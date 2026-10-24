import { test, expect } from '@playwright/test'
import { signIn } from './fixtures/auth'
import { collectDiagnostics, syncSnapshot } from './fixtures/sync'
import { activity, enqueue, network, observation, project, saveExperiment, settled, stamp, task, writeSnapshot } from './fixtures/writes'

test('pending timestamps survive creation, completion, activity window churn, ack and atomic rejection', async ({ page }, info) => {
  const diagnostics = collectDiagnostics(page)
  const stages: unknown[] = []
  try {
    await signIn(page)
    await network(page, false)
    await enqueue(page, 'create-project', [project('cp-project'),
      activity('cp-project-created', 'project.created', 'Created the project cp-project', 'cp-project')])
    await enqueue(page, 'create-task', [task('cp-task', 'cp-project'),
      activity('cp-task-created', 'task.created', 'Added cp-task to cp-project', 'cp-project', 'cp-task')])
    await expect.poll(async () => (await writeSnapshot(page)).tasks.some((row) => row.id === 'cp-task')).toBe(true)
    await enqueue(page, 'complete', [{ kind: 'update', stream: 'tasks', id: 'cp-task',
      data: { status: 'done', completedAt: stamp, updatedAt: stamp } },
    activity('cp-task-completed', 'task.completed', 'Completed cp-task', 'cp-project', 'cp-task')])
    await expect.poll(async () => (await writeSnapshot(page)).tasks.find((row) => row.id === 'cp-task')?.completedAt).toBeGreaterThan(0)
    const pending = await observation(page)
    stages.push({ stage: 'local pending creation and completion', ...pending })
    expect(pending.pendingDocuments?.some((row) => row.stream === 'projects' && row.nullFields.includes('createdAt')
      && row.estimates.createdAt > 0)).toBe(true)
    expect(pending.pendingDocuments?.some((row) => row.stream === 'tasks' && row.nullFields.includes('completedAt')
      && row.estimates.completedAt > 0)).toBe(true)
    expect(pending.pendingDocuments?.some((row) => row.stream === 'activity' && row.nullFields.includes('createdAt')
      && row.estimates.createdAt > 0)).toBe(true)
    expect(pending.sync).toMatchObject({ tasks: 1001, dataReady: true, activeHandles: 3, registrations: 3 })
    await network(page, true)
    for (const id of ['create-project', 'create-task', 'complete']) await settled(page, id)
    await expect.poll(async () => (await syncSnapshot(page)).streams.tasks.fromCache).toBe(false)
    stages.push({ stage: 'server acknowledged', ...await observation(page) })

    await network(page, false)
    await enqueue(page, 'window', Array.from({ length: 22 }, (_, i) => [project(`cp-window-${i}`),
      activity(`cp-window-${i}`, 'project.created', `Created the project cp-window-${i}`, `cp-window-${i}`)]).flat())
    await expect.poll(async () => (await writeSnapshot(page)).activity.filter((row) => row.id.startsWith('cp-window-')).length).toBe(20)
    stages.push({ stage: 'latest-20 local reconciliation', ...await observation(page) })
    await network(page, true)
    await settled(page, 'window')
    await expect.poll(async () => (await writeSnapshot(page)).activity.filter((row) => row.id.startsWith('cp-window-')).length).toBe(20)

    await network(page, false)
    // All fields remain codec-valid; changing an existing activity's immutable creation time
    // makes its required batch fail the unchanged rules, rolling back the task edit too.
    await enqueue(page, 'rejected-activity', [{ kind: 'update', stream: 'tasks', id: 'cp-task',
      data: { title: 'cp-rejected-title', updatedAt: stamp } },
    { kind: 'update', stream: 'activity', id: 'cp-window-0', data: { createdAt: stamp } }])
    await expect.poll(async () => (await writeSnapshot(page)).tasks.find((row) => row.id === 'cp-task')?.title).toBe('cp-rejected-title')
    stages.push({ stage: 'pending batch with invalid immutable activity update', ...await observation(page) })
    await network(page, true)
    await settled(page, 'rejected-activity', 'rejected')
    await expect.poll(async () => (await writeSnapshot(page)).tasks.find((row) => row.id === 'cp-task')?.title).toBe('cp-task')
    const final = await observation(page)
    stages.push({ stage: 'atomic rejection reconciled', ...final })
    expect(final.sync).toMatchObject({ dataReady: true, activeHandles: 3, registrations: 3 })
    expect(Object.values(final.sync!.streams).every((stream) => stream.error === null)).toBe(true)
    expect(final.events?.filter((event) => event.type === 'error')).toEqual([])
  } finally { await saveExperiment(info, 'pending-timestamps', { stages, diagnostics }) }
})
