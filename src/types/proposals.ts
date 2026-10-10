// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL STUDIO + COMMERCIAL PROPOSALS
// Domain Types & Interfaces
// ============================================================

export type ProposalStatus =
  | 'draft'
  | 'internal_review'
  | 'approved'
  | 'published'
  | 'viewed'
  | 'negotiation'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'archived'

export type SectionType =
  | 'cover'
  | 'introduction'
  | 'diagnosis'
  | 'objectives'
  | 'scope'
  | 'services'
  | 'deliverables'
  | 'timeline'
  | 'investment'
  | 'terms'
  | 'team'
  | 'portfolio'
  | 'closing'
  | 'custom'

export type PricingModel = 'fixed' | 'monthly' | 'hourly' | 'unit' | 'custom'

export type BillingType = 'one_time' | 'recurring' | 'optional'

export type TemplateStatus = 'draft' | 'published' | 'archived'

export type ApprovalDecision = 'approved' | 'changes_requested' | 'rejected'

export type ProposalEventType =
  | 'created'
  | 'edited'
  | 'submitted_for_review'
  | 'approved'
  | 'published'
  | 'opened'
  | 'negotiation_started'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'archived'

export interface AgencyService {
  id: string
  agency_id: string
  name: string
  description?: string | null
  category: string
  pricing_model: PricingModel
  base_price_cents: number
  currency: string
  estimated_duration?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProposalSection {
  id: string
  agency_id: string
  proposal_id: string
  section_type: SectionType
  title: string
  content: Record<string, any>
  position: number
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface ProposalItem {
  id: string
  agency_id: string
  proposal_id: string
  service_id?: string | null
  name: string
  description?: string | null
  quantity: number
  unit: string
  unit_price_cents: number
  discount_cents: number
  total_cents: number
  billing_type: BillingType
  position: number
  created_at: string
  updated_at: string
}

export interface ProposalPricing {
  id: string
  agency_id: string
  proposal_id: string
  subtotal_cents: number
  discount_cents: number
  fees_cents: number
  total_cents: number
  one_time_total_cents: number
  recurring_monthly_total_cents: number
  currency: string
  billing_frequency: string
  payment_terms: string
  created_at: string
  updated_at: string
}

export interface Proposal {
  id: string
  agency_id: string
  client_id: string
  briefing_id?: string | null
  briefing_version_id?: string | null
  strategy_id?: string | null
  title: string
  proposal_number: string
  description?: string | null
  status: ProposalStatus
  currency: string
  valid_until?: string | null
  created_by?: string | null
  owner_id?: string | null
  created_at: string
  updated_at: string
  published_at?: string | null
  accepted_at?: string | null
  rejected_at?: string | null
  archived_at?: string | null

  // Virtual joined fields
  client_name?: string
  client_company?: string
  client_logo_url?: string
  briefing_title?: string
  strategy_title?: string
  sections?: ProposalSection[]
  items?: ProposalItem[]
  pricing?: ProposalPricing
  public_token?: string
}

export interface ProposalTemplate {
  id: string
  agency_id: string
  name: string
  description?: string | null
  category: string
  status: TemplateStatus
  version: number
  sections_snapshot: Array<Partial<ProposalSection>>
  items_snapshot: Array<Partial<ProposalItem>>
  created_by?: string | null
  created_at: string
  updated_at: string
  archived_at?: string | null
}

export interface ProposalVersion {
  id: string
  agency_id: string
  proposal_id: string
  version_number: number
  snapshot: {
    proposal: Omit<Proposal, 'sections' | 'items' | 'pricing'>
    sections: ProposalSection[]
    items: ProposalItem[]
    pricing: ProposalPricing
  }
  created_by?: string | null
  created_at: string
}

export interface ProposalApproval {
  id: string
  agency_id: string
  proposal_id: string
  version_id?: string | null
  reviewer_id?: string | null
  reviewer_name?: string
  decision: ApprovalDecision
  comment?: string | null
  created_at: string
}

export interface ProposalPublicLink {
  id: string
  agency_id: string
  proposal_id: string
  version_id?: string | null
  token_hash: string
  expires_at?: string | null
  revoked_at?: string | null
  created_by?: string | null
  created_at: string
}

export interface ProposalEvent {
  id: string
  agency_id: string
  proposal_id: string
  event_type: ProposalEventType
  actor_user_id?: string | null
  actor_name?: string
  metadata: Record<string, any>
  created_at: string
}

export interface ProposalExport {
  id: string
  agency_id: string
  proposal_id: string
  version_id?: string | null
  storage_path: string
  branding_snapshot: Record<string, any>
  generated_by?: string | null
  generated_at: string
}

export interface PricingEngineResult {
  subtotal_cents: number
  discount_cents: number
  fees_cents: number
  total_cents: number
  one_time_total_cents: number
  recurring_monthly_total_cents: number
  optional_total_cents: number
  formatted_subtotal: string
  formatted_discount: string
  formatted_fees: string
  formatted_total: string
  formatted_one_time: string
  formatted_recurring: string
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
  branding: {
    agencyName: string
    logoUrl: string
    primaryColor: string
    website: string
    contactEmail: string
    contactPhone: string
    address: string
  }
}
