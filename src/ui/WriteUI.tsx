import { memo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useStore } from '../store'
import { WriteOverlay } from './WriteOverlay'
import { Toasts } from './Toasts'

export const WriteUI = memo(function WriteUI() {
  const deleted = useStore((state) => state.deletedProjectId)
  const focusAfterDelete = useStore((state) => state.focusAfterDelete)
  const rowRemoved = useStore((state) => Boolean(state.focusAfterDelete
    && !state.tasks.some((task) => task.id === state.focusAfterDelete?.taskId)))
  useEffect(() => {
    if (!focusAfterDelete || !rowRemoved) return
    const frame = requestAnimationFrame(() => {
      const state = useStore.getState()
      if (state.focusAfterDelete !== focusAfterDelete) return
      if (!state.overlay) {
        const target = document.querySelector<HTMLElement>(focusAfterDelete.selector)
          ?? document.querySelector<HTMLElement>('[data-add-task]')
        target?.focus()
      }
      useStore.setState({ focusAfterDelete: null })
    })
    return () => cancelAnimationFrame(frame)
  }, [focusAfterDelete, rowRemoved])
  return <><WriteOverlay /><Toasts />{deleted && <DeletedProjectNavigation deleted={deleted} />}</>
})

function DeletedProjectNavigation({ deleted }: { deleted: string }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
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
  return null
}
