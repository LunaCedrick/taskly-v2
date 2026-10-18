import { dueGroup } from './dates'
import type { Task } from './types'

export function tasksByProject(tasks: readonly Task[], projectId: string): Task[] {
  return tasks.filter((task) => task.projectId === projectId)
    .sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
}

export function dashboardGroups(tasks: readonly Task[], now: number) {
  const groups: Record<'overdue' | 'today' | 'upcoming', Task[]> = {
    overdue: [], today: [], upcoming: [],
  }
  for (const task of tasks) {
    const group = dueGroup(task, now)
    if (group === 'overdue' || group === 'today' || group === 'upcoming') groups[group].push(task)
  }
  for (const group of Object.values(groups)) {
    group.sort((a, b) => (a.dueDate ?? Infinity) - (b.dueDate ?? Infinity))
  }
  return groups
}

export function taskStats(tasks: readonly Task[]) {
  return {
    total: tasks.length,
    completed: tasks.filter((task) => task.status === 'done').length,
    inProgress: tasks.filter((task) => task.status === 'in-progress').length,
  }
}
