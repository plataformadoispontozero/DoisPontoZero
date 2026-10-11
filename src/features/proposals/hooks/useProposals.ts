import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL STUDIO HOOKS
// State management & TanStack Query hooks with local fallback
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Proposal,
  AgencyService,
  ProposalTemplate,
  ProposalSection,
  ProposalItem,
  ProposalApproval,
  ProposalEvent,
  ProposalStatus,
} from '@/types/proposals'
import { DEFAULT_AGENCY_SERVICES } from '../constants/initialServices'
import { INITIAL_PROPOSAL_TEMPLATES } from '../constants/initialTemplates'
import { calculateProposalPricing } from '../services/pricingEngine'

// Mock Initial Proposals for Demo Mode
const DEMO_PROPOSALS: Proposal[] = [
  {
    id: 'prop-001',
    agency_id: 'demo-agency',
    client_id: 'cli-001',
    client_name: 'Acme Corp',
    client_company: 'Acme Corp Brasil',
    title: 'Campanha de Posicionamento & Social Media',
    proposal_number: 'PROP-2026-001',
    description: 'Gestão completa de redes sociais, produção de vídeos reels e branding estético.',
    status: 'published',
    currency: 'BRL',
    valid_until: '2026-11-15',
    created_at: '2026-10-10T10:00:00Z',
    updated_at: '2026-10-10T10:00:00Z',
    public_token: 'token_acme_2026_demo_secure',
    sections: INITIAL_PROPOSAL_TEMPLATES[0].sections_snapshot as ProposalSection[],
    items: INITIAL_PROPOSAL_TEMPLATES[0].items_snapshot as ProposalItem[],
    pricing: {
      id: 'price-001',
      agency_id: 'demo-agency',
      proposal_id: 'prop-001',
      subtotal_cents: 500000,
      discount_cents: 0,
      fees_cents: 0,
      total_cents: 500000,
      one_time_total_cents: 150000,
      recurring_monthly_total_cents: 350000,
      currency: 'BRL',
      billing_frequency: 'Mensal',
      payment_terms: '50% entrada + mensalidades subsequentes',
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-10T10:00:00Z',
    },
  },
  {
    id: 'prop-002',
    agency_id: 'demo-agency',
    client_id: 'cli-002',
    client_name: 'Starlight Tech',
    client_company: 'Starlight Technology Inc',
    title: 'Redesenho de Marca & Identidade Visual',
    proposal_number: 'PROP-2026-002',
    description: 'Desenvolvimento de manual de marca, logotipo vetorizado e assets corporativos.',
    status: 'draft',
    currency: 'BRL',
    valid_until: '2026-11-30',
    created_at: '2026-10-09T14:30:00Z',
    updated_at: '2026-10-09T14:30:00Z',
    public_token: 'token_starlight_demo',
    sections: INITIAL_PROPOSAL_TEMPLATES[1].sections_snapshot as ProposalSection[],
    items: INITIAL_PROPOSAL_TEMPLATES[1].items_snapshot as ProposalItem[],
    pricing: {
      id: 'price-002',
      agency_id: 'demo-agency',
      proposal_id: 'prop-002',
      subtotal_cents: 850000,
      discount_cents: 50000,
      fees_cents: 0,
      total_cents: 800000,
      one_time_total_cents: 800000,
      recurring_monthly_total_cents: 0,
      currency: 'BRL',
      billing_frequency: 'Pontual',
      payment_terms: '50% no aceite e 50% na aprovação final',
      created_at: '2026-10-09T14:30:00Z',
      updated_at: '2026-10-09T14:30:00Z',
    },
  },
]

// In-memory demo store
let demoProposalsStore = [...DEMO_PROPOSALS]
let demoServicesStore = [...DEFAULT_AGENCY_SERVICES]
let demoTemplatesStore = [...INITIAL_PROPOSAL_TEMPLATES]

// 1. Hook: Fetch All Proposals
export function useProposals() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['proposals'],
    queryFn: async (): Promise<Proposal[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('proposals')
            .select(`
              *,
              clients (name, logo_url),
              proposal_sections (*),
              proposal_items (*),
              proposal_pricing (*)
            `)
            .eq('agency_id', agencyId)
            .order('created_at', { ascending: false })

          if (error) throw error
          if (data) {
            return data.map((p: any) => ({
              ...p,
              client_name: p.clients?.name,
              client_company: p.clients?.company_name,
              client_logo_url: p.clients?.logo_url,
              sections: p.proposal_sections || [],
              items: p.proposal_items || [],
              pricing: p.proposal_pricing?.[0] || p.proposal_pricing,
            }))
          }
        } catch (err) {
          throw err
        }
      }
      return demoProposalsStore
    },
  })
}

// 2. Hook: Fetch Single Proposal by ID
export function useProposal(proposalId?: string) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['proposal', proposalId],
    enabled: Boolean(proposalId),
    queryFn: async (): Promise<Proposal | null> => {
      if (!proposalId) return null
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('proposals')
            .select(`
              *,
              clients (name, logo_url),
              proposal_sections (*),
              proposal_items (*),
              proposal_pricing (*)
            `)
            .eq('id', proposalId)
            .single()

          if (error) throw error
          if (data) {
            return {
              ...data,
              client_name: data.clients?.name,
              client_company: data.clients?.company_name,
              client_logo_url: data.clients?.logo_url,
              sections: (data.proposal_sections || []).sort((a: any, b: any) => a.position - b.position),
              items: (data.proposal_items || []).sort((a: any, b: any) => a.position - b.position),
              pricing: data.proposal_pricing?.[0] || data.proposal_pricing,
            }
          }
        } catch (err) {
          throw err
        }
      }
      const found = demoProposalsStore.find((p) => p.id === proposalId)
      return found || null
    },
  })
}

// 3. Hook: Fetch Catalog Services
export function useAgencyServices() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['agency_services'],
    queryFn: async (): Promise<AgencyService[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('agency_services')
            .select('*')
            .eq('is_active', true)
            .order('name', { ascending: true })

          if (error) throw error
          if (data) {
            return data
          }
        } catch (err) {
          throw err
        }
      }
      return demoServicesStore
    },
  })
}

// 4. Hook: Fetch Commercial Templates
export function useProposalTemplates() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['proposal_templates'],
    queryFn: async (): Promise<ProposalTemplate[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('proposal_templates')
            .select('*')
            .eq('agency_id', agencyId)
            .order('created_at', { ascending: false })

          if (error) throw error
          if (data) {
            return data
          }
        } catch (err) {
          throw err
        }
      }
      return demoTemplatesStore
    },
  })
}

// 5. Hook: Create New Proposal
export function useCreateProposal() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      client_id: string
      client_name?: string
      client_company?: string
      briefing_id?: string
      strategy_id?: string
      template_id?: string
      description?: string
    }): Promise<Proposal> => {
      if (supabase && isSupabaseConfigured) {
        if (!auth.user || !agencyId) throw new Error('Sessão e agência são obrigatórias.')
        if (payload.template_id) throw new Error('Aplicação de modelo exige transação de seções e itens no backend; integração pendente.')
        const { data, error } = await supabase.from('proposals').insert({
          agency_id: agencyId, client_id: payload.client_id, title: payload.title.trim(),
          description: payload.description || null, briefing_id: payload.briefing_id || null,
          strategy_id: payload.strategy_id || null, created_by: auth.user.id, owner_id: auth.user.id,
          proposal_number: `PROP-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8)}`, status: 'draft',
        }).select('*').single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['proposals'] })
        return { ...data, sections: [], items: [] } as Proposal
      }
      const newId = `prop-${Date.now()}`
      const propNumber = `PROP-2026-${Math.floor(100 + Math.random() * 900)}`

      // Apply template if selected
      let templateSections: ProposalSection[] = []
      let templateItems: ProposalItem[] = []

      if (payload.template_id) {
        const foundTmpl = demoTemplatesStore.find((t) => t.id === payload.template_id)
        if (foundTmpl) {
          templateSections = foundTmpl.sections_snapshot.map((s, idx) => ({
            id: `sec-${newId}-${idx}`,
            agency_id: agencyId,
            proposal_id: newId,
            section_type: s.section_type || 'custom',
            title: s.title || 'Seção',
            content: s.content || {},
            position: idx,
            is_visible: s.is_visible !== false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
          templateItems = foundTmpl.items_snapshot.map((i, idx) => ({
            id: `item-${newId}-${idx}`,
            agency_id: agencyId,
            proposal_id: newId,
            service_id: i.service_id || null,
            name: i.name || 'Serviço',
            description: i.description || '',
            quantity: i.quantity || 1,
            unit: i.unit || 'unidade',
            unit_price_cents: i.unit_price_cents || 0,
            discount_cents: i.discount_cents || 0,
            total_cents: i.total_cents || 0,
            billing_type: i.billing_type || 'one_time',
            position: idx,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        }
      }

      const pricingResult = calculateProposalPricing(templateItems)

      const newProposal: Proposal = {
        id: newId,
        agency_id: agencyId,
        client_id: payload.client_id,
        client_name: payload.client_name || 'Cliente Selecionado',
        client_company: payload.client_company || payload.client_name || 'Empresa Cliente',
        briefing_id: payload.briefing_id,
        strategy_id: payload.strategy_id,
        title: payload.title,
        proposal_number: propNumber,
        description: payload.description || '',
        status: 'draft',
        currency: 'BRL',
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sections: templateSections,
        items: templateItems,
        pricing: {
          id: `price-${newId}`,
          agency_id: agencyId,
          proposal_id: newId,
          subtotal_cents: pricingResult.subtotal_cents,
          discount_cents: pricingResult.discount_cents,
          fees_cents: pricingResult.fees_cents,
          total_cents: pricingResult.total_cents,
          one_time_total_cents: pricingResult.one_time_total_cents,
          recurring_monthly_total_cents: pricingResult.recurring_monthly_total_cents,
          currency: 'BRL',
          billing_frequency: 'Mensal',
          payment_terms: '50% entrada + mensalidades',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('proposals').insert({
            id: newProposal.id,
            agency_id: newProposal.agency_id,
            client_id: newProposal.client_id,
            briefing_id: newProposal.briefing_id,
            strategy_id: newProposal.strategy_id,
            title: newProposal.title,
            proposal_number: newProposal.proposal_number,
            description: newProposal.description,
            status: newProposal.status,
            valid_until: newProposal.valid_until,
          })
        } catch (err) {
          throw err
        }
      }

      demoProposalsStore = [newProposal, ...demoProposalsStore]
      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      return newProposal
    },
  })
}

// 6. Hook: Update Proposal Status & Content
export function useUpdateProposal() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: string
      status?: ProposalStatus
      sections?: ProposalSection[]
      items?: ProposalItem[]
      title?: string
      description?: string
    }): Promise<Proposal> => {
      if (supabase && isSupabaseConfigured) {
        if (payload.items || payload.sections) throw new Error('Salvar itens e seções exige transação e cálculo de preço no backend; integração pendente.')
        if (payload.status && !['draft', 'internal_review', 'archived'].includes(payload.status)) throw new Error('Essa transição exige o fluxo autorizado de aprovação/publicação no backend.')
        const { data, error } = await supabase.from('proposals').update({
          title: payload.title, description: payload.description, status: payload.status,
        }).eq('agency_id', agencyId).eq('id', payload.id).select('*').single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['proposals'] }); queryClient.invalidateQueries({ queryKey: ['proposal', payload.id] })
        return data as Proposal
      }
      const foundIdx = demoProposalsStore.findIndex((p) => p.id === payload.id)
      if (foundIdx === -1) throw new Error('Proposta não encontrada')

      const current = demoProposalsStore[foundIdx]
      const updatedSections = payload.sections || current.sections || []
      const updatedItems = payload.items || current.items || []
      const pricingResult = calculateProposalPricing(updatedItems)

      const updated: Proposal = {
        ...current,
        title: payload.title !== undefined ? payload.title : current.title,
        description: payload.description !== undefined ? payload.description : current.description,
        status: payload.status !== undefined ? payload.status : current.status,
        updated_at: new Date().toISOString(),
        sections: updatedSections,
        items: updatedItems,
        pricing: {
          ...current.pricing!,
          subtotal_cents: pricingResult.subtotal_cents,
          discount_cents: pricingResult.discount_cents,
          fees_cents: pricingResult.fees_cents,
          total_cents: pricingResult.total_cents,
          one_time_total_cents: pricingResult.one_time_total_cents,
          recurring_monthly_total_cents: pricingResult.recurring_monthly_total_cents,
          updated_at: new Date().toISOString(),
        },
      }

      if (payload.status === 'published' && !updated.published_at) {
        updated.published_at = new Date().toISOString()
      } else if (payload.status === 'accepted' && !updated.accepted_at) {
        updated.accepted_at = new Date().toISOString()
      } else if (payload.status === 'rejected' && !updated.rejected_at) {
        updated.rejected_at = new Date().toISOString()
      } else if (payload.status === 'archived' && !updated.archived_at) {
        updated.archived_at = new Date().toISOString()
      }

      demoProposalsStore[foundIdx] = updated

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('proposals').update({
            title: updated.title,
            description: updated.description,
            status: updated.status,
            updated_at: updated.updated_at,
            published_at: updated.published_at,
            accepted_at: updated.accepted_at,
            rejected_at: updated.rejected_at,
            archived_at: updated.archived_at,
          }).eq('id', payload.id)
        } catch (err) {
          throw err
        }
      }

      queryClient.invalidateQueries({ queryKey: ['proposals'] })
      queryClient.invalidateQueries({ queryKey: ['proposal', payload.id] })
      return updated
    },
  })
}

// 7. Hook: Save Service to Catalog
export function useSaveService() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (serviceData: Partial<AgencyService>): Promise<AgencyService> => {
      const isEdit = Boolean(serviceData.id)
      const serviceId = serviceData.id || `service-${Date.now()}`

      const service: AgencyService = {
        id: serviceId,
        agency_id: agencyId,
        name: serviceData.name || 'Novo Serviço',
        description: serviceData.description || '',
        category: serviceData.category || 'Geral',
        pricing_model: serviceData.pricing_model || 'fixed',
        base_price_cents: serviceData.base_price_cents || 0,
        currency: 'BRL',
        estimated_duration: serviceData.estimated_duration || 'Sob consulta',
        is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
        created_at: serviceData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (isEdit) {
        demoServicesStore = demoServicesStore.map((s) => (s.id === serviceId ? service : s))
      } else {
        demoServicesStore = [service, ...demoServicesStore]
      }

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('agency_services').upsert(service)
        } catch (err) {
          throw err
        }
      }

      queryClient.invalidateQueries({ queryKey: ['agency_services'] })
      return service
    },
  })
}
