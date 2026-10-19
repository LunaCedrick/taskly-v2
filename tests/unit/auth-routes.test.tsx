import { act, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { AppRoutes } from '../../src/app/routes'
import { applySession, useStore } from '../../src/store'
import { observeSession } from '../../src/lib/firebase/auth'

vi.mock('../../src/lib/firebase/auth', () => ({
  observeSession: vi.fn(), signInWithGoogle: vi.fn(), signOutSession: vi.fn(),
}))
const profile = { uid: 'route-user', displayName: 'Route Owner', photoURL: null }

function Location() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname + location.search + location.hash}</span>
}
function visit(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><Location /><AppRoutes /></MemoryRouter>)
}

describe('store-backed route guards', () => {
  it.each(['/', '/tasks', '/projects/project-1', '/sign-in'])('hides shell and form while checking %s', (route) => {
    const { container } = visit(route)
    expect(screen.getByRole('status')).toHaveTextContent('Getting your tasks ready')
    expect(container.querySelector('[data-view]')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument()
    expect(observeSession).not.toHaveBeenCalled()
  })
  it.each(['/', '/tasks', '/projects/project-1?sort=due#task-2'])(
    'remembers %s and returns after the observer changes state', async (route) => {
      applySession(null)
      const { container } = visit(route)
      expect(screen.getByTestId('location')).toHaveTextContent(`/sign-in?${new URLSearchParams({ returnTo: route })}`)
      expect(container.querySelector('[data-view]')).toBeNull()
      act(() => applySession(profile))
      await waitFor(() => expect(screen.getByTestId('location').textContent).toBe(route))
      expect(container.querySelector('[data-view]')).not.toBeNull()
      expect(screen.queryByText('Welcome to Taskly')).not.toBeInTheDocument()
    },
  )
  it.each(['/sign-in', '/sign-in?returnTo=https%3A%2F%2Fevil.example', '/sign-in?returnTo=%2Fsign-in'])(
    'redirects signed-in visits to Dashboard for %s without showing the form', (route) => {
      applySession(profile)
      const { container } = visit(route)
      expect(screen.getByTestId('location').textContent).toBe('/')
      expect(container.querySelector('[data-view="dashboard"]')).not.toBeNull()
      expect(screen.queryByText('Welcome to Taskly')).not.toBeInTheDocument()
    },
  )
  it('removes protected content on sign-out without replacing data', () => {
    applySession(profile)
    const tasks = useStore.getState().tasks
    const { container } = visit('/tasks')
    act(() => applySession(null))
    expect(container.querySelector('[data-view]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
    expect(useStore.getState().tasks).toBe(tasks)
  })
})
