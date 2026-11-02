import { test, expect, type Locator, type Page } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { capture, collectDiagnostics, expectNormalDiagnostics, navigate, waitForSync } from './fixtures/sync'
import { saveExperiment } from './fixtures/writes'

const observations = new Map<string, { name: string; result: unknown }>()
test.afterEach(async ({ browserName }, info) => {
  const saved = observations.get(info.testId)
  if (saved) await saveExperiment(info, saved.name, { browserName, observations: saved.result })
  observations.delete(info.testId)
})
const frames = (page: Page) => page.evaluate(() => new Promise<void>((resolve) =>
  requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))

function clearance(button: Locator) {
  return button.evaluate((element) => {
    const r = element.getBoundingClientRect()
    const f = document.querySelector('[aria-label="Quick Add"]')!.getBoundingClientRect()
    const box = (r: DOMRect) => ({ top: r.top, right: r.right, bottom: r.bottom, left: r.left,
      width: r.width, height: r.height })
    const points = [[r.left + 1, r.top + 1], [r.right - 1, r.top + 1],
      [r.left + 1, r.bottom - 1], [r.right - 1, r.bottom - 1], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]]
    return { button: box(r), floating: box(f),
      overlap: Math.min(r.right, f.right) > Math.max(r.left, f.left)
        && Math.min(r.bottom, f.bottom) > Math.max(r.top, f.top),
      inViewport: r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
      hits: points.map(([x, y]) => element.contains(document.elementFromPoint(x, y))),
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth }
  })
}

for (const width of [320, 360, 390]) for (const taskCount of [60, 1000]) {
  test(`G3 final Delete clears Quick Add with ${taskCount} tasks at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 800 })
    const diagnostics = collectDiagnostics(page)
    const uid = await signIn(page, '/', { seed: false })
    const seed = await seedUser(uid, { taskCount })
    await waitForSync(page, { tasks: taskCount })
    await navigate(page, '/projects/project-1')
    await page.evaluate(() => document.fonts.ready)
    const list = page.getByRole('list', { name: 'Thesis tasks', exact: true })
    const count = seed.tasks.filter((task) => task.projectId === 'project-1').length
    const last = list.locator(`[aria-posinset="${count}"]`)
    await list.locator('[data-task-id]').first().focus()
    await page.keyboard.press('End')
    await expect(last).toBeFocused()
    await frames(page)
    const button = last.locator('[data-row-action="delete"]')
    const keyboard = await clearance(button)
    const result: { keyboard: typeof keyboard; maximum?: typeof keyboard } = { keyboard }
    observations.set(info.testId, { name: `fab-clearance-${taskCount}-${width}`, result })
    await capture(page, `g3-final-delete-keyboard-${taskCount}`)
    for (const value of [keyboard]) {
      expect(value.overlap).toBe(false)
      expect(value.inViewport).toBe(true)
      expect(value.hits).toEqual([true, true, true, true, true])
    }
    await list.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await frames(page)
    const maximum = await clearance(button)
    result.maximum = maximum
    await capture(page, `g3-final-delete-maximum-${taskCount}`)
    expect(maximum.overlap).toBe(false)
    expect(maximum.inViewport).toBe(true)
    expect(maximum.hits).toEqual([true, true, true, true, true])
    expect(maximum.button.width).toBeGreaterThanOrEqual(44)
    expect(maximum.button.height).toBeGreaterThanOrEqual(44)
    expect(maximum.horizontalOverflow).toBe(false)
    expectNormalDiagnostics(diagnostics)
  })
}
