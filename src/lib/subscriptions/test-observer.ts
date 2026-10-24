import { useStore } from '../../store'
import type { StreamName } from '../types'
import type { ListenerObserver, SubscriptionEvent } from './listeners'

interface SyncTestObserver {
  events: SubscriptionEvent[]
  pendingDocuments: { stream: StreamName; id: string; nullFields: string[]; estimates: Record<string, number> }[]
  startedAt: number
  firstDataAt: number | null
  firstDataPaintAt: number | null
  firstPaintRows: number | null
  snapshot: () => { uid: string | null; dataReady: boolean; handles: number; activeHandles: number; registrations: number;
    projects: number; tasks: number; activity: number; activityIds: string[]; activityCreatedAt: number[];
    orphanCount: number; streams: ReturnType<typeof useStore.getState>['streams'] }
  fail: (stream: StreamName) => void
}
declare global { interface Window { __TASKLY_G2_SYNC_TEST__?: SyncTestObserver } }

let observer: SyncTestObserver | undefined
let control: ((stream: StreamName) => void) | undefined
let handles = 0
let registrations = 0
const active = new Set<StreamName>()

/** Loaded exclusively by the facade's compile-time e2e branch. No SDK reads or registrations. */
export function installTestObserver(startedAt = Date.now()): ListenerObserver {
  observer ??= { events: [], pendingDocuments: [], startedAt, firstDataAt: null, firstDataPaintAt: null, firstPaintRows: null, snapshot: () => {
    const state = useStore.getState()
    return { uid: state.dataUid, dataReady: state.dataReady, handles, activeHandles: active.size, registrations,
      projects: state.projects.length, tasks: state.tasks.length, activity: state.activity.length,
      activityIds: state.activity.map((item) => item.id), activityCreatedAt: state.activity.map((item) => item.createdAt),
      orphanCount: state.orphanCount, streams: state.streams }
  }, fail: (stream) => control?.(stream) }
  observer.startedAt = startedAt
  observer.firstDataAt = null
  observer.firstDataPaintAt = null
  observer.firstPaintRows = null
  const stop = useStore.subscribe((state) => {
    if (state.dataReady && observer!.firstDataAt === null) {
      observer!.firstDataAt = Date.now()
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (observer!.startedAt === startedAt) {
          observer!.firstDataPaintAt = Date.now()
          observer!.firstPaintRows = document.querySelectorAll('[data-task-id]').length
        }
      }))
    }
    if (!state.dataUid) stop()
  })
  window.__TASKLY_G2_SYNC_TEST__ = observer
  return { inspect(stream, document) {
    if (!document.metadata.hasPendingWrites) return
    const raw = document.data()
    const estimated = document.data({ serverTimestamps: 'estimate' })
    const fields = ['createdAt', 'updatedAt', 'completedAt']
    observer!.pendingDocuments.push({ stream, id: document.id,
      nullFields: fields.filter((field) => Object.hasOwn(raw, field) && raw[field] === null),
      estimates: Object.fromEntries(fields.filter((field) => estimated[field]?.toMillis)
        .map((field) => [field, estimated[field].toMillis() as number])) })
    if (observer!.pendingDocuments.length > 200) observer!.pendingDocuments.shift()
  }, event(event) {
    if (event.type === 'register') { handles++; registrations++; active.add(event.stream) }
    if (event.type === 'stop') { handles--; active.delete(event.stream) }
    if (event.type === 'error') active.delete(event.stream)
    observer!.events.push(event)
    if (observer!.events.length > 2000) observer!.events.splice(0, observer!.events.length - 2000)
  }, controls(controls) { control = controls.fail } }
}
