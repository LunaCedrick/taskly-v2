import { useParams } from 'react-router'
import { useStore } from '../../store'
import { TaskList } from '../../ui/TaskList'
import { Pill } from '../../ui/Controls'
import styles from './Project.module.css'

export function ProjectPage() {
  const { id = '' } = useParams()
  const project = useStore((state) => state.projects.find((item) => item.id === id))
  const tasks = useStore((state) => state.projectTasks[id])
  if (!project || !tasks) return <section data-view="project" aria-label="Project preview"><h2>Project preview</h2></section>
  const completed = tasks.filter((task) => task.status === 'done').length
  const percent = Math.round(completed / tasks.length * 100)
  return <section data-view="project" aria-label={`${project.name} tasks`}>
    <div className={styles.heading}><h2>{project.name}</h2><Pill>{tasks.length} tasks</Pill>
      <span className={styles.progress}>{percent}% complete</span></div>
    <TaskList tasks={tasks} label={`${project.name} tasks`} listId={id} />
  </section>
}
