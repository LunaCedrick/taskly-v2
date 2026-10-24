import type { Priority, Project, Task, TaskStatus } from './types'

export const FIXTURE_NOW = new Date(2026, 9, 17, 12).getTime()
const names = ['Thesis', 'Taskly', 'Personal']
const titles = [
  'Submit thesis documentation', 'Build the dashboard layout', 'Buy printer ink',
  'Review Chapter 4 draft', 'Polish project navigation', 'Plan the week ahead',
  'Prepare defense slides', 'Review accessibility', 'Organize reading notes',
]

export function makeFakeData(count = 1000, now = FIXTURE_NOW) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError('Task count must be a non-negative integer')
  const projects: Project[] = names.map((name, index) => ({
    id: `project-${index + 1}`, name, colorIndex: index, createdAt: now, updatedAt: now,
  }))
  const priorities: Priority[] = ['high', 'medium', 'low', 'none']
  const statuses: TaskStatus[] = ['todo', 'in-progress', 'todo', 'done', 'todo']
  const tasks: Task[] = Array.from({ length: count }, (_, index) => {
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + (index % 9) - 2)
    dueDate.setHours(index % 2 ? 17 : 0, 0, 0, 0)
    const status = statuses[index % statuses.length]
    return {
      id: `task-${index + 1}`, projectId: projects[index % projects.length].id,
      title: `${titles[index % titles.length]}${index >= titles.length ? ` · ${index + 1}` : ''}`,
      description: 'Deterministic Gate 0 sample task', category: '',
      dueDate: index % 13 === 12 ? null : index % 2 ? dueDate.getTime()
        : Date.UTC(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()), dueHasTime: index % 2 === 1,
      priority: priorities[index % priorities.length], status,
      createdAt: now - index * 60_000, updatedAt: now,
      completedAt: status === 'done' ? now : null,
    }
  })
  return { projects, tasks, now }
}
