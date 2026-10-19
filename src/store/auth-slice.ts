import type { AuthProfile } from '../lib/firebase/auth'

export interface AuthSlice {
  sessionStatus: 'checking' | 'signed-out' | 'signed-in'
  authUser: AuthProfile | null
  authPending: 'sign-in' | 'sign-out' | null
  authError: string | null
}

export const initialAuthState: AuthSlice = {
  sessionStatus: 'checking', authUser: null, authPending: null, authError: null,
}
