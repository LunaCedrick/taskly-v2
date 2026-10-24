import { useParams } from 'react-router'
import { useStore } from '../../store'
import { TaskList } from '../../ui/TaskList'
import { Pill } from '../../ui/Controls'
import { DataState } from '../../ui/DataState'
import { projectProgress, selectDataView } from '../../store/selectors'
import type { Task } from '../../lib/types'
import styles from './Project.module.css'
import { Button } from '../../ui/Controls'
import { openOverlay, writesReady } from '../../store/write-actions'

const noTasks: readonly Task[] = []

export function ProjectPage() {
  const { id = '' } = useParams()
  const view = useStore(selectDataView)
  const project = useStore((state) => state.projects.find((item) => item.id === id))
  const tasks = useStore((state) => state.projectTasks[id] ?? noTasks)
  const { percent } = projectProgress(tasks)
  const ready = useStore(writesReady)
  return <section data-view="project" aria-label={project ? `${project.name} tasks` : 'Project tasks'}>
    {view === 'ready' && project && <div className={styles.heading}>
      <h2>{project.name}</h2><Pill>{tasks.length} tasks</Pill>
      <span className={styles.progress}><progress max={100} value={percent} aria-label="Project completion" />{percent}% complete</span>
      <Button secondary disabled={!ready} onClick={() => openOverlay('project', id, id)}>Rename project</Button>
      <Button secondary disabled={!ready} onClick={() => openOverlay('delete-project', id, id)}>Delete project</Button></div>}
    <DataState projectId={id} notFound={!project} emptyProject={project && tasks.length === 0 ? project.name : undefined}>
      {project && <TaskList tasks={tasks} label={`${project.name} tasks`} listId={id} />}
    </DataState>
    {view === 'ready' && project && tasks.length > 0 && <Button data-add-task secondary disabled={!ready}
      onClick={() => openOverlay('task', id)}>Add a task to {project.name}</Button>}
  </section>
}
