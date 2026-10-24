import { test, expect } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { collectDiagnostics, signInAnotherAccount, signOut, syncSnapshot, waitForSync } from './fixtures/sync'
import { activity, enqueue, network, observation, project, saveExperiment, serverExists,
  settled, signInEmail, task, writeSnapshot } from './fixtures/writes'

test('Q11 experiment: SDK sign-out, other account and return with an offline queued write', async ({ page }, info) => {
  const stages: unknown[] = []
  const diagnostics = collectDiagnostics(page)
  try {
    const uid = await signIn(page, '/', { seed: false })
    const email = (await writeSnapshot(page)).email!
    await network(page, false)
    await enqueue(page, 'old-user', [project('cp-old-user'),
      activity('cp-old-user-event', 'project.created', 'Created the project cp-old-user', 'cp-old-user')])
    await page.evaluate(() => window.__TASKLY_G3_WRITES_TEST__!.wait('before-sign-out'))
    await expect.poll(async () => (await writeSnapshot(page)).projects.length).toBe(1)
    stages.push({ stage: 'offline pending before sign-out', ...await observation(page),
      serverExists: await serverExists(uid, 'projects', 'cp-old-user') })
    await signOut(page)
    await waitForSync(page, { uid: null, activeHandles: 0, projects: 0, tasks: 0 })
    stages.push({ stage: 'signed out, still offline', ...await observation(page) })
    await network(page, true)
    // Bounded observation interval, not a product acknowledgement timeout or a cancellation claim.
    await page.waitForTimeout(1500)
    stages.push({ stage: 'anonymous reconnect after 1500 ms', ...await observation(page),
      serverExists: await serverExists(uid, 'projects', 'cp-old-user') })

    const other = await signInAnotherAccount(page)
    expect(other).not.toBe(uid)
    await enqueue(page, 'new-user', [project('cp-new-user'),
      activity('cp-new-user-event', 'project.created', 'Created the project cp-new-user', 'cp-new-user')])
    await settled(page, 'new-user')
    await expect.poll(async () => (await writeSnapshot(page)).projects.map((row) => row.id)).toEqual(['cp-new-user'])
    stages.push({ stage: 'other account writes acknowledged', ...await observation(page),
      oldServerExists: await serverExists(uid, 'projects', 'cp-old-user'),
      otherServerExists: await serverExists(other, 'projects', 'cp-new-user') })
    expect((await writeSnapshot(page)).tasks).toEqual([])

    await signOut(page)
    await signInEmail(page, email)
    expect((await writeSnapshot(page)).uid).toBe(uid)
    // Measure whichever terminal outcome the installed SDK gives; do not assume sign-out cancels it.
    await expect.poll(async () => (await writeSnapshot(page)).operations['old-user'].status,
      { timeout: 15000 }).not.toBe('pending')
    stages.push({ stage: 'original account returned', ...await observation(page),
      serverExists: await serverExists(uid, 'projects', 'cp-old-user') })
    expect((await writeSnapshot(page)).projects.every((row) => row.id !== 'cp-new-user')).toBe(true)
    expect((await writeSnapshot(page)).operations['old-user'].currentSession).toBe(false)
    expect((await syncSnapshot(page)).activeHandles).toBe(3)
  } finally { await saveExperiment(info, 'q11-sign-out-reconnect', { stages, diagnostics }) }
})

test('Q11 experiment: closing a tab loses its memory-only offline task queue', async ({ page, context }, info) => {
  const stages: unknown[] = []
  try {
    const uid = await signIn(page, '/', { seed: false })
    await enqueue(page, 'base-project', [project('cp-base'),
      activity('cp-base-event', 'project.created', 'Created the project cp-base', 'cp-base')])
    await settled(page, 'base-project')
    await network(page, false)
    await enqueue(page, 'unsent-task', [task('cp-lost-task', 'cp-base'),
      activity('cp-lost-event', 'task.created', 'Added cp-lost-task to cp-base', 'cp-base', 'cp-lost-task')])
    await expect.poll(async () => (await writeSnapshot(page)).tasks.length).toBe(1)
    stages.push({ stage: 'offline task visible before close', ...await observation(page),
      serverExists: await serverExists(uid, 'tasks', 'cp-lost-task') })
    await page.close()
    const restored = await context.newPage()
    await restored.goto('/')
    await waitForSync(restored, { uid, dataReady: true, activeHandles: 3 })
    expect((await writeSnapshot(restored)).tasks).toEqual([])
    expect(await serverExists(uid, 'tasks', 'cp-lost-task')).toBe(false)
    expect(await serverExists(uid, 'activity', 'cp-lost-event')).toBe(false)
    stages.push({ stage: 'new tab with restored Auth and fresh memory cache', ...await observation(restored),
      serverExists: false })
  } finally { await saveExperiment(info, 'q11-tab-close', { stages }) }
})
