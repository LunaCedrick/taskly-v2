import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { Dashboard } from '../../src/features/dashboard/Dashboard'
import { TasksPage } from '../../src/features/tasks/TasksPage'
import { ProjectPage } from '../../src/features/projects/ProjectPage'
import { TaskList } from '../../src/ui/TaskList'
import { TaskRow } from '../../src/ui/TaskRow'
import * as controls from '../../src/ui/Controls'
import { makeFakeData } from '../../src/lib/fake-data'
import { applySession, publishSessionData, setFocusedRow, useStore } from '../../src/store'
import { projectProgress } from '../../src/store/selectors'
import { confirmedStream, seedStore } from './data-fixtures'

function projectRoute(id = 'project-1') {
  return <MemoryRouter initialEntries={[`/projects/${id}`]}>
    <Routes><Route path="/projects/:id" element={<ProjectPage />} /></Routes>
  </MemoryRouter>
}

describe('real data view boundaries', () => {
  it('keeps tasks-before-projects behind the skeleton, then safely publishes rows', () => {
    const data = makeFakeData(2)
    applySession({ uid: 'edge-owner', displayName: 'Owner', photoURL: null })
    publishSessionData('edge-owner', { rawTasks: data.tasks, streams: { tasks: confirmedStream } }, data.now)
    render(<MemoryRouter><Dashboard /><TasksPage /></MemoryRouter>)
    expect(screen.getAllByRole('status', { name: 'Loading tasks' })).toHaveLength(2)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
    act(() => publishSessionData('edge-owner', {
      rawProjects: data.projects, streams: { projects: confirmedStream },
    }, data.now))
    expect(screen.queryByRole('status', { name: 'Loading tasks' })).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'All tasks' }).children).toHaveLength(2)
  })

  it('defensively skips a missing project rather than dereferencing it in TaskList', () => {
    const { tasks } = makeFakeData(1)
    render(<TaskList tasks={tasks} label="Unresolved tasks" listId="unresolved" />)
    expect(screen.getByRole('list', { name: 'Unresolved tasks' })).toBeEmptyDOMElement()
  })

  it('excludes orphan tasks from rows and counts while exposing orphanCount only in the store', () => {
    const state = seedStore(2)
    const orphan = { ...state.rawTasks[1], projectId: 'missing-project', title: 'Orphan task' }
    publishSessionData(state.dataUid!, { rawTasks: [state.rawTasks[0], orphan] }, state.now)
    render(<MemoryRouter><Dashboard /><TasksPage /></MemoryRouter>)
    expect(useStore.getState().orphanCount).toBe(1)
    expect(useStore.getState().stats.total).toBe(1)
    expect(screen.queryByText('Orphan task')).not.toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'All tasks' }).children).toHaveLength(1)
    expect(screen.getByText('Total tasks').parentElement?.querySelector('strong')).toHaveTextContent('1')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders zero progress and the designed empty-project state', () => {
    seedStore(0)
    render(projectRoute())
    expect(projectProgress([])).toEqual({ completed: 0, total: 0, percent: 0 })
    expect(screen.getByText('0% complete')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'No tasks in Thesis' })).toBeInTheDocument()
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument()
  })

  it('shows a skeleton for an unresolved deep link and minimal not-found only after readiness', () => {
    render(projectRoute('unknown'))
    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument()
    expect(screen.queryByText('Project preview')).not.toBeInTheDocument()
    expect(document.querySelector('[data-view="project"]')).toBeInTheDocument()
    act(() => { seedStore(0) })
    expect(screen.getByRole('heading', { name: 'Project not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('still shows not-found for an unknown project when the owner has no projects', () => {
    applySession({ uid: 'empty-owner', displayName: 'Owner', photoURL: null })
    publishSessionData('empty-owner', { streams: { projects: confirmedStream, tasks: confirmedStream } })
    render(projectRoute('unknown'))
    expect(screen.getByRole('heading', { name: 'Project not found' })).toBeInTheDocument()
    expect(screen.queryByText('Nothing here yet')).not.toBeInTheDocument()
  })

  it('keeps roving focus valid when the focused row is removed and ignores an empty list', () => {
    const state = seedStore(2)
    setFocusedRow('live', 1)
    const { rerender } = render(<TaskList tasks={state.tasks} label="Live tasks" listId="live" />)
    rerender(<TaskList tasks={[state.tasks[0]]} label="Live tasks" listId="live" />)
    expect(screen.getByRole('listitem')).toHaveAttribute('tabindex', '0')
    rerender(<TaskList tasks={[]} label="Live tasks" listId="live" />)
    fireEvent.keyDown(screen.getByRole('list'), { key: 'ArrowDown' })
    expect(screen.getByRole('list')).toBeEmptyDOMElement()
  })
})

it('skips unchanged row presentation as now advances, but updates a changed due label', () => {
  const { tasks, projects, now } = makeFakeData(1)
  const chip = vi.spyOn(controls, 'Chip')
  const props = { task: tasks[0], project: projects[0], now, position: 1, total: 1 }
  const { rerender } = render(<TaskRow {...props} />)
  expect(chip).toHaveBeenCalledTimes(1)
  rerender(<TaskRow {...props} now={now + 1_000} />)
  expect(chip).toHaveBeenCalledTimes(1)
  rerender(<TaskRow {...props} now={now + 86_400_000} />)
  expect(chip).toHaveBeenCalledTimes(2)
  expect(screen.getByText('3 days overdue')).toBeInTheDocument()
})
