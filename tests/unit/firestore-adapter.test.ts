import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../../src/lib/firebase/emulator-config'

const boundary = vi.hoisted(() => {
  const app = { options: { projectId: 'demo-taskly-auth' } }
  const firestore = { type: 'firestore' }
  const memoryCache = { kind: 'memory' }
  const auth = { emulatorConfig: null }
  const indexedDBPersistence = { name: 'indexedDB' }
  const browserPersistence = { name: 'localStorage' }
  return {
    app, firestore, memoryCache, auth, indexedDBPersistence, browserPersistence,
    getFirebaseApp: vi.fn(() => app),
    initializeFirestore: vi.fn(() => firestore),
    memoryLocalCache: vi.fn(() => memoryCache),
    connectFirestoreEmulator: vi.fn(),
    initializeAuth: vi.fn(() => auth),
  }
})

vi.mock('../../src/lib/firebase/client', () => ({ getFirebaseApp: boundary.getFirebaseApp }))
vi.mock('firebase/firestore', () => ({
  initializeFirestore: boundary.initializeFirestore,
  memoryLocalCache: boundary.memoryLocalCache,
  connectFirestoreEmulator: boundary.connectFirestoreEmulator,
}))
vi.mock('firebase/auth', () => ({
  initializeAuth: boundary.initializeAuth,
  indexedDBLocalPersistence: boundary.indexedDBPersistence,
  browserLocalPersistence: boundary.browserPersistence,
  browserPopupRedirectResolver: {},
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  connectAuthEmulator: vi.fn(),
}))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  vi.stubEnv('VITE_USE_FIRESTORE_EMULATOR', undefined)
  vi.stubEnv('VITE_USE_AUTH_EMULATOR', undefined)
  boundary.app.options.projectId = EMULATOR_PROJECT_ID
})

afterEach(() => vi.unstubAllEnvs())

describe('browser Firestore adapter', () => {
  it('does not initialize a Firebase service merely by importing the adapter', async () => {
    await import('../../src/lib/firebase/firestore')

    expect(boundary.getFirebaseApp).not.toHaveBeenCalled()
    expect(boundary.memoryLocalCache).not.toHaveBeenCalled()
    expect(boundary.initializeFirestore).not.toHaveBeenCalled()
    expect(boundary.connectFirestoreEmulator).not.toHaveBeenCalled()
  })

  it('creates one instance with an explicit memory-only cache', async () => {
    const { initializeBrowserFirestore } = await import('../../src/lib/firebase/firestore')

    expect(initializeBrowserFirestore()).toBe(boundary.firestore)
    expect(initializeBrowserFirestore()).toBe(boundary.firestore)
    expect(boundary.getFirebaseApp).toHaveBeenCalledTimes(1)
    expect(boundary.memoryLocalCache).toHaveBeenCalledTimes(1)
    expect(boundary.initializeFirestore).toHaveBeenCalledExactlyOnceWith(boundary.app, {
      localCache: boundary.memoryCache,
    })
  })

  it('connects the explicit demo-project emulator once using the shared host and port', async () => {
    vi.stubEnv('VITE_USE_FIRESTORE_EMULATOR', 'true')
    const { initializeBrowserFirestore } = await import('../../src/lib/firebase/firestore')

    initializeBrowserFirestore()
    initializeBrowserFirestore()

    expect(boundary.connectFirestoreEmulator).toHaveBeenCalledExactlyOnceWith(
      boundary.firestore, EMULATOR_HOST, EMULATOR_PORTS.firestore,
    )
    expect(EMULATOR_PORTS.firestore).toBe(8081)
  })

  it.each([undefined, '', 'false', 'TRUE', '1'])(
    'does not connect with flag %s even in development', async (flag) => {
      vi.stubEnv('DEV', true)
      vi.stubEnv('VITE_USE_FIRESTORE_EMULATOR', flag)
      boundary.app.options.projectId = 'normal-project'
      const { initializeBrowserFirestore } = await import('../../src/lib/firebase/firestore')

      initializeBrowserFirestore()

      expect(boundary.initializeFirestore).toHaveBeenCalledTimes(1)
      expect(boundary.connectFirestoreEmulator).not.toHaveBeenCalled()
    },
  )

  it('rejects a non-demo emulator project before initializing Firestore and permits a safe retry', async () => {
    vi.stubEnv('VITE_USE_FIRESTORE_EMULATOR', 'true')
    boundary.app.options.projectId = 'normal-project'
    const { initializeBrowserFirestore } = await import('../../src/lib/firebase/firestore')

    expect(() => initializeBrowserFirestore()).toThrow('Firestore emulator requires the demo test project')
    expect(boundary.memoryLocalCache).not.toHaveBeenCalled()
    expect(boundary.initializeFirestore).not.toHaveBeenCalled()
    expect(boundary.connectFirestoreEmulator).not.toHaveBeenCalled()

    boundary.app.options.projectId = EMULATOR_PROJECT_ID
    expect(initializeBrowserFirestore()).toBe(boundary.firestore)
    expect(boundary.initializeFirestore).toHaveBeenCalledTimes(1)
    expect(boundary.connectFirestoreEmulator).toHaveBeenCalledTimes(1)
  })

  it('keeps the existing Auth IndexedDB and localStorage persistence configuration', async () => {
    const { initializeBrowserFirestore } = await import('../../src/lib/firebase/firestore')
    const { initializeBrowserAuth } = await import('../../src/lib/firebase/auth')

    initializeBrowserFirestore()
    initializeBrowserAuth()

    expect(boundary.initializeAuth).toHaveBeenCalledExactlyOnceWith(boundary.app, {
      persistence: [boundary.indexedDBPersistence, boundary.browserPersistence],
    })
  })
})
