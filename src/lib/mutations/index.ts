import type { MutationResult, MutationWriter, WriteOperation } from './types'

let generation = 0
let binding: { writer: MutationWriter; current: () => boolean } | undefined

export function clearMutationSession() {
  generation++
  binding = undefined
  // Disposing this facade does NOT cancel writes already queued inside the SDK.
}

export function installMutationSession(writer: MutationWriter, current: () => boolean) {
  clearMutationSession()
  binding = { writer, current }
}

/** Session bootstrap loads the adapter; submitting never imports a module. */
export function submitMutation(operations: readonly WriteOperation[]): Promise<MutationResult> {
  const active = binding
  const token = generation
  if (!active?.current()) throw new Error('Writes are not ready for this session')
  const currentSession = () => binding === active && generation === token && active.current()
  return active.writer(operations).then(
    () => ({ outcome: 'acknowledged', currentSession: currentSession() }),
    (error: unknown) => ({ outcome: 'rejected', currentSession: currentSession(),
      error: error instanceof Error ? error.message : String(error) }),
  )
}
