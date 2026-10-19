import { useStore } from '../../store'
import { signOutAction } from './auth-actions'
import styles from './UserMenu.module.css'

export function UserMenu() {
  const user = useStore((state) => state.authUser)
  const pending = useStore((state) => state.authPending)
  if (!user) return null
  const name = user.displayName || 'Your account'
  return <div className={styles.profile}>
    <span className={styles.avatar} aria-hidden="true">
      {user.photoURL ? <img src={user.photoURL} alt="" referrerPolicy="no-referrer" /> : name.slice(0, 1)}
    </span>
    <div className={styles.details}><span className={styles.name}>{name}</span>
      <button type="button" disabled={pending !== null} aria-busy={pending === 'sign-out'}
        onClick={() => { void signOutAction() }}>Sign out</button>
    </div>
  </div>
}
