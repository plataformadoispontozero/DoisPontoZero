// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 07: STRATEGY STUDIO
// TanStack Query Hooks for Content Strategies, Pillars, Ideas & Editorial
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  ContentStrategy,
  EditorialPillar,
  ContentIdea,
  EditorialItem,
  StrategyStatus,
  IdeaStatus,
  EditorialStatus,
  EditorialSuggestion,
  StrategyVersion,
  StrategyActivity,
} from '@/types/strategy'

// ============================================================
// DEMO DATA (used when Supabase is not configured)
// ============================================================
function getDemoStrategies(agencyId: string): ContentStrategy[] {
  return [
    {
      id: 'demo-strategy-1',
      agency_id: agencyId,
      client_id: null,
      briefing_id: null,
      name: 'Estratégia Social Q4 2026',
      description: 'Plano de conteúdo para redes sociais no último trimestre do ano.',
      slug: 'social-q4-2026',
      objective: 'Aumentar engajamento e gerar leads qualificados',
      target_audience: 'Empreendedores digitais, 25-40 anos',
      tone_of_voice: 'Profissional porém acessível, com autoridade técnica',
      brand_positioning: 'Referência em marketing digital para PMEs',
      channels: ['instagram', 'linkedin', 'youtube'],
      competitors: ['Agência Alpha', 'Studio Beta'],
      key_messages: ['Resultados reais', 'Processos criativos', 'Dados orientam decisões'],
      restrictions: ['Não mencionar concorrentes', 'Evitar linguagem técnica excessiva'],
      visual_references: [],
      status: 'active',
      period_start: '2026-10-01',
      period_end: '2026-12-31',
      created_by: null,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      pillars: getDemoPillars(agencyId, 'demo-strategy-1'),
      ideas_count: 12,
      editorial_items_count: 8,
      published_count: 3,
    },
    {
      id: 'demo-strategy-2',
      agency_id: agencyId,
      client_id: null,
      briefing_id: null,
      name: 'Branding Launch — Nova Marca',
      description: 'Estratégia de lançamento para rebranding completo.',
      slug: 'branding-launch',
      objective: 'Posicionar a nova identidade visual no mercado',
      target_audience: 'Público geral da marca + imprensa',
      tone_of_voice: 'Inspirador e institucional',
      brand_positioning: 'Inovação com propósito',
      channels: ['instagram', 'linkedin', 'blog'],
      competitors: [],
      key_messages: ['Nova era', 'Design com propósito'],
      restrictions: [],
      visual_references: [],
      status: 'draft',
      period_start: '2026-11-01',
      period_end: '2026-12-15',
      created_by: null,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
      archived_at: null,
      pillars: [],
      ideas_count: 4,
      editorial_items_count: 0,
      published_count: 0,
    },
  ]
}

function getDemoPillars(agencyId: string, strategyId: string): EditorialPillar[] {
  return [
    {
      id: 'demo-pillar-1',
      agency_id: agencyId,
      strategy_id: strategyId,
      name: 'Autoridade',
      description: 'Conteúdos que posicionam a marca como referência técnica no segmento.',
      color: '#7952FF',
      icon: 'Award',
      percentage: 30,
      position: 0,
      content_formats: ['carrossel', 'artigo', 'video'],
      posting_frequency: '3x por semana',
      example_topics: ['Tendências do mercado', 'Cases de sucesso', 'Dados e pesquisas'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-pillar-2',
      agency_id: agencyId,
      strategy_id: strategyId,
      name: 'Conexão',
      description: 'Conteúdos humanizados que criam proximidade com a audiência.',
      color: '#10B981',
      icon: 'Heart',
      percentage: 25,
      position: 1,
      content_formats: ['stories', 'reels', 'post'],
      posting_frequency: '4x por semana',
      example_topics: ['Bastidores', 'Equipe', 'Depoimentos de clientes'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-pillar-3',
      agency_id: agencyId,
      strategy_id: strategyId,
      name: 'Educação',
      description: 'Dicas práticas e tutoriais que geram valor imediato para o público.',
      color: '#3B82F6',
      icon: 'BookOpen',
      percentage: 25,
      position: 2,
      content_formats: ['carrossel', 'reels', 'thread'],
      posting_frequency: '2x por semana',
      example_topics: ['Tutoriais', 'Checklists', 'Dicas rápidas', 'Ferramentas'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-pillar-4',
      agency_id: agencyId,
      strategy_id: strategyId,
      name: 'Vendas',
      description: 'Conteúdos orientados à conversão e geração de leads.',
      color: '#F59E0B',
      icon: 'Target',
      percentage: 20,
      position: 3,
      content_formats: ['post', 'stories', 'video'],
      posting_frequency: '2x por semana',
      example_topics: ['Ofertas', 'Provas sociais', 'CTAs diretos', 'Lançamentos'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

function getDemoIdeas(agencyId: string, strategyId: string): ContentIdea[] {
  return [
    {
      id: 'demo-idea-1',
      agency_id: agencyId,
      strategy_id: strategyId,
      pillar_id: 'demo-pillar-1',
      title: 'Carrossel: 5 tendências de marketing digital para 2027',
      description: 'Conteúdo com dados e previsões do mercado.',
      content_format: 'carrossel',
      channel: 'instagram',
      hook: '"O marketing vai mudar. Você está preparado?"',
      cta: 'Salve para consultar depois!',
      hashtags: ['#marketing', '#tendencias', '#2027'],
      references: [],
      status: 'approved',
      priority: 'high',
      task_id: null,
      editorial_item_id: null,
      suggested_by: 'manual',
      created_by: null,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-idea-2',
      agency_id: agencyId,
      strategy_id: strategyId,
      pillar_id: 'demo-pillar-2',
      title: 'Reels: Bastidores de uma sessão fotográfica',
      description: 'Mostrar o dia a dia criativo da equipe.',
      content_format: 'reels',
      channel: 'instagram',
      hook: '"Por trás de uma foto perfeita tem..."',
      cta: 'Conheça nosso processo criativo!',
      hashtags: ['#bastidores', '#agencia', '#criatividade'],
      references: [],
      status: 'idea',
      priority: 'normal',
      task_id: null,
      editorial_item_id: null,
      suggested_by: 'manual',
      created_by: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-idea-3',
      agency_id: agencyId,
      strategy_id: strategyId,
      pillar_id: 'demo-pillar-3',
      title: 'Thread: Como criar um calendário editorial do zero',
      description: 'Passo a passo prático com framework.',
      content_format: 'thread',
      channel: 'linkedin',
      hook: '"Planejamento é 80% do sucesso no conteúdo"',
      cta: 'Baixe nosso template gratuito!',
      hashtags: ['#contentmarketing', '#planejamento'],
      references: [],
      status: 'idea',
      priority: 'normal',
      task_id: null,
      editorial_item_id: null,
      suggested_by: 'editorial_engine',
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

function getDemoEditorialItems(agencyId: string, strategyId: string): EditorialItem[] {
  const today = new Date()
  return [
    {
      id: 'demo-editorial-1',
      agency_id: agencyId,
      strategy_id: strategyId,
      pillar_id: 'demo-pillar-1',
      idea_id: 'demo-idea-1',
      title: 'Carrossel: 5 tendências de marketing digital para 2027',
      description: 'Carrossel com 7 slides sobre tendências.',
      content_format: 'carrossel',
      channel: 'instagram',
      copy_text: 'O mercado muda rápido. Quem não se adapta, fica para trás.\n\nVeja as 5 tendências que vão dominar o marketing digital em 2027 👇',
      hook: '"O marketing vai mudar. Você está preparado?"',
      cta: 'Salve este post e compartilhe com quem precisa se preparar! 🚀',
      hashtags: ['#marketing', '#tendencias', '#2027'],
      visual_notes: 'Usar gradiente roxo/azul do DS. Slides numerados de 1 a 5 com ícones.',
      scheduled_date: new Date(today.getTime() + 2 * 86400000).toISOString().split('T')[0],
      scheduled_time: '10:00',
      publish_date: null,
      status: 'approved',
      task_id: null,
      created_by: null,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-editorial-2',
      agency_id: agencyId,
      strategy_id: strategyId,
      pillar_id: 'demo-pillar-2',
      idea_id: null,
      title: 'Stories: Enquete — Qual formato de conteúdo você prefere?',
      description: 'Série de stories interativos para gerar engajamento.',
      content_format: 'stories',
      channel: 'instagram',
      copy_text: 'Me conta: qual tipo de conteúdo você mais gosta de consumir?',
      hook: 'Sua opinião importa!',
      cta: 'Vote na enquete! 📊',
      hashtags: [],
      visual_notes: 'Background em gradiente com enquete nativa do Instagram.',
      scheduled_date: new Date(today.getTime() + 4 * 86400000).toISOString().split('T')[0],
      scheduled_time: '18:00',
      publish_date: null,
      status: 'draft',
      task_id: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]
}

// ============================================================
// STRATEGIES QUERIES & MUTATIONS
// ============================================================

export function useStrategies(agencyId: string, filters?: { status?: StrategyStatus; clientId?: string; search?: string }) {
  return useQuery<ContentStrategy[]>({
    queryKey: ['strategies', agencyId, filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        let data = getDemoStrategies(agencyId)
        if (filters?.status) data = data.filter((s) => s.status === filters.status)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          data = data.filter((s) => s.name.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q))
        }
        return data
      }

      let query = supabase
        .from('content_strategies')
        .select(`
          *,
          client:clients(id, name, slug, logo_url),
          pillars:editorial_pillars(*)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.clientId) query = query.eq('client_id', filters.clientId)
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`)

      const { data, error } = await query
      if (error) {
        console.warn('Error fetching strategies:', error.message)
        return getDemoStrategies(agencyId)
      }

      return (data ?? []) as ContentStrategy[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

export function useStrategy(strategyId?: string) {
  return useQuery<ContentStrategy | null>({
    queryKey: ['strategy', strategyId],
    queryFn: async () => {
      if (!strategyId) return null

      if (!isSupabaseConfigured || !supabase) {
        return getDemoStrategies('demo-agency').find((s) => s.id === strategyId) ?? null
      }

      const { data, error } = await supabase
        .from('content_strategies')
        .select(`
          *,
          client:clients(*),
          pillars:editorial_pillars(*)
        `)
        .eq('id', strategyId)
        .single()

      if (error) throw error
      return data as ContentStrategy
    },
    enabled: Boolean(strategyId),
  })
}

export function useCreateStrategy(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      client_id?: string | null
      briefing_id?: string | null
      description?: string
      objective?: string
      target_audience?: string
      tone_of_voice?: string
      brand_positioning?: string
      channels?: string[]
      competitors?: string[]
      key_messages?: string[]
      restrictions?: string[]
      period_start?: string | null
      period_end?: string | null
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          id: `local-strategy-${Date.now()}`,
          agency_id: agencyId,
          ...payload,
          slug: payload.name.toLowerCase().replace(/\s+/g, '-'),
          status: 'draft' as StrategyStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      }

      const slug = payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      const { data, error } = await supabase
        .from('content_strategies')
        .insert({
          agency_id: agencyId,
          client_id: payload.client_id || null,
          briefing_id: payload.briefing_id || null,
          name: payload.name,
          description: payload.description || null,
          slug,
          objective: payload.objective || null,
          target_audience: payload.target_audience || null,
          tone_of_voice: payload.tone_of_voice || null,
          brand_positioning: payload.brand_positioning || null,
          channels: payload.channels || [],
          competitors: payload.competitors || [],
          key_messages: payload.key_messages || [],
          restrictions: payload.restrictions || [],
          period_start: payload.period_start || null,
          period_end: payload.period_end || null,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Record activity
      await supabase.from('strategy_activity').insert({
        agency_id: agencyId,
        strategy_id: data.id,
        action: 'strategy_created',
        metadata: { name: payload.name },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', agencyId] })
    },
  })
}

export function useUpdateStrategy(agencyId: string, strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<ContentStrategy>) => {
      if (!isSupabaseConfigured || !supabase) {
        return { success: true, ...updates }
      }

      const { data, error } = await supabase
        .from('content_strategies')
        .update(updates)
        .eq('id', strategyId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategies', agencyId] })
    },
  })
}

// ============================================================
// EDITORIAL PILLARS
// ============================================================

export function usePillars(strategyId?: string) {
  return useQuery<EditorialPillar[]>({
    queryKey: ['pillars', strategyId],
    queryFn: async () => {
      if (!strategyId) return []

      if (!isSupabaseConfigured || !supabase) {
        return getDemoPillars('demo-agency', strategyId)
      }

      const { data, error } = await supabase
        .from('editorial_pillars')
        .select('*')
        .eq('strategy_id', strategyId)
        .order('position', { ascending: true })

      if (error) {
        console.warn('Error fetching pillars:', error.message)
        return getDemoPillars('demo-agency', strategyId)
      }
      return (data ?? []) as EditorialPillar[]
    },
    enabled: Boolean(strategyId),
  })
}

export function useCreatePillar(agencyId: string, strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      color?: string
      icon?: string
      percentage?: number
      content_formats?: string[]
      posting_frequency?: string
      example_topics?: string[]
      position?: number
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return { id: `local-pillar-${Date.now()}`, ...payload }
      }

      const { data, error } = await supabase
        .from('editorial_pillars')
        .insert({
          agency_id: agencyId,
          strategy_id: strategyId,
          name: payload.name,
          description: payload.description || null,
          color: payload.color || '#7952FF',
          icon: payload.icon || 'Layers',
          percentage: payload.percentage || 0,
          content_formats: payload.content_formats || [],
          posting_frequency: payload.posting_frequency || null,
          example_topics: payload.example_topics || [],
          position: payload.position ?? 0,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
    },
  })
}

export function useUpdatePillar(strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ pillarId, updates }: { pillarId: string; updates: Partial<EditorialPillar> }) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { data, error } = await supabase
        .from('editorial_pillars')
        .update(updates)
        .eq('id', pillarId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars', strategyId] })
    },
  })
}

export function useDeletePillar(strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pillarId: string) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { error } = await supabase
        .from('editorial_pillars')
        .delete()
        .eq('id', pillarId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pillars', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
    },
  })
}

// ============================================================
// CONTENT IDEAS
// ============================================================

export function useContentIdeas(strategyId?: string, filters?: { status?: IdeaStatus; pillarId?: string }) {
  return useQuery<ContentIdea[]>({
    queryKey: ['content_ideas', strategyId, filters],
    queryFn: async () => {
      if (!strategyId) return []

      if (!isSupabaseConfigured || !supabase) {
        let data = getDemoIdeas('demo-agency', strategyId)
        if (filters?.status) data = data.filter((i) => i.status === filters.status)
        if (filters?.pillarId) data = data.filter((i) => i.pillar_id === filters.pillarId)
        return data
      }

      let query = supabase
        .from('content_ideas')
        .select(`
          *,
          pillar:editorial_pillars(id, name, color, icon)
        `)
        .eq('strategy_id', strategyId)
        .order('created_at', { ascending: false })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.pillarId) query = query.eq('pillar_id', filters.pillarId)

      const { data, error } = await query
      if (error) {
        console.warn('Error fetching ideas:', error.message)
        return getDemoIdeas('demo-agency', strategyId)
      }
      return (data ?? []) as ContentIdea[]
    },
    enabled: Boolean(strategyId),
  })
}

export function useCreateIdea(agencyId: string, strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      pillar_id?: string | null
      title: string
      description?: string
      content_format?: string
      channel?: string
      hook?: string
      cta?: string
      hashtags?: string[]
      priority?: string
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return { id: `local-idea-${Date.now()}`, ...payload }
      }

      const { data, error } = await supabase
        .from('content_ideas')
        .insert({
          agency_id: agencyId,
          strategy_id: strategyId,
          pillar_id: payload.pillar_id || null,
          title: payload.title,
          description: payload.description || null,
          content_format: payload.content_format || null,
          channel: payload.channel || null,
          hook: payload.hook || null,
          cta: payload.cta || null,
          hashtags: payload.hashtags || [],
          priority: payload.priority || 'normal',
          status: 'idea',
          suggested_by: 'manual',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
    },
  })
}

export function useUpdateIdea(strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ ideaId, updates }: { ideaId: string; updates: Partial<ContentIdea> }) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { data, error } = await supabase
        .from('content_ideas')
        .update(updates)
        .eq('id', ideaId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content_ideas', strategyId] })
    },
  })
}

// ============================================================
// EDITORIAL ITEMS
// ============================================================

export function useEditorialItems(strategyId?: string, filters?: { status?: EditorialStatus; pillarId?: string; month?: string }) {
  return useQuery<EditorialItem[]>({
    queryKey: ['editorial_items', strategyId, filters],
    queryFn: async () => {
      if (!strategyId) return []

      if (!isSupabaseConfigured || !supabase) {
        let data = getDemoEditorialItems('demo-agency', strategyId)
        if (filters?.status) data = data.filter((i) => i.status === filters.status)
        if (filters?.pillarId) data = data.filter((i) => i.pillar_id === filters.pillarId)
        return data
      }

      let query = supabase
        .from('editorial_items')
        .select(`
          *,
          pillar:editorial_pillars(id, name, color, icon)
        `)
        .eq('strategy_id', strategyId)
        .order('scheduled_date', { ascending: true })

      if (filters?.status) query = query.eq('status', filters.status)
      if (filters?.pillarId) query = query.eq('pillar_id', filters.pillarId)

      const { data, error } = await query
      if (error) {
        console.warn('Error fetching editorial items:', error.message)
        return getDemoEditorialItems('demo-agency', strategyId)
      }
      return (data ?? []) as EditorialItem[]
    },
    enabled: Boolean(strategyId),
  })
}

export function useCreateEditorialItem(agencyId: string, strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      pillar_id?: string | null
      idea_id?: string | null
      title: string
      description?: string
      content_format?: string
      channel?: string
      copy_text?: string
      hook?: string
      cta?: string
      hashtags?: string[]
      visual_notes?: string
      scheduled_date?: string | null
      scheduled_time?: string | null
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return { id: `local-editorial-${Date.now()}`, ...payload }
      }

      const { data, error } = await supabase
        .from('editorial_items')
        .insert({
          agency_id: agencyId,
          strategy_id: strategyId,
          pillar_id: payload.pillar_id || null,
          idea_id: payload.idea_id || null,
          title: payload.title,
          description: payload.description || null,
          content_format: payload.content_format || null,
          channel: payload.channel || null,
          copy_text: payload.copy_text || null,
          hook: payload.hook || null,
          cta: payload.cta || null,
          hashtags: payload.hashtags || [],
          visual_notes: payload.visual_notes || null,
          scheduled_date: payload.scheduled_date || null,
          scheduled_time: payload.scheduled_time || null,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial_items', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
    },
  })
}

export function useUpdateEditorialItem(strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: Partial<EditorialItem> }) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { data, error } = await supabase
        .from('editorial_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial_items', strategyId] })
    },
  })
}

export function useDeleteEditorialItem(strategyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { error } = await supabase
        .from('editorial_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['editorial_items', strategyId] })
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] })
    },
  })
}
