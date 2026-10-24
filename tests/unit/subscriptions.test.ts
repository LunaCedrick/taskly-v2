import type { Firestore } from 'firebase/firestore'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createListenerSession, type SubscriptionEvent } from '../../src/lib/subscriptions/listeners'
import { retrySubscriptions, startSubscriptions, stopSubscriptions } from '../../src/lib/subscriptions'
import { useStore } from '../../src/store'
import { initialDataState } from '../../src/store/data-slice'
import { selectDataView } from '../../src/store/selectors'
import type { StreamName } from '../../src/lib/types'
import { controlledFrames, rawChange, snapshot, storedDocument, type RawSnapshot } from './sync-test-helpers'

interface Registration {
  reference: { path: string; constraints: unknown[] }
  options: { includeMetadataChanges: boolean }
  next: (snapshot: RawSnapshot) => void
  error: (error: { code: string }) => void
  stop: ReturnType<typeof vi.fn>
  active: boolean
}

const sdk = vi.hoisted(() => {
  const registrations: Registration[] = []
  return {
    registrations,
    initializeFirestore: vi.fn(() => ({})),
    collection: vi.fn((_database: unknown, ...path: string[]) => ({ path: path.join('/') })),
    query: vi.fn((reference: { path: string }, ...constraints: unknown[]) => ({ ...reference, constraints })),
    orderBy: vi.fn((field: string, direction: string) => ({ field, direction })),
    limit: vi.fn((count: number) => ({ count })),
    onSnapshot: vi.fn((reference: Registration['reference'], options: Registration['options'],
      next: Registration['next'], error: Registration['error']) => {
      const registration: Registration = { reference, options, next, error, active: true, stop: vi.fn() }
      registration.stop.mockImplementation(() => { registration.active = false })
      registrations.push(registration)
      return registration.stop
    }),
  }
})

vi.mock('firebase/firestore', () => ({
  ...sdk, memoryLocalCache: vi.fn(() => ({ kind: 'memory' })), connectFirestoreEmulator: vi.fn(),
}))
vi.mock('../../src/lib/firebase/client', () => ({
  getFirebaseApp: () => ({ options: { projectId: 'demo-taskly-auth' } }),
}))

let frames: ReturnType<typeof controlledFrames>
let controller: ReturnType<typeof createListenerSession> | undefined
let events: SubscriptionEvent[]
const database = {} as Firestore

beforeEach(() => {
  vi.useFakeTimers()
  vi.clearAllMocks()
  sdk.registrations.length = 0
  frames = controlledFrames()
  events = []
  useStore.setState(initialDataState('user', 100))
  vi.stubGlobal('requestAnimationFrame', frames.request)
  vi.stubGlobal('cancelAnimationFrame', frames.cancel)
})

afterEach(() => {
  controller?.stop()
  controller = undefined
  stopSubscriptions()
  expect(vi.getTimerCount()).toBe(0)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function start() {
  controller = createListenerSession(database, 'user', {
    now: () => 123, requestFrame: frames.request, cancelFrame: frames.cancel,
    observer: { event: (event) => events.push(event) },
  })
  return controller
}

function latest(stream: StreamName): Registration {
  const registration = sdk.registrations.findLast((item) => item.reference.path.endsWith(`/${stream}`))
  if (!registration) throw new Error(`Missing ${stream} listener`)
  return registration
}

function confirm(stream: StreamName) { latest(stream).next(snapshot(false)) }
function fail(stream: StreamName) {
  const registration = latest(stream)
  registration.active = false // A real terminal SDK error ends its registration.
  registration.error({ code: 'permission-denied' })
}

describe('session Firestore listeners', () => {
  it('registers exactly three metadata listeners once and limits activity to the latest 20', () => {
    start()
    expect(sdk.registrations.map((row) => row.reference.path)).toEqual([
      'users/user/projects', 'users/user/tasks', 'users/user/activity',
    ])
    expect(sdk.registrations.every((row) => row.options.includeMetadataChanges)).toBe(true)
    expect(latest('activity').reference.constraints).toEqual([{ field: 'createdAt', direction: 'desc' }, { count: 20 }])
    expect(latest('tasks').reference.constraints).toEqual([])
    frames.flush()
    expect(useStore.getState().streams.projects.registered).toBe(true)
    controller?.stop()
    controller?.stop()
    expect(sdk.registrations.every((row) => !row.active)).toBe(true)
    expect(sdk.registrations.every((row) => row.stop.mock.calls.length === 1)).toBe(true)
  })

  it('keeps empty and nonempty cached snapshots unready until metadata-only server confirmation', () => {
    start()
    latest('projects').next(snapshot(true, [rawChange('added', 'project', storedDocument('projects'))]))
    latest('tasks').next(snapshot(true, [rawChange('added', 'task', { ...storedDocument('tasks'), projectId: 'project' })]))
    latest('activity').next(snapshot(true))
    frames.flush()
    const cached = useStore.getState()
    expect(useStore.getState().rawProjects).toHaveLength(1)
    expect(useStore.getState().dataReady).toBe(false)
    expect(selectDataView(useStore.getState())).toBe('loading')
    latest('projects').next(snapshot(false, [], ['project']))
    frames.flush()
    expect(selectDataView(useStore.getState())).toBe('loading')
    latest('tasks').next(snapshot(false, [], ['task']))
    frames.flush()
    expect(useStore.getState().dataReady).toBe(true)
    expect(useStore.getState().streams.activity.ready).toBe(false)
    expect(selectDataView(useStore.getState())).toBe('ready')
    expect(useStore.getState().rawProjects).toBe(cached.rawProjects)
    expect(useStore.getState().rawTasks).toBe(cached.rawTasks)
    expect(useStore.getState().tasks).toHaveLength(1)
    expect(useStore.getState().now).toBe(123)
  })

  it('starts the 10-second deadline at registration even with no snapshots and automatically recovers on late confirmation', () => {
    start()
    vi.advanceTimersByTime(9_999)
    frames.flush()
    expect(useStore.getState().streams.projects.error).toBeNull()
    vi.advanceTimersByTime(1)
    frames.flush()
    expect(useStore.getState().streams.projects.error?.kind).toBe('timeout')
    expect(selectDataView(useStore.getState())).toBe('error')
    expect(sdk.registrations.filter((row) => row.active)).toHaveLength(3)
    confirm('projects')
    confirm('tasks')
    confirm('activity')
    frames.flush()
    expect(selectDataView(useStore.getState())).toBe('first-run')
    expect(sdk.registrations).toHaveLength(3)
    expect(useStore.getState().streams.projects.error).toBeNull()
  })

  it('requires explicit retry after a terminal listener error and only replaces failed streams', () => {
    start()
    confirm('projects'); confirm('tasks'); confirm('activity')
    frames.flush()
    fail('tasks')
    frames.flush()
    expect(useStore.getState().streams.tasks.error?.kind).toBe('listener')
    latest('tasks').next(snapshot(false))
    frames.flush()
    expect(useStore.getState().streams.tasks.error?.kind).toBe('listener')
    const projects = latest('projects')
    controller?.retryFailed()
    expect(sdk.registrations).toHaveLength(4)
    expect(latest('projects')).toBe(projects)
    expect(projects.stop).not.toHaveBeenCalled()
    frames.flush()
    expect(useStore.getState().streams.tasks.ready).toBe(true)
    expect(selectDataView(useStore.getState())).toBe('error')
    confirm('tasks')
    frames.flush()
    expect(selectDataView(useStore.getState())).toBe('first-run')
    expect(sdk.registrations.filter((row) => row.active)).toHaveLength(3)
  })

  it('gives each retried stream a fresh deadline without replacing healthy streams', () => {
    start()
    confirm('projects'); confirm('activity')
    vi.advanceTimersByTime(10_000)
    frames.flush()
    controller?.retryFailed()
    expect(sdk.registrations).toHaveLength(4)
    latest('tasks').next(snapshot(true))
    vi.advanceTimersByTime(9_999)
    frames.flush()
    expect(events.filter((event) => event.type === 'timeout' && event.stream === 'tasks')).toHaveLength(1)
    vi.advanceTimersByTime(1)
    frames.flush()
    expect(useStore.getState().streams.tasks.error?.kind).toBe('timeout')
    expect(events.filter((event) => event.type === 'timeout' && event.stream === 'tasks')).toHaveLength(2)
  })

  it('tracks activity-only failure without blocking views and retries it at the next explicit retry', () => {
    start()
    confirm('projects'); confirm('tasks')
    fail('activity')
    frames.flush()
    expect(selectDataView(useStore.getState())).toBe('first-run')
    expect(useStore.getState().streams.activity.error?.kind).toBe('listener')
    controller?.retryFailed()
    expect(sdk.registrations).toHaveLength(4)
    expect(latest('projects').stop).not.toHaveBeenCalled()
    confirm('activity')
    frames.flush()
    expect(useStore.getState().streams.activity.error).toBeNull()
  })

  it('surfaces malformed documents as decode errors and ignores callbacks after disposal', () => {
    start()
    const old = latest('projects')
    old.next(snapshot(false, [rawChange('added', 'bad', { name: 'missing fields' })]))
    frames.flush()
    expect(useStore.getState().streams.projects.error?.kind).toBe('decode')
    expect(useStore.getState().rawProjects).toEqual([])
    controller?.stop()
    old.next(snapshot(false, [rawChange('added', 'late', storedDocument('projects'))]))
    frames.flush()
    expect(useStore.getState().rawProjects).toEqual([])
    expect(frames.size()).toBe(0)
  })

  it('removes retained source and view documents deleted while a terminal listener was dead', () => {
    start()
    latest('projects').next(snapshot(false, [rawChange('added', 'project', storedDocument('projects'))]))
    latest('tasks').next(snapshot(false, [rawChange('added', 'deleted', { ...storedDocument('tasks'), projectId: 'project' })]))
    confirm('activity')
    frames.flush()
    expect(useStore.getState().stats.total).toBe(1)
    fail('tasks')
    frames.flush()
    expect(useStore.getState().streams.tasks.registered).toBe(false)
    expect(useStore.getState().rawTasks).toHaveLength(1)
    controller?.retryFailed()
    latest('tasks').next(snapshot(false)) // Backend deletion happened while no task watch was active.
    frames.flush()
    expect(useStore.getState()).toMatchObject({ rawTasks: [], tasks: [], stats: { total: 0 } })
    expect(sdk.registrations.filter((row) => row.active)).toHaveLength(3)
  })

  it('preserves a later addition in the same frame as retry membership reconciliation', () => {
    start()
    latest('projects').next(snapshot(false, [rawChange('added', 'project', storedDocument('projects'))]))
    confirm('tasks'); confirm('activity')
    frames.flush()
    fail('tasks')
    controller?.retryFailed()
    latest('tasks').next(snapshot(false))
    latest('tasks').next(snapshot(false, [rawChange('added', 'later', { ...storedDocument('tasks'), projectId: 'project' })]))
    frames.flush()
    expect(useStore.getState().rawTasks.map((task) => task.id)).toEqual(['later'])
    expect(useStore.getState().tasks.map((task) => task.id)).toEqual(['later'])
    expect(useStore.getState().stats.total).toBe(1)
    expect(sdk.registrations.filter((row) => row.active)).toHaveLength(3)
  })
})

describe('lazy subscription facade', () => {
  it('retries SDK initialization failure, deduplicates starts, cancels import races and isolates UIDs', async () => {
    sdk.initializeFirestore.mockImplementationOnce(() => { throw new Error('adapter failed') })
    await startSubscriptions('first')
    expect(useStore.getState().streams.tasks.error?.kind).toBe('load')
    retrySubscriptions()
    const pending = startSubscriptions('first')
    expect(startSubscriptions('first')).toBe(pending)
    await pending
    expect(sdk.registrations).toHaveLength(3)
    const old = latest('projects')
    const second = startSubscriptions('second')
    expect(sdk.registrations.every((row) => !row.active)).toBe(true)
    await second
    old.next(snapshot(false, [rawChange('added', 'late', storedDocument('projects'))]))
    frames.flush()
    expect(useStore.getState().dataUid).toBe('second')
    expect(useStore.getState().rawProjects).toEqual([])
    expect(sdk.registrations.filter((row) => row.active)).toHaveLength(3)
    stopSubscriptions()
    const count = sdk.registrations.length
    const race = startSubscriptions('cancelled')
    stopSubscriptions()
    await race
    expect(sdk.registrations).toHaveLength(count)
    expect(useStore.getState().dataUid).toBeNull()
    expect(sdk.registrations.every((row) => !row.active)).toBe(true)
  })
})
