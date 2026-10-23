import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID } from '../../src/lib/firebase/emulator-config'
import { emulatorEnvironment } from '../../scripts/emulator-runner.mjs'

const config = JSON.parse(readFileSync('firebase.json', 'utf8')) as {
  emulators: Record<'auth' | 'firestore', { port: number }>
}

describe('checked-in Firebase emulator configuration', () => {
  it('keeps Auth on the shared port, 9099', () => {
    expect(EMULATOR_PORTS.auth).toBe(9099)
    expect(config.emulators.auth.port).toBe(EMULATOR_PORTS.auth)
  })

  it('keeps Firestore on the shared port, 8081', () => {
    expect(EMULATOR_PORTS.firestore).toBe(8081)
    expect(config.emulators.firestore.port).toBe(EMULATOR_PORTS.firestore)
  })

  it('builds only against the demo emulators with both explicit flags', () => {
    const environment = emulatorEnvironment()
    expect(environment.VITE_USE_AUTH_EMULATOR).toBe('true')
    expect(environment.VITE_USE_FIRESTORE_EMULATOR).toBe('true')
    expect(environment.VITE_FIREBASE_PROJECT_ID).toBe(EMULATOR_PROJECT_ID)
    expect(environment.GCLOUD_PROJECT).toBe(EMULATOR_PROJECT_ID)
    expect(environment.FIREBASE_AUTH_EMULATOR_HOST).toBe(`${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`)
    expect(environment.FIRESTORE_EMULATOR_HOST).toBe(`${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}`)
    expect(environment.TASKLY_EMULATORS_MANAGED).toBe('true')
  })

  it('documents both flags as local-only and disabled by default', () => {
    const example = readFileSync('.env.example', 'utf8')
    expect(example).toContain('VITE_USE_AUTH_EMULATOR=false')
    expect(example).toContain('VITE_USE_FIRESTORE_EMULATOR=false')
    expect(example).toContain('Leave unset in Vercel Preview and Production')
  })
})
