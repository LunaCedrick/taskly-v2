import type { Project, Task } from './types'
import { SERVER_TIME, type WriteOperation } from './mutations/types'

export type TaskValues = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>
export const statusLabel = { todo: 'To do', 'in-progress': 'In progress', done: 'Done' }
export type IdSource = () => string

export function projectNameError(name: string, projects: readonly Project[], id?: string) {
  if (!name.trim()) return 'Enter a project name.'
  if (projects.some((project) => project.id !== id && project.name.trim().toLowerCase() === name.trim().toLowerCase()))
    return 'A project with this name already exists.'
  return ''
}

export function defaultProject(projects: readonly Project[], current?: string, last?: string) {
  return projects.find((project) => project.id === current) ?? projects.find((project) => project.id === last)
    ?? [...projects].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))[0]
}

export function nextColor(projects: readonly Project[]) {
  const counts = Array.from({ length: 6 }, (_, color) => projects.filter((p) => p.colorIndex === color).length)
  return counts.indexOf(Math.min(...counts))
}

function event(type: string, text: string, taskId: string | null, projectId: string | null, id: IdSource): WriteOperation {
  return { stream: 'activity', id: id(), kind: 'set', data: { type, text, taskId, projectId, createdAt: SERVER_TIME } }
}

export function projectPlan(name: string, projects: readonly Project[], id: IdSource, previous?: Project) {
  const error = projectNameError(name, projects, previous?.id)
  if (error) throw new Error(error)
  if (previous?.name === name) return []
  const projectId = previous?.id ?? id()
  return [{ stream: 'projects', id: projectId, kind: previous ? 'update' : 'set', data: previous
    ? { name, updatedAt: SERVER_TIME }
    : { name, colorIndex: nextColor(projects), createdAt: SERVER_TIME, updatedAt: SERVER_TIME } },
  event(previous ? 'project.renamed' : 'project.created', previous
    ? `Renamed the project ${previous.name} to ${name}` : `Created the project ${name}`, null, projectId, id)] as WriteOperation[]
}

export function taskPlan(values: TaskValues, projects: readonly Project[], id: IdSource, previous?: Task) {
  if (!values.title.trim()) throw new Error('Enter a task title.')
  const destination = projects.find((project) => project.id === values.projectId)
  if (!destination) throw new Error('Choose an available project.')
  if (previous && Object.entries(values).every(([key, value]) => previous[key as keyof Task] === value)) return []
  const taskId = previous?.id ?? id()
  const completedAt = values.status === 'done'
    ? previous?.status === 'done' ? previous.completedAt : SERVER_TIME : null
  const writes: WriteOperation[] = [{ stream: 'tasks', id: taskId, kind: previous ? 'update' : 'set',
    data: { ...values, completedAt, updatedAt: SERVER_TIME, ...(!previous ? { createdAt: SERVER_TIME } : {}) } }]
  if (!previous) writes.push(event('task.created', `Added ${values.title} to ${destination.name}`, taskId, destination.id, id))
  if (previous && previous.projectId !== values.projectId) {
    const source = projects.find((project) => project.id === previous.projectId)
    writes.push(event('task.project_moved', `Moved ${values.title} from ${source?.name ?? previous.projectId} to ${destination.name}`,
      taskId, destination.id, id))
  }
  if (values.status === 'done' && previous?.status !== 'done')
    writes.push(event('task.completed', `Completed ${values.title}`, taskId, destination.id, id))
  else if (previous && previous.status !== values.status)
    writes.push(event('task.status_moved', `Moved ${values.title} to ${statusLabel[values.status]}`, taskId, destination.id, id))
  return writes
}

export function deleteTaskPlan(task: Task, id: IdSource): WriteOperation[] {
  return [{ stream: 'tasks', id: task.id, kind: 'delete' },
    event('task.deleted', `Deleted ${task.title}`, task.id, task.projectId, id)]
}

export function cascadePlan(project: Project, tasks: readonly Task[], summaryId: string): WriteOperation[][] {
  const deletes: WriteOperation[] = tasks.filter((task) => task.projectId === project.id)
    .map((task) => ({ stream: 'tasks', id: task.id, kind: 'delete' }))
  const batches: WriteOperation[][] = []
  // Tasks first; the final batch has only the project and one summary.
  for (let start = 0; start < deletes.length; start += 500) batches.push(deletes.slice(start, start + 500))
  batches.push([{ stream: 'projects', id: project.id, kind: 'delete' },
    event('project.deleted', `Deleted the project ${project.name}`, null, project.id, () => summaryId)])
  return batches
}
