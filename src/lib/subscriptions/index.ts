import { publishSessionData, resetData } from '../../store'
import type { createListenerSession } from './listeners'

let generation = 0
let session: { uid: string; ready: Promise<void>; controller?: ReturnType<typeof createListenerSession> } | undefined

export function stopSubscriptions() {
  generation++
  session?.controller?.stop()
  session = undefined
  resetData(null)
}

export function startSubscriptions(uid: string): Promise<void> {
  if (session?.uid === uid) return session.ready
  stopSubscriptions()
  resetData(uid)
  const token = generation
  const startedAt = Date.now()
  const current = { uid, ready: Promise.resolve() } as NonNullable<typeof session>
  session = current
  current.ready = (async () => {
    try {
      let testing: Promise<typeof import('./test-observer')> | undefined
      if (import.meta.env.MODE === 'e2e') testing = import('./test-observer')
      const [listeners, adapter, observerModule] = await Promise.all([
        import('./listeners'), import('../firebase/firestore'), testing,
      ])
      if (session !== current || token !== generation) return
      let observer: import('./listeners').ListenerObserver | undefined
      if (import.meta.env.MODE === 'e2e') observer = observerModule?.installTestObserver(startedAt)
      current.controller = listeners.createListenerSession(adapter.initializeBrowserFirestore(), uid, { observer })
    } catch (error) {
      if (session !== current || token !== generation) return
      const state = { ready: false, registered: false, fromCache: null,
        error: { kind: 'load' as const, message: error instanceof Error ? error.message : 'Could not load data' } }
      publishSessionData(uid, { streams: { projects: state, tasks: state, activity: state } })
    }
  })()
  return current.ready
}

export function retrySubscriptions() {
  if (!session) return
  if (session.controller) session.controller.retryFailed()
  else {
    const uid = session.uid
    stopSubscriptions()
    void startSubscriptions(uid)
  }
}
