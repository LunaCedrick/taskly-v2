import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import type { RulesTestContext, RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import {
  EMULATOR_HOST, EMULATOR_PORTS, EMULATOR_PROJECT_ID,
} from '../../src/lib/firebase/emulator-config.ts'

export const OWNER_UID = 'rules-owner'
export const OTHER_UID = 'rules-other'
export const COLLECTIONS = ['projects', 'tasks', 'activity'] as const
export type RulesCollection = typeof COLLECTIONS[number]
export type RulesDocument = Record<string, unknown>
export type RulesDb = ReturnType<RulesTestContext['firestore']>
export const CREATED_AT = Timestamp.fromMillis(1_000)
export const SERVER_CREATED_AT = serverTimestamp()

export async function createRulesEnvironment(
  options: { loadRules?: boolean } = {},
): Promise<RulesTestEnvironment> {
  const expectedHost = `${EMULATOR_HOST}:${EMULATOR_PORTS.firestore}`
  if (process.env.FIRESTORE_EMULATOR_HOST !== expectedHost
    || process.env.GCLOUD_PROJECT !== EMULATOR_PROJECT_ID) {
    throw new Error(`Rules tests require ${EMULATOR_PROJECT_ID} at ${expectedHost}; no live fallback`)
  }
  return initializeTestEnvironment({
    projectId: EMULATOR_PROJECT_ID,
    firestore: {
      host: EMULATOR_HOST,
      port: EMULATOR_PORTS.firestore,
      ...(options.loadRules === false ? {} : {
        rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
      }),
    },
  })
}

export function collectionPath(collection: RulesCollection, uid = OWNER_UID): string {
  return `users/${uid}/${collection}`
}

export function validDocument(collection: RulesCollection, createdAt: unknown = SERVER_CREATED_AT): RulesDocument {
  if (collection === 'projects') {
    return { name: 'Project', colorIndex: 0, createdAt, updatedAt: CREATED_AT }
  }
  if (collection === 'tasks') {
    return {
      projectId: 'project-1', title: 'Task', description: '', category: '', dueDate: null,
      dueHasTime: false, priority: 'none', status: 'todo', createdAt,
      updatedAt: CREATED_AT, completedAt: null,
    }
  }
  return {
    type: 'created', taskId: 'task-1', projectId: 'project-1', text: 'Task created',
    createdAt,
  }
}

export async function seedDocument(
  environment: RulesTestEnvironment,
  collection: RulesCollection,
  id = 'existing',
  data = validDocument(collection, CREATED_AT),
): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`${collectionPath(collection)}/${id}`).set(data)
  })
}
