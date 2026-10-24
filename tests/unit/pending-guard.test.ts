import { expect, it, vi } from 'vitest'
import { clearMutationSession, holdPendingWrites, installMutationSession, installUnloadGuard,
  pendingTasksFor, pendingWriteCount, submitMutation } from '../../src/lib/mutations'

it('keeps the unload guard and relevant pending tasks through sign-out/account switch until the original write settles', async () => {
  const cleanup = installUnloadGuard()
  expect(pendingWriteCount()).toBe(0)
  const idle = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(idle)
  expect(idle.defaultPrevented).toBe(false)
  let acknowledge!: () => void
  installMutationSession(() => new Promise((resolve) => { acknowledge = resolve }), () => true, 'A')
  const result = submitMutation([{ kind: 'delete', stream: 'tasks', id: 'task-A' }])
  expect(pendingWriteCount()).toBe(1)
  clearMutationSession()
  installMutationSession(async () => {}, () => true, 'B')
  expect(pendingTasksFor('A')).toEqual(['task-A'])
  expect(pendingTasksFor('B')).toEqual([])
  const leaving = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(leaving)
  expect(leaving.defaultPrevented).toBe(true)
  acknowledge()
  expect(await result).toEqual({ outcome: 'acknowledged', currentSession: false })
  expect(pendingWriteCount()).toBe(0)
  expect(pendingTasksFor('A')).toEqual([])
  const settled = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(settled)
  expect(settled.defaultPrevented).toBe(false)
  cleanup(); clearMutationSession()
})

it('counts cascade work between batches, releases on rejection and synchronous transport failure', async () => {
  const release = holdPendingWrites()
  installMutationSession(async () => { throw new Error('denied') }, () => true)
  const result = await submitMutation([{ kind: 'delete', stream: 'tasks', id: 'task' }])
  expect(result.outcome).toBe('rejected')
  expect(pendingWriteCount()).toBe(1)
  release(); release()
  installMutationSession(vi.fn(() => { throw new Error('invalid') }), () => true)
  expect(() => submitMutation([])).toThrow('invalid')
  expect(pendingWriteCount()).toBe(0)
  clearMutationSession()
})
