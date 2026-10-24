import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useStore } from '../store'
import { selectDataView } from '../store/selectors'
import { retrySubscriptions } from '../lib/subscriptions'
import { Button, Skeleton } from './Controls'
import { Icon } from './Icon'
import styles from './DataState.module.css'
import { openOverlay, writesReady } from '../store/write-actions'

export function DataState({ children, emptyProject, notFound = false, projectId }: {
  children?: ReactNode
  emptyProject?: string
  notFound?: boolean
  projectId?: string
}) {
  const view = useStore(selectDataView)
  if (view === 'loading') return <div className={styles.loading} role="status"
    aria-label="Loading tasks" aria-busy="true" data-data-state="loading">
    <span className="sr-only">Loading tasks</span>
    {[0, 1, 2, 3].map((row) => <div className={styles.loadingRow} key={row} aria-hidden="true">
      <span className={styles.placeholder} />
      <div className={styles.lines}><Skeleton /><Skeleton /></div>
    </div>)}
  </div>
  if (view === 'error') return <div className={styles.panel} role="alert" data-data-state="error">
    <span className={styles.marker} data-error="true"><Icon name="warning" /></span>
    <h2>We could not load your tasks</h2>
    <p>Check your connection and try again.</p>
    <Button onClick={retrySubscriptions}>Try again</Button>
  </div>
  if (notFound) return <div className={styles.panel} data-data-state="not-found">
    <h2>Project not found</h2>
    <Link className={styles.link} to="/">Back to dashboard</Link>
  </div>
  if (view === 'first-run') return <div className={styles.panel} data-data-state="first-run">
    <span className={styles.marker}><Icon name="folder" /></span>
    <h2>Nothing here yet</h2>
    <p>Create a project to start organizing your tasks.</p>
    <Button disabled={!writesReady(useStore.getState())} onClick={() => openOverlay('project')}><Icon name="plus" />Create your first project</Button>
  </div>
  if (emptyProject !== undefined) return <div className={styles.panel} data-data-state="empty">
    <span className={styles.marker}><Icon name="tasks" /></span>
    <h2>No tasks in {emptyProject}</h2>
    <p>Add the first task to get this project moving.</p>
    <Button data-add-task onClick={() => openOverlay('task', projectId)}><Icon name="plus" />Add a task</Button>
  </div>
  return children
}
