import { applyChanges, type EntityChange } from '../sync-changes'
import type { Activity, Project, StreamDocuments, StreamName, Task } from '../types'
import type { DataPublication, StreamState } from '../../store/data-slice'

type Document = StreamDocuments[StreamName]
type SourceData = { [S in StreamName]: readonly StreamDocuments[S][] }
interface Options {
  current: () => SourceData
  publish: (publication: DataPublication) => void
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
}

/** One final change per document, even when a hidden tab never receives a frame. */
export function createFrameBatch({ current, publish,
  requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }: Options) {
  const pending = new Map<StreamName, Map<string, EntityChange<Document>>>()
  const baseIds = new Map<StreamName, Set<string>>()
  const membership = new Map<StreamName, Set<string>>()
  let states: DataPublication['streams'] = {}
  let frame: number | undefined
  let disposed = false

  function flush() {
    frame = undefined
    if (disposed) return
    const source = current()
    const publication: DataPublication = { streams: states }
    if (pending.has('projects')) publication.rawProjects = applyChanges(source.projects,
      [...pending.get('projects')!.values()] as EntityChange<Project>[])
    if (pending.has('tasks')) publication.rawTasks = applyChanges(source.tasks,
      [...pending.get('tasks')!.values()] as EntityChange<Task>[])
    if (pending.has('activity')) publication.activity = applyChanges(source.activity,
      [...pending.get('activity')!.values()] as EntityChange<Activity>[])
    function ordered<T extends { id: string }>(stream: StreamName, rows: readonly T[]): readonly T[] {
      const ids = membership.get(stream)
      if (!ids) return rows
      const documents = new Map(rows.map((document) => [document.id, document]))
      const ordered = [...ids].flatMap((id) => documents.has(id) ? [documents.get(id)!] : [])
      return rows.length === ordered.length && rows.every((row, index) => row === ordered[index]) ? rows : ordered
    }
    if (membership.has('projects')) publication.rawProjects = ordered('projects', publication.rawProjects ?? source.projects)
    if (membership.has('tasks')) publication.rawTasks = ordered('tasks', publication.rawTasks ?? source.tasks)
    if (membership.has('activity')) publication.activity = ordered('activity', publication.activity ?? source.activity)
    pending.clear()
    baseIds.clear()
    membership.clear()
    states = {}
    publish(publication)
  }

  function enqueue<S extends StreamName>(stream: S, changes: readonly EntityChange<StreamDocuments[S]>[],
    state: StreamState, order?: readonly string[]) {
    if (disposed) return
    let documents = pending.get(stream)
    if (!documents) {
      documents = new Map()
      pending.set(stream, documents)
      baseIds.set(stream, new Set(current()[stream].map((document) => document.id)))
    }
    const original = baseIds.get(stream)!
    for (const change of changes) {
      if (change.type === 'removed' && !original.has(change.id)) documents.delete(change.id)
      // Query indices describe intermediate snapshots; the final activity IDs carry its bounded order.
      else documents.set(change.id, { id: change.id, type: change.type, data: change.data })
    }
    states![stream] = { ...state }
    if (order) membership.set(stream, new Set(stream === 'activity' ? order.slice(0, 20) : order))
    else if (membership.has(stream)) {
      const ids = membership.get(stream)!
      for (const change of changes) {
        if (change.type === 'removed') ids.delete(change.id)
        else ids.add(change.id)
      }
    }
    frame ??= requestFrame(flush)
  }

  return { enqueue, pendingSize: () => [...pending.values()].reduce((size, rows) => size + rows.size, 0),
    stop() {
      disposed = true
      if (frame !== undefined) cancelFrame(frame)
      frame = undefined
      pending.clear()
      baseIds.clear()
      membership.clear()
      states = {}
    } }
}
