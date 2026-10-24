import { observeSession } from '../../lib/firebase/auth'
import { applySession } from '../../store'
import { startSubscriptions, stopSubscriptions } from '../../lib/subscriptions'

let unsubscribe: (() => void) | undefined

export function stopSession() {
  const stop = unsubscribe
  unsubscribe = undefined
  stop?.()
  stopSubscriptions()
}

export function startSession() {
  if (!unsubscribe) unsubscribe = observeSession((user) => {
    applySession(user)
    if (user) void startSubscriptions(user.uid)
    else stopSubscriptions()
  })
  return stopSession
}
