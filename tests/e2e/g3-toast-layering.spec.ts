import { test, expect, type Locator } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { capture, navigate, waitForSync } from './fixtures/sync'
import { saveExperiment, writeSnapshot } from './fixtures/writes'

const observations = new Map<string, { name: string; result: unknown }>()
test.afterEach(async ({ browserName }, info) => {
  const saved = observations.get(info.testId)
  if (saved) await saveExperiment(info, saved.name, { browserName, observations: saved.result })
  observations.delete(info.testId)
})

async function visibility(toast: Locator, dialog: Locator) {
  await expect(toast).toBeVisible()
  const surface = await toast.evaluate((element) => {
    const rect = element.getBoundingClientRect()
    const points = [[rect.left + 4, rect.top + 4], [rect.right - 4, rect.top + 4],
      [rect.left + 4, rect.bottom - 4], [rect.right - 4, rect.bottom - 4],
      ...[...element.querySelectorAll('span, button')].map((child) => {
        const box = child.getBoundingClientRect()
        return [box.left + box.width / 2, box.top + box.height / 2]
      })]
    return { rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
      openPopover: element.matches(':popover-open'),
      hitTests: points.map(([x, y]) => ({ x, y,
        clear: element.contains(document.elementFromPoint(x, y)) })),
      inViewport: rect.left >= 0 && rect.top >= 0 && rect.right <= innerWidth && rect.bottom <= innerHeight }
  })
  const primary = await dialog.locator('button[type=submit]').boundingBox()
  const r = surface.rect
  return { ...surface, primary, avoidsPrimary: Boolean(primary && (r.right <= primary.x
    || r.left >= primary.x + primary.width || r.bottom <= primary.y || r.top >= primary.y + primary.height)) }
}

for (const width of [390, 1280]) {
  test(`G3 success toast is unobscured while Quick Add stays open at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const uid = await signIn(page, '/', { seed: false })
    await seedUser(uid, { taskCount: 1 })
    await waitForSync(page, { tasks: 1 })
    await navigate(page, '/projects/project-1')
    await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
    const dialog = page.getByRole('dialog')
    const title = dialog.getByLabel('Title')
    await title.fill('Visible Quick Add confirmation')
    await title.press('Enter')
    await expect(title).toHaveValue('')
    await expect(title).toBeFocused()
    const toast = page.locator('[role=status]').filter({ hasText: 'Task added to ' })
    const result = await visibility(toast, dialog)
    await capture(page, 'g3-success-toast-open-quick-add')
    observations.set(info.testId, { name: `toast-success-${width}`, result })
    expect(result.hitTests.every((point) => point.clear)).toBe(true)
    expect(result.inViewport && result.avoidsPrimary && result.openPopover).toBe(true)
    await expect(dialog.getByRole('heading', { name: 'Quick add' })).toBeVisible()
    // Notification controls must also be operable within the modal's inert boundary.
    await toast.getByRole('button', { name: 'Dismiss notification' }).click()
    await expect(toast).toHaveCount(0)
    await expect(dialog).toBeVisible()
  })

  test(`G3 error toast is unobscured above Quick Add, edit and deletion dialogs at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    const uid = await signIn(page, '/', { seed: false })
    await seedUser(uid, { taskCount: 1 })
    await waitForSync(page, { tasks: 1 })
    await navigate(page, '/projects/project-1')
    const task = (await writeSnapshot(page)).tasks[0]
    const edit = page.getByRole('button', { name: `Edit ${task.title}`, exact: true })
    await edit.click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Title').fill('Rejected toast-layer edit')
    await page.evaluate(() => window.__TASKLY_G3_WRITES_TEST__!.rejectNextTaskUpdate())
    await dialog.getByRole('button', { name: 'Save changes' }).click()
    const failure = page.locator('[role=alert]').filter({ hasText: 'Could not save your change' })
    await expect(failure).toBeVisible()
    const results = []
    for (const kind of ['quick-add', 'edit', 'delete-task', 'delete-project']) {
      if (kind === 'quick-add') await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
      else if (kind === 'edit') await edit.click()
      else await page.getByRole('button', { name: kind === 'delete-task'
        ? `Delete ${task.title}` : 'Delete project', exact: true }).click()
      results.push({ kind, ...await visibility(failure, dialog) })
      await capture(page, `g3-error-toast-open-${kind}`)
      await dialog.press('Escape')
    }
    observations.set(info.testId, { name: `toast-errors-${width}`, result: results })
    expect(results.every((result) => result.hitTests.every((point) => point.clear))).toBe(true)
    expect(results.every((result) => result.inViewport && result.avoidsPrimary && result.openPopover)).toBe(true)
    // Recover draft remains reachable while a later modal is open, without adding copy.
    await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
    await dialog.locator('button[type=submit]').focus()
    await page.keyboard.press('Tab')
    await expect(failure.getByRole('button', { name: 'Recover draft' })).toBeFocused()
    await page.keyboard.press('Enter')
    await expect(dialog.getByLabel('Title')).toHaveValue('Rejected toast-layer edit')
    await expect(failure).toHaveCount(0)
    expect(errors).toEqual([])
  })
}
