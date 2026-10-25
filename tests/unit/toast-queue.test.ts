import { expect, it } from 'vitest'
import { enqueueToast } from '../../src/lib/toast-queue'
import { addToast, recoverDraft } from '../../src/store/write-actions'
import { emptyDraft } from '../../src/store/write-slice'
import { useStore } from '../../src/store'
import { seedStore } from './data-fixtures'

const normal = (id: string) => ({ id, text: id, error: false })

it('retains an error behind four normal messages and drops the oldest queued normal on overflow', () => {
  const queue = ['visible', 'oldest queued', 'second queued', 'third queued'].map(normal)
  const error = { id: 'error', text: 'Could not save your change', error: true }
  const withError = enqueueToast(queue, error)
  expect(withError).toHaveLength(5)
  expect(withError.at(-1)).toBe(error)
  expect(enqueueToast(withError, normal('newest')).map((toast) => toast.id))
    .toEqual(['visible', 'second queued', 'third queued', 'error', 'newest'])
  expect(queue).toHaveLength(4)
})

it('never caps distinct errors and merges identical error messages', () => {
  const errors = Array.from({ length: 8 }, (_, index) => ({ id: `${index}`, text: `Failure ${index}`, error: true }))
  const queue = errors.reduce((queue, error) => enqueueToast(queue, error), [] as readonly typeof errors[number][])
  expect(queue).toHaveLength(8)
  expect(enqueueToast(queue, { ...errors[0], id: 'duplicate' })).toHaveLength(8)
  expect(enqueueToast(queue, { ...errors[0], id: 'duplicate' })[0].id).toBe('0')
})

it('merges a failing burst into one sticky error while preserving every recoverable submitted draft', () => {
  seedStore(0)
  useStore.setState({ toasts: [], overlay: null })
  addToast('Could not save your change', true, { ...emptyDraft('project-1'), title: 'First failure' })
  addToast('Could not save your change', true, { ...emptyDraft('project-1'), title: 'Second failure' })
  expect(useStore.getState().toasts).toHaveLength(1)
  recoverDraft(useStore.getState().toasts[0])
  expect(useStore.getState().draft.title).toBe('First failure')
  expect(useStore.getState().toasts[0].recovery?.title).toBe('Second failure')
  useStore.setState({ overlay: null })
  recoverDraft(useStore.getState().toasts[0])
  expect(useStore.getState().draft.title).toBe('Second failure')
  expect(useStore.getState().toasts).toHaveLength(0)
})
