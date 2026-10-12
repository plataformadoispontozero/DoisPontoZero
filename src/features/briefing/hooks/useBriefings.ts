// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO
// TanStack Query Hooks for Briefings, Templates, Questions & Public Links
// ============================================================

import { useAgencyId } from '@/features/auth/AuthProvider'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  Briefing,
  BriefingTemplate,
  BriefingSection,
  BriefingQuestion,
  BriefingAnswer,
  BriefingPublicLink,
  BriefingVersion,
  BriefingStatus,
} from '@/types/briefing'
import { INITIAL_BRIEFING_TEMPLATES } from '../constants/initialTemplates'

// Helper to convert initial templates to BriefingTemplate objects for demo mode
function getInitialTemplatesMapped(agencyId: string): BriefingTemplate[] {
  return INITIAL_BRIEFING_TEMPLATES.map((t, idx) => ({
    id: t.id,
    agency_id: agencyId,
    name: t.name,
    description: t.description,
    category: t.category,
    status: 'published',
    version: 1,
    created_by: null,
    created_at: new Date(Date.now() - (idx + 1) * 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    archived_at: null,
    sections: t.sections.map((s, sIdx) => ({
      id: s.id,
      agency_id: agencyId,
      template_id: t.id,
      title: s.title,
      description: s.description ?? null,
      position: sIdx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      questions: s.questions.map((q, qIdx) => ({
        id: q.id,
        agency_id: agencyId,
        template_id: t.id,
        section_id: s.id,
        question_key: q.question_key,
        label: q.label,
        description: q.description ?? null,
        question_type: q.question_type,
        is_required: q.is_required,
        position: qIdx,
        options: q.options ?? [],
        validation_rules: q.placeholder ? { placeholder: q.placeholder } : {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
    })),
    questions: t.sections.flatMap((s) =>
      s.questions.map((q, qIdx) => ({
        id: q.id,
        agency_id: agencyId,
        template_id: t.id,
        section_id: s.id,
        question_key: q.question_key,
        label: q.label,
        description: q.description ?? null,
        question_type: q.question_type,
        is_required: q.is_required,
        position: qIdx,
        options: q.options ?? [],
        validation_rules: q.placeholder ? { placeholder: q.placeholder } : {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
    ),
  }))
}

// SHA-256 helper for browser environment
export async function sha256Hex(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateSecureToken(): string {
  const array = new Uint8Array(24)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// ------------------------------------------------------------
// 1. TEMPLATES QUERIES & MUTATIONS
// ------------------------------------------------------------
export function useBriefingTemplates(agencyId: string) {
  return useQuery<BriefingTemplate[]>({
    queryKey: ['briefing_templates', agencyId],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return getInitialTemplatesMapped(agencyId)
      }

      const { data, error } = await supabase
        .from('briefing_templates')
        .select(`
          *,
          sections:briefing_sections(*),
          questions:briefing_questions(*)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data ?? []) as BriefingTemplate[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useBriefingTemplate(templateId?: string, agencyId?: string) {
  return useQuery<BriefingTemplate | null>({
    queryKey: ['briefing_template', agencyId, templateId],
    queryFn: async () => {
      if (!templateId) return null

      // Check defaults first
      const defaultMatch = INITIAL_BRIEFING_TEMPLATES.find((t) => t.id === templateId)
      if (defaultMatch && !isSupabaseConfigured) {
        return getInitialTemplatesMapped('demo-agency').find((t) => t.id === templateId) ?? null
      }

      if (!isSupabaseConfigured || !supabase) return null

      const { data, error } = await supabase
        .from('briefing_templates')
        .select(`
          *,
          sections:briefing_sections(*),
          questions:briefing_questions(*)
        `)
        .eq('id', templateId)
        .eq('agency_id', agencyId!)
        .single()

      if (error) throw error
      return data as BriefingTemplate
    },
    enabled: Boolean(templateId && agencyId),
  })
}

export function useCreateTemplate(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      status?: 'draft'|'published'
      source_template_id?: string|null
      save_request_id?: string
      category: BriefingTemplate['category']
      sections: {
        title: string
        description?: string
        position: number
        questions: {
          question_key: string
          label: string
          description?: string
          question_type: BriefingQuestion['question_type']
          is_required: boolean
          position: number
          options?: any[]
          validation_rules?: any
        }[]
      }[]
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return { id: `local-${Date.now()}`, ...payload }
      }

      const {data,error}=await supabase.rpc('save_briefing_template',{p_agency:agencyId,p_source_template:payload.source_template_id||null,p_payload:{...payload,status:payload.status||'draft',save_request_id:payload.save_request_id||crypto.randomUUID()}})
      if(error)throw new Error(error.message)
      return data as BriefingTemplate
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing_templates', agencyId] })
    },
  })
}

// ------------------------------------------------------------
// 2. BRIEFINGS QUERIES & MUTATIONS
// ------------------------------------------------------------
export function useBriefings(agencyId: string, filters?: { status?: BriefingStatus; clientId?: string; search?: string }) {
  return useQuery<Briefing[]>({
    queryKey: ['briefings', agencyId, filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        return []
      }

      let query = supabase
        .from('briefings')
        .select(`
          *,
          client:clients(id, name, slug, logo_url),
          template:briefing_templates(id, name, category, version)
        `)
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.clientId) {
        query = query.eq('client_id', filters.clientId)
      }
      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) throw error

      return (data ?? []) as Briefing[]
    },
  })
}

export function useBriefing(briefingId?: string) {
  const agencyId=useAgencyId()
  return useQuery<Briefing | null>({
    queryKey: ['briefing', agencyId, briefingId],
    queryFn: async () => {
      if (!briefingId) return null
      if (!isSupabaseConfigured || !supabase) return null

      const { data, error } = await supabase
        .from('briefings')
        .select(`
          *,
          client:clients(*),
          template:briefing_templates(
            *,
            sections:briefing_sections(*),
            questions:briefing_questions(*)
          ),
          answers:briefing_answers(*),
          public_links:briefing_public_links(*)
        `)
        .eq('agency_id',agencyId)
        .eq('id', briefingId)
        .single()

      if (error) throw error
      return data as Briefing
    },
    enabled: Boolean(briefingId&&agencyId),
  })
}

export function useCreateBriefing(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      client_id?: string
      template_id: string
      title: string
      description?: string
      assigned_to?: string
    }) => {
      if (!isSupabaseConfigured || !supabase) {
        return {
          id: `local-briefing-${Date.now()}`,
          agency_id: agencyId,
          ...payload,
          status: 'draft' as BriefingStatus,
          template_version: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          submitted_at: null,
          approved_at: null,
          archived_at: null,
        }
      }

      // Fetch template version
      const { data: tpl, error: templateError } = await supabase
        .from('briefing_templates')
        .select('version')
        .eq('id', payload.template_id)
        .eq('agency_id', agencyId)
        .single()

      if (templateError) throw templateError
      if (!tpl) throw new Error('Modelo de briefing não encontrado nesta agência.')
      const template_version = tpl.version

      const { data, error } = await supabase
        .from('briefings')
        .insert({
          agency_id: agencyId,
          client_id: payload.client_id || null,
          template_id: payload.template_id,
          template_version,
          title: payload.title,
          description: payload.description || null,
          assigned_to: payload.assigned_to || null,
          status: 'draft',
        })
        .select()
        .single()

      if (error) throw error

      // Record activity
      await supabase.from('briefing_activity').insert({
        agency_id: agencyId,
        briefing_id: data.id,
        action: 'briefing_created',
        metadata: { title: payload.title },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefings', agencyId] })
    },
  })
}

export function useUpdateBriefingStatus(agencyId: string, briefingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ status, notes }: { status: BriefingStatus; notes?: string }) => {
      if (!isSupabaseConfigured || !supabase) {
        return { success: true, status }
      }

      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'approved') {
        updates.approved_at = new Date().toISOString()
      } else if (status === 'archived') {
        updates.archived_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('briefings')
        .update(updates)
        .eq('id', briefingId)
        .select()
        .single()

      if (error) throw error

      await supabase.from('briefing_activity').insert({
        agency_id: agencyId,
        briefing_id: briefingId,
        action: `status_changed_to_${status}`,
        metadata: { notes, timestamp: new Date().toISOString() },
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing', agencyId, briefingId] })
      queryClient.invalidateQueries({ queryKey: ['briefings', agencyId] })
    },
  })
}

// ------------------------------------------------------------
// 3. PUBLIC LINKS & TOKENS
// ------------------------------------------------------------
export function useCreatePublicLink(agencyId: string, briefingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params?: { maxSubmissions?: number; expiresInDays?: number }) => {
      const rawToken = generateSecureToken()
      const tokenHash = await sha256Hex(rawToken)

      let expiresAt: string | null = null
      if (params?.expiresInDays) {
        const expDate = new Date()
        expDate.setDate(expDate.getDate() + params.expiresInDays)
        expiresAt = expDate.toISOString()
      }

      const maxSubmissions = params?.maxSubmissions ?? 1

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('briefing_public_links').insert({
          agency_id: agencyId,
          briefing_id: briefingId,
          token_hash: tokenHash,
          expires_at: expiresAt,
          max_submissions: maxSubmissions,
        })
        if (error) throw error

        // Also update briefing status to 'sent' if it was draft
        await supabase
          .from('briefings')
          .update({ status: 'sent', updated_at: new Date().toISOString() })
          .eq('id', briefingId)
          .eq('status', 'draft')

        await supabase.from('briefing_activity').insert({
          agency_id: agencyId,
          briefing_id: briefingId,
          action: 'public_link_generated',
          metadata: { maxSubmissions, expiresAt },
        })
      }

      const publicUrl = `${window.location.origin}/b/${rawToken}`
      return { rawToken, publicUrl, tokenHash }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing', agencyId, briefingId] })
      queryClient.invalidateQueries({ queryKey: ['briefings', agencyId] })
    },
  })
}

export function useRevokePublicLink(agencyId: string, briefingId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (linkId: string) => {
      if (!isSupabaseConfigured || !supabase) return { success: true }

      const { error } = await supabase
        .from('briefing_public_links')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', linkId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['briefing', agencyId, briefingId] })
    },
  })
}
