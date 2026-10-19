import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { observeSession, signInWithGoogle, signOutSession, type AuthProfile } from '../../src/lib/firebase/auth'
import { startSession, stopSession } from '../../src/features/auth/session'
import { signInAction, signOutAction } from '../../src/features/auth/auth-actions'
import { applySession, useStore } from '../../src/store'

vi.mock('../../src/lib/firebase/auth', () => ({
  observeSession: vi.fn(), signInWithGoogle: vi.fn(), signOutSession: vi.fn(),
}))

const profile: AuthProfile = { uid: 'test-user', displayName: 'Test Owner', photoURL: null }
let notify: (user: AuthProfile | null) => void
const unsubscribe = vi.fn()

beforeEach(() => {
  stopSession()
  vi.clearAllMocks()
  vi.mocked(observeSession).mockImplementation((callback) => { notify = callback; return unsubscribe })
})
afterEach(stopSession)

describe('app session observer', () => {
  it('starts checking and accepts signed-out and signed-in observer results', () => {
    expect(useStore.getState().sessionStatus).toBe('checking')
    startSession()
    notify(null)
    expect(useStore.getState()).toMatchObject({ sessionStatus: 'signed-out', authUser: null })
    notify(profile)
    expect(useStore.getState()).toMatchObject({ sessionStatus: 'signed-in', authUser: profile })
  })
  it('prevents duplicate starts and supports idempotent disposal and restart', () => {
    const stop = startSession()
    expect(startSession()).toBe(stop)
    expect(observeSession).toHaveBeenCalledTimes(1)
    stop()
    stop()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
    startSession()
    expect(observeSession).toHaveBeenCalledTimes(2)
  })
  it('retains every fixture/selector reference across auth updates and closes the signed-out drawer', () => {
    const before = useStore.getState()
    startSession()
    notify(profile)
    useStore.setState({ drawerOpen: true })
    notify(null)
    const after = useStore.getState()
    for (const key of ['tasks', 'projects', 'projectTasks', 'groups', 'stats'] as const) {
      expect(after[key]).toBe(before[key])
    }
    expect(after.drawerOpen).toBe(false)
  })
})

describe('auth actions', () => {
  it('opens the popup synchronously, prevents duplicates, and recovers for retry', async () => {
    let reject!: (error: unknown) => void
    vi.mocked(signInWithGoogle).mockReturnValueOnce(new Promise((_, fail) => { reject = fail }))
    const first = signInAction()
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
    expect(useStore.getState().authPending).toBe('sign-in')
    expect(await signInAction()).toBe(false)
    reject({ code: 'auth/popup-closed-by-user' })
    expect(await first).toBe(false)
    expect(useStore.getState()).toMatchObject({ authPending: null,
      authError: "Sign-in was cancelled. Try again when you're ready." })
    vi.mocked(signInWithGoogle).mockResolvedValueOnce(undefined)
    expect(await signInAction()).toBe(true)
    expect(useStore.getState().authError).toBeNull()
  })
  it('waits for the observer to update authentication after sign-in and sign-out', async () => {
    startSession()
    notify(null)
    vi.mocked(signInWithGoogle).mockResolvedValueOnce(undefined)
    await signInAction()
    expect(useStore.getState().sessionStatus).toBe('signed-out')
    notify(profile)
    vi.mocked(signOutSession).mockResolvedValueOnce(undefined)
    expect(await signOutAction()).toBe(true)
    expect(useStore.getState().sessionStatus).toBe('signed-in')
    notify(null)
    expect(useStore.getState()).toMatchObject({ sessionStatus: 'signed-out', authPending: null })
  })
  it('prevents duplicate sign-outs and recovers after an unspecified sign-out failure without new UI', async () => {
    applySession(profile)
    let reject!: (error: unknown) => void
    vi.mocked(signOutSession).mockReturnValueOnce(new Promise((_, fail) => { reject = fail }))
    const pending = signOutAction()
    expect(await signOutAction()).toBe(false)
    expect(signOutSession).toHaveBeenCalledTimes(1)
    reject(new Error('Unavailable'))
    expect(await pending).toBe(false)
    expect(useStore.getState()).toMatchObject({ sessionStatus: 'signed-in', authUser: profile,
      authPending: null, authError: null })
  })
})
