import { test, expect } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { seedUser } from './fixtures/firestore'
import { capture, collectDiagnostics, expectNormalDiagnostics, navigate, waitForSync } from './fixtures/sync'
import { saveExperiment } from './fixtures/writes'

const observations = new Map<string, unknown>()
test.afterEach(async ({}, info) => {
  const value = observations.get(info.testId)
  if (value) await saveExperiment(info, `plain-page-overflow-${info.title.match(/\d+px/)?.[0]}`, value)
  observations.delete(info.testId)
})

for (const width of [390, 1280]) {
  test(`G3 plain-list screen-reader text stays inside its scroll container at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const diagnostics = collectDiagnostics(page)
    const uid = await signIn(page, '/', { seed: false })
    await seedUser(uid, { taskCount: 60 })
    await waitForSync(page, { tasks: 60 })
    const results = []
    observations.set(info.testId, results)
    for (const route of ['/projects/project-1', '/tasks']) {
      await navigate(page, route)
      await page.evaluate(() => { window.scrollTo(0, 0) })
      await page.evaluate(() => document.fonts.ready)
      const list = page.locator('[data-virtualized]')
      await expect(list).toHaveAttribute('data-virtualized', 'false')
      await expect(list.locator('[data-task-id]')).toHaveCount(route === '/tasks' ? 60 : 20)
      const result = await page.evaluate(() => {
        const main = document.querySelector('#main')!.getBoundingClientRect()
        const list = document.querySelector('[data-virtualized]')!
        const pageHeight = document.documentElement.scrollHeight
        const contentBottom = Math.max(innerHeight, Math.ceil(main.bottom + scrollY))
        return { pageHeight, contentBottom, blankOverflow: Math.max(0, pageHeight - contentBottom),
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          listPosition: getComputedStyle(list).position, rowCount: list.querySelectorAll('[data-task-id]').length }
      })
      results.push({ route, ...result })
      await capture(page, route === '/tasks' ? 'g3-plain-tasks-page' : 'g3-plain-project-page')
      expect(result.blankOverflow).toBe(0)
      expect(result.horizontalOverflow).toBe(false)
      expect(result.listPosition).toBe('relative')
    }
    expectNormalDiagnostics(diagnostics)
  })
}
