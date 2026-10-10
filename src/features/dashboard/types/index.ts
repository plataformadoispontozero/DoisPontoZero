export interface OperationalIndicators {
  activeProjects: number
  pendingTasks: number
  weekDeliveries: number
  pendingApprovals: number
}

export interface UserPriorityTask {
  id: string
  title: string
  projectName: string
  clientName: string
  deadline: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'review' | 'done'
}

export interface RecentProject {
  id: string
  name: string
  client: string
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'paused'
  owner: {
    name: string
    avatar?: string
  }
  deadline: string
  progress: number
}

export interface UpcomingMeeting {
  id: string
  title: string
  client?: string
  date: string
  time: string
  attendees: string[]
  platform: 'Google Meet' | 'Zoom' | 'Presencial' | 'Microsoft Teams'
}

export interface OperationalActivity {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'system' | 'project' | 'task' | 'meeting' | 'approval'
}
