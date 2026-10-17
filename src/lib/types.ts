export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type Priority = 'none' | 'low' | 'medium' | 'high'

export interface Project {
  id: string
  name: string
  colorIndex: number
  createdAt: number
  updatedAt: number
}

export interface Task {
  id: string
  projectId: string
  title: string
  description: string
  category: string
  dueDate: number | null
  dueHasTime: boolean
  priority: Priority
  status: TaskStatus
  createdAt: number
  updatedAt: number
  completedAt: number | null
}
