// ============================================================
// DOIS.ZERO | Fase 05 — Squads, Metas & Gamificação
// ============================================================

export type SquadStatus = 'active' | 'archived'
export type SquadMemberRole = 'leader' | 'member'
export type GoalPeriod = 'monthly' | 'quarterly'
export type GoalMetric =
  | 'tasks_completed'
  | 'on_time_rate'
  | 'quality_score'
  | 'collaboration_score'
  | 'projects_delivered'
  | 'revenue_generated'
  | 'custom'
export type GoalStatus = 'draft' | 'active' | 'achieved' | 'missed' | 'cancelled'

// -------------------------
// Squad
// -------------------------
export interface Squad {
  id: string
  agency_id: string
  name: string
  description: string | null
  avatar_color: string
  avatar_emoji: string
  specialty: string | null
  capacity: number
  status: SquadStatus
  created_by: string | null
  created_at: string
  updated_at: string
  // Joined relations
  members?: SquadMember[]
  member_count?: number
}

// -------------------------
// Squad Member
// -------------------------
export interface SquadMember {
  id: string
  squad_id: string
  user_id: string
  role: SquadMemberRole
  joined_at: string
  // Joined
  profile?: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

// -------------------------
// Squad Goal
// -------------------------
export interface SquadGoal {
  id: string
  squad_id: string
  agency_id: string
  title: string
  description: string | null
  metric: GoalMetric
  metric_label: string | null
  target_value: number
  current_value: number
  period: GoalPeriod
  period_start: string
  period_end: string
  status: GoalStatus
  weight: number
  created_by: string | null
  created_at: string
  updated_at: string
}

// -------------------------
// Performance Snapshot (monthly)
// -------------------------
export interface SquadPerformanceSnapshot {
  id: string
  squad_id: string
  agency_id: string
  period_year: number
  period_month: number
  tasks_completed: number
  tasks_total: number
  tasks_on_time: number
  quality_score: number | null
  collaboration_score: number | null
  on_time_rate: number        // computed column
  notes: string | null
  created_at: string
  updated_at: string
}

// -------------------------
// Ranking Entry (from RPC)
// -------------------------
export interface SquadRankingEntry {
  squad_id: string
  squad_name: string
  squad_emoji: string
  squad_color: string
  specialty: string | null
  member_count: number
  tasks_completed: number
  tasks_total: number
  on_time_rate: number
  quality_score: number
  collaboration_score: number
  overall_score: number
  rank: number
}

// -------------------------
// Forms
// -------------------------
export interface CreateSquadForm {
  name: string
  description?: string
  avatar_color: string
  avatar_emoji: string
  specialty?: string
  capacity?: number
}

export interface CreateGoalForm {
  squad_id: string
  title: string
  description?: string
  metric: GoalMetric
  metric_label?: string
  target_value: number
  period: GoalPeriod
  period_start: string
  period_end: string
  weight: number
}

export interface UpsertPerformanceForm {
  squad_id: string
  year: number
  month: number
  tasks_completed?: number
  tasks_total?: number
  tasks_on_time?: number
  quality_score?: number | null
  collaboration_score?: number | null
  notes?: string
}

// -------------------------
// Helpers / Constants
// -------------------------
export const GOAL_METRIC_LABELS: Record<GoalMetric, string> = {
  tasks_completed: 'Tarefas Concluídas',
  on_time_rate: 'Taxa de Prazo (%)',
  quality_score: 'Score de Qualidade',
  collaboration_score: 'Score de Colaboração',
  projects_delivered: 'Projetos Entregues',
  revenue_generated: 'Receita Gerada (R$)',
  custom: 'Métrica Customizada',
}

export const GOAL_STATUS_CONFIG: Record<GoalStatus, { label: string; color: string }> = {
  draft:     { label: 'Rascunho',   color: 'text-[#6B7280] bg-[#6B7280]/10' },
  active:    { label: 'Ativa',      color: 'text-[#3B82F6] bg-[#3B82F6]/10' },
  achieved:  { label: 'Alcançada',  color: 'text-[#10B981] bg-[#10B981]/10' },
  missed:    { label: 'Perdida',    color: 'text-[#EF4444] bg-[#EF4444]/10' },
  cancelled: { label: 'Cancelada',  color: 'text-[#F59E0B] bg-[#F59E0B]/10' },
}

export const SPECIALTY_OPTIONS = [
  { value: 'motion',      label: 'Motion Design',    emoji: '🎬' },
  { value: 'social',      label: 'Social Media',     emoji: '📱' },
  { value: 'performance', label: 'Performance',      emoji: '📈' },
  { value: 'branding',    label: 'Branding',         emoji: '🎨' },
  { value: 'design',      label: 'Design',           emoji: '✏️' },
  { value: 'content',     label: 'Conteúdo',         emoji: '✍️' },
  { value: 'video',       label: 'Vídeo',            emoji: '🎥' },
  { value: 'strategy',    label: 'Estratégia',       emoji: '🧠' },
  { value: 'tech',        label: 'Tecnologia',       emoji: '⚙️' },
]

export const AVATAR_COLORS = [
  '#7952FF', '#EC4899', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
  '#84CC16', '#F97316',
]

export const AVATAR_EMOJIS = [
  '⚡', '🚀', '🎯', '🔥', '🌟', '💡', '🎨', '⚙️',
  '🏆', '💎', '🎬', '📱', '📈', '🧠', '✍️', '🎥',
]

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export function getPeriodLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`
}

export function getGoalProgress(goal: SquadGoal): number {
  if (goal.target_value === 0) return 0
  return Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
}

export function getMedalForRank(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-[#10B981]'
  if (score >= 60) return 'text-[#F59E0B]'
  if (score >= 40) return 'text-[#F97316]'
  return 'text-[#EF4444]'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-[#10B981]/10'
  if (score >= 60) return 'bg-[#F59E0B]/10'
  if (score >= 40) return 'bg-[#F97316]/10'
  return 'bg-[#EF4444]/10'
}
