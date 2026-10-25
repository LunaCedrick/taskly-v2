import { readFile } from 'node:fs/promises'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp } from 'firebase/firestore'
import {
  COLLECTIONS, OWNER_UID, collectionPath, createRulesEnvironment, seedDocument, validDocument,
  CREATED_AT, SERVER_CREATED_AT,
} from './fixtures'
import type { RulesCollection, RulesDb, RulesDocument } from './fixtures'

let environment: RulesTestEnvironment
let owner: RulesDb
beforeAll(async () => {
  environment = await createRulesEnvironment()
  owner = environment.authenticatedContext(OWNER_UID).firestore()
})
beforeEach(async () => { await environment.clearFirestore() })
afterAll(async () => { await environment?.cleanup() })

async function rejectsCreateAndUpdate(collection: RulesCollection, data: RulesDocument) {
  const path = collectionPath(collection)
  await assertFails(owner.doc(`${path}/new`).set(data))
  await seedDocument(environment, collection)
  // Keep invalid-field update coverage independent from the immutable-createdAt rule.
  const update = data.createdAt === SERVER_CREATED_AT ? { ...data, createdAt: CREATED_AT } : data
  await assertFails(owner.doc(`${path}/existing`).set(update))
}

describe.each(COLLECTIONS)('%s exact document contract', (collection) => {
  it('rejects a client createdAt timestamp on create', async () => {
    await assertFails(owner.doc(`${collectionPath(collection)}/client-time`).set(validDocument(collection, CREATED_AT)))
  })

  it('allows an update without createdAt after a server-timestamp create', async () => {
    const document = owner.doc(`${collectionPath(collection)}/server-time`)
    await assertSucceeds(document.set(validDocument(collection)))
    const createdAt = (await document.get()).get('createdAt')
    const field = collection === 'projects' ? 'name' : collection === 'tasks' ? 'title' : 'text'
    await assertSucceeds(document.update({ [field]: 'Partial update without createdAt' }))
    expect((await document.get()).get('createdAt').isEqual(createdAt)).toBe(true)
  })

  it.each(Object.keys(validDocument(collection)))('requires %s, including nullable slots', async (field) => {
    const data = validDocument(collection)
    delete data[field]
    await rejectsCreateAndUpdate(collection, data)
  })

  it.each(['extra', 'id', 'uid'])('rejects additional payload field %s', async (field) => {
    await rejectsCreateAndUpdate(collection, { ...validDocument(collection), [field]: 'injected' })
  })

  it('keeps createdAt immutable while allowing its unchanged value', async () => {
    await seedDocument(environment, collection)
    const document = owner.doc(`${collectionPath(collection)}/existing`)
    await assertSucceeds(document.update({ createdAt: Timestamp.fromMillis(1_000) }))
    await assertFails(document.update({ createdAt: Timestamp.fromMillis(2_000) }))
    expect((await document.get()).get('createdAt').toMillis()).toBe(1_000)
  })
})

const invalidFields: [RulesCollection, string, unknown][] = [
  ['projects', 'name', null], ['projects', 'colorIndex', '0'],
  ['projects', 'colorIndex', -1], ['projects', 'colorIndex', 6], ['projects', 'colorIndex', 0.5],
  ['projects', 'createdAt', null], ['projects', 'updatedAt', 1_000],
  ['projects', 'createdAt', { seconds: 1, nanoseconds: 0 }],
  ['tasks', 'projectId', null], ['tasks', 'title', 1], ['tasks', 'title', ''],
  ['tasks', 'title', ' \t\r\n\v\f'], ['tasks', 'title', '\u00a0\u2003\u2028\u2029\ufeff'],
  ['tasks', 'description', null], ['tasks', 'category', 1], ['tasks', 'dueDate', 1_000],
  ['tasks', 'dueHasTime', 'false'], ['tasks', 'priority', 'urgent'], ['tasks', 'status', 'in progress'],
  ['tasks', 'createdAt', null], ['tasks', 'updatedAt', '2026-10-23'], ['tasks', 'completedAt', false],
  ['tasks', 'dueDate', { seconds: 1, nanoseconds: 0 }],
  ['activity', 'type', 1], ['activity', 'taskId', 1], ['activity', 'projectId', false],
  ['activity', 'text', null], ['activity', 'createdAt', null],
  ['activity', 'createdAt', { seconds: 1, nanoseconds: 0 }],
]

it.each(invalidFields)('rejects %s.%s = %j on create and update', async (collection, field, value) => {
  await rejectsCreateAndUpdate(collection, { ...validDocument(collection), [field]: value })
})

it('ties accepted colorIndex 0–5 to the existing palette, including both bounds', async () => {
  const tokens = await readFile(new URL('../../src/styles/tokens.css', import.meta.url), 'utf8')
  const palette = [...tokens.matchAll(/--project-(\d+)\s*:/g)].map((match) => Number(match[1]))
  expect(palette).toEqual([0, 1, 2, 3, 4, 5])
  for (const colorIndex of palette) {
    await assertSucceeds(owner.doc(`${collectionPath('projects')}/color-${colorIndex}`)
      .set({ ...validDocument('projects'), colorIndex }))
  }
})

it('preserves multiline title text and surrounding whitespace without rewriting it', async () => {
  const title = ' \n\tFirst line\nSecond line\r\n '
  const document = owner.doc(`${collectionPath('tasks')}/multiline`)
  await assertSucceeds(document.set({ ...validDocument('tasks'), title }))
  expect((await document.get()).get('title')).toBe(title)
})

function titleCharacter(codePoint: number) {
  return { code: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
    title: String.fromCodePoint(codePoint) }
}

const nonWhitespaceTitles = [0x0085, 0x001c, 0x001d, 0x001e, 0x001f, 0x180e, 0x200b].map(titleCharacter)
it.each(nonWhitespaceTitles)('accepts $code as non-whitespace under JavaScript trim', async ({ code, title }) => {
  expect(title.trim()).toBe(title)
  const document = owner.doc(`${collectionPath('tasks')}/char-${code.slice(2)}`)
  await assertSucceeds(document.set({ ...validDocument('tasks'), title }))
  const wrapped = ` \n${title}\n `
  await assertSucceeds(document.update({ title: wrapped }))
  expect((await document.get()).get('title')).toBe(wrapped)
})

const whitespaceTitles = [
  0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x00a0, 0x1680,
  ...Array.from({ length: 11 }, (_, index) => 0x2000 + index),
  0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
].map(titleCharacter)
it.each(whitespaceTitles)('rejects whitespace-only $code under JavaScript trim', async ({ title }) => {
  expect(title.trim()).toBe('')
  await rejectsCreateAndUpdate('tasks', { ...validDocument('tasks'), title })
})

it('accepts all exact task enums and approved nullable dates', async () => {
  for (const priority of ['none', 'low', 'medium', 'high']) {
    for (const status of ['todo', 'in-progress', 'done']) {
      await assertSucceeds(owner.doc(`${collectionPath('tasks')}/${priority}-${status}`).set({
        ...validDocument('tasks'), priority, status, dueDate: null, completedAt: null,
      }))
    }
  }
  await assertSucceeds(owner.doc(`${collectionPath('tasks')}/dated`).set({
    ...validDocument('tasks'), dueDate: Timestamp.fromMillis(2_000), completedAt: Timestamp.fromMillis(3_000),
  }))
})

it('accepts nullable activity references and does not invent an activity enum', async () => {
  await assertSucceeds(owner.doc(`${collectionPath('activity')}/nullable`).set({
    ...validDocument('activity'), type: 'future-writer-value', taskId: null, projectId: null,
  }))
})

it('does not add nonempty-string, timestamp-order, or cross-field constraints', async () => {
  await assertSucceeds(owner.doc(`${collectionPath('projects')}/empty-name`).set({
    ...validDocument('projects'), name: '', updatedAt: Timestamp.fromMillis(0),
  }))
  await assertSucceeds(owner.doc(`${collectionPath('tasks')}/independent-fields`).set({
    ...validDocument('tasks'), projectId: '', dueDate: null, dueHasTime: true,
    status: 'done', completedAt: null, updatedAt: Timestamp.fromMillis(0),
  }))
  await assertSucceeds(owner.doc(`${collectionPath('activity')}/empty-strings`).set({
    ...validDocument('activity'), type: '', text: '', taskId: '', projectId: '',
  }))
})

it('does not add a string-length cap', async () => {
  const longText = 'x'.repeat(20_000)
  await assertSucceeds(owner.doc(`${collectionPath('tasks')}/long`).set({
    ...validDocument('tasks'), title: longText, description: longText, category: longText,
  }))
})
