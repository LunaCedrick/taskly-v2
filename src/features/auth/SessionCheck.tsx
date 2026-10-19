import { Icon } from '../../ui/Icon'
import styles from './SessionCheck.module.css'

export function SessionCheck() {
  return <main className={styles.page}>
    <div className={styles.content} role="status" aria-live="polite">
      <span className={styles.mark}><Icon name="check" /></span>
      <h1>Taskly</h1>
      <div className={styles.track} aria-hidden="true"><span /></div>
      <p>Getting your tasks ready</p>
    </div>
  </main>
}
