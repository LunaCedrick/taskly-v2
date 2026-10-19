import { Route, Routes } from 'react-router'
import { Shell } from './Shell'
import { Dashboard } from '../features/dashboard/Dashboard'
import { TasksPage } from '../features/tasks/TasksPage'
import { ProjectPage } from '../features/projects/ProjectPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { SignedOutOnly } from '../features/auth/SignedOutOnly'
import { SignInPage } from '../features/auth/SignInPage'

export function AppRoutes() {
  return <Routes>
    <Route element={<SignedOutOnly />}><Route path="/sign-in" element={<SignInPage />} /></Route>
    <Route element={<RequireAuth />}><Route element={<Shell />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/projects/:id" element={<ProjectPage />} />
    </Route></Route>
  </Routes>
}
