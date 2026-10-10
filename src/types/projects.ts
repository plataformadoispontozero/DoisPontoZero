// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS — FASE 04
// Domain types for Projects, Boards, Tasks and related entities
// ============================================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived'
export type Priority = 'urgent' | 'high' | 'normal' | 'low'
export type TaskStatus = 'open' | 'in_progress' | 'review' | 'done' | 'archived'
export type ColumnCategory = 'backlog' | 'in_progress' | 'review' | 'done'
export type ReviewStatus = 'pending' | 'approved' | 'changes_requested'

// -------------------------
// Client (Fase 03)
// -------------------------
export interface Client {
  id: string
  agency_id: string
  name: string
  slug: string
  logo_url: string | null
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
}

// -------------------------
// Profile (simplified for joins)
// -------------------------
export interface Profile {
  id: string
  full_name: string
  avatar_url: string | null
}

// -------------------------
// Project
// -------------------------
export interface Project {
  id: string
  agency_id: string
  client_id: string | null
  name: string
  slug?: string
  description: string | null
  status: ProjectStatus
  priority: Priority
  start_date: string | null
  due_date: string | null
  completed_at?: string | null
  owner_id: string | null
  created_by?: string
  created_at: string
  updated_at: string
  archived_at: string | null
  // Joined
  client?: Client | null
  owner?: Profile | null
  members?: ProjectMember[]
  progress?: ProjectProgress
}

export interface ProjectMember {
  id: string
  agency_id: string
  project_id: string
  user_id: string
  created_at: string
  // Joined
  profile?: Profile
}

export interface ProjectProgress {
  total_tasks: number
  done_tasks: number
  progress_pct: number
}

// -------------------------
// Board
// -------------------------
export interface ProjectBoard {
  id: string
  agency_id: string
  project_id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at?: string
  columns?: BoardColumn[]
}

export interface BoardColumn {
  id: string
  agency_id: string
  board_id: string
  name: string
  position: number
  color: string
  category: ColumnCategory
  wip_limit?: number | null
  is_system?: boolean
  created_at: string
  updated_at?: string
  tasks?: Task[]
}

// -------------------------
// Task
// -------------------------
export interface Task {
  id: string
  agency_id: string
  project_id: string
  board_id: string
  column_id: string
  parent_task_id: string | null
  title: string
  description: string | null
  priority: Priority
  status: TaskStatus
  position: number
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
  archived_at: string | null
  // Joined / computed
  assignees?: TaskAssignee[]
  checklists?: TaskChecklist[]
  comments_count?: number
  attachments_count?: number
  links_count?: number
  subtasks?: Task[]
  column?: BoardColumn
  project?: { id: string; name: string }
  client?: { id: string; name: string } | null
}

export interface TaskAssignee {
  id: string
  agency_id: string
  task_id: string
  user_id: string
  assigned_at?: string
  profile?: Profile
}

export interface TaskChecklist {
  id: string
  agency_id: string
  task_id: string
  title: string
  position: number
  created_at?: string
  items?: TaskChecklistItem[]
}

export interface TaskChecklistItem {
  id: string
  agency_id: string
  checklist_id: string
  title: string
  is_completed: boolean
  completed_by: string | null
  completed_at: string | null
  position: number
  created_at?: string
  updated_at?: string
}

export interface TaskComment {
  id: string
  agency_id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  author?: Profile
}

export interface TaskAttachment {
  id: string
  agency_id: string
  task_id: string
  file_name?: string
  name?: string
  storage_path: string
  mime_type?: string | null
  file_size?: number | null
  size_bytes?: number | null
  uploaded_by: string
  created_at: string
  uploader?: Profile
}

export interface TaskLink {
  id: string
  agency_id: string
  task_id: string
  title: string
  url: string
  created_by: string
  created_at: string
}

export interface TaskActivity {
  id: string
  agency_id: string
  task_id: string
  actor_user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  actor?: Profile | null
}

export interface TaskReview {
  id: string
  agency_id: string
  task_id: string
  reviewer_id: string
  status: ReviewStatus
  note: string | null
  created_at: string
  updated_at: string
  reviewer?: Profile
}

// -------------------------
// Form Types
// -------------------------
export interface CreateProjectForm {
  name: string
  client_id: string | null
  description: string
  priority: Priority
  status: ProjectStatus
  start_date: string | null
  due_date: string | null
  owner_id: string | null
  member_ids: string[]
}

export interface CreateTaskForm {
  title: string
  description: string
  priority: Priority
  column_id: string
  due_date: string | null
  start_date: string | null
  assignee_ids: string[]
  parent_task_id: string | null
}

export interface UpdateTaskForm {
  title?: string
  description?: string
  priority?: Priority
  status?: TaskStatus
  column_id?: string
  due_date?: string | null
  start_date?: string | null
  completed_at?: string | null
}

// -------------------------
// Filter Types
// -------------------------
export interface TaskFilters {
  projectId?: string
  clientId?: string
  status?: TaskStatus
  priority?: Priority
  assigneeId?: string
  search?: string
  dueDateFrom?: string
  dueDateTo?: string
}

// -------------------------
// Kanban helpers
// -------------------------
export interface KanbanColumn extends BoardColumn {
  tasks: Task[]
}

export interface DragEndResult {
  taskId: string
  sourceColumnId: string
  destinationColumnId: string
  newPosition: number
}
