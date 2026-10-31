import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useStore } from '../store'
import { closeOverlay, deleteProject, deleteTask, registerToastHost, relevantPending, saveProject, saveTask, writesReady } from '../store/write-actions'
import { TaskFields } from '../features/tasks/TaskFields'
import { Button, IconButton } from './Controls'
import styles from './Overlays.module.css'
import { observePendingWrites, pendingWriteCount } from '../lib/mutations'
import { Icon } from './Icon'

export function WriteOverlay() {
  useSyncExternalStore(observePendingWrites, pendingWriteCount)
  const overlay = useStore((state) => state.overlay)
  const error = useStore((state) => state.fieldError)
  const taskId = useStore((state) => state.editTaskId)
  const projectId = useStore((state) => state.editProjectId)
  const name = useStore((state) => state.projectName)
  const task = useStore((state) => state.tasks.find((t) => t.id === taskId))
  const project = useStore((state) => state.projects.find((p) => p.id === projectId))
  const tasks = useStore((state) => state.rawTasks)
  const jobs = useStore((state) => state.jobs)
  const ready = useStore(writesReady)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!overlay) return
    const dialog = ref.current
    dialog?.showModal()
    const unregisterToastHost = dialog && registerToastHost(dialog)
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialog?.querySelector<HTMLElement>('textarea, input, [data-cancel]')?.focus()
    return () => { unregisterToastHost?.(); dialog?.close(); document.body.style.overflow = old }
  }, [overlay])
  if (!overlay) return null
  const quick = overlay === 'quick'
  const form = quick || overlay === 'task'
  const deleting = overlay.startsWith('delete')
  const count = overlay === 'delete-project' ? tasks.filter((t) => t.projectId === projectId).length : 1
  const affected = overlay === 'delete-project' ? tasks.filter((t) => t.projectId === projectId).map((t) => t.id) : taskId ? [taskId] : []
  const pending = deleting && relevantPending(affected, overlay === 'delete-project' ? projectId ?? undefined : undefined)
  const editingPending = jobs.some((job) => taskId ? job.taskIds.includes(taskId) : projectId && job.projectId === projectId)
  const title = quick ? 'Quick add' : overlay === 'task' ? taskId ? 'Edit task' : 'Add task'
    : overlay === 'project' ? projectId ? 'Rename project' : 'New project'
      : overlay === 'delete-task' ? 'Delete this task?' : 'Delete project?'
  const save = () => {
    if (!ready || pending || editingPending) return
    if (form) saveTask(quick)
    else if (overlay === 'project') saveProject()
    else if (overlay === 'delete-task') deleteTask()
    else void deleteProject()
  }
  return <dialog ref={ref} className={quick ? styles.quick : styles.modal} aria-labelledby="overlay-title"
    onCancel={(event) => { event.preventDefault(); closeOverlay() }} onClick={(event) => {
      if (event.target === event.currentTarget) closeOverlay()
    }}>
    <form className={styles.inner} noValidate onSubmit={(event) => { event.preventDefault(); save() }} onKeyDown={(event) => {
      if (quick && event.target instanceof HTMLTextAreaElement && event.target.name === 'title'
        && event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); save() }
      if (event.key !== 'Tab') return
      const controls = ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea, select:not(:disabled)')
      if (!controls?.length) return
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}>
      <header className={styles.header}><h2 id="overlay-title">{title}</h2>
        <IconButton icon="close" label="Close dialog" onClick={closeOverlay} /></header>
      {deleting && <span className={styles.confirmationIcon} data-confirmation-icon aria-hidden="true"><Icon name="trash" /></span>}
      {form ? <TaskFields quick={quick} /> : overlay === 'project'
        ? <label className={styles.field}><span>Project name <span aria-hidden="true">*</span></span>
          <input value={name} aria-required="true" aria-invalid={Boolean(error)} aria-describedby={error ? 'write-error' : undefined}
            onChange={(event) => useStore.setState({ projectName: event.target.value, projectRetry: undefined, fieldError: '' })} /></label>
        : <p>“{overlay === 'delete-task' ? task?.title : project?.name}”{overlay === 'delete-project' ? ` and its ${count} ${count === 1 ? 'task' : 'tasks'}` : ''}
          {' '}will be permanently deleted. This cannot be undone.{overlay === 'delete-task' && ' 1 task affected.'}</p>}
      {pending && <p role="status">Waiting for pending task writes. The count will update before you can confirm.</p>}
      {error && <p id="write-error" role="alert" className={styles.error}>{error}</p>}
      <footer className={styles.footer}>
        {quick && <button type="button" onClick={() => useStore.setState({ overlay: 'task' })}>More options</button>}
        {overlay === 'task' && taskId && <button type="button" className={styles.danger}
          onClick={() => useStore.setState({ overlay: 'delete-task', fieldError: '' })}>Delete task</button>}
        <span className={styles.spacer} />
        {!quick && <Button secondary data-cancel onClick={closeOverlay}>Cancel</Button>}
        {quick && <small>Enter to add · Esc to close</small>}
        <Button disabled={!ready || Boolean(pending || editingPending)} className={deleting ? styles.destructive : undefined} type="submit">
          {quick ? 'Add task' : overlay === 'task' ? taskId ? 'Save changes' : 'Add task'
            : overlay === 'project' ? projectId ? 'Save changes' : 'Create project'
              : overlay === 'delete-task' ? 'Delete task' : 'Delete project'}
        </Button>
      </footer>
    </form>
  </dialog>
}
