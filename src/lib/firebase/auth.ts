import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence,
  browserPopupRedirectResolver, GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signOut, connectAuthEmulator,
  type Auth, type User,
} from 'firebase/auth'
import { getFirebaseApp } from './client'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from './emulator-config'

export type AuthProfile = Pick<User, 'uid' | 'displayName' | 'photoURL'>
let browserAuth: Auth | undefined

export function initializeBrowserAuth() {
  if (browserAuth) return browserAuth
  const app = getFirebaseApp()
  const auth = initializeAuth(app, {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  })
  if (import.meta.env.VITE_USE_AUTH_EMULATOR === 'true' && !auth.emulatorConfig) {
    if (app.options.projectId !== EMULATOR_PROJECT_ID) {
      throw new Error('Auth emulator requires the demo test project')
    }
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`)
  }
  browserAuth = auth
  return auth
}

export function observeSession(onChange: (profile: AuthProfile | null) => void) {
  return onAuthStateChanged(initializeBrowserAuth(), (user) => onChange(user ? {
    uid: user.uid, displayName: user.displayName, photoURL: user.photoURL,
  } : null))
}

export function signInWithGoogle() {
  // Pass the resolver at the click, avoiding its eager mobile iframe initialization.
  return signInWithPopup(initializeBrowserAuth(), new GoogleAuthProvider(), browserPopupRedirectResolver)
    .then(() => undefined)
}

export function signOutSession() {
  return signOut(initializeBrowserAuth())
}
