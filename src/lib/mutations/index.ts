import type { MutationResult, MutationWriter, WriteOperation } from './types'

let generation = 0
let binding: { writer: MutationWriter; current: () => boolean; uid?: string } | undefined
const queued = new Set<{ uid?: string; taskIds: readonly string[]; projectIds: readonly string[] }>()
export const pendingTasksFor = (uid: string | null) => [...queued]
  .filter((item) => item.uid === uid).flatMap((item) => item.taskIds)
export const pendingProjectsFor = (uid: string | null) => [...queued]
  .filter((item) => item.uid === uid).flatMap((item) => item.projectIds)
// Q17: survives session disposal/account changes. SDK waitForPendingWrites does not.
let pending = 0
const observers = new Set<() => void>()
export const pendingWriteCount = () => pending
export const observePendingWrites = (observer: () => void) => {
  observers.add(observer)
  return () => { observers.delete(observer) }
}
export function holdPendingWrites() {
  pending++
  observers.forEach((observer) => observer())
  let released = false
  return () => {
    if (released) return
    released = true
    pending--
    observers.forEach((observer) => observer())
  }
}

export function installUnloadGuard(target: Window = window) {
  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (!pending) return
    event.preventDefault()
    event.returnValue = ''
  }
  let attached = false
  const update = () => {
    if (pending > 0 && !attached) { target.addEventListener('beforeunload', beforeUnload); attached = true }
    else if (!pending && attached) { target.removeEventListener('beforeunload', beforeUnload); attached = false }
  }
  const unsubscribe = observePendingWrites(update)
  update()
  return () => { unsubscribe(); target.removeEventListener('beforeunload', beforeUnload) }
}

export function clearMutationSession() {
  generation++
  binding = undefined
  // Disposing this facade does NOT cancel writes already queued inside the SDK.
}

export function installMutationSession(writer: MutationWriter, current: () => boolean, uid?: string) {
  clearMutationSession()
  binding = { writer, current, uid }
}

/** Session bootstrap loads the adapter; submitting never imports a module. */
export function submitMutation(operations: readonly WriteOperation[], projectIds: readonly string[] = []): Promise<MutationResult> {
  const active = binding
  const token = generation
  if (!active?.current()) throw new Error('Writes are not ready for this session')
  const currentSession = () => binding === active && generation === token && active.current()
  const release = holdPendingWrites()
  const entry = { uid: active.uid, taskIds: operations.filter((op) => op.stream === 'tasks').map((op) => op.id),
    projectIds: [...projectIds, ...operations.flatMap((op) => op.stream === 'tasks' && op.kind !== 'delete'
      && typeof op.data.projectId === 'string' ? [op.data.projectId] : [])] }
  queued.add(entry)
  let submitted: Promise<void>
  try { submitted = active.writer(operations) } catch (error) { queued.delete(entry); release(); throw error }
  return submitted.then(
    () => ({ outcome: 'acknowledged' as const, currentSession: currentSession() }),
    (error: unknown) => ({ outcome: 'rejected' as const, currentSession: currentSession(),
      error: error instanceof Error ? error.message : String(error) }),
  ).finally(() => { queued.delete(entry); release() })
}
