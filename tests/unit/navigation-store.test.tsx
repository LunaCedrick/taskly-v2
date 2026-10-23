import type { ReactNode } from 'react'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, expect, it, vi } from 'vitest'
import { Navigation } from '../../src/app/Navigation'
import { Drawer } from '../../src/app/Drawer'
import { applySession, publishSessionData } from '../../src/store'
import { makeFakeData } from '../../src/lib/fake-data'
import { confirmedStream, seedStore } from './data-fixtures'

const renders = vi.hoisted(() => ({ Navigation: 0, Drawer: 0 }))
// Instrument the actual memoized parent bodies, rather than counting child commits in a Profiler.
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>()
  return { ...actual, memo: (
    component: (props: Record<string, unknown>) => ReactNode,
    compare?: (previous: Record<string, unknown>, next: Record<string, unknown>) => boolean,
  ) => {
    const name = component.name
    if (name !== 'Navigation' && name !== 'Drawer') return actual.memo(component, compare)
    return actual.memo((props: Record<string, unknown>) => {
      renders[name]++
      return component(props)
    }, compare)
  } }
})

beforeEach(() => { renders.Navigation = 0; renders.Drawer = 0 })

it('updates primitive project counts without rendering Navigation or Drawer parents', () => {
  const state = seedStore(3)
  render(<MemoryRouter><Navigation /><Drawer /></MemoryRouter>)
  const before = { ...renders }
  const bars = screen.getAllByRole('progressbar', { name: 'Thesis completion', hidden: true })
  expect(bars).toHaveLength(2)
  expect(bars[0]).toHaveAttribute('value', '0')
  act(() => publishSessionData(state.dataUid!, {
    rawTasks: state.rawTasks.map((task, index) => index === 0 ? { ...task, status: 'done' } : task),
  }, state.now + 1_000))
  expect(screen.getAllByRole('progressbar', { name: 'Thesis completion', hidden: true })[0])
    .toHaveAttribute('value', '1')
  expect(renders).toEqual(before)
  act(() => publishSessionData(state.dataUid!, {
    rawProjects: state.rawProjects.map((project, index) => index === 0 ? { ...project, name: 'Renamed' } : project),
  }, state.now + 2_000))
  expect(renders.Navigation).toBeGreaterThan(before.Navigation)
  expect(renders.Drawer).toBe(before.Drawer)
  expect(screen.getAllByRole('link', { name: /Renamed/, hidden: true })).toHaveLength(2)
})

it('withholds initial counts until projects+tasks confirm without rerendering the parents', () => {
  const data = makeFakeData(1)
  applySession({ uid: 'navigation-owner', displayName: 'Owner', photoURL: null })
  publishSessionData('navigation-owner', {
    rawProjects: data.projects, streams: { projects: confirmedStream },
  }, data.now)
  render(<MemoryRouter><Navigation /><Drawer /></MemoryRouter>)
  expect(screen.queryAllByRole('progressbar', { hidden: true })).toHaveLength(0)
  const before = { ...renders }
  act(() => publishSessionData('navigation-owner', {
    rawTasks: data.tasks, streams: { tasks: confirmedStream },
  }, data.now))
  expect(screen.getAllByRole('progressbar', { hidden: true })).toHaveLength(6)
  expect(renders).toEqual(before)
  expect(screen.getAllByRole('progressbar', { name: 'Taskly completion', hidden: true })[0])
    .toHaveAttribute('max', '1')
})
