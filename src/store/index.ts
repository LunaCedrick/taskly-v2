import { create } from 'zustand'
import { initialAuthState } from './auth-slice'
import { initialDataState, publishData, type DataPublication } from './data-slice'
import type { AuthProfile } from '../lib/firebase/auth'
import { initialWriteState } from './write-slice'

export const useStore = create(() => ({
  ...initialAuthState,
  ...initialDataState(),
  ...initialWriteState(),
  drawerOpen: false,
  bannerDismissed: false,
  virtualize: true,
  focusedRows: {} as Record<string, number>,
}))

export const setDrawerOpen = (drawerOpen: boolean) => useStore.setState({ drawerOpen })
export const dismissBanner = () => useStore.setState({ bannerDismissed: true })

export const applySession = (authUser: AuthProfile | null) => useStore.setState((state) => ({
  authUser, sessionStatus: authUser ? 'signed-in' : 'signed-out', authError: null,
  ...(state.dataUid !== (authUser?.uid ?? null)
    ? { ...initialDataState(authUser?.uid ?? null), ...initialWriteState() } : {}),
  ...(!authUser ? { drawerOpen: false, focusedRows: {}, bannerDismissed: false } : {}),
}))

export function resetData(uid: string | null) {
  if (useStore.getState().dataUid !== uid) useStore.setState({ ...initialDataState(uid), ...initialWriteState() })
}

export function publishSessionData(uid: string, publication: DataPublication, now = Date.now()) {
  const current = useStore.getState()
  if (current.dataUid !== uid) return
  const next = publishData(current, publication, now)
  if (next !== current) useStore.setState(next)
}

// Kept out of the product UI; the benchmark switches this through Playwright only.
export const setVirtualize = (virtualize: boolean) => useStore.setState({ virtualize })
export const setFocusedRow = (listId: string, index: number) => useStore.setState((state) => ({
  focusedRows: { ...state.focusedRows, [listId]: index },
}))
