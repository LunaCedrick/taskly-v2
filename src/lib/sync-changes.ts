export interface EntityChange<T> {
  type: 'added' | 'modified' | 'removed'
  id: string
  data?: T
  oldIndex?: number
  newIndex?: number
}

// Decoded documents are flat: every effective field is a primitive UI value.
export function effectiveDataEqual<T extends { id: string }>(left: T, right: T): boolean {
  const keys = Object.keys(left) as (keyof T)[]
  return keys.length === Object.keys(right).length
    && keys.every((key) => Object.hasOwn(right, key) && Object.is(left[key], right[key]))
}

export function applyChanges<T extends { id: string }>(
  current: readonly T[],
  changes: readonly EntityChange<T>[],
  options: { limit?: number } = {},
): readonly T[] {
  const { limit } = options
  if (limit !== undefined && (!Number.isInteger(limit) || limit < 0)) {
    throw new RangeError('The document limit must be a non-negative integer')
  }
  if (!changes.length && (limit === undefined || current.length <= limit)) return current

  const originals = new Map(current.map((document) => [document.id, document]))
  let next: T[] | undefined
  const mutable = () => (next ??= [...current])

  for (const change of changes) {
    const rows = next ?? current
    const index = rows.findIndex((document) => document.id === change.id)
    if (change.type === 'removed') {
      if (index !== -1) mutable().splice(index, 1)
      continue
    }
    if (!change.data || change.data.id !== change.id) {
      throw new Error('A document change must contain data with the matching id')
    }
    const original = originals.get(change.id)
    const document = original && effectiveDataEqual(original, change.data) ? original : change.data
    const target = change.newIndex ?? (index === -1 ? rows.length : index)
    const maximum = index === -1 ? rows.length : rows.length - 1
    if (!Number.isInteger(target) || target < 0 || target > maximum) {
      throw new RangeError('The new document index is outside the resulting collection')
    }
    if (index !== -1 && rows[index] === document && index === target) continue
    const draft = mutable()
    if (index !== -1) draft.splice(index, 1)
    draft.splice(target, 0, document)
  }

  if (limit !== undefined && (next ?? current).length > limit) mutable().splice(limit)
  if (!next || (next.length === current.length && next.every((row, index) => row === current[index]))) {
    return current
  }
  return next
}
