import { dashboardGroups, taskStats, tasksByProject } from '../lib/task-selectors'
import type { Activity, Project, StreamName, Task } from '../lib/types'

export interface StreamError { kind: 'timeout' | 'listener' | 'decode' | 'load'; message: string }
export interface StreamState {
  ready: boolean
  fromCache: boolean | null
  error: StreamError | null
  registered: boolean
}
export type Streams = Record<StreamName, StreamState>
export interface DataSlice {
  dataUid: string | null
  rawProjects: readonly Project[]
  rawTasks: readonly Task[]
  activity: readonly Activity[]
  projects: readonly Project[]
  tasks: readonly Task[]
  streams: Streams
  dataReady: boolean
  orphanCount: number
  now: number
  projectTasks: Record<string, readonly Task[]>
  groups: ReturnType<typeof dashboardGroups>
  stats: ReturnType<typeof taskStats>
}
export interface DataPublication {
  rawProjects?: readonly Project[]
  rawTasks?: readonly Task[]
  activity?: readonly Activity[]
  streams?: Partial<Streams>
}

export function initialDataState(dataUid: string | null = null, now = Date.now()): DataSlice {
  return { dataUid, rawProjects: [], rawTasks: [], activity: [], projects: [], tasks: [],
    streams: { projects: initialStream(), tasks: initialStream(), activity: initialStream() },
    dataReady: false, orphanCount: 0, now, projectTasks: {},
    groups: { overdue: [], today: [], upcoming: [] }, stats: { total: 0, completed: 0, inProgress: 0 } }
}

export function initialStream(): StreamState {
  return { ready: false, fromCache: null, error: null, registered: false }
}

function sameItems<T>(before: readonly T[], after: readonly T[]): boolean {
  return before.length === after.length && before.every((item, index) => item === after[index])
}

function stableItems<T>(before: readonly T[], after: readonly T[]): readonly T[] {
  return sameItems(before, after) ? before : after
}

function mergeStreams(current: Streams, updates: Partial<Streams> | undefined): Streams {
  if (!updates) return current
  let result = current
  for (const name of ['projects', 'tasks', 'activity'] as const) {
    const next = updates[name]
    const previous = current[name]
    if (!next || (next.ready === previous.ready && next.fromCache === previous.fromCache
      && next.registered === previous.registered && next.error?.kind === previous.error?.kind
      && next.error?.message === previous.error?.message)) continue
    if (result === current) result = { ...current }
    result[name] = next
  }
  return result
}

/** Pure publication: retain source documents, expose only safe, initially confirmed joins. */
export function publishData(current: DataSlice, publication: DataPublication, now: number): DataSlice {
  const rawProjects = publication.rawProjects ?? current.rawProjects
  const rawTasks = publication.rawTasks ?? current.rawTasks
  const activity = publication.activity ?? current.activity
  const streams = mergeStreams(current.streams, publication.streams)
  if (rawProjects === current.rawProjects && rawTasks === current.rawTasks
    && activity === current.activity && streams === current.streams) return current
  const dataReady = streams.projects.ready && streams.tasks.ready
  const projectIds = new Set(rawProjects.map((project) => project.id))
  const safe = dataReady ? rawTasks.filter((task) => projectIds.has(task.projectId)) : []
  const tasks = stableItems(current.tasks, safe)
  const projectTasks: Record<string, readonly Task[]> = {}
  for (const project of rawProjects) {
    projectTasks[project.id] = stableItems(current.projectTasks[project.id] ?? [], tasksByProject(tasks, project.id))
  }
  const sameProjects = Object.keys(current.projectTasks).length === rawProjects.length
    && rawProjects.every((project) => projectTasks[project.id] === current.projectTasks[project.id])
  const nextGroups = dashboardGroups(tasks, now)
  const groups = Object.fromEntries(Object.entries(nextGroups).map(([name, group]) => [name,
    stableItems(current.groups[name as keyof typeof nextGroups], group)])) as DataSlice['groups']
  const sameGroups = (['overdue', 'today', 'upcoming'] as const)
    .every((name) => groups[name] === current.groups[name])
  const nextStats = taskStats(tasks)
  const sameStats = nextStats.total === current.stats.total && nextStats.completed === current.stats.completed
    && nextStats.inProgress === current.stats.inProgress
  return { ...current, rawProjects, rawTasks, activity, streams, projects: rawProjects, tasks, dataReady, now,
    orphanCount: dataReady ? rawTasks.length - safe.length : 0,
    projectTasks: sameProjects ? current.projectTasks : projectTasks,
    groups: sameGroups ? current.groups : groups, stats: sameStats ? current.stats : nextStats }
}
