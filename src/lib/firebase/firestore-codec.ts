import type { Activity, Priority, Project, StreamDocuments, StreamName, Task, TaskStatus } from '../types'

const projectFields = ['name', 'colorIndex', 'createdAt', 'updatedAt']
const taskFields = [
  'projectId', 'title', 'description', 'category', 'dueDate', 'dueHasTime',
  'priority', 'status', 'createdAt', 'updatedAt', 'completedAt',
]
const activityFields = ['type', 'taskId', 'projectId', 'text', 'createdAt']
const priorities: readonly Priority[] = ['none', 'low', 'medium', 'high']
const statuses: readonly TaskStatus[] = ['todo', 'in-progress', 'done']
// Keep aligned with --project-0 through --project-5 in src/styles/tokens.css.
const projectColorCount = 6

function invalid(path: string): never {
  throw new Error(`Invalid Firestore document field: ${path}`)
}

function record(value: unknown, fields: readonly string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid(path)
  const data = value as Record<string, unknown>
  if (Object.keys(data).length !== fields.length || !fields.every((field) => Object.hasOwn(data, field))) {
    return invalid(`${path} fields`)
  }
  return data
}

function string(value: unknown, path: string): string {
  return typeof value === 'string' ? value : invalid(path)
}

function nullableString(value: unknown, path: string): string | null {
  return value === null ? null : string(value, path)
}

function timestamp(value: unknown, path: string): number {
  if (!value || typeof value !== 'object') return invalid(path)
  const { seconds, nanoseconds } = value as Record<string, unknown>
  if (typeof seconds !== 'number' || !Number.isInteger(seconds)
    || seconds < -62_135_596_800 || seconds > 253_402_300_799
    || typeof nanoseconds !== 'number' || !Number.isInteger(nanoseconds)
    || nanoseconds < 0 || nanoseconds > 999_999_999) return invalid(path)
  return seconds * 1000 + nanoseconds / 1_000_000
}

function nullableTimestamp(value: unknown, path: string): number | null {
  return value === null ? null : timestamp(value, path)
}

function enumeration<T extends string>(value: unknown, allowed: readonly T[], path: string): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : invalid(path)
}

export function decodeProject(id: string, value: unknown): Project {
  const path = `projects/${id}`
  const data = record(value, projectFields, path)
  if (typeof data.colorIndex !== 'number' || !Number.isInteger(data.colorIndex)
    || data.colorIndex < 0 || data.colorIndex >= projectColorCount) return invalid(`${path}.colorIndex`)
  return {
    id, name: string(data.name, `${path}.name`), colorIndex: data.colorIndex,
    createdAt: timestamp(data.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(data.updatedAt, `${path}.updatedAt`),
  }
}

export function decodeTask(id: string, value: unknown): Task {
  const path = `tasks/${id}`
  const data = record(value, taskFields, path)
  const title = string(data.title, `${path}.title`)
  if (!title.trim()) return invalid(`${path}.title`)
  if (typeof data.dueHasTime !== 'boolean') return invalid(`${path}.dueHasTime`)
  return {
    id, projectId: string(data.projectId, `${path}.projectId`), title,
    description: string(data.description, `${path}.description`),
    category: string(data.category, `${path}.category`),
    dueDate: nullableTimestamp(data.dueDate, `${path}.dueDate`), dueHasTime: data.dueHasTime,
    priority: enumeration(data.priority, priorities, `${path}.priority`),
    status: enumeration(data.status, statuses, `${path}.status`),
    createdAt: timestamp(data.createdAt, `${path}.createdAt`),
    updatedAt: timestamp(data.updatedAt, `${path}.updatedAt`),
    completedAt: nullableTimestamp(data.completedAt, `${path}.completedAt`),
  }
}

export function decodeActivity(id: string, value: unknown): Activity {
  const path = `activity/${id}`
  const data = record(value, activityFields, path)
  return {
    id, type: string(data.type, `${path}.type`), text: string(data.text, `${path}.text`),
    taskId: nullableString(data.taskId, `${path}.taskId`),
    projectId: nullableString(data.projectId, `${path}.projectId`),
    createdAt: timestamp(data.createdAt, `${path}.createdAt`),
  }
}

export function decodeDocument<S extends StreamName>(stream: S, id: string, value: unknown): StreamDocuments[S] {
  const decoders = { projects: decodeProject, tasks: decodeTask, activity: decodeActivity }
  return decoders[stream](id, value) as StreamDocuments[S]
}
