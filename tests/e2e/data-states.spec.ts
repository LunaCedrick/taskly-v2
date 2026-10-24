import { test, expect } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { cleanupUser, seedUser } from './fixtures/firestore'
import { validDocument } from '../rules/fixtures'
import {
  capture, collectDiagnostics, expectNormalDiagnostics, externalWrite, FIRESTORE_ROUTE,
  navigate, observedDataStates, saveObservation, syncSnapshot, trackDataStates, waitForSync,
} from './fixtures/sync'

for (const width of [390, 1280]) {
  test(`first-run, empty project, orphan, missing project and partial failure at ${width}px`, async ({ page }) => {
    const messages = collectDiagnostics(page)
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const uid = await signIn(page, '/', { seed: false })
    try {
      await expect(page.getByRole('heading', { name: 'Nothing here yet' })).toBeVisible()
      await capture(page, 'state-first-run')
      const firstAction = page.getByRole('button', { name: 'Create your first project' })
      await expect(firstAction).toBeEnabled()
      await firstAction.click({ force: true })
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Cancel', exact: true }).click()
      await waitForSync(page, { projects: 0, tasks: 0 })
      await seedUser(uid)
      await waitForSync(page, { projects: 4, tasks: 1000, activity: 20 })
      await navigate(page, '/projects/project-empty')
      await expect(page.getByRole('heading', { name: 'No tasks in Empty project' })).toBeVisible()
      await expect(page.getByText('0% complete', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Add a task', exact: true })).toBeEnabled()
      await capture(page, 'state-empty-project')
      await externalWrite(uid, (database, path) => database.doc(`${path}/tasks/orphan`).set({
        ...validDocument('tasks'), projectId: 'absent-project', title: 'Orphan excluded from every view',
      }))
      await waitForSync(page, { orphanCount: 1, tasks: 1000 })
      await navigate(page, '/tasks')
      await expect(page.getByText('Orphan excluded from every view')).toHaveCount(0)
      await page.evaluate(() => window.__TASKLY_G2_SYNC_TEST__!.fail('activity'))
      await waitForSync(page, { activeHandles: 2 })
      await expect(page.locator('[data-data-state="error"]')).toHaveCount(0)
      await expect(page.locator('[data-task-id]').first()).toBeVisible()
      const before = await syncSnapshot(page)
      await page.evaluate(() => window.__TASKLY_G2_SYNC_TEST__!.fail('tasks'))
      await expect(page.getByRole('alert')).toContainText('We could not load your tasks')
      await capture(page, 'state-load-error')
      const retry = page.getByRole('button', { name: 'Try again' })
      await retry.focus()
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await expect(retry).toBeFocused()
      expect(await retry.evaluate((element) => parseFloat(getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(3)
      await retry.click()
      await waitForSync(page, { registrations: before.registrations + 2, activeHandles: 3, tasks: 1000 })
      // Retained rows and replacement handles precede server confirmation; neither proves recovery.
      await expect.poll(() => syncSnapshot(page)).toMatchObject({ streams: {
        tasks: { fromCache: false, error: null }, activity: { fromCache: false, error: null },
      } })
      await expect(page.locator('[data-data-state="error"]')).toHaveCount(0)
      const after = await syncSnapshot(page)
      expect(after.streams.projects).toEqual(before.streams.projects)
      expect(after.streams.tasks.error).toBeNull()
      expect(after.streams.activity.error).toBeNull()
      await page.goto('/projects/unknown-project')
      await waitForSync(page, { dataReady: true, tasks: 1000 })
      await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Try again' })).toHaveCount(0)
      await page.getByRole('link', { name: 'Back to dashboard' }).click()
      await expect(page.locator('[data-view="dashboard"]')).toBeVisible()
      await saveObservation(page, 'states-and-partial-failure', messages)
      expectNormalDiagnostics(messages)
    } finally { await cleanupUser(uid) }
  })

  test(`fresh memory cache stays loading offline, times out, and recovers without new registrations at ${width}px`, async ({ page }) => {
    test.setTimeout(75_000) // Includes the required 10-second deadline plus SDK reconnect backoff.
    const messages = collectDiagnostics(page)
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    const uid = await signIn(page, '/', { seed: false })
    let blocked = false
    try {
      await trackDataStates(page)
      await page.route(FIRESTORE_ROUTE, (route) => route.abort('internetdisconnected'))
      blocked = true
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('status', { name: 'Loading tasks' })).toBeVisible()
      await capture(page, 'state-loading')
      await expect(page.locator('[data-data-state="first-run"]')).toHaveCount(0)
      await expect(page.getByRole('alert')).toContainText('We could not load your tasks', { timeout: 15_000 })
      const timedOut = await syncSnapshot(page)
      expect(timedOut).toMatchObject({ uid, dataReady: false, registrations: 3, handles: 3, activeHandles: 3 })
      expect(timedOut.streams.projects.error?.kind).toBe('timeout')
      expect(timedOut.streams.tasks.error?.kind).toBe('timeout')
      expect(await observedDataStates(page)).not.toContain('first-run')
      await capture(page, 'state-offline-error')
      await saveObservation(page, 'offline-before-restoration', messages, {
        traffic: 'Only Firestore8081 blocked; Auth/app remained available', states: await observedDataStates(page),
      })
      await page.unroute(FIRESTORE_ROUTE)
      blocked = false
      await expect(page.getByRole('heading', { name: 'Nothing here yet' })).toBeVisible({ timeout: 30_000 })
      await waitForSync(page, { uid, dataReady: true, registrations: 3, activeHandles: 3, handles: 3 })
      await saveObservation(page, 'offline-after-restoration', messages)
      expectNormalDiagnostics(messages, true)
    } finally {
      if (blocked) await page.unroute(FIRESTORE_ROUTE)
      await saveObservation(page, 'offline-final', messages)
      await cleanupUser(uid)
    }
  })
}
