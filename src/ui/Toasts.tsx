import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { dismissToast, recoverDraft } from '../store/write-actions'
import { IconButton } from './Controls'
import styles from './Overlays.module.css'

export function Toasts() {
  const toast = useStore((state) => state.toasts[0])
  const remaining = useRef(5000)
  const started = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pause = () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = undefined; remaining.current -= performance.now() - started.current }
  }
  const resume = () => {
    if (!toast || toast.error || timer.current) return
    started.current = performance.now()
    timer.current = setTimeout(() => dismissToast(toast.id), remaining.current)
  }
  useEffect(() => {
    remaining.current = 5000
    if (!toast || toast.error) return
    started.current = performance.now()
    timer.current = setTimeout(() => dismissToast(toast.id), 5000)
    return () => { clearTimeout(timer.current); timer.current = undefined }
  }, [toast])
  if (!toast) return null
  return <div className={styles.toast} data-error={toast.error} role={toast.error ? 'alert' : 'status'}
    onMouseEnter={pause} onMouseLeave={(event) => { if (!event.currentTarget.contains(document.activeElement)) resume() }}
    onFocus={pause} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) resume()
    }}>
    <span>{toast.text}</span>{(toast.recovery || toast.projectRecovery) && <button onClick={() => recoverDraft(toast)}>Recover draft</button>}
    <IconButton icon="close" label="Dismiss notification" onClick={() => dismissToast(toast.id)} />
  </div>
}
