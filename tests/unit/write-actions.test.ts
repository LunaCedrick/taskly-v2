import { afterEach, expect, it, vi } from 'vitest'
import { seedStore } from './data-fixtures'
import { publishSessionData, useStore } from '../../src/store'
import { clearMutationSession, installMutationSession, pendingWriteCount } from '../../src/lib/mutations'
import { deleteProject, openOverlay, recoverDraft, saveTask, updateDraft, writesReady } from '../../src/store/write-actions'
import type { WriteOperation } from '../../src/lib/mutations/types'

afterEach(() => clearMutationSession())

it('waits for confirmed healthy tasks as well as projects before opening task-writing entry points', () => {
  const state = seedStore(0)
  useStore.setState({ streams: { ...state.streams, tasks: { ...state.streams.tasks, error: { kind: 'listener', message: 'bad' } } } })
  expect(writesReady(useStore.getState())).toBe(false)
  openOverlay('quick')
  expect(useStore.getState().overlay).toBe(null)
})

it('clears Quick Add immediately, retains later input after failure and recovers the same operation IDs', async () => {
  seedStore(0)
  let reject!: (reason: Error) => void
  const writer = vi.fn(() => new Promise<void>((_, fail) => { reject = fail }))
  installMutationSession(writer, () => true, 'unit-owner')
  openOverlay('quick', 'project-1')
  updateDraft({ title: 'First task' })
  saveTask(true)
  expect(useStore.getState().draft.title).toBe('')
  const submitted = writer.mock.calls[0]
  updateDraft({ title: 'Second task' })
  reject(new Error('denied'))
  await vi.waitFor(() => expect(useStore.getState().jobs).toHaveLength(0))
  expect(useStore.getState().draft.title).toBe('Second task')
  const recovery = useStore.getState().toasts.find((toast) => toast.recovery)!
  expect(recovery.text).toBe('Could not save your change')
  recoverDraft(recovery)
  expect(useStore.getState().draft.title).toBe('Second task')
  useStore.setState({ overlay: null })
  recoverDraft(recovery)
  installMutationSession(async () => {}, () => true, 'unit-owner')
  const retryWriter = vi.fn(async (operations: readonly WriteOperation[]) => { void operations })
  installMutationSession(retryWriter, () => true, 'unit-owner')
  saveTask()
  await vi.waitFor(() => expect(useStore.getState().jobs).toHaveLength(0))
  expect(retryWriter.mock.calls[0]).toEqual(submitted)
})

it('retains partial deletion, stops on failure and retries remaining tasks with the same final summary ID', async () => {
  const state = seedStore(501)
  publishSessionData(state.dataUid!, { rawTasks: state.rawTasks.map((task) => ({ ...task, projectId: 'project-1' })) })
  useStore.setState({ overlay: 'delete-project', editProjectId: 'project-1' })
  let fail = true
  const batches: (readonly WriteOperation[])[] = []
  installMutationSession(async (batch) => {
    batches.push(batch)
    if (fail && batches.length === 2) throw new Error('permission-denied')
    const now = useStore.getState()
    const deleted = new Set(batch.filter((op) => op.stream === 'tasks').map((op) => op.id))
    publishSessionData(now.dataUid!, { rawTasks: now.rawTasks.filter((task) => !deleted.has(task.id)) })
  }, () => true, state.dataUid!)
  await deleteProject()
  expect(batches.map((batch) => batch.length)).toEqual([500, 1])
  expect(useStore.getState().rawTasks).toHaveLength(1)
  expect(useStore.getState().projects).toHaveLength(3)
  expect(useStore.getState().fieldError).toBe('Could not finish deleting this project. Some tasks may already be deleted. Try again.')
  const summary = useStore.getState().cascadeIds['project-1']
  fail = false
  await deleteProject()
  expect(batches.map((batch) => batch.length)).toEqual([500, 1, 1, 2])
  expect(batches.at(-1)?.[1].id).toBe(summary)
  expect(pendingWriteCount()).toBe(0)
  expect(useStore.getState().deletedProjectId).toBe('project-1')
})
