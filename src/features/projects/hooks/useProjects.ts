import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// useProjects — TanStack Query hooks for project management
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Project,
  ProjectBoard,
  BoardColumn,
  CreateProjectForm,
  ProjectProgress,
} from '@/types/projects'

// -------------------------
// Query Keys
// -------------------------
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (agencyId: string) => [...projectKeys.lists(), agencyId] as const,
  detail: (id: string) => [...projectKeys.all, 'detail', id] as const,
  board: (projectId: string) => [...projectKeys.all, 'board', projectId] as const,
  progress: (projectId: string) => [...projectKeys.all, 'progress', projectId] as const,
  members: (projectId: string) => [...projectKeys.all, 'members', projectId] as const,
}

// -------------------------
// Fetch projects list
// -------------------------
async function fetchProjects(agencyId: string): Promise<Project[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url),
      owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url),
      members:project_members(id, user_id, profile:profiles(id, full_name, avatar_url))
    `)
    .eq('agency_id', agencyId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as Project[]) ?? []
}

// -------------------------
// Fetch single project
// -------------------------
async function fetchProject(projectId: string, agencyId: string): Promise<Project | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(id, name, logo_url, slug),
      owner:profiles!projects_owner_id_fkey(id, full_name, avatar_url),
      members:project_members(id, user_id, created_at, profile:profiles(id, full_name, avatar_url))
    `)
    .eq('id', projectId).eq('agency_id', agencyId)
    .single()

  if (error) throw error
  return data as unknown as Project
}

// -------------------------
// Fetch project board with columns and tasks
// -------------------------
async function fetchProjectBoard(projectId: string, agencyId: string): Promise<ProjectBoard | null> {
  if (!supabase) return null

  // Get default board
  const { data: board, error: boardErr } = await supabase
    .from('project_boards')
    .select('*')
    .eq('project_id', projectId).eq('agency_id', agencyId)
    .eq('is_default', true)
    .single()

  if (boardErr) throw boardErr
  if (!board) return null

  // Get columns with tasks
  const { data: columns, error: colErr } = await supabase
    .from('board_columns')
    .select('*')
    .eq('board_id', board.id)
    .order('position', { ascending: true })

  if (colErr) throw colErr

  const { data: tasks, error: taskErr } = await supabase
    .from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        id, user_id, assigned_at,
        profile:profiles(id, full_name, avatar_url)
      ),
      checklists:task_checklists(
        id, title, position,
        items:task_checklist_items(id, title, is_completed, position)
      )
    `)
    .eq('board_id', board.id)
    .is('archived_at', null)
    .is('parent_task_id', null) // Only root tasks in Kanban
    .order('position', { ascending: true })

  if (taskErr) throw taskErr

  const cols = (columns ?? []).map((col) => ({
    ...col,
    tasks: (tasks ?? []).filter((t: { column_id: string }) => t.column_id === col.id),
  }))

  return { ...board, columns: cols } as unknown as ProjectBoard
}

// -------------------------
// Fetch project progress
// -------------------------
async function fetchProjectProgress(projectId: string): Promise<ProjectProgress> {
  if (!supabase) return { total_tasks: 0, done_tasks: 0, progress_pct: 0 }

  const { data, error } = await supabase.rpc('get_project_progress', {
    p_project_id: projectId,
  })

  if (error) throw error
  const row = data?.[0]
  return row
    ? {
        total_tasks: row.total_tasks ?? 0,
        done_tasks: row.done_tasks ?? 0,
        progress_pct: Number(row.progress_pct ?? 0),
      }
    : { total_tasks: 0, done_tasks: 0, progress_pct: 0 }
}

// -------------------------
// Hooks
// -------------------------
export function useProjects(agencyId?: string) {
  return useQuery({
    queryKey: projectKeys.list(agencyId ?? ''),
    queryFn: () => fetchProjects(agencyId!),
    enabled: isSupabaseConfigured && !!agencyId,
    staleTime: 30_000,
  })
}

export function useProject(projectId?: string) {
  const agencyId = useAgencyId()
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => fetchProject(projectId!, agencyId),
    enabled: isSupabaseConfigured && !!projectId,
    staleTime: 30_000,
  })
}

export function useProjectBoard(projectId?: string) {
  const agencyId = useAgencyId()
  return useQuery({
    queryKey: projectKeys.board(projectId ?? ''),
    queryFn: () => fetchProjectBoard(projectId!, agencyId),
    enabled: isSupabaseConfigured && !!projectId,
    staleTime: 10_000,
  })
}

export function useProjectProgress(projectId?: string) {
  return useQuery({
    queryKey: projectKeys.progress(projectId ?? ''),
    queryFn: () => fetchProjectProgress(projectId!),
    enabled: isSupabaseConfigured && !!projectId,
    staleTime: 15_000,
  })
}

// -------------------------
// Create project mutation
// -------------------------
export function useCreateProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateProjectForm & { agency_id: string }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data, error } = await supabase.rpc('create_project_with_board', {
        p_agency_id: payload.agency_id,
        p_client_id: payload.client_id,
        p_name: payload.name,
        p_description: payload.description || null,
        p_priority: payload.priority,
        p_status: payload.status,
        p_start_date: payload.start_date,
        p_due_date: payload.due_date,
        p_owner_id: payload.owner_id,
        p_member_ids: payload.member_ids.length > 0 ? payload.member_ids : null,
      })

      if (error) throw error
      return data as string
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: projectKeys.list(variables.agency_id) })
    },
  })
}

// -------------------------
// Update project mutation
// -------------------------
export function useUpdateProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      agencyId,
      updates,
    }: {
      projectId: string
      agencyId: string
      updates: Partial<Project>
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .eq('agency_id', agencyId)

      if (error) throw error
    },
    onSuccess: (_, { projectId, agencyId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.detail(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.list(agencyId) })
    },
  })
}

// -------------------------
// Archive project mutation
// -------------------------
export function useArchiveProject() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      agencyId,
    }: {
      projectId: string
      agencyId: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('projects')
        .update({
          archived_at: new Date().toISOString(),
          status: 'archived',
        })
        .eq('id', projectId)
        .eq('agency_id', agencyId)

      if (error) throw error
    },
    onSuccess: (_, { agencyId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.list(agencyId) })
    },
  })
}

// -------------------------
// Update column
// -------------------------
export function useUpdateColumn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      columnId,
      projectId,
      updates,
    }: {
      columnId: string
      projectId: string
      updates: Partial<BoardColumn>
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('board_columns')
        .update(updates)
        .eq('id', columnId)

      if (error) throw error
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.board(projectId) })
    },
  })
}

// -------------------------
// Create column
// -------------------------
export function useCreateColumn() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      boardId,
      agencyId,
      projectId,
      name,
      position,
      color,
      category,
    }: {
      boardId: string
      agencyId: string
      projectId: string
      name: string
      position: number
      color?: string
      category?: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase.from('board_columns').insert({
        board_id: boardId,
        agency_id: agencyId,
        name,
        position,
        color: color ?? '#30303B',
        category: category ?? 'backlog',
      })

      if (error) throw error
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: projectKeys.board(projectId) })
    },
  })
}
