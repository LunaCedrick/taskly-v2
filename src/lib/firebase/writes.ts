import { doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import type { Firestore } from 'firebase/firestore'
import type { MutationWriter, WriteFields } from '../mutations/types'

const timestampFields = new Set(['createdAt', 'updatedAt', 'completedAt', 'dueDate'])
const streams = new Set(['projects', 'tasks', 'activity'])

function segment(value: string) {
  if (!value || value.includes('/')) throw new Error('A single document path segment is required')
  return value
}

function encode(data: WriteFields) {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key,
    value && typeof value === 'object' && value.serverTimestamp === true ? serverTimestamp()
      : timestampFields.has(key) && typeof value === 'number' ? Timestamp.fromMillis(value) : value,
  ]))
}

/** Low-level atomic transport only. Entity validation/planning follows checkpoint 1. */
export function createMutationWriter(database: Firestore, uid: string): MutationWriter {
  segment(uid)
  return (operations) => {
    if (!operations.length || operations.length > 500) throw new Error('A batch needs 1–500 write operations')
    const batch = writeBatch(database)
    for (const operation of operations) {
      if (!streams.has(operation.stream)) throw new Error('Unsupported document collection')
      const reference = doc(database, 'users', uid, operation.stream, segment(operation.id))
      if (operation.kind === 'delete') batch.delete(reference)
      else if (operation.kind === 'update') batch.update(reference, encode(operation.data))
      else batch.set(reference, encode(operation.data))
    }
    return batch.commit()
  }
}
