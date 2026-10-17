import { Route, Routes } from 'react-router'
import { Shell } from './Shell'
import { Dashboard } from '../features/dashboard/Dashboard'
import { TasksPage } from '../features/tasks/TasksPage'
import { ProjectPage } from '../features/projects/ProjectPage'

export function AppRoutes() {
  return <Routes><Route element={<Shell />}>
    <Route path="/" element={<Dashboard />} />
    <Route path="/tasks" element={<TasksPage />} />
    <Route path="/projects/:id" element={<ProjectPage />} />
  </Route></Routes>
}
