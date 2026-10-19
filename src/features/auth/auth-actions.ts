import { signInWithGoogle, signOutSession } from '../../lib/firebase/auth'
import { authErrorMessage } from '../../lib/auth-errors'
import { useStore } from '../../store'

export async function signInAction() {
  if (useStore.getState().authPending) return false
  useStore.setState({ authPending: 'sign-in', authError: null })
  try {
    // No await before the popup: preserve the browser's user gesture.
    await signInWithGoogle()
    return true
  } catch (error: unknown) {
    useStore.setState({ authError: authErrorMessage(error) })
    return false
  } finally {
    useStore.setState({ authPending: null })
  }
}

export async function signOutAction() {
  if (useStore.getState().authPending) return false
  useStore.setState({ authPending: 'sign-out', authError: null })
  try {
    await signOutSession()
    return true
  } catch {
    // Keep the authenticated session and allow retry; no new failure UI is approved.
    return false
  } finally {
    useStore.setState({ authPending: null })
  }
}
