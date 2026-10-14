// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION PDF TYPES
// ============================================================

import type { PresentationSection, PresentationAsset } from '@/types/presentations'

export interface PresentationPdfBranding {
  agencyName: string
  logoUrl: string
  primaryColor: string
  website: string
}

export interface PresentationPdfModel {
  mediaWarnings?: number
  presentationId: string
  title: string
  clientName: string
  periodFormatted: string
  dateFormatted: string
  sections: PresentationSection[]
  assets: PresentationAsset[]
  branding: PresentationPdfBranding
}
