import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useStore } from '../store'
import { WriteOverlay } from './WriteOverlay'
import { Toasts } from './Toasts'

export function WriteUI() {
  const deleted = useStore((state) => state.deletedProjectId)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    if (!deleted) return
    useStore.setState({ deletedProjectId: null })
    if (pathname === `/projects/${deleted}`) {
      navigate('/')
      requestAnimationFrame(() => {
        const heading = [...document.querySelectorAll<HTMLElement>('#main h1, header h1')]
          .find((element) => element.getClientRects().length > 0)
        if (heading) { heading.tabIndex = -1; heading.focus() }
      })
    }
  }, [deleted, navigate, pathname])
  return <><WriteOverlay /><Toasts /></>
}
