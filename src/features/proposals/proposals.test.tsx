// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL STUDIO UNIT & INTEGRATION TESTS
// ============================================================

import { describe, it, expect } from 'vitest'
import { calculateProposalPricing, formatCurrencyCents } from './services/pricingEngine'
import { importDataFromBriefing } from './services/briefingIntegration'
import { importDataFromStrategy } from './services/strategyIntegration'
import { transformProposalToPdfModel } from './pdf/transformProposalToPdfModel'
import type { ProposalItem, Proposal } from '@/types/proposals'

describe('FASE 08: Proposal Studio & Pricing Engine', () => {
  it('calculates pricing in cents with pure integer arithmetic and handles discounts', () => {
    const items: ProposalItem[] = [
      {
        id: '1',
        agency_id: 'demo',
        proposal_id: 'p1',
        name: 'Gestão Social Media',
        quantity: 1,
        unit: 'mês',
        unit_price_cents: 350000, // R$ 3.500,00
        discount_cents: 0,
        total_cents: 350000,
        billing_type: 'recurring',
        position: 0,
        created_at: '',
        updated_at: '',
      },
      {
        id: '2',
        agency_id: 'demo',
        proposal_id: 'p1',
        name: 'Setup de Marca',
        quantity: 1,
        unit: 'projeto',
        unit_price_cents: 150000, // R$ 1.500,00
        discount_cents: 50000, // R$ 500,00 desc
        total_cents: 100000,
        billing_type: 'one_time',
        position: 1,
        created_at: '',
        updated_at: '',
      },
    ]

    const result = calculateProposalPricing(items, 0, 0, 'BRL')

    expect(result.subtotal_cents).toBe(450000) // 3500 + 1000 = 4500
    expect(result.recurring_monthly_total_cents).toBe(350000) // R$ 3.500,00
    expect(result.one_time_total_cents).toBe(100000) // R$ 1.000,00
    expect(result.total_cents).toBe(450000)
    expect(result.formatted_total).toContain('4.500,00')
  })

  it('separates optional items from active total calculations', () => {
    const items: ProposalItem[] = [
      {
        id: '1',
        agency_id: 'demo',
        proposal_id: 'p1',
        name: 'Vídeo Institucional Opcional',
        quantity: 1,
        unit: 'vídeo',
        unit_price_cents: 200000,
        discount_cents: 0,
        total_cents: 200000,
        billing_type: 'optional',
        position: 0,
        created_at: '',
        updated_at: '',
      },
    ]

    const result = calculateProposalPricing(items)

    expect(result.subtotal_cents).toBe(0)
    expect(result.total_cents).toBe(0)
    expect(result.optional_total_cents).toBe(200000)
  })

  it('formats currency values correctly in BRL', () => {
    expect(formatCurrencyCents(125050)).toContain('1.250,50')
    expect(formatCurrencyCents(0)).toContain('0,00')
  })

  it('imports client briefing answers into proposal sections', () => {
    const mockBriefing: any = {
      id: 'b-100',
      client_name: 'Starlight Tech',
      company_name: 'Starlight Technology Inc',
      title: 'Briefing para Reposicionamento',
      created_at: '2026-10-10T12:00:00Z',
      answers: {
        desafios: 'Expandir o alcance no mercado nacional.',
        goals: ['Aumentar o ROI de campanhas', 'Melhorar a percepção visual da marca'],
      },
    }

    const imported = importDataFromBriefing(mockBriefing)

    expect(imported.proposalTitle).toContain('Starlight Tech')
    expect(imported.suggestedSections.length).toBeGreaterThan(0)
    expect(imported.suggestedSections[1].content?.text).toContain('Expandir o alcance')
  })

  it('imports strategy studio diagnosis into proposal sections', () => {
    const mockStrategy: any = {
      id: 'strat-100',
      title: 'Estratégia 2026',
      diagnosis: 'Marca com boa tração mas baixa frequência de publicação.',
      target_positioning: 'Líder em tecnologia B2B',
      main_channels: ['Instagram', 'LinkedIn'],
    }

    const imported = importDataFromStrategy(mockStrategy)

    expect(imported.strategyTitle).toBe('Estratégia 2026')
    expect(imported.suggestedSections[0].content?.text).toContain('Marca com boa tração')
  })

  it('transforms Proposal domain entity into ProposalPdfModel', () => {
    const mockProp: Proposal = {
      id: 'p-99',
      agency_id: 'demo-agency',
      client_id: 'cli-1',
      client_name: 'Acme Corp',
      client_company: 'Acme Inc',
      title: 'Proposta Comercial Especial',
      proposal_number: 'PROP-99',
      status: 'draft',
      currency: 'BRL',
      created_at: '2026-10-10T00:00:00Z',
      updated_at: '2026-10-10T00:00:00Z',
    }

    const pdfModel = transformProposalToPdfModel(mockProp)

    expect(pdfModel.proposalNumber).toBe('PROP-99')
    expect(pdfModel.clientName).toBe('Acme Corp')
    expect(pdfModel.branding.agencyName).toBeDefined()
  })
})
