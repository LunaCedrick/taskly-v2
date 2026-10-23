import { Timestamp } from 'firebase/firestore'
import { makeFakeData } from '../../../src/lib/fake-data.ts'
import type { Activity, Project, Task } from '../../../src/lib/types'
import { createRulesEnvironment } from '../../rules/fixtures.ts'
import type { RulesDb, RulesDocument } from '../../rules/fixtures'

export interface SeedUserOptions {
  taskCount?: number
  now?: number
  projects?: boolean
  includeEmptyProject?: boolean
  activityCount?: number
}

export interface SeededUser {
  uid: string
  now: number
  projects: Project[]
  tasks: Task[]
  activity: Activity[]
  projectIds: string[]
  taskIds: string[]
  activityIds: string[]
  emptyProjectId: string | null
}

interface FixtureWrite { path: string; data: RulesDocument }
const batchSize = 500

function userPath(uid: string): string {
  if (!uid || uid.includes('/')) throw new Error('A single emulator user UID is required')
  return `users/${uid}`
}

async function writeRows(database: RulesDb, rows: FixtureWrite[]): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = database.batch()
    for (const row of rows.slice(offset, offset + batchSize)) {
      batch.set(database.doc(row.path), row.data)
    }
    await batch.commit()
  }
}

async function deleteUserData(database: RulesDb, uid: string): Promise<void> {
  for (const collection of ['projects', 'tasks', 'activity']) {
    const snapshot = await database.collection(`${userPath(uid)}/${collection}`).get()
    for (let offset = 0; offset < snapshot.docs.length; offset += batchSize) {
      const batch = database.batch()
      for (const document of snapshot.docs.slice(offset, offset + batchSize)) batch.delete(document.ref)
      await batch.commit()
    }
  }
}

function storedRows(seed: SeededUser): FixtureWrite[] {
  const base = userPath(seed.uid)
  const projects = seed.projects.map(({ id, ...data }) => ({
    path: `${base}/projects/${id}`,
    data: { ...data, createdAt: Timestamp.fromMillis(data.createdAt), updatedAt: Timestamp.fromMillis(data.updatedAt) },
  }))
  const tasks = seed.tasks.map(({ id, ...data }) => ({
    path: `${base}/tasks/${id}`,
    data: {
      ...data, createdAt: Timestamp.fromMillis(data.createdAt), updatedAt: Timestamp.fromMillis(data.updatedAt),
      dueDate: data.dueDate === null ? null : Timestamp.fromMillis(data.dueDate),
      completedAt: data.completedAt === null ? null : Timestamp.fromMillis(data.completedAt),
    },
  }))
  const activity = seed.activity.map(({ id, ...data }) => ({
    path: `${base}/activity/${id}`, data: { ...data, createdAt: Timestamp.fromMillis(data.createdAt) },
  }))
  return [...projects, ...tasks, ...activity]
}

export async function seedUser(uid: string, options: SeedUserOptions = {}): Promise<SeededUser> {
  userPath(uid)
  const now = options.now ?? Date.now()
  const populated = options.projects !== false
  const generated = makeFakeData(populated ? options.taskCount ?? 1_000 : 0, now)
  const projects = populated ? generated.projects : []
  const tasks = populated ? generated.tasks : []
  const emptyProjectId = populated && options.includeEmptyProject !== false ? 'project-empty' : null
  if (emptyProjectId) {
    projects.push({ id: emptyProjectId, name: 'Empty project', colorIndex: 3, createdAt: now, updatedAt: now })
  }
  const activityCount = populated ? options.activityCount ?? 25 : 0
  if (!Number.isInteger(activityCount) || activityCount < 0) throw new RangeError('Invalid activity count')
  const activity: Activity[] = Array.from({ length: activityCount }, (_, index) => ({
    id: `activity-${index + 1}`, type: 'seeded', text: `Seeded activity ${index + 1}`,
    taskId: tasks.length ? tasks[index % tasks.length].id : null,
    projectId: tasks.length ? tasks[index % tasks.length].projectId : projects[index % projects.length].id,
    createdAt: now - index * 1_000,
  }))
  const seed: SeededUser = {
    uid, now, projects, tasks, activity, emptyProjectId,
    projectIds: projects.map(({ id }) => id), taskIds: tasks.map(({ id }) => id),
    activityIds: activity.map(({ id }) => id),
  }
  // The runner owns emulator startup/rules loading; seeding never reloads rules or creates a listener.
  const environment = await createRulesEnvironment({ loadRules: false })
  try {
    await environment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore()
      await deleteUserData(database, uid)
      await writeRows(database, storedRows(seed))
    })
  } finally { await environment.cleanup() }
  return seed
}

export async function cleanupUser(uid: string): Promise<void> {
  userPath(uid)
  const environment = await createRulesEnvironment({ loadRules: false })
  try {
    await environment.withSecurityRulesDisabled(async (context) => {
      await deleteUserData(context.firestore(), uid)
    })
  } finally { await environment.cleanup() }
}
