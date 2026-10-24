import type { StreamName } from '../types'

// SDK-free intent. Only the lazy adapter turns this marker into a FieldValue.
export const SERVER_TIME = { serverTimestamp: true } as const
export type WriteValue = string | number | boolean | null | typeof SERVER_TIME
export type WriteFields = Readonly<Record<string, WriteValue>>
export type WriteOperation = { stream: StreamName; id: string } & (
  | { kind: 'set' | 'update'; data: WriteFields }
  | { kind: 'delete' }
)
export type MutationWriter = (operations: readonly WriteOperation[]) => Promise<void>
export interface MutationResult {
  outcome: 'acknowledged' | 'rejected'
  currentSession: boolean
  error?: string
}
