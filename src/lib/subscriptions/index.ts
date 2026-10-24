import { publishSessionData, resetData } from '../../store'
import type { createListenerSession } from './listeners'
import { clearMutationSession, installMutationSession } from '../mutations'

let generation = 0
let session: { uid: string; ready: Promise<void>; controller?: ReturnType<typeof createListenerSession> } | undefined

export function stopSubscriptions() {
  generation++
  clearMutationSession()
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
      let writeTesting: Promise<typeof import('./write-test-probe')> | undefined
      if (import.meta.env.MODE === 'e2e') writeTesting = import('./write-test-probe')
      const [listeners, adapter, writes, observerModule, probe] = await Promise.all([
        import('./listeners'), import('../firebase/firestore'), import('../firebase/writes'), testing, writeTesting,
      ])
      if (session !== current || token !== generation) return
      let observer: import('./listeners').ListenerObserver | undefined
      if (import.meta.env.MODE === 'e2e') observer = observerModule?.installTestObserver(startedAt)
      const database = adapter.initializeBrowserFirestore()
      current.controller = listeners.createListenerSession(database, uid, { observer })
      installMutationSession(writes.createMutationWriter(database, uid),
        () => session === current && token === generation)
      if (import.meta.env.MODE === 'e2e') probe?.installWriteTestProbe(database)
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
