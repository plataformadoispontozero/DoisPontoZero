// Priority and status utilities for projects and tasks
import type { Priority, TaskStatus, ProjectStatus, ColumnCategory } from '@/types/projects'

// -------------------------
// Priority
// -------------------------
export const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; color: string; bg: string; dotColor: string }
> = {
  urgent: {
    label: 'Urgente',
    color: 'text-red-400',
    bg: 'bg-red-500/15 border border-red-500/30',
    dotColor: 'bg-red-400',
  },
  high: {
    label: 'Alta',
    color: 'text-orange-400',
    bg: 'bg-orange-500/15 border border-orange-500/30',
    dotColor: 'bg-orange-400',
  },
  normal: {
    label: 'Normal',
    color: 'text-[#A1A1B0]',
    bg: 'bg-[#30303B]/60 border border-[#424252]',
    dotColor: 'bg-[#717182]',
  },
  low: {
    label: 'Baixa',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
}

// -------------------------
// Task status
// -------------------------
export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bg: string }
> = {
  open: {
    label: 'Aberta',
    color: 'text-[#A1A1B0]',
    bg: 'bg-[#30303B]/60',
  },
  in_progress: {
    label: 'Em andamento',
    color: 'text-[#7952FF]',
    bg: 'bg-[#7952FF]/15',
  },
  review: {
    label: 'Em revisão',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  done: {
    label: 'Concluída',
    color: 'text-[#34D399]',
    bg: 'bg-[#34D399]/15',
  },
  archived: {
    label: 'Arquivada',
    color: 'text-[#717182]',
    bg: 'bg-[#717182]/15',
  },
}

// -------------------------
// Project status
// -------------------------
export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; dotColor: string }
> = {
  planning: {
    label: 'Planejamento',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15 border border-sky-500/30',
    dotColor: 'bg-sky-400',
  },
  active: {
    label: 'Ativo',
    color: 'text-[#34D399]',
    bg: 'bg-[#34D399]/15 border border-[#34D399]/30',
    dotColor: 'bg-[#34D399]',
  },
  on_hold: {
    label: 'Em pausa',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15 border border-amber-500/30',
    dotColor: 'bg-amber-400',
  },
  completed: {
    label: 'Concluído',
    color: 'text-[#7952FF]',
    bg: 'bg-[#7952FF]/15 border border-[#7952FF]/30',
    dotColor: 'bg-[#7952FF]',
  },
  archived: {
    label: 'Arquivado',
    color: 'text-[#717182]',
    bg: 'bg-[#717182]/15 border border-[#717182]/30',
    dotColor: 'bg-[#717182]',
  },
}

// -------------------------
// Column category
// -------------------------
export const COLUMN_CATEGORY_CONFIG: Record<
  ColumnCategory,
  { label: string; color: string }
> = {
  backlog: { label: 'Backlog', color: '#717182' },
  in_progress: { label: 'Em andamento', color: '#7952FF' },
  review: { label: 'Em revisão', color: '#FBBF24' },
  done: { label: 'Concluído', color: '#34D399' },
}

// -------------------------
// Link type detection
// -------------------------
export function detectLinkType(url: string): {
  type: string
  icon: string
  color: string
} {
  const u = url.toLowerCase()
  if (u.includes('figma.com')) return { type: 'Figma', icon: '🎨', color: 'text-purple-400' }
  if (u.includes('drive.google.com')) return { type: 'Drive', icon: '📁', color: 'text-blue-400' }
  if (u.includes('canva.com')) return { type: 'Canva', icon: '✏️', color: 'text-cyan-400' }
  if (u.includes('frame.io')) return { type: 'Frame.io', icon: '🎬', color: 'text-green-400' }
  if (u.includes('youtube.com') || u.includes('youtu.be'))
    return { type: 'YouTube', icon: '▶️', color: 'text-red-400' }
  if (u.includes('notion.so')) return { type: 'Notion', icon: '📄', color: 'text-[#F8F9FC]' }
  if (u.includes('loom.com')) return { type: 'Loom', icon: '🎥', color: 'text-violet-400' }
  return { type: 'Link', icon: '🔗', color: 'text-[#A1A1B0]' }
}

// -------------------------
// Date formatting
// -------------------------
export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date + 'T00:00:00'))
}

export function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dt))
}

export function isOverdue(dueDate: string | null | undefined, completedAt?: string | null): boolean {
  if (!dueDate || completedAt) return false
  return new Date(dueDate + 'T23:59:59') < new Date()
}

// -------------------------
// Lexicographic position helpers
// -------------------------
export function getPositionBetween(before: number, after: number): number {
  return (before + after) / 2
}

export function getPositionAtEnd(items: Array<{ position: number }>): number {
  if (items.length === 0) return 1000
  return (items[items.length - 1].position ?? 0) + 1000
}

export function getPositionAtStart(items: Array<{ position: number }>): number {
  if (items.length === 0) return 1000
  return (items[0].position ?? 2000) / 2
}
