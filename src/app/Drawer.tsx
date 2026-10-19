import { memo, useEffect, useRef } from 'react'
import { useStore, setDrawerOpen } from '../store'
import { IconButton } from '../ui/Controls'
import { Navigation } from './Navigation'
import styles from './Shell.module.css'

export const Drawer = memo(function Drawer() {
  const open = useStore((state) => state.drawerOpen)
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (!open) return
    const trigger = document.activeElement
    const dialog = ref.current
    dialog?.showModal()
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = oldOverflow
      if (trigger instanceof HTMLElement) trigger.focus()
    }
  }, [open])
  return <dialog ref={ref} className={styles.drawer} aria-label="Menu" onCancel={(event) => {
    event.preventDefault()
    setDrawerOpen(false)
  }} onClick={(event) => { if (event.target === event.currentTarget) setDrawerOpen(false) }}>
    <div className={styles.drawerInner} onKeyDown={(event) => {
      if (event.key !== 'Tab') return
      const controls = ref.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }}>
      <div className={styles.drawerClose}><IconButton icon="close" label="Close menu" onClick={() => setDrawerOpen(false)} /></div>
      <Navigation />
    </div>
  </dialog>
})
