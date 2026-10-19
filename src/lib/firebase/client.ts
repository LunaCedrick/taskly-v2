import { getApp, getApps, initializeApp } from 'firebase/app'

export function getFirebaseApp() {
  if (getApps().length) return getApp()

  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  }
  for (const key of ['apiKey', 'authDomain', 'projectId', 'appId'] as const) {
    if (!config[key]) throw new Error(`Missing Firebase configuration: ${key}`)
  }
  return initializeApp(config)
}
