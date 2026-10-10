// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL PDF MODEL TRANSFORMER
// Convert raw Proposal domain entity into immutable PDF model
// ============================================================

import type { Proposal } from '@/types/proposals'
import type { ProposalPdfModel } from './types'
import { defaultBranding } from '@/config/branding'

export function transformProposalToPdfModel(
  proposal: Proposal,
  customBranding?: Record<string, any>
): ProposalPdfModel {
  const agencyName = customBranding?.agencyName || defaultBranding.company?.legalName || defaultBranding.name || 'Matriz Criativa Agência OS'
  const logoUrl = customBranding?.logoUrl || ''
  const primaryColor = customBranding?.primaryColor || defaultBranding.colors.primary || '#7952FF'
  const website = customBranding?.website || 'https://doiszero.com'
  const contactEmail = customBranding?.contactEmail || 'contato@doiszero.com'
  const contactPhone = customBranding?.contactPhone || '(11) 99999-0000'
  const address = customBranding?.address || 'São Paulo, SP'

  const dateFormatted = new Date(proposal.created_at || Date.now()).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const validUntilFormatted = proposal.valid_until
    ? new Date(proposal.valid_until).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '30 dias a partir da emissão'

  return {
    proposalId: proposal.id,
    title: proposal.title || 'Proposta Comercial',
    proposalNumber: proposal.proposal_number || 'PROP-001',
    clientName: proposal.client_name || 'Cliente',
    clientCompany: proposal.client_company || proposal.client_name || 'Empresa Cliente',
    dateFormatted,
    validUntilFormatted,
    version: 1,
    sections: proposal.sections || [],
    items: proposal.items || [],
    pricing: proposal.pricing || {
      id: 'p-1',
      agency_id: proposal.agency_id || 'demo-agency',
      proposal_id: proposal.id,
      subtotal_cents: 0,
      discount_cents: 0,
      fees_cents: 0,
      total_cents: 0,
      one_time_total_cents: 0,
      recurring_monthly_total_cents: 0,
      currency: 'BRL',
      billing_frequency: 'Mensal',
      payment_terms: '50% entrada + 50% entrega',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    branding: {
      agencyName,
      logoUrl,
      primaryColor,
      website,
      contactEmail,
      contactPhone,
      address,
    },
  }
}
