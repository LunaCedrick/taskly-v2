import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import * as dates from '../../src/lib/dates'
import { makeFakeData } from '../../src/lib/fake-data'
import { TaskRow } from '../../src/ui/TaskRow'
import { Dashboard } from '../../src/features/dashboard/Dashboard'
import { useStore } from '../../src/store'
import { seedStore } from './data-fixtures'

describe('task row', () => {
  it('skips an unchanged render and updates when the task reference changes', () => {
    const { tasks, projects, now } = makeFakeData(1)
    const spy = vi.spyOn(dates, 'dueLabel')
    const props = { task: tasks[0], project: projects[0], now, position: 1, total: 1000 }
    const { rerender } = render(<TaskRow {...props} />)
    expect(spy).toHaveBeenCalledTimes(1)
    rerender(<TaskRow {...props} />)
    expect(spy).toHaveBeenCalledTimes(1)
    rerender(<TaskRow {...props} task={{ ...tasks[0], title: 'Changed title' }} />)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-setsize', '1000')
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-posinset', '1')
  })
})

describe('dashboard placeholder', () => {
  it('uses full-data selector counts and renders only two previews per group', () => {
    seedStore()
    const groups = useStore.getState().groups
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    expect(screen.getAllByRole('listitem')).toHaveLength(6)
    expect(screen.getByRole('status')).toHaveTextContent(`${groups.overdue.length} tasks are overdue`)
    for (const group of ['overdue', 'today', 'upcoming'] as const) {
      const list = screen.getByRole('list', { name: `${group} tasks` })
      expect(list.querySelector('[data-virtualized]')).toBeNull()
      expect(list.querySelectorAll('[role="listitem"]')).toHaveLength(2)
      expect(list.querySelector('[role="listitem"]')).toHaveAttribute('aria-setsize', String(groups[group].length))
    }
  })
})
