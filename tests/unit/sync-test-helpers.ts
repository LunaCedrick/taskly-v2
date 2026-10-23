import { makeFakeData } from '../../src/lib/fake-data'
import type { StreamState } from '../../src/store/data-slice'
import type { StreamName } from '../../src/lib/types'

export const fixture = makeFakeData(3)
export const confirmed: StreamState = { ready: true, registered: true, fromCache: false, error: null }
export const confirmedStreams = { projects: confirmed, tasks: confirmed, activity: confirmed }

export function controlledFrames() {
  let id = 0
  const callbacks = new Map<number, FrameRequestCallback>()
  return {
    request: (callback: FrameRequestCallback) => { callbacks.set(++id, callback); return id },
    cancel: (frame: number) => { callbacks.delete(frame) },
    size: () => callbacks.size,
    flush: () => {
      const pending = [...callbacks.values()]
      callbacks.clear()
      pending.forEach((callback) => callback(0))
    },
  }
}

export interface RawChange {
  type: 'added' | 'modified' | 'removed'
  doc: { id: string; data: () => unknown }
}
export interface RawSnapshot {
  metadata: { fromCache: boolean }
  size: number
  docs: { id: string }[]
  docChanges: (options: { includeMetadataChanges: boolean }) => RawChange[]
}

export function rawChange(type: RawChange['type'], id: string, data?: unknown): RawChange {
  return { type, doc: { id, data: () => data } }
}

export function snapshot(fromCache: boolean, changes: RawChange[] = [], ids = changes
  .filter((change) => change.type !== 'removed').map((change) => change.doc.id)): RawSnapshot {
  return { metadata: { fromCache }, size: ids.length, docs: ids.map((id) => ({ id })), docChanges: () => changes }
}

export function storedDocument(stream: StreamName, index = 0): Record<string, unknown> {
  const timestamp = (ms: number) => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1_000_000 })
  if (stream === 'activity') return { type: 'anything', text: 'Activity', taskId: null, projectId: null,
    createdAt: timestamp(fixture.now) }
  const source = stream === 'projects' ? fixture.projects[index] : fixture.tasks[index]
  const data: Record<string, unknown> = { ...source }
  delete data.id
  for (const key of ['createdAt', 'updatedAt', 'dueDate', 'completedAt']) {
    if (typeof data[key] === 'number') data[key] = timestamp(data[key])
  }
  return data
}
