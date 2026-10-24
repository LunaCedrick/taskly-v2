import type { Task } from './types'

export function localCalendarDate(utcMidnight: number) {
  const date = new Date(utcMidnight)
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

export function dateInput(task: Pick<Task, 'dueDate' | 'dueHasTime'>) {
  if (task.dueDate === null) return ''
  const date = task.dueHasTime ? new Date(task.dueDate) : localCalendarDate(task.dueDate)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function timeInput(task: Pick<Task, 'dueDate' | 'dueHasTime'>) {
  if (!task.dueHasTime || task.dueDate === null) return ''
  const date = new Date(task.dueDate)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

export function parseDue(date: string, time: string) {
  if (!date) {
    if (time) throw new Error('Choose a due date before a time.')
    return { dueDate: null, dueHasTime: false }
  }
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time ? time.split(':').map(Number) : [0, 0]
  const utc = new Date(Date.UTC(year, month - 1, day))
  if (utc.getUTCFullYear() !== year || utc.getUTCMonth() !== month - 1 || utc.getUTCDate() !== day)
    throw new Error('Choose a valid date.')
  if (!time) return { dueDate: utc.getTime(), dueHasTime: false }
  // Date chooses the earlier occurrence on a repeated DST hour. Reject normalized gaps.
  const local = new Date(year, month - 1, day, hour, minute)
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day
    || local.getHours() !== hour || local.getMinutes() !== minute) throw new Error('This local time does not exist.')
  return { dueDate: local.getTime(), dueHasTime: true }
}

export function quickDate(chip: 'Today' | 'Tomorrow' | 'Next week' | 'No date', now = Date.now()) {
  if (chip === 'No date') return ''
  const date = new Date(now)
  if (chip === 'Tomorrow') date.setDate(date.getDate() + 1)
  if (chip === 'Next week') date.setDate(date.getDate() + ((8 - date.getDay()) % 7 || 7))
  return dateInput({ dueDate: date.getTime(), dueHasTime: true })
}
