import type { Firestore } from 'firebase/firestore'
import { afterEach, expect, it, vi } from 'vitest'
import { createListenerSession } from '../../src/lib/subscriptions/listeners'
import { controlledFrames, storedDocument } from './sync-test-helpers'
import { initialDataState } from '../../src/store/data-slice'
import { useStore } from '../../src/store'

const sdk = vi.hoisted(() => ({ onSnapshot: vi.fn(), collection: vi.fn(), query: vi.fn(),
  orderBy: vi.fn(), limit: vi.fn() }))
vi.mock('firebase/firestore', () => sdk)
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks() })

it('extracts estimates before decoding while confirmed malformed null timestamps still kill the faulty stream', () => {
  vi.useFakeTimers()
  sdk.onSnapshot.mockReturnValue(vi.fn())
  useStore.setState(initialDataState('owner'))
  const frames = controlledFrames()
  const controller = createListenerSession({} as Firestore, 'owner', {
    requestFrame: frames.request, cancelFrame: frames.cancel })
  try {
    const next = sdk.onSnapshot.mock.calls[0][2]
    const stored = storedDocument('projects')
    const data = vi.fn((options) => ({ ...stored, createdAt: options?.serverTimestamps === 'estimate'
      ? { seconds: 123, nanoseconds: 0 } : null }))
    const snapshot = { metadata: { fromCache: true, hasPendingWrites: true }, size: 1,
      docs: [{ id: 'pending' }], docChanges: () => [{ type: 'added', doc: { id: 'pending', data } }] }
    next(snapshot)
    frames.flush()
    expect(data).toHaveBeenCalledWith({ serverTimestamps: 'estimate' })
    expect(useStore.getState().rawProjects[0].createdAt).toBe(123000)
    expect(useStore.getState().streams.projects.error).toBeNull()
    expect(useStore.getState().streams.projects.registered).toBe(true)
    next({ ...snapshot, metadata: { fromCache: false, hasPendingWrites: false }, docChanges: () => [{
      type: 'modified', doc: { id: 'pending', data: () => ({ ...stored, createdAt: null }) } }] })
    frames.flush()
    expect(useStore.getState().streams.projects.error?.kind).toBe('decode')
    expect(useStore.getState().streams.projects.registered).toBe(false)
  } finally { controller.stop() }
})
