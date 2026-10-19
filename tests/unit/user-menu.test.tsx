import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { UserMenu } from '../../src/features/auth/UserMenu'
import { signOutSession } from '../../src/lib/firebase/auth'
import { applySession, useStore } from '../../src/store'

vi.mock('../../src/lib/firebase/auth', () => ({ signOutSession: vi.fn(), signInWithGoogle: vi.fn() }))

describe('signed-in profile', () => {
  it('renders the store-backed name/avatar and invokes sign-out', async () => {
    applySession({ uid: 'profile-user', displayName: 'Alex Example', photoURL: '/avatar.png' })
    vi.mocked(signOutSession).mockResolvedValueOnce(undefined)
    const { container } = render(<UserMenu />)
    expect(screen.getByText('Alex Example')).toBeVisible()
    expect(container.querySelector('img')).toHaveAttribute('src', '/avatar.png')
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(signOutSession).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(useStore.getState().authPending).toBeNull())
  })
  it('shows an initial without a photo and disables sign-out during an action', () => {
    applySession({ uid: 'initial-user', displayName: 'Alex Example', photoURL: null })
    useStore.setState({ authPending: 'sign-out' })
    const { container } = render(<UserMenu />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('A')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeDisabled()
  })
  it('has no profile or sign-out control without an authenticated user', () => {
    const { container } = render(<UserMenu />)
    expect(container).toBeEmptyDOMElement()
  })
})
