import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { EMULATOR_PORTS } from '../../src/lib/firebase/emulator-config'

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
})
