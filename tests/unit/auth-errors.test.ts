import { describe, expect, it } from 'vitest'
import { authErrorMessage } from '../../src/lib/auth-errors'

describe('approved sign-in messages', () => {
  it.each([
    ['auth/popup-blocked', 'Sign-in failed: the popup was blocked. Allow popups for this site and try again.'],
    ['auth/network-request-failed', 'Sign-in failed: no connection. Check your network and try again.'],
    ['auth/popup-closed-by-user', "Sign-in was cancelled. Try again when you're ready."],
    ['auth/cancelled-popup-request', "Sign-in was cancelled. Try again when you're ready."],
  ])('maps %s exactly', (code, message) => expect(authErrorMessage({ code })).toBe(message))

  it.each([undefined, null, 'offline', 42, {}, { code: 3 }, { code: 'auth/unknown' }, { code: 'toString' }])(
    'handles unknown input %j', (error) => {
      expect(authErrorMessage(error)).toBe('Sign-in failed: something went wrong. Try again.')
    },
  )
})
