// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO + PROFESSIONAL PDF
// Domain types for Briefings, Templates, Questions and PDF
// ============================================================

import type { Client, Profile } from './projects'

export type BriefingCategory =
  | 'branding'
  | 'social_media'
  | 'motion'
  | 'audiovisual'
  | 'paid_media'
  | 'campaign'
  | 'general'
  | 'custom'

export type TemplateStatus = 'draft' | 'published' | 'archived'

export type BriefingStatus =
  | 'draft'
  | 'sent'
  | 'in_progress'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'changes_requested'
  | 'archived'

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'single_choice'
  | 'multiple_choice'
  | 'date'
  | 'number'
  | 'url'
  | 'email'
  | 'file_upload'

export interface QuestionOption {
  id: string
  label: string
  value: string
}

export interface QuestionValidationRules {
  minLength?: number
  maxLength?: number
  minNumber?: number
  maxNumber?: number
  allowedMimeTypes?: string[]
  maxFileSizeMb?: number
  regexPattern?: string
  placeholder?: string
}

// -------------------------
// 1. Template
// -------------------------
export interface BriefingTemplate {
  id: string
  agency_id: string
  name: string
  description: string | null
  category: BriefingCategory
  status: TemplateStatus
  version: number
  created_by: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  // Joined
  sections?: BriefingSection[]
  questions?: BriefingQuestion[]
  creator?: Profile | null
  briefings_count?: number
}

// -------------------------
// 2. Section
// -------------------------
export interface BriefingSection {
  id: string
  agency_id: string
  template_id: string
  title: string
  description: string | null
  position: number
  created_at: string
  updated_at: string
  // Joined
  questions?: BriefingQuestion[]
}

// -------------------------
// 3. Question
// -------------------------
export interface BriefingQuestion {
  id: string
  agency_id: string
  template_id: string
  section_id: string
  question_key: string
  label: string
  description: string | null
  question_type: QuestionType
  is_required: boolean
  position: number
  options: QuestionOption[]
  validation_rules: QuestionValidationRules
  created_at: string
  updated_at: string
}

// -------------------------
// 4. Briefing
// -------------------------
export interface Briefing {
  source_system?: string | null
  source_status?: string | null
  migration_review_pending?: boolean
  migrated_at?: string | null
  id: string
  agency_id: string
  client_id: string | null
  template_id: string
  template_version: number
  title: string
  description: string | null
  status: BriefingStatus
  created_by: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  approved_at: string | null
  archived_at: string | null
  // Joined
  client?: Client | null
  template?: BriefingTemplate | null
  creator?: Profile | null
  assignee?: Profile | null
  answers?: BriefingAnswer[]
  public_links?: BriefingPublicLink[]
  latest_version?: BriefingVersion | null
}

// -------------------------
// 5. Answer
// -------------------------
export interface BriefingAnswer {
  id: string
  agency_id: string
  briefing_id: string
  question_id: string
  answer_value: any // JSON value depending on QuestionType
  created_at: string
  updated_at: string
  // Joined
  question?: BriefingQuestion | null
}

// -------------------------
// 6. Public Link
// -------------------------
export interface BriefingPublicLink {
  id: string
  agency_id: string
  briefing_id: string
  token_hash: string
  expires_at: string | null
  revoked_at: string | null
  max_submissions: number
  submission_count: number
  created_by: string | null
  created_at: string
  // Virtual
  full_url?: string
}

// -------------------------
// 7. Attachment
// -------------------------
export interface BriefingAttachment {
  id: string
  agency_id: string
  briefing_id: string
  question_id: string | null
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  uploaded_at: string
}

// -------------------------
// 8. Version
// -------------------------
export interface BriefingVersion {
  id: string
  agency_id: string
  briefing_id: string
  version_number: number
  snapshot: {
    submitted_at: string
    answers: Record<string, any>
    template_id: string
    template_version: number
  }
  created_by: string | null
  created_at: string
}

// -------------------------
// 9. Export
// -------------------------
export interface BriefingExport {
  id: string
  agency_id: string
  briefing_id: string
  version_id: string | null
  file_path: string
  export_format: 'pdf' | string
  branding_snapshot: any
  generated_by: string | null
  generated_at: string
}

// -------------------------
// 10. Activity
// -------------------------
export interface BriefingActivity {
  id: string
  agency_id: string
  briefing_id: string
  actor_user_id: string | null
  action: string
  metadata: Record<string, any>
  created_at: string
  actor?: Profile | null
}

// ------------------------------------------------------------
// STRATEGY & PROPOSAL PREPARATION (Requisitos 18 e 19)
// ------------------------------------------------------------
export interface StrategyBriefingExtraction {
  briefingId: string
  clientId?: string
  targetAudience?: string
  mainObjectives?: string[]
  brandPositioning?: string
  toneOfVoice?: string
  competitors?: string[]
  visualReferences?: string[]
  channels?: string[]
  communicationRestrictions?: string[]
  rawExtractedData: Record<string, any>
}

export interface ProposalBriefingExtraction {
  briefingId: string
  clientId?: string
  scopeOverview?: string
  requestedServices?: string[]
  deliverables?: string[]
  targetDates?: string[]
  budgetRange?: string
  commercialNotes?: string
  rawExtractedData: Record<string, any>
}

// ------------------------------------------------------------
// STATUS & CONFIG HELPERS
// ------------------------------------------------------------
export const BRIEFING_STATUS_CONFIG: Record<
  BriefingStatus,
  { label: string; badgeVariant: 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'outline' | 'info' }
> = {
  draft: { label: 'Rascunho', badgeVariant: 'outline' },
  sent: { label: 'Enviado', badgeVariant: 'warning' },
  in_progress: { label: 'Em Preenchimento', badgeVariant: 'warning' },
  submitted: { label: 'Recebido', badgeVariant: 'default' },
  under_review: { label: 'Em Análise', badgeVariant: 'info' },
  approved: { label: 'Aprovado', badgeVariant: 'success' },
  changes_requested: { label: 'Ajustes Solicitados', badgeVariant: 'error' },
  archived: { label: 'Arquivado', badgeVariant: 'neutral' },
}

export const BRIEFING_CATEGORY_CONFIG: Record<
  BriefingCategory,
  { label: string; description: string; color: string }
> = {
  branding: { label: 'Branding & Identidade', description: 'Manual de marca, tom e posicionamento', color: '#C74410' },
  social_media: { label: 'Social Media', description: 'Linhas editoriais, tom de voz e formatos', color: '#10B981' },
  motion: { label: 'Motion Design', description: 'Animações 2D/3D, vinhetas e entregáveis', color: '#F59E0B' },
  audiovisual: { label: 'Audiovisual & Vídeo', description: 'Produções em vídeo, roteiros e diárias', color: '#EC4899' },
  paid_media: { label: 'Mídia Paga & Performance', description: 'Campanhas, metas de ROAS e criativos', color: '#3B82F6' },
  campaign: { label: 'Campanha Publicitária', description: 'Conceito, canais integrados e cronograma', color: '#8B5CF6' },
  general: { label: 'Geral', description: 'Demandas pontuais e alinhamentos de escopo', color: '#6B7280' },
  custom: { label: 'Personalizado', description: 'Template sob medida para a agência', color: '#14B8A6' },
}

export const QUESTION_TYPE_CONFIG: Record<
  QuestionType,
  { label: string; description: string; iconName: string }
> = {
  short_text: { label: 'Texto Curto', description: 'Títulos, nomes ou respostas pontuais (1 linha)', iconName: 'Type' },
  long_text: { label: 'Texto Longo', description: 'Descrições, histórico e detalhes aprofundados', iconName: 'AlignLeft' },
  single_choice: { label: 'Escolha Única', description: 'Seleção exclusiva entre múltiplas opções', iconName: 'CheckCircle' },
  multiple_choice: { label: 'Múltipla Escolha', description: 'Seleção múltipla de opções ou formatos', iconName: 'ListChecks' },
  date: { label: 'Data', description: 'Prazos desejados, eventos ou lançamentos', iconName: 'Calendar' },
  number: { label: 'Número', description: 'Quantidades, valores ou metas numéricas', iconName: 'Hash' },
  url: { label: 'Link / URL', description: 'Links para referências, concorrentes ou pastas', iconName: 'Link' },
  email: { label: 'E-mail', description: 'E-mails de contato e stakeholders', iconName: 'Mail' },
  file_upload: { label: 'Upload de Arquivo', description: 'Anexos, imagens, logos e PDFs', iconName: 'Upload' },
}
