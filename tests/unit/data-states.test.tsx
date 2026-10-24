import { act, fireEvent, render, screen } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { expect, it, vi } from 'vitest'
import { Dashboard } from '../../src/features/dashboard/Dashboard'
import { TasksPage } from '../../src/features/tasks/TasksPage'
import { ProjectPage } from '../../src/features/projects/ProjectPage'
import { applySession, publishSessionData, useStore } from '../../src/store'
import { retrySubscriptions } from '../../src/lib/subscriptions'
import { confirmedStream, seedStore } from './data-fixtures'

vi.mock('../../src/lib/subscriptions', () => ({ retrySubscriptions: vi.fn() }))

it('retains each route root and uses skeleton rows while initial data is unresolved', () => {
  render(<MemoryRouter><Dashboard /><TasksPage /><ProjectPage /></MemoryRouter>)
  expect(document.querySelectorAll('[data-view]')).toHaveLength(3)
  expect(screen.getAllByRole('status', { name: 'Loading tasks' })).toHaveLength(3)
  expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument()
})

it('does not turn cache-only documents into initial readiness or first-run', () => {
  const state = seedStore(1)
  useStore.setState({ dataReady: false, streams: {
    ...state.streams, projects: { ...confirmedStream, ready: false, fromCache: true },
  } })
  render(<MemoryRouter><TasksPage /></MemoryRouter>)
  expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument()
  expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
})

it('renders exact first-run copy and a working project action', () => {
  applySession({ uid: 'empty-owner', displayName: 'Owner', photoURL: null })
  publishSessionData('empty-owner', { streams: { projects: confirmedStream, tasks: confirmedStream } })
  render(<MemoryRouter><Dashboard /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument()
  expect(screen.getByText('Create a project to start organizing your tasks.')).toBeInTheDocument()
  const action = screen.getByRole('button', { name: 'Create your first project' })
  expect(action).not.toHaveAttribute('aria-disabled')
  expect(action).not.toBeDisabled()
  action.focus()
  expect(action).toHaveFocus()
  fireEvent.click(action)
  expect(screen.getByRole('heading', { name: 'Nothing here yet' })).toBeInTheDocument()
  expect(useStore.getState().overlay).toBe('project')
})

it('renders exact empty-project copy with the working add-task action', () => {
  seedStore(0)
  render(<MemoryRouter initialEntries={['/projects/project-1']}>
    <Routes><Route path="/projects/:id" element={<ProjectPage />} /></Routes>
  </MemoryRouter>)
  expect(screen.getByText('Add the first task to get this project moving.')).toBeInTheDocument()
  const action = screen.getByRole('button', { name: 'Add a task' })
  expect(action).not.toHaveAttribute('aria-disabled')
  expect(action).not.toBeDisabled()
  fireEvent.click(action)
  expect(useStore.getState().overlay).toBe('task')
})

it('announces project/task errors, retries explicitly, and restores retained data without a skeleton', () => {
  const state = seedStore(1)
  const tasks = state.tasks
  render(<MemoryRouter><TasksPage /></MemoryRouter>)
  act(() => publishSessionData(state.dataUid!, { streams: { tasks: {
    ...confirmedStream, registered: false, error: { kind: 'listener', message: 'Test failure' },
  } } }))
  expect(screen.getByRole('alert')).toHaveTextContent('We could not load your tasks')
  expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument()
  expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retrySubscriptions).toHaveBeenCalledTimes(1)
  expect(useStore.getState().tasks).toBe(tasks)
  act(() => publishSessionData(state.dataUid!, { streams: { tasks: confirmedStream } }))
  expect(screen.getByRole('listitem')).toBeInTheDocument()
  expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
})

it('does not block healthy task/project views for pending or failed activity', () => {
  const state = seedStore(1)
  publishSessionData(state.dataUid!, { streams: { activity: {
    ready: false, fromCache: null, registered: false, error: { kind: 'listener', message: 'Activity failed' },
  } } })
  render(<MemoryRouter><TasksPage /></MemoryRouter>)
  expect(screen.getByRole('listitem')).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
})

it('navigates using retained data with no loading state or reference reset', () => {
  const before = seedStore(1)
  render(<MemoryRouter initialEntries={['/tasks']}>
    <Link to="/projects/project-1">Project</Link>
    <Routes><Route path="/tasks" element={<TasksPage />} />
      <Route path="/projects/:id" element={<ProjectPage />} /></Routes>
  </MemoryRouter>)
  fireEvent.click(screen.getByRole('link', { name: 'Project' }))
  expect(screen.getByRole('heading', { name: 'Thesis' })).toBeInTheDocument()
  expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
  expect(useStore.getState().tasks).toBe(before.tasks)
  expect(useStore.getState().projects).toBe(before.projects)
})
