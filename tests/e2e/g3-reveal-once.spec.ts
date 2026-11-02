import { test, expect, type Locator, type Page } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { capture, collectDiagnostics, expectNormalDiagnostics, navigate, waitForSync } from './fixtures/sync'
import { saveExperiment, writeSnapshot } from './fixtures/writes'

const frames = (page: Page) => page.evaluate(() => new Promise<void>((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

async function confirmed(page: Page, id: string) {
  await page.evaluate((id) => window.__TASKLY_G3_WRITES_TEST__!.wait(id), id)
  await expect.poll(async () => (await writeSnapshot(page)).waiters[id]?.status).toBe('acknowledged')
  await frames(page)
}

const scrollTop = (list: Locator) => list.evaluate((element) => element.scrollTop)

for (const width of [390, 1280]) for (const taskCount of [150, 1000]) {
  test(`G3 reveal is consumed after Quick Add: ${taskCount} tasks at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const diagnostics = collectDiagnostics(page)
    const uid = await signIn(page, '/', { seed: false })
    await seedUser(uid, { taskCount })
    await waitForSync(page, { tasks: taskCount })
    await navigate(page, '/projects/project-1')
    const list = page.getByRole('list', { name: 'Thesis tasks', exact: true })
    await expect(list).toHaveAttribute('data-virtualized', String(taskCount === 1000))
    const title = `Reveal once ${taskCount} ${width}`
    await page.getByRole('button', { name: 'Quick Add', exact: true }).click()
    const input = page.getByRole('dialog').getByLabel('Title')
    await input.fill(title)
    await input.press('Enter')
    await expect(input).toHaveValue('')
    await confirmed(page, 'after-add')
    const added = (await writeSnapshot(page)).tasks.find((task) => task.title === title)!
    const addedRow = list.locator(`[data-task-id="${added.id}"]`)
    await expect(addedRow).toBeInViewport()
    const revealedTop = await scrollTop(list)
    expect(revealedTop).toBeGreaterThan(0)
    await page.keyboard.press('Escape')
    await list.evaluate((element) => { element.scrollTop = 0 })
    await frames(page)
    await list.evaluate((element) => {
      element.dataset.maxObservedScroll = '0'
      element.addEventListener('scroll', () => {
        element.dataset.maxObservedScroll = String(Math.max(Number(element.dataset.maxObservedScroll), element.scrollTop))
      })
    })
    const above = list.locator('[data-row-action="complete"]').first()
    const aboveId = await above.evaluate((button) => button.closest<HTMLElement>('[data-task-id]')!.dataset.taskId)
    await above.click()
    await expect.poll(async () => (await writeSnapshot(page)).tasks.find((task) => task.id === aboveId)?.status).toBe('done')
    await confirmed(page, 'after-complete')
    const afterComplete = await scrollTop(list)
    const maximumAfterComplete = Number(await list.getAttribute('data-max-observed-scroll'))
    expect(afterComplete).toBe(0)
    expect(maximumAfterComplete).toBe(0)
    if (taskCount === 1000) await expect(addedRow).toHaveCount(0)
    await navigate(page, '/')
    await navigate(page, '/projects/project-1')
    await frames(page)
    const afterReturn = await scrollTop(list)
    expect(afterReturn).toBe(0)
    if (taskCount === 1000) await expect(addedRow).toHaveCount(0)
    await navigate(page, '/tasks')
    const all = page.getByRole('list', { name: 'All tasks', exact: true })
    await frames(page)
    const myTasks = await scrollTop(all)
    expect(myTasks).toBe(0)
    if (taskCount === 1000) await expect(all.locator(`[data-task-id="${added.id}"]`)).toHaveCount(0)
    await capture(page, `g3-reveal-once-${taskCount}`)
    await saveExperiment(info, `reveal-once-${taskCount}-${width}`, {
      revealedTop, afterComplete, maximumAfterComplete, afterReturn, myTasks,
    })
    expectNormalDiagnostics(diagnostics)
  })
}
