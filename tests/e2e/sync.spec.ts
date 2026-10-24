import { test, expect } from '@playwright/test'
import { Timestamp } from 'firebase/firestore'
import { signIn } from './fixtures/auth'
import { cleanupUser } from './fixtures/firestore'
import { validDocument } from '../rules/fixtures'
import {
  capture, collectDiagnostics, expectNormalDiagnostics, externalWrite, navigate,
  saveObservation, signInAnotherAccount, signOut, syncSnapshot, waitForSync,
} from './fixtures/sync'

test('real data stays in three session listeners across routes, external changes and refresh', async ({ page }) => {
  const messages = collectDiagnostics(page)
  const uid = await signIn(page)
  try {
    const initial = await syncSnapshot(page)
    expect(initial).toMatchObject({ projects: 4, tasks: 1000, activity: 20, handles: 3, activeHandles: 3, registrations: 3 })
    expect(initial.activityIds).toEqual(Array.from({ length: 20 }, (_, index) => `activity-${index + 1}`))
    expect(initial.activityCreatedAt).toEqual([...initial.activityCreatedAt].sort((left, right) => right - left))
    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
      for (const [name, route] of [['my-tasks', '/tasks'], ['project', '/projects/project-1'], ['dashboard', '/']]) {
        await navigate(page, route)
        await expect(page.locator('[data-task-id]').first()).toBeVisible()
        await waitForSync(page, { tasks: 1000, handles: 3, activeHandles: 3, registrations: initial.registrations })
        await capture(page, `sync-${name}`)
      }
      await navigate(page, '/projects/project-2')
      await waitForSync(page, { registrations: initial.registrations, activeHandles: 3 })
    }
    await externalWrite(uid, async (database, path) => {
      const batch = database.batch()
      batch.set(database.doc(`${path}/projects/external`), { ...validDocument('projects'), name: 'External sync project' })
      batch.set(database.doc(`${path}/tasks/external`), { ...validDocument('tasks'), projectId: 'external', title: 'External added' })
      await batch.commit()
    })
    await waitForSync(page, { projects: 5, tasks: 1001 })
    await navigate(page, '/projects/external')
    await expect(page.locator('[data-task-id="external"]')).toContainText('External added')
    await externalWrite(uid, (database, path) => database.doc(`${path}/tasks/external`).update({
      title: 'External updated', status: 'done', updatedAt: Timestamp.now(),
    }))
    await expect(page.locator('[data-task-id="external"]')).toContainText('External updated')
    await externalWrite(uid, (database, path) => database.doc(`${path}/activity/newest`).set({
      ...validDocument('activity'), text: 'Newest external event', createdAt: Timestamp.fromMillis(Date.now() + 60_000),
    }))
    await expect.poll(async () => (await syncSnapshot(page)).activityIds[0]).toBe('newest')
    const latest = await syncSnapshot(page)
    expect(latest.activityIds).toEqual(['newest', ...initial.activityIds.slice(0, 19)])
    expect(latest.activity).toBe(20)
    expect(latest.activityCreatedAt).toEqual([...latest.activityCreatedAt].sort((left, right) => right - left))
    await externalWrite(uid, (database, path) => database.doc(`${path}/tasks/external`).delete())
    await waitForSync(page, { tasks: 1000 })
    await expect(page.locator('[data-data-state="empty"]')).toBeVisible()
    await externalWrite(uid, (database, path) => database.doc(`${path}/projects/external`).delete())
    await waitForSync(page, { projects: 4, registrations: initial.registrations, activeHandles: 3 })
    await expect(page.getByRole('heading', { name: 'Project not found' })).toBeVisible()
    await saveObservation(page, 'sync-before-refresh', messages)
    await page.reload()
    await waitForSync(page, { uid, tasks: 1000, projects: 4, activity: 20, handles: 3, activeHandles: 3, registrations: 3 })
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
    await saveObservation(page, 'sync-external-and-refresh', messages)
    expectNormalDiagnostics(messages)
  } finally { await cleanupUser(uid) }
})

test('sign-out stops subscriptions and a second Google account cannot see the first account data', async ({ page }) => {
  const messages = collectDiagnostics(page)
  const firstUid = await signIn(page)
  let secondUid: string | undefined
  try {
    await signOut(page)
    expect(await syncSnapshot(page)).toMatchObject({ uid: null, handles: 0, activeHandles: 0, tasks: 0, projects: 0 })
    secondUid = await signInAnotherAccount(page)
    expect(secondUid).not.toBe(firstUid)
    await expect(page.locator('[data-data-state="first-run"]')).toBeVisible()
    await waitForSync(page, { uid: secondUid, projects: 0, tasks: 0, activity: 0, activeHandles: 3, handles: 3, registrations: 6 })
    await externalWrite(firstUid, (database, path) => database.doc(`${path}/tasks/old-user-late`).set({
      ...validDocument('tasks'), title: 'Another account private task',
    }))
    await externalWrite(secondUid, (database, path) => database.doc(`${path}/activity/second-account-sentinel`).set(validDocument('activity')))
    await waitForSync(page, { activity: 1 })
    await expect(page.getByText('Another account private task')).toHaveCount(0)
    expect(await syncSnapshot(page)).toMatchObject({ uid: secondUid, tasks: 0, projects: 0 })
    await saveObservation(page, 'sync-account-isolation', messages)
    expectNormalDiagnostics(messages)
  } finally {
    await cleanupUser(firstUid)
    if (secondUid) await cleanupUser(secondUid)
  }
})
