import { useRef, type KeyboardEvent, type FocusEvent } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { Task } from '../lib/types'
import { useStore, setFocusedRow } from '../store'
import { TaskRow } from './TaskRow'
import styles from './TaskList.module.css'

export function TaskList({ tasks, label, listId }: { tasks: readonly Task[]; label: string; listId: string }) {
  const enabled = useStore((state) => state.virtualize) && tasks.length > 200
  return enabled ? <VirtualTaskList tasks={tasks} label={label} listId={listId} />
    : <PlainTaskList tasks={tasks} label={label} listId={listId} />
}

function useRows(listId: string, tasks: readonly Task[]) {
  const projects = useStore((state) => state.projects)
  const now = useStore((state) => state.now)
  const active = useStore((state) => state.focusedRows[listId] ?? 0)
  const row = (index: number) => {
    const task = tasks[index]
    return <TaskRow key={task.id} task={task} project={projects.find((project) => project.id === task.projectId)!}
      now={now} position={index + 1} total={tasks.length} tabIndex={index === active ? 0 : -1} />
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-task-id]')
    const index = item ? tasks.findIndex((task) => task.id === item.dataset.taskId) : -1
    if (index >= 0 && index !== active) setFocusedRow(listId, index)
  }
  return { active, row, onFocus }
}

function keyboardIndex(event: KeyboardEvent, active: number, count: number) {
  const indexes: Record<string, number> = {
    ArrowDown: Math.min(count - 1, active + 1), ArrowUp: Math.max(0, active - 1),
    Home: 0, End: count - 1,
  }
  const next = indexes[event.key]
  if (next !== undefined) event.preventDefault()
  return next
}

function VirtualTaskList({ tasks, label, listId }: { tasks: readonly Task[]; label: string; listId: string }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { active, row, onFocus } = useRows(listId, tasks)
  const tokens = getComputedStyle(document.documentElement)
  const rowHeight = parseFloat(tokens.getPropertyValue('--row-height'))
  const initialHeight = tokens.getPropertyValue('--desktop-display').trim() === 'none'
    ? window.innerHeight - parseFloat(tokens.getPropertyValue('--list-phone-offset'))
    : parseFloat(tokens.getPropertyValue('--list-height'))
  // No React Compiler is enabled; this component deliberately uses the virtualizer imperatively.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    // Render the first range immediately, rather than waiting for ResizeObserver to populate an empty list.
    initialRect: { height: initialHeight, width: window.innerWidth },
    overscan: 3,
    getItemKey: (index) => tasks[index].id,
    // Keep the focused row mounted when pointer scrolling moves it out of view.
    rangeExtractor: (range) => [...new Set([...defaultRangeExtractor(range), active])].sort((a, b) => a - b),
  })
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = keyboardIndex(event, active, tasks.length)
    if (next === undefined) return
    setFocusedRow(listId, next)
    virtualizer.scrollToIndex(next, { align: 'auto' })
    requestAnimationFrame(() => scrollRef.current?.querySelector<HTMLElement>(`[data-task-id="${tasks[next].id}"]`)?.focus())
  }
  return <div ref={scrollRef} className={styles.scroll} onKeyDown={onKeyDown} onFocus={onFocus}
    role="list" aria-label={label} data-virtualized="true">
    {/* Virtual offsets are measured geometry, not design values. */}
    <div className={styles.virtualCanvas} role="presentation" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => <div key={item.key} role="presentation"
        className={styles.virtualRow} style={{ transform: `translateY(${item.start}px)` }}>{row(item.index)}</div>)}
    </div>
  </div>
}

function PlainTaskList({ tasks, label, listId }: { tasks: readonly Task[]; label: string; listId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { active, row, onFocus } = useRows(listId, tasks)
  return <div ref={ref} className={styles.scroll} role="list" aria-label={label} onFocus={onFocus} data-virtualized="false"
    onKeyDown={(event) => {
      const next = keyboardIndex(event, active, tasks.length)
      if (next === undefined) return
      setFocusedRow(listId, next)
      ref.current?.querySelector<HTMLElement>(`[data-task-id="${tasks[next].id}"]`)?.focus()
    }}>{tasks.map((_, index) => row(index))}</div>
}
