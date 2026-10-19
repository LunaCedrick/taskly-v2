const messages = {
  'auth/popup-blocked': 'Sign-in failed: the popup was blocked. Allow popups for this site and try again.',
  'auth/network-request-failed': 'Sign-in failed: no connection. Check your network and try again.',
  'auth/popup-closed-by-user': "Sign-in was cancelled. Try again when you're ready.",
  'auth/cancelled-popup-request': "Sign-in was cancelled. Try again when you're ready.",
} as const

export function authErrorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : null
  return typeof code === 'string' && Object.hasOwn(messages, code)
    ? messages[code as keyof typeof messages]
    : 'Sign-in failed: something went wrong. Try again.'
}
