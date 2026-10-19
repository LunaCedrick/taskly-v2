import { observeSession } from '../../lib/firebase/auth'
import { applySession } from '../../store'

let unsubscribe: (() => void) | undefined

export function stopSession() {
  const stop = unsubscribe
  unsubscribe = undefined
  stop?.()
}

export function startSession() {
  if (!unsubscribe) unsubscribe = observeSession(applySession)
  return stopSession
}
