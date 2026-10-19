import { Navigate, Outlet, useLocation } from 'react-router'
import { useStore } from '../../store'
import { authReturnDestination } from '../../lib/auth-redirect'
import { SessionCheck } from './SessionCheck'

export function SignedOutOnly() {
  const status = useStore((state) => state.sessionStatus)
  const { search } = useLocation()
  if (status === 'checking') return <SessionCheck />
  if (status === 'signed-in') {
    return <Navigate replace to={authReturnDestination(new URLSearchParams(search).get('returnTo'))} />
  }
  return <Outlet />
}
