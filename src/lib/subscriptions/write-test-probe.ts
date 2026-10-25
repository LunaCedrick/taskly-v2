import { disableNetwork, enableNetwork, waitForPendingWrites } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { submitMutation } from '../mutations'
import type { MutationResult, MutationWriter, WriteOperation } from '../mutations/types'
import { initializeBrowserAuth } from '../firebase/auth'
import { useStore } from '../../store'

interface Observation {
  status: 'pending' | 'acknowledged' | 'rejected'
  currentSession?: boolean
  error?: string
}
interface WriteTestProbe {
  rejectNextTaskUpdate: () => void
  network: (enabled: boolean) => Promise<void>
  enqueue: (id: string, operations: readonly WriteOperation[]) => void
  wait: (id: string) => void
  snapshot: () => { operations: Record<string, Observation>; waiters: Record<string, Observation>;
    uid: string | null; email: string | null; projects: ReturnType<typeof useStore.getState>['rawProjects'];
    tasks: ReturnType<typeof useStore.getState>['rawTasks']; activity: ReturnType<typeof useStore.getState>['activity'] }
}
declare global { interface Window { __TASKLY_G3_WRITES_TEST__?: WriteTestProbe } }

let rejectNextUpdate = false
/** A real invalid immutable-time update, sent to emulator rules, never a mocked rejection. */
export function instrumentMutationWriter(writer: MutationWriter): MutationWriter {
  return (operations) => {
    if (!rejectNextUpdate) return writer(operations)
    rejectNextUpdate = false
    return writer(operations.map((operation) => operation.stream === 'tasks' && operation.kind === 'update'
      ? { ...operation, data: { ...operation.data, createdAt: 0 } } : operation))
  }
}

/** Emulator-only SDK experiment controls. Removed from normal production builds. */
export function installWriteTestProbe(database: Firestore) {
  if (window.__TASKLY_G3_WRITES_TEST__) return
  const operations: Record<string, Observation> = {}
  const waiters: Record<string, Observation> = {}
  window.__TASKLY_G3_WRITES_TEST__ = {
    rejectNextTaskUpdate: () => { rejectNextUpdate = true },
    network: (enabled) => enabled ? enableNetwork(database) : disableNetwork(database),
    enqueue(id, writes) {
      if (operations[id]) throw new Error('An experiment ID cannot be reused')
      operations[id] = { status: 'pending' }
      void submitMutation(writes).then((result: MutationResult) => {
        operations[id] = { status: result.outcome, currentSession: result.currentSession, error: result.error }
      })
    },
    wait(id) {
      waiters[id] = { status: 'pending' }
      void waitForPendingWrites(database).then(() => { waiters[id] = { status: 'acknowledged' } },
        (error: unknown) => { waiters[id] = { status: 'rejected', error: String(error) } })
    },
    snapshot() {
      const state = useStore.getState()
      return { operations, waiters, uid: state.dataUid, email: initializeBrowserAuth().currentUser?.email ?? null,
        projects: state.rawProjects, tasks: state.rawTasks, activity: state.activity }
    },
  }
}
