import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS — FASE 03
// TanStack Query Hooks for Client Management (CRM)
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type { Client } from '@/types/projects'

export interface ClientFilters {
  status?: 'active' | 'inactive' | 'archived'
  search?: string
}

export interface CreateClientPayload {
  name: string
  slug?: string
  logo_url?: string | null
  status?: 'active' | 'inactive'
  profile?: import("@/features/clients/clientProfile").ClientProfile
  contact_name?: string
  contact_email?: string
  brand_guidelines?: string
}

export interface UpdateClientPayload {
  id: string
  name?: string
  slug?: string
  logo_url?: string | null
  status?: 'active' | 'inactive' | 'archived'
  profile?: import("@/features/clients/clientProfile").ClientProfile
  contact_name?: string
  contact_email?: string
  brand_guidelines?: string
}

// -------------------------
// Hooks
// -------------------------

export function useClients(agencyId?: string, filters?: ClientFilters) {
  const activeAgencyId = useAgencyId()
  agencyId = agencyId ?? activeAgencyId
  return useQuery<Client[]>({
    queryKey: ['clients', agencyId, filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) throw new Error('Servidor indisponível. Não foi possível carregar os clientes.')

      let query = supabase
        .from('clients')
        .select('*')
        .eq('agency_id', agencyId)
        .order('name', { ascending: true })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      } else {
        query = query.neq('status', 'archived')
      }

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      const { data, error } = await query
      if (error) {
        throw error
      }

      return (data as Client[]) ?? []
    },
  })
}

export function useClient(clientId?: string) {
  const agencyId = useAgencyId()
  return useQuery<Client | null>({
    queryKey: ['client', agencyId, clientId],
    queryFn: async () => {
      if (!clientId) return null

      if (!isSupabaseConfigured || !supabase) {
        throw new Error('Servidor indisponível. Não foi possível carregar o cliente.')
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId).eq('agency_id', agencyId)
        .single()

      if (error) throw error
      return (data as Client) ?? null
    },
    enabled: Boolean(clientId),
  })
}

export function useCreateClient(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const slug =
        payload.slug ||
        payload.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

      if (!isSupabaseConfigured || !supabase) throw new Error('Servidor indisponível. Nenhuma alteração foi salva.')

      const { data, error } = await supabase
        .from('clients')
        .insert({
          agency_id: agencyId,
          name: payload.name.trim(),
          slug,
          logo_url: payload.logo_url || null,
          status: payload.status || 'active',
          profile: payload.profile || {},
        })
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', agencyId] })
    },
  })
}

export function useUpdateClient(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpdateClientPayload) => {
      if (!isSupabaseConfigured || !supabase) throw new Error('Servidor indisponível. Nenhuma alteração foi salva.')

      const { data, error } = await supabase
        .from('clients')
        .update({
          name: payload.name,
          slug: payload.slug,
          logo_url: payload.logo_url,
          status: payload.status,
          profile: payload.profile,
        })
        .eq('id', payload.id).eq('agency_id', agencyId)
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients', agencyId] })
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: ['client', agencyId, data.id] })
      }
    },
  })
}

export function useDeleteClient(agencyId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!isSupabaseConfigured || !supabase) throw new Error('Servidor indisponível. Nenhuma alteração foi salva.')

      const { error } = await supabase
        .from('clients')
        .update({ status: 'archived' })
        .eq('id', clientId).eq('agency_id', agencyId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', agencyId] })
    },
  })
}
