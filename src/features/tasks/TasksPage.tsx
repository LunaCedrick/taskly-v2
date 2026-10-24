import { useStore } from '../../store'
import { TaskList } from '../../ui/TaskList'
import { Pill } from '../../ui/Controls'
import { DataState } from '../../ui/DataState'
import styles from './Tasks.module.css'

export function TasksPage() {
  const tasks = useStore((state) => state.tasks)
  return <section data-view="tasks" aria-label="My Tasks">
    <DataState>
    <div className={styles.heading}><h2>All tasks</h2><Pill>{tasks.length}</Pill></div>
    <TaskList tasks={tasks} label="All tasks" listId="all" />
    </DataState>
  </section>
}
