import { useStore, dismissBanner } from '../../store'
import { IconButton, Pill, StatCard } from '../../ui/Controls'
import { TaskRow } from '../../ui/TaskRow'
import { DataState } from '../../ui/DataState'
import styles from './Dashboard.module.css'

const sections = ['overdue', 'today', 'upcoming'] as const
const PREVIEW_LIMIT = 2

export function Dashboard() {
  const groups = useStore((state) => state.groups)
  const stats = useStore((state) => state.stats)
  const projects = useStore((state) => state.projects)
  const now = useStore((state) => state.now)
  const dismissed = useStore((state) => state.bannerDismissed)
  return <section data-view="dashboard" aria-label="Dashboard overview">
    <DataState>
    {!dismissed && groups.overdue.length > 0 && <div className={styles.banner} role="status">
      <span><strong>{groups.overdue.length} tasks are overdue.</strong><span className={styles.bannerExtra}> Review them so nothing slips.</span></span>
      <a href="#overdue">Review</a><IconButton icon="close" label="Dismiss overdue notice" onClick={dismissBanner} />
    </div>}
    <div className={styles.stats}>
      <StatCard label="Total tasks" value={stats.total} note={`across ${projects.length} projects`} />
      <StatCard label="Completed" value={stats.completed} note={`of ${stats.total} tasks`} />
      <StatCard label="In progress" value={stats.inProgress} note={`of ${stats.total} tasks`} />
      <StatCard label="Overdue" value={groups.overdue.length} note="needs attention" overdue />
    </div>
    <div className={styles.columns}>
      <div>{sections.map((group) => <section key={group} id={group} className={styles.section} aria-labelledby={`${group}-title`}>
        <div className={styles.sectionTitle}><h2 id={`${group}-title`}>{group[0].toUpperCase() + group.slice(1)}</h2><Pill tone={group}>{groups[group].length}</Pill></div>
        <div role="list" aria-label={`${group} tasks`} className={styles.list}>
          {groups[group].slice(0, PREVIEW_LIMIT).map((task, index) => {
            const project = projects.find((item) => item.id === task.projectId)
            return project ? <TaskRow key={task.id} task={task} project={project}
              now={now} position={index + 1} total={groups[group].length} /> : null
          })}
        </div>
      </section>)}</div>
      <aside className={styles.activity} aria-labelledby="activity-title">
        <h2 id="activity-title">Recent activity</h2><p>Activity will appear here.</p>
      </aside>
    </div>
    </DataState>
  </section>
}
