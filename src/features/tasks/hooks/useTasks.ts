import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// useTasks — TanStack Query hooks for task management
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { projectKeys } from '@/features/projects/hooks/useProjects'
import type {
  Task,
  TaskComment,
  TaskAttachment,
  TaskLink,
  TaskActivity,
  TaskChecklist,
  TaskChecklistItem,
  CreateTaskForm,
  UpdateTaskForm,
  TaskFilters,
  TaskStatus,
} from '@/types/projects'

// -------------------------
// Query Keys
// -------------------------
export const taskKeys = {
  all: ['tasks'] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
  list: (filters: TaskFilters) => [...taskKeys.all, 'list', filters] as const,
  comments: (taskId: string) => [...taskKeys.all, 'comments', taskId] as const,
  attachments: (taskId: string) => [...taskKeys.all, 'attachments', taskId] as const,
  links: (taskId: string) => [...taskKeys.all, 'links', taskId] as const,
  activity: (taskId: string) => [...taskKeys.all, 'activity', taskId] as const,
  subtasks: (taskId: string) => [...taskKeys.all, 'subtasks', taskId] as const,
}

// -------------------------
// Fetch task detail
// -------------------------
async function fetchTask(taskId: string, agencyId: string): Promise<Task | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        id, user_id, assigned_at,
        profile:profiles(id, full_name, avatar_url)
      ),
      checklists:task_checklists(
        id, title, position,
        items:task_checklist_items(
          id, title, is_completed, completed_by, completed_at, position
        )
      ),
      column:board_columns(id, name, color, category),
      project:projects(id, name, client_id, client:clients(id, name))
    `)
    .eq('id', taskId).eq('agency_id', agencyId)
    .single()

  if (error) throw error
  return data as unknown as Task
}

// -------------------------
// Fetch tasks (list with filters)
// -------------------------
async function fetchTasks(filters: TaskFilters, agencyId: string): Promise<Task[]> {
  if (!supabase) return []

  let query = supabase
    .from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        id, user_id,
        profile:profiles(id, full_name, avatar_url)
      ),
      column:board_columns(id, name, color, category),
      project:projects(id, name, client_id, client:clients(id, name)),
      attachment_counts:task_attachments(count)
    `)
    .is('archived_at', null)
    .is('parent_task_id', null)
    .order('position', { ascending: true })

  query = query.eq('agency_id', agencyId)
  if (filters.projectId) query = query.eq('project_id', filters.projectId)
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.priority) query = query.eq('priority', filters.priority)
  if (filters.search) query = query.ilike('title', `%${filters.search}%`)
  if (filters.dueDateFrom) query = query.gte('due_date', filters.dueDateFrom)
  if (filters.dueDateTo) query = query.lte('due_date', filters.dueDateTo)

  const { data, error } = await query
  if (error) throw error
  return ((data ?? []) as unknown as (Task & {attachment_counts?:{count:number}[]})[]).map(t=>({...t,attachments_count:t.attachment_counts?.[0]?.count||0}))
}

// -------------------------
// Fetch subtasks
// -------------------------
async function fetchSubtasks(parentTaskId: string): Promise<Task[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('tasks')
    .select(`
      *,
      assignees:task_assignees(
        id, user_id,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('parent_task_id', parentTaskId)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as unknown as Task[]) ?? []
}

// -------------------------
// Fetch comments
// -------------------------
async function fetchTaskComments(taskId: string): Promise<TaskComment[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      *,
      author:profiles(id, full_name, avatar_url)
    `)
    .eq('task_id', taskId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data as unknown as TaskComment[]) ?? []
}

// -------------------------
// Fetch attachments
// -------------------------
async function fetchTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('task_attachments')
    .select(`
      *,
      uploader:profiles(id, full_name, avatar_url)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as TaskAttachment[]) ?? []
}

// -------------------------
// Fetch links
// -------------------------
async function fetchTaskLinks(taskId: string): Promise<TaskLink[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('task_links')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as TaskLink[]) ?? []
}

// -------------------------
// Fetch activity
// -------------------------
async function fetchTaskActivity(taskId: string): Promise<TaskActivity[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('task_activity')
    .select(`
      *,
      actor:profiles(id, full_name, avatar_url)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data as unknown as TaskActivity[]) ?? []
}

// -------------------------
// Hooks
// -------------------------
export function useTask(taskId?: string) {
  const agencyId = useAgencyId()
  return useQuery({
    queryKey: taskKeys.detail(taskId ?? ''),
    queryFn: () => fetchTask(taskId!, agencyId),
    enabled: isSupabaseConfigured && !!taskId,
  })
}

export function useTasks(filters: TaskFilters) {
  const agencyId = useAgencyId()
  return useQuery({
    queryKey: [...taskKeys.list(filters), agencyId],
    queryFn: () => fetchTasks(filters, agencyId),
    enabled: isSupabaseConfigured,
    staleTime: 15_000,
  })
}

export function useSubtasks(parentTaskId?: string) {
  return useQuery({
    queryKey: taskKeys.subtasks(parentTaskId ?? ''),
    queryFn: () => fetchSubtasks(parentTaskId!),
    enabled: isSupabaseConfigured && !!parentTaskId,
  })
}

export function useTaskComments(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.comments(taskId ?? ''),
    queryFn: () => fetchTaskComments(taskId!),
    enabled: isSupabaseConfigured && !!taskId,
  })
}

export function useTaskAttachments(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.attachments(taskId ?? ''),
    queryFn: () => fetchTaskAttachments(taskId!),
    enabled: isSupabaseConfigured && !!taskId,
  })
}

export function useTaskLinks(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.links(taskId ?? ''),
    queryFn: () => fetchTaskLinks(taskId!),
    enabled: isSupabaseConfigured && !!taskId,
  })
}

export function useTaskActivity(taskId?: string) {
  return useQuery({
    queryKey: taskKeys.activity(taskId ?? ''),
    queryFn: () => fetchTaskActivity(taskId!),
    enabled: isSupabaseConfigured && !!taskId,
  })
}

// -------------------------
// Create task mutation
// -------------------------
export function useCreateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      form,
      projectId,
      boardId,
      agencyId,
      initialStatus = 'open',
    }: {
      initialStatus?: TaskStatus
      form: CreateTaskForm
      projectId: string
      boardId: string
      agencyId: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      // Calculate position (append at end of column)
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('position')
        .eq('column_id', form.column_id)
        .is('archived_at', null)
        .order('position', { ascending: false })
        .limit(1)

      const maxPos = existingTasks?.[0]?.position ?? 0
      const newPosition = maxPos + 1000

      const { data: task, error: taskErr } = await supabase
        .from('tasks')
        .insert({
          agency_id: agencyId,
          project_id: projectId,
          board_id: boardId,
          column_id: form.column_id,
          parent_task_id: form.parent_task_id,
          title: form.title,
          status: initialStatus,
          completed_at: initialStatus === 'done' ? new Date().toISOString() : null,
          description: form.description || null,
          priority: form.priority,
          start_date: form.start_date,
          due_date: form.due_date,
          position: newPosition,
          created_by: (await supabase.auth.getUser()).data.user?.id ?? '',
        })
        .select('id')
        .single()

      if (taskErr) throw taskErr

      // Add assignees
      if (form.assignee_ids.length > 0 && task) {
        const assigneeInserts = form.assignee_ids.map((uid) => ({
          agency_id: agencyId,
          task_id: task.id,
          user_id: uid,
        }))

        const { error: assignErr } = await supabase
          .from('task_assignees')
          .insert(assigneeInserts)

        if (assignErr) throw assignErr
      }

      // Log activity
      if (task) {
        await supabase.from('task_activity').insert({
          agency_id: agencyId,
          task_id: task.id,
          actor_user_id: (await supabase.auth.getUser()).data.user?.id ?? null,
          action: 'created',
          metadata: { title: form.title },
        })
      }

      return task?.id
    },
    onSuccess: (_, { projectId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({queryKey:['management-kanban']});qc.invalidateQueries({queryKey:['production-timing']})
      qc.invalidateQueries({ queryKey: projectKeys.board(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.progress(projectId) })
    },
  })
}

// -------------------------
// Update task mutation
// -------------------------
export function useUpdateTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      projectId,
      updates,
    }: {
      taskId: string
      projectId: string
      updates: UpdateTaskForm
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: (_, { taskId, projectId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({queryKey:['management-kanban']});qc.invalidateQueries({queryKey:['production-timing']})
      qc.invalidateQueries({ queryKey: projectKeys.board(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.progress(projectId) })
    },
  })
}

// -------------------------
// Move task (Kanban) using RPC
// -------------------------
export function useMoveTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      position,
    }: {
      taskId: string
      columnId: string
      position: number
      projectId: string // for cache invalidation
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase.rpc('move_task', {
        p_task_id: taskId,
        p_column_id: columnId,
        p_position: position,
      })

      if (error) throw error
    },
    onSuccess: async (_, { projectId }) => {
      await Promise.all([
        qc.invalidateQueries({queryKey:taskKeys.all}),
        qc.invalidateQueries({queryKey:['management-kanban']}),qc.invalidateQueries({queryKey:['production-timing']}),
        qc.invalidateQueries({queryKey:projectKeys.board(projectId)}),
        qc.invalidateQueries({queryKey:projectKeys.progress(projectId)}),
      ])
    },
  })
}

// -------------------------
// Archive task mutation
// -------------------------
export function useArchiveTask() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, projectId }: { taskId: string; projectId: string }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('tasks')
        .update({ archived_at: new Date().toISOString(), status: 'archived' })
        .eq('id', taskId)

      if (error) throw error
    },
    onSuccess: (_, { taskId, projectId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
      qc.invalidateQueries({ queryKey: taskKeys.all })
      qc.invalidateQueries({queryKey:['management-kanban']});qc.invalidateQueries({queryKey:['production-timing']})
      qc.invalidateQueries({ queryKey: projectKeys.board(projectId) })
      qc.invalidateQueries({ queryKey: projectKeys.progress(projectId) })
    },
  })
}

// -------------------------
// Comment mutations
// -------------------------
export function useAddComment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      agencyId,
      content,
      authorId,
    }: {
      taskId: string
      agencyId: string
      content: string
      authorId: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase.from('task_comments').insert({
        task_id: taskId,
        agency_id: agencyId,
        author_id: authorId,
        content,
      })

      if (error) throw error
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(taskId) })
    },
  })
}

export function useDeleteComment() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, taskId }: { commentId: string; taskId: string }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('task_comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)

      if (error) throw error
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.comments(taskId) })
    },
  })
}

// -------------------------
// Checklist mutations
// -------------------------
export function useToggleChecklistItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      taskId,
      isCompleted,
      userId,
    }: {
      itemId: string
      taskId: string
      isCompleted: boolean
      userId: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('task_checklist_items')
        .update({
          is_completed: isCompleted,
          completed_by: isCompleted ? userId : null,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', itemId)

      if (error) throw error
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

export function useCreateChecklist() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      agencyId,
      title,
    }: {
      taskId: string
      agencyId: string
      title: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data, error } = await supabase
        .from('task_checklists')
        .insert({ task_id: taskId, agency_id: agencyId, title })
        .select('id')
        .single()

      if (error) throw error
      return data?.id
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

export function useAddChecklistItem() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      checklistId,
      agencyId,
      taskId,
      title,
    }: {
      checklistId: string
      agencyId: string
      taskId: string
      title: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase.from('task_checklist_items').insert({
        checklist_id: checklistId,
        agency_id: agencyId,
        title,
      })

      if (error) throw error
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) })
    },
  })
}

// -------------------------
// Link mutations
// -------------------------
export function useAddLink() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      taskId,
      agencyId,
      title,
      url,
      createdBy,
    }: {
      taskId: string
      agencyId: string
      title: string
      url: string
      createdBy: string
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase.from('task_links').insert({
        task_id: taskId,
        agency_id: agencyId,
        title,
        url,
        created_by: createdBy,
      })

      if (error) throw error
    },
    onSuccess: (_, { taskId }) => {
      qc.invalidateQueries({ queryKey: taskKeys.links(taskId) })
    },
  })
}

// Atomic group movement; the database validates every task before committing.
export function useMoveTaskGroup(){const qc=useQueryClient();return useMutation({mutationFn:async({agencyId,taskIds,status}:{agencyId:string;taskIds:string[];status:TaskStatus})=>{if(!supabase)throw new Error('Servidor indisponível');const result=await supabase.rpc('move_task_group',{p_agency_id:agencyId,p_task_ids:taskIds,p_status:status});if(result.error)throw result.error;return result.data as number},onSuccess:async()=>{await Promise.all([qc.invalidateQueries({queryKey:taskKeys.all}),qc.invalidateQueries({queryKey:['management-kanban']}),qc.invalidateQueries({queryKey:['production-timing']}),qc.invalidateQueries({queryKey:projectKeys.all})])}})}
