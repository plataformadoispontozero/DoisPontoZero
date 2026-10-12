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
// Demo Data (Fallback when Supabase not configured)
// -------------------------
let demoClientsCache: Client[] = [
  {
    id: 'client-demo-1',
    agency_id: 'demo-agency',
    name: 'Studio Vertex',
    slug: 'studio-vertex',
    logo_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'client-demo-2',
    agency_id: 'demo-agency',
    name: 'Nexus Tech B2B',
    slug: 'nexus-tech',
    logo_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'client-demo-3',
    agency_id: 'demo-agency',
    name: 'Pulse Digital',
    slug: 'pulse-digital',
    logo_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'client-demo-4',
    agency_id: 'demo-agency',
    name: 'Aura Cosméticos',
    slug: 'aura-cosmeticos',
    logo_url: null,
    status: 'active',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'client-demo-5',
    agency_id: 'demo-agency',
    name: 'Lumina Finanças',
    slug: 'lumina-financas',
    logo_url: null,
    status: 'inactive',
    created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
]

// -------------------------
// Hooks
// -------------------------

export function useClients(agencyId: string = 'demo-agency', filters?: ClientFilters) {
  return useQuery<Client[]>({
    queryKey: ['clients', agencyId, filters],
    queryFn: async () => {
      if (!isSupabaseConfigured || !supabase) {
        let list = [...demoClientsCache]
        if (filters?.status) {
          list = list.filter((c) => c.status === filters.status)
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          list = list.filter(
            (c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
          )
        }
        return list
      }

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
        return demoClientsCache.find((c) => c.id === clientId) ?? null
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

      if (!isSupabaseConfigured || !supabase) {
        const newClient: Client = {
          id: `demo-client-${Date.now()}`,
          agency_id: agencyId,
          name: payload.name.trim(),
          slug,
          logo_url: payload.logo_url || null,
          status: payload.status || 'active',
          profile: payload.profile || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        demoClientsCache = [newClient, ...demoClientsCache]
        return newClient
      }

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
      if (!isSupabaseConfigured || !supabase) {
        const index = demoClientsCache.findIndex((c) => c.id === payload.id)
        if (index >= 0) {
          demoClientsCache[index] = {
            ...demoClientsCache[index],
            ...payload,
            updated_at: new Date().toISOString(),
          }
        }
        return demoClientsCache[index]
      }

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
      if (!isSupabaseConfigured || !supabase) {
        demoClientsCache = demoClientsCache.filter((c) => c.id !== clientId)
        return { success: true }
      }

      const { error } = await supabase
        .from('clients')
        .update({ status: 'archived' })
        .eq('id', clientId)

      if (error) throw error
      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', agencyId] })
    },
  })
}
