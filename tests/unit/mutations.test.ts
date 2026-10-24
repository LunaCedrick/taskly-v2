import { afterEach, expect, it, vi } from 'vitest'
import type { Firestore } from 'firebase/firestore'
import { clearMutationSession, installMutationSession, submitMutation } from '../../src/lib/mutations'
import { SERVER_TIME, type WriteOperation } from '../../src/lib/mutations/types'
import { createMutationWriter } from '../../src/lib/firebase/writes'

const sdk = vi.hoisted(() => {
  const batch = { set: vi.fn(), update: vi.fn(), delete: vi.fn(), commit: vi.fn(async () => {}) }
  return { batch, writeBatch: vi.fn(() => batch),
    doc: vi.fn((_db: unknown, ...path: string[]) => path.join('/')),
    serverTimestamp: vi.fn(() => 'SDK_SERVER_TIME'), Timestamp: { fromMillis: vi.fn((value) => ({ millis: value })) } }
})
vi.mock('firebase/firestore', () => sdk)
afterEach(() => { clearMutationSession(); vi.clearAllMocks() })
const write: WriteOperation = { stream: 'projects', id: 'p', kind: 'set',
  data: { name: 'Project', colorIndex: 0, createdAt: SERVER_TIME, updatedAt: SERVER_TIME } }

it('uses an installed session synchronously and preserves actual ack/rejection while marking stale results', async () => {
  expect(() => submitMutation([write])).toThrow('not ready')
  let resolve!: () => void
  const writer = vi.fn(() => new Promise<void>((done) => { resolve = done }))
  installMutationSession(writer, () => true)
  const pending = submitMutation([write])
  expect(writer).toHaveBeenCalledExactlyOnceWith([write])
  clearMutationSession()
  resolve()
  expect(await pending).toEqual({ outcome: 'acknowledged', currentSession: false })
  installMutationSession(async () => { throw new Error('permission-denied') }, () => true)
  expect(await submitMutation([write])).toEqual({ outcome: 'rejected', currentSession: true, error: 'permission-denied' })
  installMutationSession(writer, () => false)
  expect(() => submitMutation([write])).toThrow('not ready')
})

it('encodes timestamps inside a single atomic batch scoped to the captured UID', async () => {
  const writer = createMutationWriter({} as Firestore, 'owner')
  await writer([write, { kind: 'update', stream: 'tasks', id: 't', data: {
    updatedAt: SERVER_TIME, completedAt: null, dueDate: 1234, colorIndex: 2 } },
  { kind: 'delete', stream: 'tasks', id: 'old' }])
  expect(sdk.batch.set).toHaveBeenCalledWith('users/owner/projects/p', {
    name: 'Project', colorIndex: 0, createdAt: 'SDK_SERVER_TIME', updatedAt: 'SDK_SERVER_TIME' })
  expect(sdk.batch.update).toHaveBeenCalledWith('users/owner/tasks/t', {
    updatedAt: 'SDK_SERVER_TIME', completedAt: null, dueDate: { millis: 1234 }, colorIndex: 2 })
  expect(sdk.batch.delete).toHaveBeenCalledWith('users/owner/tasks/old')
  expect(sdk.batch.commit).toHaveBeenCalledTimes(1)
})

it('counts every batch operation, rejects oversized batches and cannot escape the UID path', async () => {
  const writer = createMutationWriter({} as Firestore, 'owner')
  expect(() => writer([])).toThrow('1–500')
  expect(() => writer(Array.from({ length: 501 }, () => write))).toThrow('1–500')
  expect(() => writer([{ ...write, id: '../other' }])).toThrow('path segment')
  expect(() => createMutationWriter({} as Firestore, 'bad/uid')).toThrow('path segment')
  expect(sdk.batch.commit).not.toHaveBeenCalled()
  await writer(Array.from({ length: 500 }, (_, index) => ({ ...write, id: `p-${index}` })))
  expect(sdk.batch.set).toHaveBeenCalledTimes(500)
  expect(sdk.batch.commit).toHaveBeenCalledTimes(1)
})
