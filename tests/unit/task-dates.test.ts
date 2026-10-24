import { expect, it } from 'vitest'
import { localCalendarDate, parseDue, quickDate } from '../../src/lib/task-dates'
import { dueInstant, dueLabel, endOfDay } from '../../src/lib/dates'
import { makeFakeData } from '../../src/lib/fake-data'

it('round-trips selected date-only UTC components and applies local end of day', () => {
  const value = parseDue('2026-10-17', '')
  expect(value).toEqual({ dueDate: Date.UTC(2026, 9, 17), dueHasTime: false })
  const task = { ...makeFakeData(1).tasks[0], ...value }
  expect(localCalendarDate(value.dueDate!).getDate()).toBe(17)
  expect(dueInstant(task)).toBe(endOfDay(new Date(2026, 9, 17).getTime()))
  expect(dueLabel(task, new Date(2026, 9, 17, 12).getTime())).toBe('Today')
  expect(dueLabel(task, new Date(2026, 9, 19, 12).getTime())).toBe('2 days overdue')
})

it('uses next strictly future Monday, including Sunday and Monday', () => {
  expect(quickDate('Next week', new Date(2026, 9, 18, 12).getTime())).toBe('2026-10-19')
  expect(quickDate('Next week', new Date(2026, 9, 19, 12).getTime())).toBe('2026-10-26')
  expect(() => parseDue('2026-02-30', '')).toThrow('valid date')
  expect(() => parseDue('', '12:00')).toThrow('before a time')
})

it.skipIf(process.env.TZ !== 'America/New_York')('rejects the DST spring gap and selects the earlier repeated fall time', () => {
  expect(() => parseDue('2026-03-08', '02:30')).toThrow('does not exist')
  expect(parseDue('2026-11-01', '01:30').dueDate).toBe(Date.UTC(2026, 10, 1, 5, 30))
  const spring = { ...makeFakeData(1).tasks[0], ...parseDue('2026-03-08', '') }
  expect(dueInstant(spring)).toBe(new Date(2026, 2, 8, 23, 59, 59, 999).getTime())
})
