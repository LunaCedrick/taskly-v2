import { test, expect, type Locator } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { capture, collectDiagnostics, expectNormalDiagnostics, externalWrite, navigate, waitForSync } from './fixtures/sync'
import { saveExperiment, writeSnapshot } from './fixtures/writes'

const longTitle = 'Review the project draft and share all approved task updates'
const observations = new Map<string, { name: string; result: unknown }>()
test.afterEach(async ({ browserName }, info) => {
  const saved = observations.get(info.testId)
  if (saved) await saveExperiment(info, saved.name, { browserName, observations: saved.result })
  observations.delete(info.testId)
})

async function geometry(row: Locator) {
  return row.evaluate((element) => {
    const title = element.querySelector<HTMLElement>('[title]')!
    const bounds = (node: Element) => {
      const r = node.getBoundingClientRect()
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }
    }
    const meta = [...title.nextElementSibling!.children].filter((node) => {
      const r = node.getBoundingClientRect()
      return r.width > 0 && r.height > 0
    })
    const parts = { title: bounds(title), project: bounds(meta[0]), due: bounds(meta[1]),
      priority: bounds(element.querySelector('[data-priority]')!),
      checkbox: bounds(element.querySelector('[data-row-action=complete]')!),
      edit: bounds(element.querySelector('[data-row-action=edit]')!),
      delete: bounds(element.querySelector('[data-row-action=delete]')!) }
    const entries = Object.entries(parts)
    const overlaps = entries.flatMap(([a, x], index) => entries.slice(index + 1).flatMap(([b, y]) =>
      Math.min(x.right, y.right) - Math.max(x.left, y.left) > .5
      && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > .5 ? [`${a}/${b}`] : []))
    const rect = bounds(element)
    return { rect, parts, overlaps, title: { scrollHeight: title.scrollHeight, clientHeight: title.clientHeight,
      lineHeight: parseFloat(getComputedStyle(title).lineHeight) },
      insideRow: entries.every(([, r]) => r.top >= rect.top && r.bottom <= rect.bottom
        && r.left >= rect.left && r.right <= rect.right),
      noHorizontalScroll: element.scrollWidth <= element.clientWidth,
      minHeight: parseFloat(getComputedStyle(element).minHeight), heightStyle: element.style.height }
  })
}

function expectClear(result: Awaited<ReturnType<typeof geometry>>) {
  expect(result.title.scrollHeight).toBeLessThanOrEqual(result.title.clientHeight)
  expect(result.overlaps).toEqual([])
  expect(result.insideRow).toBe(true)
  expect(result.noHorizontalScroll).toBe(true)
  for (const action of [result.parts.checkbox, result.parts.edit, result.parts.delete]) {
    expect(action.width).toBeGreaterThanOrEqual(44)
    expect(action.height).toBeGreaterThanOrEqual(44)
  }
}

async function adjacentRows(list: Locator) {
  return list.locator('[data-task-id]').evaluateAll((elements) => {
    const rects = elements.map((element) => element.getBoundingClientRect()).sort((a, b) => a.top - b.top)
    return rects.every((rect, index) => index === 0 || rect.top >= rects[index - 1].bottom - .5)
  })
}

for (const width of [320, 360, 390, 1280]) for (const taskCount of [6, 1000]) {
  const mode = taskCount === 6 ? 'plain' : 'virtual'
  test(`G3 ${mode} Project rows fit long and short titles at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 1280 ? 900 : 800 })
    const diagnostics = collectDiagnostics(page)
    const uid = await signIn(page, '/', { seed: false })
    const seed = await seedUser(uid, { taskCount })
    const projectTasks = seed.tasks.filter((task) => task.projectId === 'project-1')
      .sort((a, b) => a.id.localeCompare(b.id))
    const [longTask, shortTask] = projectTasks
    await externalWrite(uid, async (database, root) => {
      const batch = database.batch()
      for (const [task, title] of [[longTask, longTitle], [shortTask, 'Call Sam']] as const)
        batch.update(database.doc(`${root}/tasks/${task.id}`), { title, priority: 'high', status: 'todo', completedAt: null })
      await batch.commit()
    })
    await waitForSync(page, { tasks: taskCount })
    await navigate(page, '/projects/project-1')
    const list = page.getByRole('list', { name: 'Thesis tasks', exact: true })
    await expect(list).toHaveAttribute('data-virtualized', String(mode === 'virtual'))
    const longRow = list.locator(`[data-task-id="${longTask.id}"]`)
    const shortRow = list.locator(`[data-task-id="${shortTask.id}"]`)
    await expect(longRow.locator('[title]')).toHaveText(longTitle)
    await expect(shortRow.locator('[title]')).toHaveText('Call Sam')
    await page.evaluate(() => document.fonts.ready)
    const initial = { long: await geometry(longRow), short: await geometry(shortRow),
      adjacent: await adjacentRows(list), noHorizontalScroll: await page.evaluate(() =>
        document.documentElement.scrollWidth <= innerWidth),
      listFits: await list.evaluate((element) => element.scrollWidth <= element.clientWidth) }
    observations.set(info.testId, { name: `project-rows-${mode}-${width}`, result: { initial } })
    await capture(page, `g3-project-rows-${mode}`)
    expectClear(initial.long)
    expectClear(initial.short)
    expect(initial.adjacent && initial.noHorizontalScroll && initial.listFits).toBe(true)
    if (width < 1280) {
      for (const result of [initial.long, initial.short]) {
        const lowerBandTop = Math.min(result.parts.project.top, result.parts.due.top,
          result.parts.priority.top, result.parts.edit.top, result.parts.delete.top)
        expect(Math.max(result.parts.title.bottom, result.parts.checkbox.bottom)).toBeLessThanOrEqual(lowerBandTop)
        expect(result.parts.delete.right).toBeCloseTo(result.rect.right - 12, 0)
        const bandCenter = (result.parts.edit.top + result.parts.edit.bottom) / 2
        for (const part of [result.parts.project, result.parts.due, result.parts.priority, result.parts.delete])
          expect((part.top + part.bottom) / 2).toBeCloseTo(bandCenter, 0)
      }
      expect(initial.long.parts.title.height).toBeGreaterThan(initial.long.title.lineHeight)
      // A measured phone list must return to the existing fixed desktop geometry.
      await page.setViewportSize({ width: 1280, height: 900 })
      const desktopHeight = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height')))
      await expect.poll(async () => (await geometry(longRow)).rect.height).toBe(desktopHeight)
      await expect.poll(() => adjacentRows(list)).toBe(true)
      const desktop = { long: await geometry(longRow), short: await geometry(shortRow) }
      expectClear(desktop.long)
      expectClear(desktop.short)
      await page.setViewportSize({ width, height: 800 })
      await expect.poll(async () => (await geometry(longRow)).parts.title.height)
        .toBeGreaterThan(initial.long.title.lineHeight)
      await expect.poll(() => adjacentRows(list)).toBe(true)
      expectClear(await geometry(longRow))
      // Variable titles must remeasure while mounted, not only on initial rendering.
      const expanded = `${longTitle} ${'More project details '.repeat(8)}`
      await longRow.getByRole('button', { name: `Edit ${longTitle}`, exact: true }).click()
      const dialog = page.getByRole('dialog')
      await dialog.getByLabel('Title').fill(expanded)
      await dialog.getByRole('button', { name: 'Save changes' }).click()
      await expect(longRow.locator('[title]')).toHaveText(expanded)
      await expect.poll(async () => (await geometry(longRow)).rect.height).toBeGreaterThan(initial.long.rect.height)
      await expect.poll(() => adjacentRows(list)).toBe(true)
      const grown = await geometry(longRow)
      expectClear(grown)
      observations.set(info.testId, { name: `project-rows-${mode}-${width}`, result: { initial, desktop, grown } })
      await capture(page, `g3-project-rows-${mode}-grown`)
    } else {
      const expectedHeight = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-height')))
      expect(initial.long.rect.height).toBe(expectedHeight)
      expect(initial.short.rect.height).toBe(expectedHeight)
    }
    await longRow.focus()
    await page.keyboard.press('End')
    await expect(list.locator(`[aria-posinset="${projectTasks.length}"]`)).toBeFocused()
    await page.keyboard.press('Home')
    await expect(longRow).toBeFocused()
    await expect.poll(() => adjacentRows(list)).toBe(true)
    expectNormalDiagnostics(diagnostics)
    expect((await writeSnapshot(page)).projects).toHaveLength(4)
  })
}
