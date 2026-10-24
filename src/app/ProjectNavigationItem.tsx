import { memo } from 'react'
import { NavLink } from 'react-router'
import type { Project } from '../lib/types'
import { useStore, setDrawerOpen } from '../store'
import styles from './Shell.module.css'

export const ProjectNavigationItem = memo(function ProjectNavigationItem({ project }: { project: Project }) {
  const ready = useStore((state) => state.dataReady)
  const total = useStore((state) => state.dataReady ? state.projectTasks[project.id]?.length ?? 0 : 0)
  const completed = useStore((state) => state.dataReady ? state.projectTasks[project.id]
    ?.reduce((count, task) => count + Number(task.status === 'done'), 0) ?? 0 : 0)
  return <NavLink to={`/projects/${project.id}`} className={styles.projectLink}
    data-color={project.colorIndex} onClick={() => setDrawerOpen(false)}>
    <span className={styles.projectLine}><span className={styles.dot} />{project.name}
      {ready && <small>{completed}/{total}</small>}</span>
    {ready && <progress value={completed} max={total || 1} aria-label={`${project.name} completion`} />}
  </NavLink>
})
