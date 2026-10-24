import { NavLink } from 'react-router'
import { memo } from 'react'
import { useStore, setDrawerOpen } from '../store'
import { Icon } from '../ui/Icon'
import styles from './Shell.module.css'
import { UserMenu } from '../features/auth/UserMenu'
import { ProjectNavigationItem } from './ProjectNavigationItem'

export const Navigation = memo(function Navigation() {
  const projects = useStore((state) => state.projects)
  return <>
    <NavLink to="/" className={styles.brand} onClick={() => setDrawerOpen(false)} aria-label="Taskly dashboard">
      <span className={styles.brandMark}><Icon name="check" /></span>Taskly
    </NavLink>
    <nav aria-label="Main navigation" className={styles.navigation}>
      <NavLink end to="/" onClick={() => setDrawerOpen(false)}><Icon name="dashboard" />Dashboard</NavLink>
      <NavLink to="/tasks" onClick={() => setDrawerOpen(false)}><Icon name="tasks" />My Tasks</NavLink>
      <p className={styles.navLabel}>Projects</p>
      {projects.map((project) => <ProjectNavigationItem project={project} key={project.id} />)}
      <button type="button" className={styles.newProject} aria-disabled="true"><Icon name="plus" />New project</button>
    </nav>
    <UserMenu />
  </>
})
