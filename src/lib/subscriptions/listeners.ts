import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import type { Firestore, QueryDocumentSnapshot } from 'firebase/firestore'
import { decodeDocument } from '../firebase/firestore-codec'
import type { StreamDocuments, StreamName } from '../types'
import type { EntityChange } from '../sync-changes'
import { publishSessionData, useStore } from '../../store'
import type { StreamError, StreamState } from '../../store/data-slice'
import { createFrameBatch } from './frame-batch'

const streams = ['projects', 'tasks', 'activity'] as const
export interface SubscriptionEvent {
  type: 'register' | 'stop' | 'snapshot' | 'timeout' | 'error' | 'ready'
  stream: StreamName
  fromCache?: boolean
  hasPendingWrites?: boolean
  size?: number
  changes?: number
  message?: string
  callbackAt?: number
  decodedAt?: number
  at: number
}
export interface ListenerObserver {
  event: (event: SubscriptionEvent) => void
  inspect?: (stream: StreamName, document: QueryDocumentSnapshot) => void
  controls?: (controls: { fail: (stream: StreamName) => void }) => void
}
interface Options {
  now?: () => number
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
  observer?: ListenerObserver
}
interface Handle {
  stop: () => void
  timer?: ReturnType<typeof setTimeout>
  dead: boolean
  reconciled: boolean
  state: StreamState
}

export function createListenerSession(database: Firestore, uid: string, options: Options = {}) {
  const now = options.now ?? Date.now
  const handles = new Map<StreamName, Handle>()
  let stopped = false
  const batch = createFrameBatch({ current: () => {
    const state = useStore.getState()
    return { projects: state.rawProjects, tasks: state.rawTasks, activity: state.activity }
  }, publish: (publication) => publishSessionData(uid, publication, now()),
  requestFrame: options.requestFrame, cancelFrame: options.cancelFrame })
  const record = (event: Omit<SubscriptionEvent, 'at'>) => options.observer?.event({ ...event, at: now() })
  const active = (stream: StreamName, handle: Handle) => !stopped && handles.get(stream) === handle && !handle.dead

  function fail(stream: StreamName, handle: Handle, error: StreamError) {
    if (!active(stream, handle)) return
    clearTimeout(handle.timer)
    handle.dead = true
    handle.state = { ...handle.state, error, registered: false }
    batch.enqueue(stream, [], handle.state)
    record({ type: 'error', stream, message: error.kind })
  }

  function register<S extends StreamName>(stream: S, previous?: StreamState) {
    const handle: Handle = { stop: () => {}, dead: false, reconciled: false,
      state: { ready: previous?.ready ?? false, fromCache: null, registered: true, error: previous?.error ?? null } }
    handles.set(stream, handle)
    // The deadline starts at registration, including a connection that delivers no snapshot.
    handle.timer = setTimeout(() => {
      if (!active(stream, handle) || handle.state.fromCache === false) return
      handle.state = { ...handle.state, error: { kind: 'timeout', message: 'Server confirmation timed out' } }
      batch.enqueue(stream, [], handle.state)
      record({ type: 'timeout', stream })
    }, 10_000)
    batch.enqueue(stream, [], handle.state)
    const path = collection(database, 'users', uid, stream)
    const reference = stream === 'activity' ? query(path, orderBy('createdAt', 'desc'), limit(20)) : query(path)
    record({ type: 'register', stream })
    try {
      handle.stop = onSnapshot(reference, { includeMetadataChanges: true }, (snapshot) => {
        if (!active(stream, handle)) return
        const callbackAt = options.observer ? now() : undefined
        try {
          const changes: EntityChange<StreamDocuments[S]>[] = snapshot.docChanges({ includeMetadataChanges: true })
            .map((change) => {
              options.observer?.inspect?.(stream, change.doc)
              return { id: change.doc.id, type: change.type,
                ...(change.type === 'removed' ? {} : { data: decodeDocument(stream, change.doc.id,
                  change.doc.data({ serverTimestamps: 'estimate' })) }) }
            })
          const fromCache = snapshot.metadata.fromCache
          handle.state = { ...handle.state, fromCache,
            ...(fromCache ? {} : { ready: true, error: null }) }
          if (!fromCache) clearTimeout(handle.timer)
          // A replacement listener reports its current documents as added; reconcile IDs once
          // against the server so retained documents deleted during the failure disappear too.
          const ids = stream === 'activity' || (!fromCache && !handle.reconciled)
            ? snapshot.docs.map((document) => document.id) : undefined
          if (!fromCache) handle.reconciled = true
          batch.enqueue(stream, changes, handle.state, ids)
          record({ type: 'snapshot', stream, fromCache, size: snapshot.size, changes: changes.length,
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
            callbackAt, decodedAt: options.observer ? now() : undefined })
          if (!fromCache) record({ type: 'ready', stream })
        } catch (error) {
          handle.stop()
          fail(stream, handle, { kind: 'decode', message: error instanceof Error ? error.message : 'Malformed document' })
        }
      }, (error) => fail(stream, handle, { kind: 'listener', message: error.code }))
    } catch (error) {
      fail(stream, handle, { kind: 'listener', message: error instanceof Error ? error.message : 'Listener registration failed' })
    }
  }

  function retire(stream: StreamName, handle: Handle) {
    clearTimeout(handle.timer)
    handle.dead = true
    handle.stop()
    record({ type: 'stop', stream })
  }

  for (const stream of streams) register(stream)
  options.observer?.controls?.({ fail: (stream) => {
    const handle = handles.get(stream)
    if (handle) { handle.stop(); fail(stream, handle, { kind: 'listener', message: 'Deterministic test failure' }) }
  } })

  return { retryFailed() {
    if (stopped) return
    for (const [stream, handle] of handles) {
      if (!handle.state.error) continue
      retire(stream, handle)
      register(stream, handle.state)
    }
  }, stop() {
    if (stopped) return
    stopped = true
    for (const [stream, handle] of handles) retire(stream, handle)
    handles.clear()
    batch.stop()
  } }
}
