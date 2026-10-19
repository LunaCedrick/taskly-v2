import { useStore } from '../../store'
import { Button } from '../../ui/Controls'
import { Icon } from '../../ui/Icon'
import { signInAction } from './auth-actions'
import styles from './SignInPage.module.css'

const values = [
  { icon: 'dashboard', title: 'Everything in one place', copy: 'Every project and task on one dashboard.' },
  { icon: 'bolt', title: 'Fast and live', copy: 'Changes show up on all your devices at once.' },
  { icon: 'leaf', title: 'Calm by design', copy: 'Clear priorities, without the clutter.' },
] as const

export function SignInPage() {
  const pending = useStore((state) => state.authPending)
  const error = useStore((state) => state.authError)
  return <main className={styles.page}>
    <div className={styles.brand}><span className={styles.mark}><Icon name="check" /></span>Taskly</div>
    <div className={styles.formRegion}>
      <div className={styles.form}>
        <h1>Welcome to Taskly</h1>
        <p className={styles.subtitle}>Sign in to see what needs your attention today.</p>
        {error && <div className={styles.error} role="alert"><Icon name="warning" /><p>{error}</p></div>}
        <div className={styles.action}>
          <Button secondary disabled={pending !== null} aria-busy={pending === 'sign-in'}
            onClick={() => { void signInAction() }}>
            <span className={styles.google} aria-hidden="true">G</span>Continue with Google
          </Button>
        </div>
        {pending === 'sign-in' && <p className={styles.pending} role="status">Opening Google…</p>}
        <p className={styles.privacy}><Icon name="lock" />Your tasks are private to your account.</p>
      </div>
    </div>
    <aside className={styles.values} aria-label="Why Taskly">
      {values.map((value) => <div className={styles.value} key={value.title}>
        <span className={styles.valueIcon}><Icon name={value.icon} /></span>
        <div><strong>{value.title}</strong><p>{value.copy}</p></div>
      </div>)}
    </aside>
  </main>
}
