import { useStore } from './index'
import { emptyDraft, type Draft, type Overlay, type Toast } from './write-slice'
import { dateInput, parseDue, timeInput } from '../lib/task-dates'
import { defaultProject, taskPlan, projectPlan, deleteTaskPlan, cascadePlan, type TaskValues } from '../lib/write-plans'
import { holdPendingWrites, pendingProjectsFor, pendingTasksFor, submitMutation } from '../lib/mutations'
import type { WriteOperation } from '../lib/mutations/types'
import type { DataSlice } from './data-slice'
import type { Task } from '../lib/types'

const id = () => crypto.randomUUID()
export function writesReady(state: DataSlice) {
  return state.dataReady && !state.streams.projects.error && !state.streams.tasks.error
}
export const disabledExplanation = (state: DataSlice) => writesReady(state) ? ''
  : state.streams.projects.error || state.streams.tasks.error ? 'Tasks could not load. Try again before adding a task.'
    : 'Waiting for your projects and tasks to load.'

export function addToast(text: string, error = false, recovery?: Draft, projectRecovery?: Toast['projectRecovery']) {
  useStore.setState((state) => ({ toasts: [...state.toasts, { id: id(), text, error, recovery, projectRecovery }].slice(0, 4) }))
}
export const dismissToast = (toastId: string) => useStore.setState((state) => ({
  toasts: state.toasts.filter((toast) => toast.id !== toastId),
}))
export function recoverDraft(toast: Toast) {
  const state = useStore.getState()
  if ((!toast.recovery && !toast.projectRecovery) || !writesReady(state)) return
  if (state.overlay && state.draft.title) {
    addToast('Close the current draft before recovering this task.', true)
    return
  }
  if (toast.projectRecovery) useStore.setState({ overlay: 'project', fieldError: '',
    projectName: toast.projectRecovery.name, editProjectId: toast.projectRecovery.projectId ?? null,
    projectRetry: toast.projectRecovery.operations })
  else if (toast.recovery) useStore.setState({ draft: { ...toast.recovery }, overlay: 'task',
    editTaskId: toast.recovery.originalTaskId ?? null, fieldError: '' })
  dismissToast(toast.id)
}
export const updateDraft = (patch: Partial<Draft>) => useStore.setState((state) => ({
  draft: { ...state.draft, retry: undefined, ...patch }, fieldError: '',
}))

export function openOverlay(overlay: NonNullable<Overlay>, currentProject?: string, entityId?: string) {
  const state = useStore.getState()
  if (!writesReady(state)) return
  const task = state.tasks.find((item) => item.id === entityId)
  const project = state.projects.find((item) => item.id === entityId)
  const selected = defaultProject(state.projects, currentProject, state.lastProjectId)
  const taskOverlay = overlay === 'quick' || overlay === 'task'
  const draft: Draft = task ? { ...task, date: dateInput(task), time: timeInput(task) } : emptyDraft(selected?.id)
  const rows = task ? state.projectTasks[task.projectId] ?? [] : []
  const next = rows.slice(rows.findIndex((item) => item.id === entityId) + 1).find((item) => item.id !== entityId)
  useStore.setState({ overlay: taskOverlay && !selected ? 'project' : overlay, draft,
    editTaskId: task?.id ?? null, editProjectId: project?.id ?? null,
    projectName: project?.name ?? '', projectRetry: undefined, fieldError: '', drawerOpen: false,
    resumeOverlay: taskOverlay && !selected ? overlay : null,
    returnFocus: document.activeElement instanceof HTMLElement ? document.activeElement : null,
    fallbackFocus: next ? `[data-task-id="${next.id}"] button` : '[data-add-task]' })
}

export function closeOverlay() {
  const { returnFocus, fallbackFocus, overlay } = useStore.getState()
  useStore.setState({ overlay: null, fieldError: '', resumeOverlay: null })
  requestAnimationFrame(() => {
    if (useStore.getState().overlay) return
    const target = overlay !== 'delete-task' && returnFocus?.isConnected ? returnFocus
      : document.querySelector<HTMLElement>(fallbackFocus || '#main h1')
    target?.focus()
  })
}

export function relevantPending(taskIds: readonly string[], projectId?: string) {
  const state = useStore.getState()
  return pendingTasksFor(state.dataUid).some((taskId) => taskIds.includes(taskId))
    || Boolean(projectId && pendingProjectsFor(state.dataUid).includes(projectId))
    || state.jobs.some((job) => job.projectId === projectId && projectId !== undefined
    || job.taskIds.some((taskId) => taskIds.includes(taskId)))
}

async function perform(operations: readonly WriteOperation[], options: {
  toast?: string; draft?: Draft; projectId?: string; projectDraft?: Toast['projectRecovery']; local?: () => void
} = {}) {
  if (!operations.length) { options.local?.(); return true }
  const state = useStore.getState()
  const taskIds = operations.filter((op) => op.stream === 'tasks').map((op) => op.id)
  if (relevantPending(taskIds, options.projectId)) return false
  const job = { id: id(), taskIds, projectId: options.projectId }
  try {
    useStore.setState({ jobs: [...state.jobs, job] })
    const promise = submitMutation(operations, state.rawTasks.filter((task) => taskIds.includes(task.id)).map((task) => task.projectId))
    options.local?.()
    if (options.toast) addToast(options.toast)
    const result = await promise
    if (!result.currentSession) return false
    if (result.outcome === 'rejected') {
      addToast('Could not save your change', true, options.draft ? { ...options.draft, retry: operations } : undefined, options.projectDraft)
      return false
    }
    return true
  } catch {
    if (useStore.getState().dataUid === state.dataUid) addToast('Could not save your change', true, options.draft)
    return false
  } finally {
    if (useStore.getState().dataUid === state.dataUid)
      useStore.setState((now) => ({ jobs: now.jobs.filter((item) => item.id !== job.id) }))
  }
}

function taskValues(draft: Draft): TaskValues {
  return { title: draft.title, description: draft.description, category: draft.category,
    projectId: draft.projectId, priority: draft.priority, status: draft.status, ...parseDue(draft.date, draft.time) }
}
export function saveTask(quick = false) {
  const state = useStore.getState()
  if (!writesReady(state)) return
  const submitted = { ...state.draft, originalTaskId: state.editTaskId ?? undefined }
  try {
    const previous = state.tasks.find((task) => task.id === state.editTaskId)
    if (state.editTaskId && !previous) throw new Error('Could not save your change')
    const operations = submitted.retry ?? taskPlan(taskValues(submitted), state.projects, id, previous)
    void perform(operations, { draft: submitted,
      toast: previous ? undefined : `Task added to ${state.projects.find((p) => p.id === submitted.projectId)?.name}`,
      local: () => {
        useStore.setState({ lastProjectId: submitted.projectId, ...(!previous && operations.length
          ? { revealTaskId: operations[0].id } : {}) })
        if (quick) updateDraft({ title: '' })
        else closeOverlay()
      } })
  } catch (error) { useStore.setState({ fieldError: (error as Error).message }) }
}

export function saveProject() {
  const state = useStore.getState()
  if (!writesReady(state)) return
  try {
    const previous = state.projects.find((p) => p.id === state.editProjectId)
    const operations = state.projectRetry ?? projectPlan(state.projectName, state.projects, id, previous)
    void perform(operations, { projectId: previous?.id,
      projectDraft: { name: state.projectName, projectId: previous?.id, operations }, local: () => {
      if (state.resumeOverlay) {
        const projectId = operations[0].id
        useStore.setState({ overlay: state.resumeOverlay, resumeOverlay: null, projectName: '',
          draft: { ...state.draft, projectId }, lastProjectId: projectId })
      } else closeOverlay()
    } })
  } catch (error) { useStore.setState({ fieldError: (error as Error).message }) }
}

export function toggleTask(task: Task) {
  const state = useStore.getState()
  if (!writesReady(state)) return
  const { id: _id, createdAt: _created, updatedAt: _updated, completedAt: _completed, ...values } = task
  void [_id, _created, _updated, _completed]
  void perform(taskPlan({ ...values, status: task.status === 'done' ? 'todo' : 'done' }, state.projects, id, task))
}

export function deleteTask() {
  const state = useStore.getState()
  const task = state.tasks.find((t) => t.id === state.editTaskId)
  if (!task || !writesReady(state) || relevantPending([task.id])) return
  void perform(deleteTaskPlan(task, id), { toast: 'Task deleted', local: closeOverlay })
}

export async function deleteProject() {
  const state = useStore.getState()
  const project = state.projects.find((p) => p.id === state.editProjectId)
  if (!project || !writesReady(state)) return
  const tasks = state.rawTasks.filter((task) => task.projectId === project.id)
  if (relevantPending(tasks.map((t) => t.id), project.id)) return
  const summary = state.cascadeIds[project.id] ?? id()
  const job = { id: id(), taskIds: tasks.map((t) => t.id), projectId: project.id }
  useStore.setState({ cascadeIds: { ...state.cascadeIds, [project.id]: summary }, jobs: [...state.jobs, job], fieldError: '' })
  const release = holdPendingWrites()
  try {
    for (const batch of cascadePlan(project, tasks, summary)) {
      if (useStore.getState().dataUid !== state.dataUid) return
      const result = await submitMutation(batch)
      if (!result.currentSession) return
      if (result.outcome === 'rejected') throw new Error('cascade-failed')
    }
    useStore.setState({ deletedProjectId: project.id })
    addToast('Project deleted')
    if (useStore.getState().overlay === 'delete-project' && useStore.getState().editProjectId === project.id) closeOverlay()
  } catch {
    if (useStore.getState().dataUid !== state.dataUid) return
    const text = 'Could not finish deleting this project. Some tasks may already be deleted. Try again.'
    if (useStore.getState().overlay === 'delete-project' && useStore.getState().editProjectId === project.id)
      useStore.setState({ fieldError: text })
    else addToast(text, true)
  } finally {
    release()
    if (useStore.getState().dataUid === state.dataUid)
      useStore.setState((now) => ({ jobs: now.jobs.filter((item) => item.id !== job.id) }))
  }
}
