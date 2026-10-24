import { Outlet, NavLink, useLocation, useParams } from 'react-router'
import { useStore, setDrawerOpen } from '../store'
import { Button, IconButton } from '../ui/Controls'
import { Icon } from '../ui/Icon'
import { Navigation } from './Navigation'
import { Drawer } from './Drawer'
import styles from './Shell.module.css'
import { WriteUI } from '../ui/WriteUI'
import { disabledExplanation, openOverlay, writesReady } from '../store/write-actions'

export function Shell() {
  const { pathname } = useLocation()
  const { id } = useParams()
  const project = useStore((state) => state.projects.find((item) => item.id === id))
  const now = useStore((state) => state.now)
  const ready = useStore(writesReady)
  const explanation = useStore(disabledExplanation)
  const title = pathname === '/' ? 'Dashboard' : pathname === '/tasks' ? 'My Tasks' : project?.name ?? 'Project'
  return <div className={styles.shell}>
    <a href="#main" className={styles.skip}>Skip to content</a>
    <aside className={styles.sidebar}><Navigation /></aside>
    <div className={styles.page}>
      <header className={styles.phoneBar}>
        <IconButton icon="menu" label="Open menu" aria-haspopup="dialog" onClick={() => setDrawerOpen(true)} />
        <h1>{title}</h1><IconButton icon="bell" label="Alerts unavailable in this preview" aria-disabled="true" />
      </header>
      <main id="main" className={styles.main} tabIndex={-1}>
        <header className={styles.topbar}>
          <div><p className={styles.date}>{new Date(now).toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })}</p><h1>{title}</h1></div>
          <div className={styles.tools}>
            <div className={styles.search} aria-disabled="true"><Icon name="search" />Search tasks</div>
            <IconButton icon="bell" label="Alerts unavailable in this preview" aria-disabled="true" />
            <Button disabled={!ready} aria-describedby={!ready ? 'quick-add-reason' : undefined}
              onClick={() => openOverlay('task', id)}><Icon name="plus" />Add task</Button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
    <button type="button" className={styles.fab} aria-label="Quick Add" disabled={!ready}
      aria-describedby={!ready ? 'quick-add-reason' : undefined} onClick={() => openOverlay('quick', id)}><Icon name="plus" /></button>
    {!ready && <span id="quick-add-reason" className="sr-only">{explanation}</span>}
    <nav className={styles.tabs} aria-label="Phone navigation">
      <NavLink end to="/"><Icon name="dashboard" />Dashboard</NavLink>
      <NavLink to="/tasks"><Icon name="tasks" />Tasks</NavLink>
      <button type="button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog"
        aria-current={pathname.startsWith('/projects/') ? 'page' : undefined}><Icon name="folder" />Projects</button>
    </nav>
    <Drawer />
    <WriteUI />
  </div>
}
