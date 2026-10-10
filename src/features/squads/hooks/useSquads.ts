// ============================================================
// useSquads — TanStack Query hooks for Fase 05: Squads & Metas
// ============================================================
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Squad,
  SquadMember,
  SquadGoal,
  SquadPerformanceSnapshot,
  SquadRankingEntry,
  CreateSquadForm,
  CreateGoalForm,
  UpsertPerformanceForm,
} from '@/types/squads'

// -------------------------
// Query Keys
// -------------------------
export const squadKeys = {
  all: ['squads'] as const,
  lists: () => [...squadKeys.all, 'list'] as const,
  list: (agencyId: string) => [...squadKeys.lists(), agencyId] as const,
  detail: (id: string) => [...squadKeys.all, 'detail', id] as const,
  members: (squadId: string) => [...squadKeys.all, 'members', squadId] as const,
  goals: (squadId: string) => [...squadKeys.all, 'goals', squadId] as const,
  allGoals: (agencyId: string) => [...squadKeys.all, 'allGoals', agencyId] as const,
  snapshots: (squadId: string) => [...squadKeys.all, 'snapshots', squadId] as const,
  ranking: (agencyId: string, year: number, month: number) =>
    [...squadKeys.all, 'ranking', agencyId, year, month] as const,
}

// -------------------------
// Fetch all squads for agency
// -------------------------
async function fetchSquads(agencyId: string): Promise<Squad[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('squads')
    .select(`
      *,
      members:squad_members(
        id, user_id, role, joined_at,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('agency_id', agencyId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as Squad[]) ?? []
}

// -------------------------
// Fetch single squad with members
// -------------------------
async function fetchSquad(squadId: string): Promise<Squad | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('squads')
    .select(`
      *,
      members:squad_members(
        id, user_id, role, joined_at,
        profile:profiles(id, full_name, avatar_url)
      )
    `)
    .eq('id', squadId)
    .single()

  if (error) throw error
  return data as unknown as Squad
}

// -------------------------
// Fetch goals for a squad
// -------------------------
async function fetchSquadGoals(squadId: string): Promise<SquadGoal[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('squad_goals')
    .select('*')
    .eq('squad_id', squadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as SquadGoal[]) ?? []
}

// -------------------------
// Fetch all active goals for agency (for dashboard overview)
// -------------------------
async function fetchAgencyGoals(agencyId: string): Promise<SquadGoal[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('squad_goals')
    .select('*')
    .eq('agency_id', agencyId)
    .in('status', ['active', 'achieved'])
    .order('period_start', { ascending: false })

  if (error) throw error
  return (data as SquadGoal[]) ?? []
}

// -------------------------
// Fetch performance snapshots for a squad
// -------------------------
async function fetchSnapshots(squadId: string): Promise<SquadPerformanceSnapshot[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('squad_performance_snapshots')
    .select('*')
    .eq('squad_id', squadId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(12)

  if (error) throw error
  return (data as SquadPerformanceSnapshot[]) ?? []
}

// -------------------------
// Fetch ranking via RPC
// -------------------------
async function fetchRanking(
  agencyId: string,
  year: number,
  month: number
): Promise<SquadRankingEntry[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .rpc('compute_squad_ranking', {
      p_agency_id: agencyId,
      p_year: year,
      p_month: month,
    })

  if (error) throw error
  return (data as SquadRankingEntry[]) ?? []
}

// ============================================================
// HOOKS — READ
// ============================================================

export function useSquads(agencyId: string) {
  return useQuery({
    queryKey: squadKeys.list(agencyId),
    queryFn: () => fetchSquads(agencyId),
    enabled: Boolean(agencyId) && isSupabaseConfigured,
    staleTime: 30_000,
  })
}

export function useSquad(squadId: string) {
  return useQuery({
    queryKey: squadKeys.detail(squadId),
    queryFn: () => fetchSquad(squadId),
    enabled: Boolean(squadId) && isSupabaseConfigured,
    staleTime: 30_000,
  })
}

export function useSquadGoals(squadId: string) {
  return useQuery({
    queryKey: squadKeys.goals(squadId),
    queryFn: () => fetchSquadGoals(squadId),
    enabled: Boolean(squadId) && isSupabaseConfigured,
    staleTime: 60_000,
  })
}

export function useAgencyGoals(agencyId: string) {
  return useQuery({
    queryKey: squadKeys.allGoals(agencyId),
    queryFn: () => fetchAgencyGoals(agencyId),
    enabled: Boolean(agencyId) && isSupabaseConfigured,
    staleTime: 60_000,
  })
}

export function useSquadSnapshots(squadId: string) {
  return useQuery({
    queryKey: squadKeys.snapshots(squadId),
    queryFn: () => fetchSnapshots(squadId),
    enabled: Boolean(squadId) && isSupabaseConfigured,
    staleTime: 60_000,
  })
}

export function useSquadRanking(agencyId: string, year: number, month: number) {
  return useQuery({
    queryKey: squadKeys.ranking(agencyId, year, month),
    queryFn: () => fetchRanking(agencyId, year, month),
    enabled: Boolean(agencyId) && isSupabaseConfigured,
    staleTime: 60_000,
  })
}

// ============================================================
// HOOKS — MUTATIONS
// ============================================================

// Create squad
export function useCreateSquad(agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateSquadForm) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('squads')
        .insert({
          agency_id: agencyId,
          name: form.name,
          description: form.description ?? null,
          avatar_color: form.avatar_color,
          avatar_emoji: form.avatar_emoji,
          specialty: form.specialty ?? null,
          capacity: form.capacity ?? 0,
          created_by: user?.id ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as Squad
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: squadKeys.list(agencyId) })
    },
  })
}

// Update squad
export function useUpdateSquad(agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<CreateSquadForm> & { id: string }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data, error } = await supabase
        .from('squads')
        .update(patch)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Squad
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: squadKeys.list(agencyId) })
      qc.invalidateQueries({ queryKey: squadKeys.detail(vars.id) })
    },
  })
}

// Archive squad
export function useArchiveSquad(agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (squadId: string) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('squads')
        .update({ status: 'archived' })
        .eq('id', squadId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: squadKeys.list(agencyId) })
    },
  })
}

// Add member
export function useAddSquadMember(squadId: string, agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'leader' | 'member' }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data, error } = await supabase
        .from('squad_members')
        .insert({ squad_id: squadId, user_id: userId, role })
        .select()
        .single()

      if (error) throw error
      return data as SquadMember
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: squadKeys.detail(squadId) })
      qc.invalidateQueries({ queryKey: squadKeys.list(agencyId) })
    },
  })
}

// Remove member
export function useRemoveSquadMember(squadId: string, agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { error } = await supabase
        .from('squad_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: squadKeys.detail(squadId) })
      qc.invalidateQueries({ queryKey: squadKeys.list(agencyId) })
    },
  })
}

// Create goal
export function useCreateGoal(agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (form: CreateGoalForm) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('squad_goals')
        .insert({
          squad_id: form.squad_id,
          agency_id: agencyId,
          title: form.title,
          description: form.description ?? null,
          metric: form.metric,
          metric_label: form.metric_label ?? null,
          target_value: form.target_value,
          period: form.period,
          period_start: form.period_start,
          period_end: form.period_end,
          weight: form.weight,
          status: 'active',
          created_by: user?.id ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return data as SquadGoal
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: squadKeys.goals(data.squad_id) })
      qc.invalidateQueries({ queryKey: squadKeys.allGoals(agencyId) })
    },
  })
}

// Update goal current_value
export function useUpdateGoalValue() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      goalId,
      currentValue,
      status,
    }: {
      goalId: string
      currentValue: number
      status?: 'active' | 'achieved' | 'missed'
    }) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const patch: Record<string, unknown> = { current_value: currentValue }
      if (status) patch.status = status

      const { data, error } = await supabase
        .from('squad_goals')
        .update(patch)
        .eq('id', goalId)
        .select()
        .single()

      if (error) throw error
      return data as SquadGoal
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: squadKeys.goals(data.squad_id) })
    },
  })
}

// Upsert performance snapshot via RPC
export function useUpsertSnapshot(agencyId: string) {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (form: UpsertPerformanceForm) => {
      if (!supabase) throw new Error('Supabase não configurado')

      const { data, error } = await supabase.rpc('upsert_performance_snapshot', {
        p_squad_id: form.squad_id,
        p_year: form.year,
        p_month: form.month,
        p_tasks_completed: form.tasks_completed ?? null,
        p_tasks_total: form.tasks_total ?? null,
        p_tasks_on_time: form.tasks_on_time ?? null,
        p_quality_score: form.quality_score ?? null,
        p_collaboration_score: form.collaboration_score ?? null,
        p_notes: form.notes ?? null,
      })

      if (error) throw error
      return data as SquadPerformanceSnapshot
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: squadKeys.snapshots(data.squad_id) })
      qc.invalidateQueries({
        queryKey: squadKeys.ranking(agencyId, data.period_year, data.period_month),
      })
    },
  })
}
