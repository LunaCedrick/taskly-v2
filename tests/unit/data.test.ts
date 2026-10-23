import { describe, expect, it } from 'vitest'
import { FIXTURE_NOW, makeFakeData } from '../../src/lib/fake-data'
import { dueGroup, dueInstant, dueLabel, endOfDay } from '../../src/lib/dates'
import { dashboardGroups, taskStats, tasksByProject } from '../../src/lib/task-selectors'
import { useStore } from '../../src/store'
import { seedStore } from './data-fixtures'

describe('deterministic fixture', () => {
  it('creates 1,000 unique tasks with stable values and valid project references', () => {
    const data = makeFakeData()
    expect(data).toEqual(makeFakeData())
    expect(data.projects).toHaveLength(3)
    expect(data.tasks).toHaveLength(1000)
    expect(new Set(data.tasks.map((task) => task.id)).size).toBe(1000)
    expect(data.tasks.every((task) => data.projects.some((project) => project.id === task.projectId))).toBe(true)
  })
  it('supports zero tasks and rejects invalid counts', () => {
    expect(makeFakeData(0).tasks).toEqual([])
    expect(() => makeFakeData(-1)).toThrow(RangeError)
    expect(() => makeFakeData(1.5)).toThrow(RangeError)
  })
})

describe('due date semantics', () => {
  const task = makeFakeData(1).tasks[0]
  it('keeps date-only tasks due until the end of their local day', () => {
    const today = { ...task, dueDate: FIXTURE_NOW, dueHasTime: false }
    expect(dueInstant(today)).toBe(endOfDay(FIXTURE_NOW))
    expect(dueGroup(today, FIXTURE_NOW)).toBe('today')
    expect(dueGroup(today, endOfDay(FIXTURE_NOW) + 1)).toBe('overdue')
  })
  it('honors an explicit time, null dates, and completion', () => {
    expect(dueGroup({ ...task, dueDate: FIXTURE_NOW - 1, dueHasTime: true }, FIXTURE_NOW)).toBe('overdue')
    expect(dueGroup({ ...task, dueDate: FIXTURE_NOW, dueHasTime: true }, FIXTURE_NOW)).toBe('today')
    expect(dueGroup({ ...task, dueDate: null }, FIXTURE_NOW)).toBe('none')
    expect(dueGroup({ ...task, status: 'done' }, FIXTURE_NOW)).toBe('done')
  })
  it('shows informative labels instead of color alone', () => {
    expect(dueLabel(task, FIXTURE_NOW)).toBe('2 days overdue')
    expect(dueLabel({ ...task, dueDate: FIXTURE_NOW, dueHasTime: false }, FIXTURE_NOW)).toBe('Today')
    expect(dueLabel({ ...task, dueDate: null }, FIXTURE_NOW)).toBe('No due date')
  })
})

describe('pure selectors', () => {
  const { tasks, projects, now } = makeFakeData()
  it('groups every eligible task once, orders by due date, and never mutates the source', () => {
    const original = [...tasks]
    const groups = dashboardGroups(tasks, now)
    const grouped = Object.values(groups).flat()
    expect(new Set(grouped.map((task) => task.id)).size).toBe(grouped.length)
    expect(grouped).toHaveLength(tasks.filter((task) => task.status !== 'done' && task.dueDate !== null).length)
    for (const [group, rows] of Object.entries(groups)) {
      expect(rows.every((row) => dueGroup(row, now) === group)).toBe(true)
      expect(rows.map((row) => row.dueDate)).toEqual(rows.map((row) => row.dueDate).sort((a, b) => a! - b!))
    }
    expect(tasks).toEqual(original)
    expect(dashboardGroups([], now)).toEqual({ overdue: [], today: [], upcoming: [] })
  })
  it('selects only a project’s tasks, with completed rows last and stable task identities', () => {
    const rows = tasksByProject(tasks, projects[0].id)
    expect(rows).toHaveLength(334)
    expect(rows.every((row) => row.projectId === projects[0].id)).toBe(true)
    const firstDone = rows.findIndex((row) => row.status === 'done')
    expect(rows.slice(firstDone).every((row) => row.status === 'done')).toBe(true)
    expect(rows[0]).toBe(tasks.find((task) => task.id === rows[0].id))
    expect(tasksByProject(tasks, 'unknown')).toEqual([])
  })
  it('computes counts and keeps derived selector references stable on UI-only changes', () => {
    expect(taskStats(tasks)).toEqual({ total: 1000, completed: 200, inProgress: 200 })
    seedStore()
    const before = useStore.getState()
    useStore.setState({ drawerOpen: true })
    const after = useStore.getState()
    expect(after.tasks).toBe(before.tasks)
    expect(after.groups).toBe(before.groups)
    expect(after.projectTasks).toBe(before.projectTasks)
    useStore.setState({ drawerOpen: false })
  })
})
