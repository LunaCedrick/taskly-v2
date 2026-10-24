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

export interface Activity {
  id: string
  type: string
  taskId: string | null
  projectId: string | null
  text: string
  createdAt: number
}

export interface StreamDocuments {
  projects: Project
  tasks: Task
  activity: Activity
}

export type StreamName = keyof StreamDocuments
