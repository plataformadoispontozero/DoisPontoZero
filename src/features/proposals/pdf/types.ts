// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF STUDIO TYPES
// ============================================================

import type { ProposalSection, ProposalItem, ProposalPricing } from '@/types/proposals'

export interface ProposalPdfBranding {
  agencyName: string
  logoUrl: string
  primaryColor: string
  website: string
  contactEmail: string
  contactPhone: string
  address: string
}

export interface ProposalPdfModel {
  proposalId: string
  title: string
  proposalNumber: string
  clientName: string
  clientCompany: string
  dateFormatted: string
  validUntilFormatted: string
  version: number
  sections: ProposalSection[]
  items: ProposalItem[]
  pricing: ProposalPricing
  branding: ProposalPdfBranding
}
