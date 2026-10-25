import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp } from 'firebase/firestore'
import {
  COLLECTIONS, OWNER_UID, OTHER_UID, collectionPath, createRulesEnvironment,
  seedDocument, validDocument, CREATED_AT,
} from './fixtures'
import type { RulesDb } from './fixtures'

let environment: RulesTestEnvironment
let owner: RulesDb
let other: RulesDb
let guest: RulesDb

beforeAll(async () => {
  environment = await createRulesEnvironment()
  owner = environment.authenticatedContext(OWNER_UID).firestore()
  other = environment.authenticatedContext(OTHER_UID).firestore()
  guest = environment.unauthenticatedContext().firestore()
})
beforeEach(async () => { await environment.clearFirestore() })
afterAll(async () => { await environment?.cleanup() })

describe.each(COLLECTIONS)('%s ownership', (collection) => {
  it('allows owner create/get/list/partial-update/delete without a parent profile', async () => {
    const document = owner.doc(`${collectionPath(collection)}/owner-created`)
    await assertSucceeds(document.set(validDocument(collection)))
    expect((await assertSucceeds(document.get())).exists).toBe(true)
    expect((await assertSucceeds(owner.collection(collectionPath(collection)).get())).size).toBe(1)
    const field = collection === 'projects' ? 'name' : collection === 'tasks' ? 'title' : 'text'
    await assertSucceeds(document.update({ [field]: 'Changed' }))
    expect((await document.get()).get(field)).toBe('Changed')
    await assertSucceeds(document.delete())
    expect((await document.get()).exists).toBe(false)
  })

  it.each(['signed out', 'another user'] as const)('denies every operation for %s', async (identity) => {
    await seedDocument(environment, collection)
    const database = identity === 'signed out' ? guest : other
    const existing = database.doc(`${collectionPath(collection)}/existing`)
    await assertFails(existing.get())
    await assertFails(database.collection(collectionPath(collection)).get())
    await assertFails(database.doc(`${collectionPath(collection)}/new`).set(validDocument(collection)))
    await assertFails(existing.set(validDocument(collection, CREATED_AT)))
    await assertFails(existing.update({ createdAt: Timestamp.fromMillis(1_000) }))
    await assertFails(existing.delete())
  })

  it('allows the actual owner subscription query and denies it to other identities', async () => {
    await seedDocument(environment, collection)
    for (const [database, allowed] of [[owner, true], [other, false], [guest, false]] as const) {
      const reference = database.collection(collectionPath(collection))
      const query = collection === 'activity' ? reference.orderBy('createdAt', 'desc').limit(20) : reference
      await (allowed ? assertSucceeds(query.get()) : assertFails(query.get()))
    }
  })
})

it('allows the owner activity query to retrieve only the latest 20', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    const batch = database.batch()
    for (let index = 1; index <= 25; index++) {
      batch.set(database.doc(`${collectionPath('activity')}/${index}`), {
        ...validDocument('activity'), createdAt: Timestamp.fromMillis(index * 1_000),
      })
    }
    await batch.commit()
  })
  const snapshot = await assertSucceeds(
    owner.collection(collectionPath('activity')).orderBy('createdAt', 'desc').limit(20).get(),
  )
  expect(snapshot.docs.map((document) => document.id)).toEqual(
    Array.from({ length: 20 }, (_, index) => String(25 - index)),
  )
})

it('denies profile creation, reads, listing, updates, and deletion even for the owner', async () => {
  const profile = { displayName: 'Owner', photoURL: null, createdAt: Timestamp.fromMillis(1_000) }
  await assertFails(owner.doc(`users/${OWNER_UID}`).set(profile))
  await environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`users/${OWNER_UID}`).set(profile)
  })
  for (const database of [owner, other, guest]) {
    const document = database.doc(`users/${OWNER_UID}`)
    await assertFails(document.get())
    await assertFails(database.collection('users').get())
    await assertFails(document.set(profile))
    await assertFails(document.update({ displayName: 'Changed' }))
    await assertFails(document.delete())
  }
})

it.each(['unknown/document', `users/${OWNER_UID}/unknown/document`,
  `users/${OWNER_UID}/projects/project-1/nested/document`])('denies unmatched path %s', async (path) => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(path).set({ value: 'private' })
  })
  for (const database of [owner, other, guest]) {
    await assertFails(database.doc(path).get())
    await assertFails(database.doc(path).set({ value: 'changed' }))
    await assertFails(database.doc(path).delete())
  }
})
