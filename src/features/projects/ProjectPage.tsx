import { useParams } from 'react-router'
import { useStore } from '../../store'
import { TaskList } from '../../ui/TaskList'
import { Pill } from '../../ui/Controls'
import { DataState } from '../../ui/DataState'
import { projectProgress, selectDataView } from '../../store/selectors'
import type { Task } from '../../lib/types'
import styles from './Project.module.css'

const noTasks: readonly Task[] = []

export function ProjectPage() {
  const { id = '' } = useParams()
  const view = useStore(selectDataView)
  const project = useStore((state) => state.projects.find((item) => item.id === id))
  const tasks = useStore((state) => state.projectTasks[id] ?? noTasks)
  const { percent } = projectProgress(tasks)
  return <section data-view="project" aria-label={project ? `${project.name} tasks` : 'Project tasks'}>
    {view === 'ready' && project && <div className={styles.heading}>
      <h2>{project.name}</h2><Pill>{tasks.length} tasks</Pill>
      <span className={styles.progress}>{percent}% complete</span></div>}
    <DataState notFound={!project} emptyProject={project && tasks.length === 0 ? project.name : undefined}>
      {project && <TaskList tasks={tasks} label={`${project.name} tasks`} listId={id} />}
    </DataState>
  </section>
}
