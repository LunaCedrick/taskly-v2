import { NavLink } from 'react-router'
import { useStore, setDrawerOpen } from '../store'
import { Icon } from '../ui/Icon'
import styles from './Shell.module.css'
import { UserMenu } from '../features/auth/UserMenu'

export function Navigation() {
  const projects = useStore((state) => state.projects)
  const projectTasks = useStore((state) => state.projectTasks)
  return <>
    <NavLink to="/" className={styles.brand} onClick={() => setDrawerOpen(false)} aria-label="Taskly dashboard">
      <span className={styles.brandMark}><Icon name="check" /></span>Taskly
    </NavLink>
    <nav aria-label="Main navigation" className={styles.navigation}>
      <NavLink end to="/" onClick={() => setDrawerOpen(false)}><Icon name="dashboard" />Dashboard</NavLink>
      <NavLink to="/tasks" onClick={() => setDrawerOpen(false)}><Icon name="tasks" />My Tasks</NavLink>
      <p className={styles.navLabel}>Projects</p>
      {projects.map((project) => {
        const tasks = projectTasks[project.id]
        const completed = tasks.filter((task) => task.status === 'done').length
        return <NavLink to={`/projects/${project.id}`} key={project.id} className={styles.projectLink}
          data-color={project.colorIndex} onClick={() => setDrawerOpen(false)}>
          <span className={styles.projectLine}><span className={styles.dot} />{project.name}
            <small>{completed}/{tasks.length}</small></span>
          <progress value={completed} max={tasks.length} aria-label={`${project.name} completion`} />
        </NavLink>
      })}
      <button type="button" className={styles.newProject} aria-disabled="true"><Icon name="plus" />New project</button>
    </nav>
    <UserMenu />
  </>
}
