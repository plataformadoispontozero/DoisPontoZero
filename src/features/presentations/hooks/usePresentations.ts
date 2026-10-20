import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 09: PRESENTATION STUDIO HOOKS
// State management & TanStack Query hooks for Presentations
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Presentation,
  PresentationSection,
  PresentationAsset,
  PresentationTemplate,
  PresentationStatus,
  PresentationSectionType,
} from '@/types/presentations'

export const SECTION_TYPES: { type: PresentationSectionType; label: string; description: string }[] = [
  { type: 'cover', label: 'Capa', description: 'Capa da apresentação com título e subtítulo' },
  { type: 'overview', label: 'Visão Geral', description: 'Resumo executivo do projeto ou período' },
  { type: 'objectives', label: 'Objetivos', description: 'Metas e objetivos traçados' },
  { type: 'deliverables', label: 'Entregáveis', description: 'Lista de materiais e peças criadas' },
  { type: 'gallery', label: 'Galeria de Imagens', description: 'Grade ou carrossel de peças visuais' },
  { type: 'video', label: 'Vídeos & Reels', description: 'Exibição de conteúdos em vídeo' },
  { type: 'results', label: 'Resultados & Métricas', description: 'Indicadores e performance de campanha' },
  { type: 'insights', label: 'Insights & Aprendizados', description: 'Pontos-chave e aprendizados do período' },
  { type: 'next_steps', label: 'Próximos Passos', description: 'Planejamento e ações para o próximo ciclo' },
  { type: 'closing', label: 'Encerramento', description: 'Slide final de contato e encerramento' },
  { type: 'custom', label: 'Seção Personalizada', description: 'Bloco de texto e mídia livre' },
]


export const INITIAL_PRESENTATION_TEMPLATES: PresentationTemplate[] = [
  {
    id: 'tmpl-pres-001',
    name: 'Aprovação mensal — Posts, Carrossel e Reels',
    description: 'Apresentação mensal de entregas de redes sociais, reels e métricas operacionais.',
    category: 'Social Media',
    sections_snapshot: [
      {
        section_type: 'cover',
        title: 'Capa da Apresentação',
        content: { subtitle: 'Relatório & Showcase Mensal de Entregas' },
      },
      {
        section_type: 'overview',
        title: 'Resumo das Entregas do Mês',
        content: {},
      },
      {
        section_type: 'gallery',
        title: 'Posts',
        content: { media_layout:'grid' },
      },
      {
        section_type:'gallery',
        title:'Carrossel',
        content:{media_layout:'carousel'},
      },
      {
        section_type: 'video',
        title: 'Vídeos & Reels em Destaque',
        content: { text: 'Vídeos curtos gravados e editados para máxima retenção.' },
      },
      {
        section_type: 'results',
        title: 'Resultados Operacionais',
        content: {},
      },
      {
        section_type: 'next_steps',
        title: 'Próximos Passos & Planejamento',
        content: { text: 'Alinhamento do cronograma para o próximo ciclo de conteúdo.' },
      },
    ],
  },
  {
    id: 'tmpl-pres-002',
    name: 'Creative Deliverables & Branding',
    description: 'Apresentação editorial de manual de marca, paleta e guias visuais.',
    category: 'Branding',
    sections_snapshot: [
      {
        section_type: 'cover',
        title: 'Capa do Projeto de Branding',
        content: { subtitle: 'Apresentação do Universo da Marca' },
      },
      {
        section_type: 'objectives',
        title: 'Conceito & Posicionamento',
        content: { text: 'Desenvolvimento estético focado em autoridade e sofisticação B2B.' },
      },
      {
        section_type: 'gallery',
        title: 'Aplicações da Marca',
        content: { text: 'Modelos de papelaria, redes sociais e apresentações.' },
      },
    ],
  },
]

const DEMO_PRESENTATIONS: Presentation[] = [
  {
    id: 'pres-001',
    agency_id: 'demo-agency',
    client_id: 'cli-001',
    client_name: 'Acme Corp',
    title: 'Showcase de Entregas — Outubro 2026',
    description: 'Apresentação interativa das peças de mídia social, reels e relatório do mês.',
    period_month: 10,
    period_year: 2026,
    status: 'published',
    created_at: '2026-10-10T10:00:00Z',
    updated_at: '2026-10-10T10:00:00Z',
    public_token: 'showcase_acme_2026_secure',
    sections: INITIAL_PRESENTATION_TEMPLATES[0].sections_snapshot as PresentationSection[],
    assets: [],
  },
  {
    id: 'pres-002',
    agency_id: 'demo-agency',
    client_id: 'cli-002',
    client_name: 'Starlight Tech',
    title: 'Apresentação de Identidade Visual',
    description: 'Entrega final do manual de marca e aplicações.',
    period_month: 10,
    period_year: 2026,
    status: 'draft',
    created_at: '2026-10-09T15:00:00Z',
    updated_at: '2026-10-09T15:00:00Z',
    public_token: 'showcase_starlight_demo',
    sections: INITIAL_PRESENTATION_TEMPLATES[1].sections_snapshot as PresentationSection[],
    assets: [],
  },
]

let demoPresentationsStore = [...DEMO_PRESENTATIONS]

// 1. Hook: List Presentations
export function usePresentations() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const query = useQuery({
    queryKey: ['presentations',agencyId],
    enabled: !isSupabaseConfigured||!!agencyId,
    queryFn: async (): Promise<Presentation[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError1 } = await supabase
            .from('presentations')
            .select(`
              *,
              clients (name, logo_url),
              presentation_sections (*),
              presentation_assets (*, file_reference:drive_file_references(*))
            `)
            .eq('agency_id', agencyId)
            .order('created_at', { ascending: false })
          if (backendError1) throw backendError1

          if (data) {
            return data.map((p: any) => ({
              ...p,
              client_name: p.clients?.name,
              client_logo_url: p.clients?.logo_url,
              sections: p.presentation_sections || [],
              assets: p.presentation_assets || [],
            }))
          }
        } catch (err) {
          throw err
        }
      }
      return demoPresentationsStore
    },
  })

  const createMutation = useCreatePresentation()

  return Object.assign(query, {
    presentations: query.data || [],
    createPresentation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  })
}

// 2. Hook: Single Presentation
export function usePresentation(presentationId?: string) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['presentation', agencyId, presentationId],
    enabled: Boolean(presentationId && agencyId),
    queryFn: async (): Promise<Presentation | null> => {
      if (!presentationId) return null

      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError2 } = await supabase
            .from('presentations')
            .select(`
              *,
              clients (name, logo_url),
              presentation_sections (*),
              presentation_assets (*, file_reference:drive_file_references(*))
            `)
            .eq('id', presentationId)
            .eq('agency_id', agencyId)
            .single()
          if (backendError2) throw backendError2

          if (data) {
            return {
              ...data,
              client_name: data.clients?.name,
              client_logo_url: data.clients?.logo_url,
              sections: (data.presentation_sections || []).sort((a: any, b: any) => a.position - b.position),
              assets: (data.presentation_assets || []).sort((a: any, b: any) => a.position - b.position),
            }
          }
        } catch (err) {
          throw err
        }
      }

      return demoPresentationsStore.find((p) => p.id === presentationId) || null
    },
  })
}

export function useSinglePresentation(presentationId?: string) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const query = usePresentation(presentationId)
  const updateMutation = useUpdatePresentation()
  const sharingLink = useQuery({queryKey:['presentation-sharing-link',agencyId,presentationId],enabled:!!agencyId&&!!presentationId&&(auth.activeAgency?.roleName==='OWNER'||auth.permissions?.has('presentations.manage_public_links')),queryFn:async()=>{if(!supabase)return null;const result=await supabase.functions.invoke('google-workspace',{body:{action:'presentation-sharing-read',agencyId,presentationId}});if(result.error)throw result.error;return result.data?.token as string|null}})
  const publicLinkMutation = useMutation({
    mutationFn: async () => {
      if (!presentation) throw new Error('Apresentação não encontrada')
      if (!isSupabaseConfigured || !supabase) return presentation.public_token || `demo-${presentation.id}`
      if (!agencyId) throw new Error('Sessão e agência são obrigatórias.')
      const {data,error}=await supabase.functions.invoke('google-workspace',{body:{action:'presentation-sharing-create',agencyId,presentationId:presentation.id}})
      if(error)throw error
      if(!data?.token||typeof data.token!=='string')throw new Error('O servidor não retornou um link válido.')
      return data.token as string
    },
  })

  const presentation = query.data || null
  const sections = presentation?.sections || []
  const assets = presentation?.assets || []
  const versions = (presentation as any)?.versions || []

  const addSection = async (section: Partial<PresentationSection>) => {
    if (!presentation) return
    const newSec: PresentationSection = {
      id: isSupabaseConfigured ? crypto.randomUUID() : `sec-${Date.now()}`,
      agency_id: presentation.agency_id || 'demo-agency',
      presentation_id: presentation.id,
      section_type: section.section_type || 'custom',
      title: section.title || 'Nova Seção',
      description: section.description || '',
      content: section.content || {},
      position: sections.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await updateMutation.mutateAsync({
      id: presentation.id,
      sections: [...sections, newSec],
    })
    await query.refetch()
    return newSec
  }

  const updateSection = async ({ sectionId, updates }: { sectionId: string; updates: Partial<PresentationSection> }) => {
    if (!presentation) return
    const updatedSecs = sections.map((s) => (s.id === sectionId ? { ...s, ...updates, updated_at: new Date().toISOString() } : s))
    await updateMutation.mutateAsync({
      id: presentation.id,
      sections: updatedSecs,
    })
  }

  const deleteSection = async (sectionId: string) => {
    if (!presentation) return
    const updatedSecs = sections.filter((s) => s.id !== sectionId)
    await updateMutation.mutateAsync({
      id: presentation.id,
      sections: updatedSecs,
    })
  }

  const reorderSections = async (reordered: PresentationSection[] | string[]) => {
    if (!presentation) return
    let updatedSecs: PresentationSection[] = []
    if (reordered.length > 0 && typeof reordered[0] === 'string') {
      const idMap = new Map((reordered as string[]).map((id, idx) => [id, idx]))
      updatedSecs = [...sections].sort((a, b) => (idMap.get(a.id) ?? 0) - (idMap.get(b.id) ?? 0)).map((s, idx) => ({ ...s, position: idx }))
    } else {
      updatedSecs = (reordered as PresentationSection[]).map((s, idx) => ({ ...s, position: idx }))
    }
    await updateMutation.mutateAsync({
      id: presentation.id,
      sections: updatedSecs,
    })
  }

  const addAsset = async (asset: Partial<PresentationAsset>) => {
    if (!presentation) return
    const newAst: PresentationAsset = {
      id: isSupabaseConfigured ? crypto.randomUUID() : `ast-${Date.now()}`,
      agency_id: presentation.agency_id || 'demo-agency',
      presentation_id: presentation.id,
      section_id: asset.section_id || null,
      file_reference_id: asset.file_reference_id || null,
      title: asset.title || 'Material',
      description: asset.description || '',
      position: assets.length,
      created_at: new Date().toISOString(),
      file_reference: asset.file_reference,
    }
    await updateMutation.mutateAsync({
      id: presentation.id,
      assets: [...assets, newAst],
    })
  }

  const removeAsset = async (assetId: string) => {
    if (!presentation) return
    const updatedAssets = assets.filter((a) => a.id !== assetId)
    await updateMutation.mutateAsync({
      id: presentation.id,
      assets: updatedAssets,
    })
  }

  const publishPresentation = async () => {
    if (!presentation) return
    await updateMutation.mutateAsync({
      id: presentation.id,
      status: 'published',
    })
  }

  const createPublicLink = async () => {
    const token=await publicLinkMutation.mutateAsync()
    await sharingLink.refetch()
    return token
  }

  return {
    presentation,
    sections,
    assets,
    versions,
    isLoading: query.isLoading,
    isError: query.isError,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addAsset,
    removeAsset,
    publishPresentation,
    createPublicLink,
    sharingToken: sharingLink.data,
    sharingLinkError: sharingLink.isError,
    isPublishing: updateMutation.isPending,
    isCreatingLink: publicLinkMutation.isPending,
  }
}

// 3. Hook: Templates
export function usePresentationTemplates() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['presentation_templates'],
    queryFn: async (): Promise<PresentationTemplate[]> => {
      return INITIAL_PRESENTATION_TEMPLATES
    },
  })
}

// 4. Hook: Create Presentation
export function useCreatePresentation() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      title: string
      client_id: string
      client_name?: string
      period_month: number
      period_year: number
      template_id?: string
      sections_snapshot?: Array<Partial<PresentationSection>>
      description?: string
    }): Promise<Presentation> => {
      if (isSupabaseConfigured && supabase) {
        if (!agencyId) throw new Error('Sessão e agência são obrigatórias.')
        const { data: row, error: presentationError } = await supabase
          .from('presentations')
          .insert({
            agency_id: agencyId,
            client_id: payload.client_id,
            title: payload.title.trim(),
            description: payload.description?.trim() || null,
            period_month: payload.period_month,
            period_year: payload.period_year,
            status: 'draft',
          })
          .select('*, clients(name, logo_url)')
          .single()
        if (presentationError) throw presentationError

        const template = payload.template_id
          ? INITIAL_PRESENTATION_TEMPLATES.find((t) => t.id === payload.template_id)
          : undefined
        const templateSections = (payload.sections_snapshot ?? template?.sections_snapshot)?.map((s, idx) => ({
          agency_id: agencyId,
          presentation_id: row.id,
          section_type: s.section_type || 'custom',
          title: s.title || 'Seção',
          description: s.description || null,
          content: s.content || {},
          position: idx,
        })) || []
        let createdSections: PresentationSection[] = []
        if (templateSections.length) {
          const { data, error: sectionsError } = await supabase
            .from('presentation_sections')
            .insert(templateSections)
            .select('*')
            .order('position')
          if (sectionsError) {
            await supabase.from('presentations').delete().eq('id', row.id).eq('agency_id', agencyId)
            throw sectionsError
          }
          createdSections = (data || []) as PresentationSection[]
        }

        queryClient.invalidateQueries({ queryKey: ['presentations', agencyId] })
        return {
          ...row,
          client_name: row.clients?.name || payload.client_name || 'Cliente Selecionado',
          client_logo_url: row.clients?.logo_url,
          sections: createdSections,
          assets: [],
        } as Presentation
      }

      const newId = `pres-${Date.now()}`
      const template = payload.template_id
        ? INITIAL_PRESENTATION_TEMPLATES.find((t) => t.id === payload.template_id)
        : undefined
      const sections: PresentationSection[] = (payload.sections_snapshot ?? template?.sections_snapshot)?.map((s, idx) => ({
        id: `sec-${newId}-${idx}`,
        agency_id: agencyId,
        presentation_id: newId,
        section_type: s.section_type || 'custom',
        title: s.title || 'Seção',
        description: s.description || '',
        content: s.content || {},
        position: idx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || []
      const newPres: Presentation = {
        id: newId,
        agency_id: agencyId,
        client_id: payload.client_id,
        client_name: payload.client_name || 'Cliente Selecionado',
        title: payload.title,
        description: payload.description || '',
        period_month: payload.period_month,
        period_year: payload.period_year,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        public_token: `token_showcase_${newId}`,
        sections,
        assets: [],
      }
      demoPresentationsStore = [newPres, ...demoPresentationsStore]
      queryClient.invalidateQueries({ queryKey: ['presentations', agencyId] })
      return newPres
    },
  })
}

// 5. Hook: Update Presentation
export function useUpdatePresentation() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      id: string
      status?: PresentationStatus
      sections?: PresentationSection[]
      assets?: PresentationAsset[]
      title?: string
      description?: string
    }): Promise<Presentation> => {
      if (isSupabaseConfigured && supabase) {
        if (!agencyId) throw new Error('Sessão e agência são obrigatórias.')
        const updates: Record<string, unknown> = {}
        if (payload.title !== undefined) updates.title = payload.title.trim()
        if (payload.description !== undefined) updates.description = payload.description
        if (payload.status !== undefined) {
          updates.status = payload.status
          if (payload.status === 'published') updates.published_at = new Date().toISOString()
        }
        const presentationQuery = Object.keys(updates).length
          ? supabase
              .from('presentations')
              .update(updates)
              .eq('id', payload.id)
              .eq('agency_id', agencyId)
              .select('*, clients(name, logo_url), presentation_sections(*), presentation_assets(*, file_reference:drive_file_references(*))')
              .single()
          : supabase
              .from('presentations')
              .select('*, clients(name, logo_url), presentation_sections(*), presentation_assets(*, file_reference:drive_file_references(*))')
              .eq('id', payload.id)
              .eq('agency_id', agencyId)
              .single()
        const { error } = await presentationQuery
        if (error) throw error
        if (payload.sections !== undefined) {
          const sectionRows = payload.sections.map((section) => ({
            id: section.id,
            agency_id: agencyId,
            presentation_id: payload.id,
            section_type: section.section_type,
            title: section.title,
            description: section.description || null,
            content: section.content || {},
            position: section.position,
          }))
          const sectionIds = sectionRows.map((section) => section.id)
          const deleteSections = sectionIds.length
            ? supabase.from('presentation_sections').delete().eq('presentation_id', payload.id).eq('agency_id', agencyId).not('id', 'in', `(${sectionIds.join(',')})`)
            : supabase.from('presentation_sections').delete().eq('presentation_id', payload.id).eq('agency_id', agencyId)
          const { error: deleteError } = await deleteSections
          if (deleteError) throw deleteError
          if (sectionRows.length) {
            const { error: upsertError } = await supabase.from('presentation_sections').upsert(sectionRows, { onConflict: 'id' })
            if (upsertError) throw upsertError
          }
        }
        if (payload.assets !== undefined) {
          const assetRows = payload.assets.map((asset) => ({
            id: asset.id,
            agency_id: agencyId,
            presentation_id: payload.id,
            section_id: asset.section_id || null,
            file_reference_id: asset.file_reference_id || null,
            title: asset.title,
            description: asset.description || null,
            position: asset.position,
          }))
          const assetIds = assetRows.map((asset) => asset.id)
          const deleteAssets = assetIds.length
            ? supabase.from('presentation_assets').delete().eq('presentation_id', payload.id).eq('agency_id', agencyId).not('id', 'in', `(${assetIds.join(',')})`)
            : supabase.from('presentation_assets').delete().eq('presentation_id', payload.id).eq('agency_id', agencyId)
          const { error: deleteError } = await deleteAssets
          if (deleteError) throw deleteError
          if (assetRows.length) {
            const { error: upsertError } = await supabase.from('presentation_assets').upsert(assetRows, { onConflict: 'id' })
            if (upsertError) throw upsertError
          }
        }
        const { data: refreshed, error: refreshError } = await supabase
          .from('presentations')
          .select('*, clients(name, logo_url), presentation_sections(*), presentation_assets(*, file_reference:drive_file_references(*))')
          .eq('id', payload.id)
          .eq('agency_id', agencyId)
          .single()
        if (refreshError) throw refreshError
        queryClient.invalidateQueries({ queryKey: ['presentations', agencyId] })
        queryClient.invalidateQueries({ queryKey: ['presentation', agencyId, payload.id] })
        return {
          ...refreshed,
          client_name: refreshed.clients?.name,
          client_logo_url: refreshed.clients?.logo_url,
          sections: (refreshed.presentation_sections || []).sort((a: PresentationSection, b: PresentationSection) => a.position - b.position),
          assets: (refreshed.presentation_assets || []).sort((a: PresentationAsset, b: PresentationAsset) => a.position - b.position),
        } as Presentation
      }

      const idx = demoPresentationsStore.findIndex((p) => p.id === payload.id)
      if (idx === -1) throw new Error('Apresentação não encontrada')

      const cur = demoPresentationsStore[idx]
      const updated: Presentation = {
        ...cur,
        title: payload.title !== undefined ? payload.title : cur.title,
        description: payload.description !== undefined ? payload.description : cur.description,
        status: payload.status !== undefined ? payload.status : cur.status,
        sections: payload.sections || cur.sections || [],
        assets: payload.assets || cur.assets || [],
        updated_at: new Date().toISOString(),
      }

      demoPresentationsStore[idx] = updated

      queryClient.invalidateQueries({ queryKey: ['presentations', agencyId] })
      queryClient.invalidateQueries({ queryKey: ['presentation', agencyId, payload.id] })
      return updated
    },
  })
}

export function useDeletePresentation(){
 const auth=useAuth(),cache=useQueryClient(),agency=auth.activeAgency?.agencyId
 return useMutation({mutationFn:async({id,confirmation}:{id:string;confirmation:string})=>{if(!supabase||!agency)throw Error('Sessão necessária.');const result=await supabase.rpc('delete_presentation_permanently',{p_agency:agency,p_presentation:id,p_confirmation:confirmation});if(result.error)throw result.error;if(result.data!==true)throw Error('A apresentação não foi excluída.');return id},onSuccess:id=>{cache.removeQueries({queryKey:['presentation',agency,id]});cache.removeQueries({queryKey:['presentation-sharing-link',agency,id]});void cache.invalidateQueries({queryKey:['presentations']});void cache.invalidateQueries({queryKey:['client-presentations']});cache.removeQueries({queryKey:['presentation-media']});cache.removeQueries({queryKey:['presentation-reel']})}})
}
