import type { Task } from './types'
import { localCalendarDate } from './task-dates'

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const dateFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function endOfDay(timestamp: number): number {
  const date = new Date(timestamp)
  date.setHours(23, 59, 59, 999)
  return date.getTime()
}

export function dueInstant(task: Task): number | null {
  if (task.dueDate === null) return null
  return task.dueHasTime ? task.dueDate : endOfDay(localCalendarDate(task.dueDate).getTime())
}

export type DueGroup = 'overdue' | 'today' | 'upcoming' | 'none' | 'done'

export function dueGroup(task: Task, now: number): DueGroup {
  if (task.status === 'done') return 'done'
  const due = dueInstant(task)
  if (due === null) return 'none'
  if (due < now) return 'overdue'
  return startOfDay(due) === startOfDay(now) ? 'today' : 'upcoming'
}

export function dueLabel(task: Task, now: number): string {
  const group = dueGroup(task, now)
  if (group === 'done') return 'Completed'
  if (task.dueDate === null) return 'No due date'
  const calendarDate = task.dueHasTime ? task.dueDate : localCalendarDate(task.dueDate).getTime()
  if (group === 'today') {
    return task.dueHasTime
      ? `Today, ${timeFormat.format(task.dueDate)}`
      : 'Today'
  }
  if (group === 'overdue') {
    // Calendar-day arithmetic avoids a 23/25-hour daylight-saving day changing the label.
    const calendarDay = (value: number) => {
      const date = new Date(value)
      return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    }
    const days = Math.round((calendarDay(now) - calendarDay(calendarDate)) / 86_400_000)
    return days > 1 ? `${days} days overdue` : days === 1 ? 'Yesterday' : 'Overdue today'
  }
  return dateFormat.format(calendarDate)
}
