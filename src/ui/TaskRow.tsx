import { memo } from 'react'
import type { Project, Task } from '../lib/types'
import { dueGroup, dueLabel } from '../lib/dates'
import { Chip, Pill } from './Controls'
import { Icon } from './Icon'
import styles from './TaskRow.module.css'

export interface TaskRowProps {
  task: Task
  project: Project
  now: number
  position: number
  total: number
  tabIndex?: number
  mutable?: boolean
  pending?: boolean
}

export const TaskRow = memo(function TaskRow({ task, project, now, position, total, tabIndex, mutable, pending }: TaskRowProps) {
  const group = dueGroup(task, now)
  return <div role="listitem" aria-setsize={total} aria-posinset={position}
    className={styles.row} data-task-id={task.id} data-tone={group} data-mutable={Boolean(mutable)} tabIndex={tabIndex}>
    {mutable ? <button className={styles.checkTarget} role="checkbox" aria-checked={task.status === 'done'}
      aria-label={`Complete ${task.title}`} data-row-action="complete" disabled={pending}>
      <span className={styles.checkbox} aria-hidden="true">{task.status === 'done' && <Icon name="check" />}</span>
    </button> : <span className={styles.checkbox} aria-hidden="true">{task.status === 'done' && <Icon name="check" />}</span>}
    <div className={styles.content}>
      <span className={styles.title} title={task.title}>{task.title}</span>
      <div className={styles.meta}>
        <span className={styles.project}><Chip colorIndex={project.colorIndex}>{project.name}</Chip></span>
        <span className={styles.phoneProject}>{project.name} ·</span>
        <Pill tone={group}>{dueLabel(task, now)}</Pill>
      </div>
    </div>
    {task.priority !== 'none' && <span className={styles.priority} data-priority={task.priority}>
      <span className={styles.dot} aria-hidden="true" /><span className={styles.priorityText} aria-hidden="true">{task.priority}</span>
      <span className="sr-only">{task.priority} priority</span>
    </span>}
    <span className="sr-only">Status: {task.status.replace('-', ' ')}</span>
    {mutable && <span className={styles.actions}>
      <button data-row-action="edit" disabled={pending} aria-label={`Edit ${task.title}`}>Edit</button>
      <button data-row-action="delete" disabled={pending} aria-label={`Delete ${task.title}`}>Delete</button>
    </span>}
  </div>
}, (previous, next) => {
  if (previous.task !== next.task || previous.project !== next.project
    || previous.position !== next.position || previous.total !== next.total
    || previous.tabIndex !== next.tabIndex || previous.mutable !== next.mutable || previous.pending !== next.pending) return false
  if (previous.now === next.now) return true
  return dueGroup(next.task, previous.now) === dueGroup(next.task, next.now)
    && dueLabel(next.task, previous.now) === dueLabel(next.task, next.now)
})
