// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION STUDIO
// Domain Types & Interfaces
// ============================================================

import type { DriveFileReference } from './drive'

export type PresentationStatus = 'draft' | 'internal_review' | 'approved' | 'published' | 'archived'

export type PresentationSectionType =
  | 'cover'
  | 'overview'
  | 'objectives'
  | 'deliverables'
  | 'gallery'
  | 'video'
  | 'results'
  | 'insights'
  | 'next_steps'
  | 'closing'
  | 'custom'

export interface PresentationSection {
  id: string
  agency_id: string
  presentation_id: string
  section_type: PresentationSectionType
  title: string
  description?: string | null
  content: Record<string, any>
  position: number
  created_at: string
  updated_at: string
}

export interface PresentationAsset {
  id: string
  agency_id: string
  presentation_id: string
  section_id?: string | null
  file_reference_id?: string | null
  title: string
  description?: string | null
  position: number
  created_at: string
  file_reference?: DriveFileReference
}

export interface Presentation {
  id: string
  agency_id: string
  client_id: string
  title: string
  description?: string | null
  period_month: number
  period_year: number
  status: PresentationStatus
  created_by?: string | null
  owner_id?: string | null
  production_project_id?: string | null
  created_at: string
  updated_at: string
  published_at?: string | null
  archived_at?: string | null

  // Joined fields
  client_name?: string
  client_logo_url?: string
  sections?: PresentationSection[]
  assets?: PresentationAsset[]
  public_token?: string
}

export interface PresentationTemplate {
  id: string
  name: string
  description: string
  category: string
  sections_snapshot: Array<Partial<PresentationSection>>
}

export interface PresentationPdfModel {
  presentationId: string
  title: string
  clientName: string
  periodFormatted: string
  sections: PresentationSection[]
  assets: PresentationAsset[]
  branding: {
    agencyName: string
    logoUrl: string
    primaryColor: string
    website: string
  }
}
