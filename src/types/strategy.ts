// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO + EDITORIAL GENERATOR
// Domain types for Content Strategies, Pillars, Ideas & Editorial
// ============================================================

import type { Client, Profile } from './projects'

// -------------------------
// Strategy Status
// -------------------------
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

export type IdeaStatus = 'idea' | 'approved' | 'in_production' | 'scheduled' | 'published' | 'discarded'

export type EditorialStatus = 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published' | 'paused'

export type ContentFormat =
  | 'carrossel'
  | 'reels'
  | 'stories'
  | 'post'
  | 'video'
  | 'artigo'
  | 'thread'
  | 'live'
  | 'podcast'
  | 'newsletter'
  | 'infografico'
  | 'ebook'

export type SocialChannel =
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'youtube'
  | 'twitter'
  | 'facebook'
  | 'blog'
  | 'pinterest'
  | 'spotify'
  | 'newsletter'

// -------------------------
// 1. Content Strategy
// -------------------------
export interface ContentStrategy {
  id: string
  agency_id: string
  client_id: string | null
  briefing_id: string | null

  // Identity
  name: string
  description: string | null
  slug: string | null

  // Strategic data
  objective: string | null
  target_audience: string | null
  tone_of_voice: string | null
  brand_positioning: string | null
  channels: string[]
  competitors: string[]
  key_messages: string[]
  restrictions: string[]
  visual_references: Array<{ url: string; label?: string }>

  // Metadata
  status: StrategyStatus
  period_start: string | null
  period_end: string | null

  created_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null

  // Joined
  client?: Client | null
  creator?: Profile | null
  pillars?: EditorialPillar[]
  ideas_count?: number
  editorial_items_count?: number
  published_count?: number
}

// -------------------------
// 2. Editorial Pillar
// -------------------------
export interface EditorialPillar {
  id: string
  agency_id: string
  strategy_id: string

  name: string
  description: string | null
  color: string
  icon: string
  percentage: number
  position: number

  content_formats: string[]
  posting_frequency: string | null
  example_topics: string[]

  created_at: string
  updated_at: string
}

// -------------------------
// 3. Content Idea
// -------------------------
export interface ContentIdea {
  id: string
  agency_id: string
  strategy_id: string
  pillar_id: string | null

  title: string
  description: string | null
  content_format: string | null
  channel: string | null
  hook: string | null
  cta: string | null
  hashtags: string[]
  references: Array<{ url: string; label?: string }>

  status: IdeaStatus
  priority: string

  task_id: string | null
  editorial_item_id: string | null

  suggested_by: 'manual' | 'briefing_intelligence' | 'editorial_engine'
  created_by: string | null
  created_at: string
  updated_at: string

  // Joined
  pillar?: EditorialPillar | null
  creator?: Profile | null
}

// -------------------------
// 4. Editorial Item (Pauta)
// -------------------------
export interface EditorialItem {
  id: string
  agency_id: string
  strategy_id: string
  pillar_id: string | null
  idea_id: string | null

  title: string
  description: string | null
  content_format: string | null
  channel: string | null
  copy_text: string | null
  hook: string | null
  cta: string | null
  hashtags: string[]
  visual_notes: string | null

  scheduled_date: string | null
  scheduled_time: string | null
  publish_date: string | null

  status: EditorialStatus

  task_id: string | null

  created_by: string | null
  created_at: string
  updated_at: string

  // Joined
  pillar?: EditorialPillar | null
  idea?: ContentIdea | null
  creator?: Profile | null
}

// -------------------------
// 5. Strategy Version
// -------------------------
export interface StrategyVersion {
  id: string
  agency_id: string
  strategy_id: string
  version_number: number
  snapshot: {
    strategy: ContentStrategy
    pillars: EditorialPillar[]
    created_at: string
  }
  notes: string | null
  created_by: string | null
  created_at: string
}

// -------------------------
// 6. Strategy Activity
// -------------------------
export interface StrategyActivity {
  id: string
  agency_id: string
  strategy_id: string
  actor_user_id: string | null
  action: string
  metadata: Record<string, unknown>
  created_at: string
  actor?: Profile | null
}

// -------------------------
// 7. Editorial Suggestion (from RPC)
// -------------------------
export interface EditorialSuggestion {
  pillar_id: string
  pillar_name: string
  pillar_color: string
  suggested_format: string
  suggested_date: string
  example_topics: string[]
}

// -------------------------
// 8. Form Types
// -------------------------
export interface CreateStrategyForm {
  name: string
  client_id: string | null
  briefing_id: string | null
  description: string
  objective: string
  target_audience: string
  tone_of_voice: string
  brand_positioning: string
  channels: string[]
  competitors: string[]
  key_messages: string[]
  restrictions: string[]
  period_start: string | null
  period_end: string | null
}

export interface CreatePillarForm {
  name: string
  description: string
  color: string
  icon: string
  percentage: number
  content_formats: string[]
  posting_frequency: string
  example_topics: string[]
}

export interface CreateIdeaForm {
  pillar_id: string | null
  title: string
  description: string
  content_format: string
  channel: string
  hook: string
  cta: string
  hashtags: string[]
}

export interface CreateEditorialItemForm {
  pillar_id: string | null
  idea_id: string | null
  title: string
  description: string
  content_format: string
  channel: string
  copy_text: string
  hook: string
  cta: string
  hashtags: string[]
  visual_notes: string
  scheduled_date: string | null
  scheduled_time: string | null
}

// -------------------------
// 9. Config Helpers
// -------------------------
export const STRATEGY_STATUS_CONFIG: Record<
  StrategyStatus,
  { label: string; badgeVariant: 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'outline' | 'info' }
> = {
  draft: { label: 'Rascunho', badgeVariant: 'outline' },
  active: { label: 'Ativa', badgeVariant: 'success' },
  paused: { label: 'Pausada', badgeVariant: 'warning' },
  completed: { label: 'Concluída', badgeVariant: 'info' },
  archived: { label: 'Arquivada', badgeVariant: 'neutral' },
}

export const IDEA_STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; badgeVariant: 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'outline' | 'info' }
> = {
  idea: { label: 'Ideia', badgeVariant: 'outline' },
  approved: { label: 'Aprovada', badgeVariant: 'success' },
  in_production: { label: 'Em Produção', badgeVariant: 'warning' },
  scheduled: { label: 'Agendada', badgeVariant: 'info' },
  published: { label: 'Publicada', badgeVariant: 'default' },
  discarded: { label: 'Descartada', badgeVariant: 'neutral' },
}

export const EDITORIAL_STATUS_CONFIG: Record<
  EditorialStatus,
  { label: string; badgeVariant: 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'outline' | 'info' }
> = {
  draft: { label: 'Rascunho', badgeVariant: 'outline' },
  in_review: { label: 'Em Revisão', badgeVariant: 'warning' },
  approved: { label: 'Aprovada', badgeVariant: 'success' },
  scheduled: { label: 'Agendada', badgeVariant: 'info' },
  published: { label: 'Publicada', badgeVariant: 'default' },
  paused: { label: 'Pausada', badgeVariant: 'neutral' },
}

export const CONTENT_FORMAT_CONFIG: Record<
  ContentFormat,
  { label: string; iconName: string }
> = {
  carrossel: { label: 'Carrossel', iconName: 'Layers' },
  reels: { label: 'Reels / Shorts', iconName: 'Film' },
  stories: { label: 'Stories', iconName: 'Smartphone' },
  post: { label: 'Post Estático', iconName: 'Image' },
  video: { label: 'Vídeo', iconName: 'Video' },
  artigo: { label: 'Artigo / Blog Post', iconName: 'FileText' },
  thread: { label: 'Thread / Texto', iconName: 'MessageSquare' },
  live: { label: 'Live / Ao Vivo', iconName: 'Radio' },
  podcast: { label: 'Podcast', iconName: 'Headphones' },
  newsletter: { label: 'Newsletter', iconName: 'Mail' },
  infografico: { label: 'Infográfico', iconName: 'BarChart3' },
  ebook: { label: 'E-book / Material Rico', iconName: 'BookOpen' },
}

export const SOCIAL_CHANNEL_CONFIG: Record<
  SocialChannel,
  { label: string; color: string; iconName: string }
> = {
  instagram: { label: 'Instagram', color: '#E4405F', iconName: 'Instagram' },
  tiktok: { label: 'TikTok', color: '#000000', iconName: 'Music' },
  linkedin: { label: 'LinkedIn', color: '#0077B5', iconName: 'Linkedin' },
  youtube: { label: 'YouTube', color: '#FF0000', iconName: 'Youtube' },
  twitter: { label: 'X / Twitter', color: '#1DA1F2', iconName: 'Twitter' },
  facebook: { label: 'Facebook', color: '#1877F2', iconName: 'Facebook' },
  blog: { label: 'Blog', color: '#C74410', iconName: 'Globe' },
  pinterest: { label: 'Pinterest', color: '#BD081C', iconName: 'Pin' },
  spotify: { label: 'Spotify', color: '#1DB954', iconName: 'Music' },
  newsletter: { label: 'Newsletter', color: '#14B8A6', iconName: 'Mail' },
}

export const DEFAULT_PILLAR_COLORS = [
  '#C74410',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#3B82F6',
  '#8B5CF6',
  '#EF4444',
  '#14B8A6',
]
