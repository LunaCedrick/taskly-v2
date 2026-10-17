import { create } from 'zustand'
import { makeFakeData } from '../lib/fake-data'
import { dashboardGroups, taskStats, tasksByProject } from '../lib/task-selectors'

const fixture = makeFakeData()
const projectTasks = Object.fromEntries(fixture.projects.map((project) => [
  project.id, tasksByProject(fixture.tasks, project.id),
]))

export const useStore = create(() => ({
  ...fixture,
  projectTasks,
  groups: dashboardGroups(fixture.tasks, fixture.now),
  stats: taskStats(fixture.tasks),
  drawerOpen: false,
  bannerDismissed: false,
  virtualize: true,
  focusedRows: {} as Record<string, number>,
}))

export const setDrawerOpen = (drawerOpen: boolean) => useStore.setState({ drawerOpen })
export const dismissBanner = () => useStore.setState({ bannerDismissed: true })

// Kept out of the product UI; the benchmark switches this through Playwright only.
export const setVirtualize = (virtualize: boolean) => useStore.setState({ virtualize })
export const setFocusedRow = (listId: string, index: number) => useStore.setState((state) => ({
  focusedRows: { ...state.focusedRows, [listId]: index },
}))
