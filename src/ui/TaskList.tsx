import { useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent, type FocusEvent } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { Task } from '../lib/types'
import { useStore, setFocusedRow } from '../store'
import { TaskRow } from './TaskRow'
import styles from './TaskList.module.css'
import { openOverlay, toggleTask, writesReady } from '../store/write-actions'

function rowClick(event: React.MouseEvent<HTMLDivElement>) {
  const action = (event.target as HTMLElement).closest<HTMLElement>('[data-row-action]')
  const taskId = action?.closest<HTMLElement>('[data-task-id]')?.dataset.taskId
  if (!action || !taskId) return
  const task = useStore.getState().tasks.find((item) => item.id === taskId)
  if (!task) return
  if (action.dataset.rowAction === 'complete') toggleTask(task)
  else openOverlay(action.dataset.rowAction === 'delete' ? 'delete-task' : 'task', task.projectId, task.id)
}

type ListProps = { tasks: readonly Task[]; label: string; listId: string }

function subscribeLayout(onChange: () => void) {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

const phoneLayout = () => getComputedStyle(document.documentElement).getPropertyValue('--desktop-display').trim() === 'none'

function ResponsiveProjectList(props: ListProps) {
  const phone = useSyncExternalStore(subscribeLayout, phoneLayout)
  // Rebuild the virtualizer, its measured elements and observers as one layout-specific instance.
  return <VirtualTaskList key={phone ? 'phone' : 'desktop'} {...props} />
}

export function TaskList({ tasks, label, listId }: ListProps) {
  const enabled = useStore((state) => state.virtualize) && tasks.length > 200
  const project = useStore((state) => state.projects.some((item) => item.id === listId))
  if (enabled && project) return <ResponsiveProjectList tasks={tasks} label={label} listId={listId} />
  return enabled ? <VirtualTaskList tasks={tasks} label={label} listId={listId} />
    : <PlainTaskList tasks={tasks} label={label} listId={listId} />
}

function useRows(listId: string, tasks: readonly Task[]) {
  const projects = useStore((state) => state.projects)
  const now = useStore((state) => state.now)
  const focused = useStore((state) => state.focusedRows[listId] ?? 0)
  const mutable = useStore((state) => state.projects.some((p) => p.id === listId) && writesReady(state))
  const jobs = useStore((state) => state.jobs)
  const reveal = useStore((state) => state.revealTaskId)
  const revealIndex = reveal ? tasks.findIndex((task) => task.id === reveal) : -1
  const active = Math.min(focused, Math.max(0, tasks.length - 1))
  const row = (index: number) => {
    const task = tasks[index]
    const project = projects.find((item) => item.id === task.projectId)
    return project ? <TaskRow key={task.id} task={task} project={project}
      now={now} position={index + 1} total={tasks.length} tabIndex={index === active ? 0 : -1}
      mutable={mutable} pending={jobs.some((job) => job.taskIds.includes(task.id))} />
      : null
  }
  const onFocus = (event: FocusEvent<HTMLDivElement>) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('[data-task-id]')
    const index = item ? tasks.findIndex((task) => task.id === item.dataset.taskId) : -1
    if (index >= 0 && index !== active) setFocusedRow(listId, index)
  }
  return { active, row, onFocus, revealIndex, mutable }
}

function keyboardIndex(event: KeyboardEvent, active: number, count: number) {
  if (count === 0) return
  const indexes: Record<string, number> = {
    ArrowDown: Math.min(count - 1, active + 1), ArrowUp: Math.max(0, active - 1),
    Home: 0, End: count - 1,
  }
  const next = indexes[event.key]
  if (next !== undefined) event.preventDefault()
  return next
}

function VirtualTaskList({ tasks, label, listId }: ListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { active, row, onFocus, revealIndex, mutable } = useRows(listId, tasks)
  const tokens = getComputedStyle(document.documentElement)
  const rowHeight = parseFloat(tokens.getPropertyValue('--row-height'))
  const phone = tokens.getPropertyValue('--desktop-display').trim() === 'none'
  const dynamic = phone && mutable
  const initialHeight = phone
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
    rangeExtractor: (range) => [...new Set([...defaultRangeExtractor(range), active,
      ...(revealIndex >= 0 ? [revealIndex] : [])])].sort((a, b) => a - b),
  })
  useLayoutEffect(() => {
    if (revealIndex >= 0) virtualizer.scrollToIndex(revealIndex, { align: 'auto' })
  }, [revealIndex, virtualizer])
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = keyboardIndex(event, active, tasks.length)
    if (next === undefined) return
    setFocusedRow(listId, next)
    virtualizer.scrollToIndex(next, { align: 'auto' })
    requestAnimationFrame(() => scrollRef.current?.querySelector<HTMLElement>(`[data-task-id="${tasks[next].id}"]`)?.focus())
  }
  return <div ref={scrollRef} className={styles.scroll} onKeyDown={onKeyDown} onFocus={onFocus}
    onClick={rowClick}
    role="list" aria-label={label} data-virtualized="true">
    {/* Virtual offsets are measured geometry, not design values. */}
    <div className={styles.virtualCanvas} role="presentation" style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => <div key={item.key} role="presentation"
        data-index={item.index} ref={dynamic ? virtualizer.measureElement : undefined}
        className={styles.virtualRow} style={{ transform: `translateY(${item.start}px)` }}>{row(item.index)}</div>)}
    </div>
  </div>
}

function PlainTaskList({ tasks, label, listId }: ListProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { active, row, onFocus, revealIndex } = useRows(listId, tasks)
  useLayoutEffect(() => {
    if (revealIndex >= 0) ref.current?.querySelector<HTMLElement>(`[data-task-id="${tasks[revealIndex].id}"]`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [revealIndex, tasks])
  return <div ref={ref} className={styles.scroll} role="list" aria-label={label} onFocus={onFocus} data-virtualized="false"
    onClick={rowClick}
    onKeyDown={(event) => {
      const next = keyboardIndex(event, active, tasks.length)
      if (next === undefined) return
      setFocusedRow(listId, next)
      ref.current?.querySelector<HTMLElement>(`[data-task-id="${tasks[next].id}"]`)?.focus()
    }}>{tasks.map((_, index) => row(index))}</div>
}
