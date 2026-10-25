import { expect, it } from 'vitest'
import { parseDue } from '../../src/lib/task-dates'
import { dueInstant } from '../../src/lib/dates'
import { makeFakeData } from '../../src/lib/fake-data'

it('runs P7 in New York: rejects the spring gap and selects the earlier repeated fall time', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/New_York')
  expect(() => parseDue('2026-03-08', '02:30')).toThrow('does not exist')
  expect(parseDue('2026-11-01', '01:30').dueDate).toBe(Date.UTC(2026, 10, 1, 5, 30))
  const spring = { ...makeFakeData(1).tasks[0], ...parseDue('2026-03-08', '') }
  expect(dueInstant(spring)).toBe(new Date(2026, 2, 8, 23, 59, 59, 999).getTime())
})
