import { act, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, useLocation } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { WriteUI } from '../../src/ui/WriteUI'
import { useStore } from '../../src/store'
import { initialWriteState } from '../../src/store/write-slice'

const renders = vi.hoisted(() => ({ overlays: 0, toasts: 0 }))
vi.mock('../../src/ui/WriteOverlay', () => ({ WriteOverlay: () => { renders.overlays++; return null } }))
vi.mock('../../src/ui/Toasts', () => ({ Toasts: () => { renders.toasts++; return null } }))

function Shell() {
  const { pathname } = useLocation()
  return <><header><h1 data-testid="route">{pathname}</h1></header>
    <Link to="/tasks">Tasks</Link><Link to="/projects/project-1">Project</Link><WriteUI /></>
}

beforeEach(() => {
  useStore.setState(initialWriteState())
  renders.overlays = 0
  renders.toasts = 0
})

it('keeps the write UI subtree still during ordinary Shell route changes', async () => {
  render(<MemoryRouter initialEntries={['/projects/project-1']}><Shell /></MemoryRouter>)
  const before = { ...renders }
  await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Tasks' })) })
  expect(screen.getByTestId('route')).toHaveTextContent('/tasks')
  await act(async () => { fireEvent.click(screen.getByRole('link', { name: 'Project' })) })
  expect(screen.getByTestId('route')).toHaveTextContent('/projects/project-1')
  expect(renders).toEqual(before)
})

it('reads the current route when a deleted-project navigation becomes pending', async () => {
  render(<MemoryRouter initialEntries={['/projects/project-1']}><Shell /></MemoryRouter>)
  await act(async () => { useStore.setState({ deletedProjectId: 'project-1' }) })
  expect(screen.getByTestId('route')).toHaveTextContent(/^\/$/)
  expect(useStore.getState().deletedProjectId).toBeNull()
})

it('consumes a background deletion without leaving the current unrelated route', async () => {
  render(<MemoryRouter initialEntries={['/tasks']}><Shell /></MemoryRouter>)
  await act(async () => { useStore.setState({ deletedProjectId: 'project-1' }) })
  expect(screen.getByTestId('route')).toHaveTextContent('/tasks')
  expect(useStore.getState().deletedProjectId).toBeNull()
})
