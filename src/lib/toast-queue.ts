import type { Toast } from '../store/write-slice'

/** Errors are sticky and unbounded by the normal-message cap. Preserve merged drafts. */
export function enqueueToast(queue: readonly Toast[], incoming: Toast): readonly Toast[] {
  if (incoming.error) {
    const index = queue.findIndex((toast) => toast.error && toast.text === incoming.text)
    if (index >= 0) {
      const current = queue[index]
      const recovery = incoming.recovery || incoming.projectRecovery
        ? { recovery: incoming.recovery, projectRecovery: incoming.projectRecovery } : undefined
      const merged = !recovery ? current : current.recovery || current.projectRecovery
        ? { ...current, extraRecoveries: [...(current.extraRecoveries ?? []), recovery] }
        : { ...current, ...recovery }
      return queue.map((toast, position) => position === index ? merged : toast)
    }
    return [...queue, incoming]
  }
  const next = [...queue, incoming]
  if (next.filter((toast) => !toast.error).length > 4) {
    // Index zero is the visible message. Evict the oldest queued normal message only.
    const oldest = next.findIndex((toast, index) => index > 0 && !toast.error)
    next.splice(oldest, 1)
  }
  return next
}
