import { useStore } from '../../store'
import { updateDraft } from '../../store/write-actions'
import { quickDate } from '../../lib/task-dates'
import { statusLabel } from '../../lib/write-plans'
import type { Priority, TaskStatus } from '../../lib/types'
import styles from '../../ui/Overlays.module.css'

export function TaskFields({ quick = false }: { quick?: boolean }) {
  const draft = useStore((state) => state.draft)
  const projects = useStore((state) => state.projects)
  const categories = useStore((state) => state.rawTasks)
  const error = useStore((state) => state.fieldError)
  return <>
    <label className={styles.field}><span>Title <span aria-hidden="true">*</span></span>
      <textarea rows={quick ? 1 : 2} name="title" autoFocus value={draft.title} aria-required="true"
        aria-invalid={Boolean(error)} aria-describedby={error ? 'write-error' : undefined}
        onChange={(event) => updateDraft({ title: event.target.value })} />
    </label>
    {!quick && <label className={styles.field}>Description
      <textarea rows={3} value={draft.description} onChange={(event) => updateDraft({ description: event.target.value })} />
    </label>}
    <fieldset className={styles.dates}><legend>Due date</legend>
      <div className={styles.chips}>{(['Today', 'Tomorrow', 'Next week', 'No date'] as const).map((chip) =>
        <button type="button" key={chip} onClick={() => updateDraft({ date: quickDate(chip),
          ...(chip === 'No date' ? { time: '' } : {}) })}>{chip}</button>)}</div>
      <div className={styles.columns}>
        <label className={styles.field}>Date<input type="date" value={draft.date}
          onChange={(event) => updateDraft({ date: event.target.value, ...(!event.target.value ? { time: '' } : {}) })} /></label>
        <label className={styles.field}>Time (optional)<input type="time" value={draft.time}
          disabled={!draft.date} onChange={(event) => updateDraft({ time: event.target.value })} /></label>
      </div>
    </fieldset>
    <div className={styles.columns}>
      <label className={styles.field}>Project<select value={draft.projectId}
        onChange={(event) => updateDraft({ projectId: event.target.value })}>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select></label>
      <label className={styles.field}>Priority<select value={draft.priority}
        onChange={(event) => updateDraft({ priority: event.target.value as Priority })}>
        <option value="none">None</option><option value="low">Low</option>
        <option value="medium">Medium</option><option value="high">High</option>
      </select></label>
    </div>
    {!quick && <div className={styles.columns}>
      <label className={styles.field}>Category<input value={draft.category} list="task-categories"
        onChange={(event) => updateDraft({ category: event.target.value })} />
        <datalist id="task-categories">{[...new Set(categories.map((task) => task.category).filter(Boolean))]
          .map((category) => <option key={category} value={category} />)}</datalist>
      </label>
      <label className={styles.field}>Status<select value={draft.status}
        onChange={(event) => updateDraft({ status: event.target.value as TaskStatus })}>
        {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
    </div>}
  </>
}
