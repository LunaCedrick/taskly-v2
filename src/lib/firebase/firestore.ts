import { connectFirestoreEmulator, initializeFirestore, memoryLocalCache } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import { getFirebaseApp } from './client'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from './emulator-config'

let browserFirestore: Firestore | undefined

export function initializeBrowserFirestore(): Firestore {
  if (browserFirestore) return browserFirestore

  const app = getFirebaseApp()
  const useEmulator = import.meta.env.VITE_USE_FIRESTORE_EMULATOR === 'true'
  if (useEmulator && app.options.projectId !== EMULATOR_PROJECT_ID) {
    throw new Error('Firestore emulator requires the demo test project')
  }

  const firestore = initializeFirestore(app, { localCache: memoryLocalCache() })
  if (useEmulator) {
    connectFirestoreEmulator(firestore, EMULATOR_HOST, EMULATOR_PORTS.firestore)
  }
  browserFirestore = firestore
  return firestore
}
