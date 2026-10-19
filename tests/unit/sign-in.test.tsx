import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SignInPage } from '../../src/features/auth/SignInPage'
import { signInWithGoogle } from '../../src/lib/firebase/auth'

vi.mock('../../src/lib/firebase/auth', () => ({ signInWithGoogle: vi.fn(), signOutSession: vi.fn() }))

describe('Google sign-in', () => {
  it('offers one action and prevents pending duplicate requests', async () => {
    let resolve!: () => void
    vi.mocked(signInWithGoogle).mockClear().mockReturnValueOnce(new Promise((done) => { resolve = () => done(undefined) }))
    render(<SignInPage />)
    expect(screen.getAllByRole('button')).toHaveLength(1)
    const button = screen.getByRole('button', { name: 'Continue with Google' })
    fireEvent.click(button)
    fireEvent.click(button)
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(signInWithGoogle).toHaveBeenCalledTimes(1)
    resolve()
    await waitFor(() => expect(button).toBeEnabled())
  })
  it.each([
    ['auth/popup-blocked', 'Sign-in failed: the popup was blocked. Allow popups for this site and try again.'],
    ['auth/network-request-failed', 'Sign-in failed: no connection. Check your network and try again.'],
    ['auth/popup-closed-by-user', "Sign-in was cancelled. Try again when you're ready."],
    ['auth/cancelled-popup-request', "Sign-in was cancelled. Try again when you're ready."],
    ['auth/unknown', 'Sign-in failed: something went wrong. Try again.'],
  ])('announces %s above the button and allows retry', async (code, message) => {
    vi.mocked(signInWithGoogle).mockClear().mockRejectedValueOnce({ code }).mockResolvedValueOnce(undefined)
    render(<SignInPage />)
    const button = screen.getByRole('button', { name: 'Continue with Google' })
    fireEvent.click(button)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(message)
    expect(alert.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(button).toBeEnabled()
    fireEvent.click(button)
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(signInWithGoogle).toHaveBeenCalledTimes(2)
  })
})
