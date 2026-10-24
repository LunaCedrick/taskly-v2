import { mkdir, writeFile } from 'node:fs/promises'
import { expect, type Page, type TestInfo } from '@playwright/test'
import type { WriteOperation } from '../../../src/lib/mutations/types'
import { SERVER_TIME } from '../../../src/lib/mutations/types'
import { QA_DIRECTORY } from './qa'
import { externalWrite } from './sync'
import { openGooglePopup } from './auth'

export const stamp = SERVER_TIME
export const project = (id: string): WriteOperation => ({ kind: 'set', stream: 'projects', id,
  data: { name: id, colorIndex: 0, createdAt: stamp, updatedAt: stamp } })
export const task = (id: string, projectId: string): WriteOperation => ({ kind: 'set', stream: 'tasks', id,
  data: { projectId, title: id, description: '', category: '', dueDate: null, dueHasTime: false,
    priority: 'none', status: 'todo', completedAt: null, createdAt: stamp, updatedAt: stamp } })
export const activity = (id: string, type: string, text: string, projectId: string, taskId: string | null = null): WriteOperation => ({
  kind: 'set', stream: 'activity', id, data: { type, text, projectId, taskId, createdAt: stamp } })

export const writeSnapshot = (page: Page) => page.evaluate(() => window.__TASKLY_G3_WRITES_TEST__!.snapshot())
export const network = (page: Page, enabled: boolean) => page.evaluate((enabled) =>
  window.__TASKLY_G3_WRITES_TEST__!.network(enabled), enabled)
export const enqueue = (page: Page, id: string, operations: WriteOperation[]) => page.evaluate(({ id, operations }) => {
  window.__TASKLY_G3_WRITES_TEST__!.enqueue(id, operations)
}, { id, operations })
export async function settled(page: Page, id: string, status = 'acknowledged') {
  await expect.poll(async () => (await writeSnapshot(page)).operations[id]?.status).toBe(status)
}

export async function serverExists(uid: string, stream: string, id: string) {
  let exists = false
  await externalWrite(uid, async (db, path) => { exists = (await db.doc(`${path}/${stream}/${id}`).get()).exists })
  return exists
}

export async function signInEmail(page: Page, email: string) {
  const popup = await openGooglePopup(page)
  await popup.locator('#email-input').fill(email)
  await popup.locator('#display-name-input').fill('Returning Taskly Owner')
  const closed = popup.waitForEvent('close')
  await popup.locator('#sign-in').click()
  await closed
  await page.waitForFunction(() => window.__TASKLY_G2_SYNC_TEST__?.snapshot().dataReady)
}

export async function observation(page: Page) {
  return page.evaluate(() => {
    const probe = window.__TASKLY_G3_WRITES_TEST__?.snapshot()
    const sync = window.__TASKLY_G2_SYNC_TEST__
    return { writes: probe && { ...probe, tasks: probe.tasks.filter((row) => row.id.startsWith('cp-')) },
      sync: sync?.snapshot(), pendingDocuments: sync?.pendingDocuments, events: sync?.events }
  })
}

export async function saveExperiment(info: TestInfo, name: string, result: unknown) {
  await mkdir(QA_DIRECTORY, { recursive: true })
  // One value per line keeps bounded event arrays below the repository's 300-line limit.
  const json = `{\n  "testStatus": ${JSON.stringify(info.status)},\n  "result": ${JSON.stringify(result)}\n}\n`
  await writeFile(`${QA_DIRECTORY}/${name}.json`, json)
  await info.attach(name, { body: json, contentType: 'application/json' })
}
