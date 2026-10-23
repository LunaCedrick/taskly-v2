import type { Task } from '../lib/types'
import type { DataSlice } from './data-slice'

export function selectDataView(state: DataSlice): 'loading' | 'error' | 'first-run' | 'ready' {
  if (state.streams.projects.error || state.streams.tasks.error) return 'error'
  if (!state.dataReady) return 'loading'
  return state.projects.length === 0 ? 'first-run' : 'ready'
}

export function projectProgress(tasks: readonly Task[]) {
  const completed = tasks.reduce((count, task) => count + Number(task.status === 'done'), 0)
  return { completed, total: tasks.length, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 }
}
