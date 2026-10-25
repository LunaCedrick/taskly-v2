import type { TaskValues } from '../lib/write-plans'
import type { WriteOperation } from '../lib/mutations/types'

export type Overlay = 'quick' | 'task' | 'project' | 'delete-task' | 'delete-project' | null
export interface Draft extends TaskValues {
  date: string; time: string; retry?: readonly WriteOperation[]; originalTaskId?: string
}
export interface Toast {
  id: string; text: string; error: boolean; recovery?: Draft
  projectRecovery?: { name: string; projectId?: string; operations: readonly WriteOperation[] }
  extraRecoveries?: readonly { recovery?: Draft; projectRecovery?: Toast['projectRecovery'] }[]
}
export interface WriteJob { id: string; taskIds: readonly string[]; projectId?: string }

export function emptyDraft(projectId = ''): Draft {
  return { title: '', description: '', category: '', projectId, priority: 'none', status: 'todo',
    dueDate: null, dueHasTime: false, date: '', time: '' }
}

export function initialWriteState() {
  return { overlay: null as Overlay, draft: emptyDraft(), projectName: '', fieldError: '',
    editTaskId: null as string | null, editProjectId: null as string | null,
    returnFocus: null as HTMLElement | null, fallbackFocus: '',
    resumeOverlay: null as 'quick' | 'task' | null, lastProjectId: '',
    projectRetry: undefined as readonly WriteOperation[] | undefined,
    revealTaskId: null as string | null,
    jobs: [] as readonly WriteJob[], toasts: [] as readonly Toast[],
    cascadeIds: {} as Record<string, string>, deletedProjectId: null as string | null }
}
