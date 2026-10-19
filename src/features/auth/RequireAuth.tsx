import { Navigate, Outlet, useLocation } from 'react-router'
import { useStore } from '../../store'
import { authReturnDestination } from '../../lib/auth-redirect'
import { SessionCheck } from './SessionCheck'

export function RequireAuth() {
  const status = useStore((state) => state.sessionStatus)
  const location = useLocation()
  if (status === 'checking') return <SessionCheck />
  if (status === 'signed-out') {
    const returnTo = authReturnDestination(location.pathname + location.search + location.hash)
    return <Navigate replace to={`/sign-in?${new URLSearchParams({ returnTo })}`} />
  }
  return <Outlet />
}
