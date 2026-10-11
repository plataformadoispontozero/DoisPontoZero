import { useAuth } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: TEAM CHAT HOOKS
// Realtime Messaging & Channel Management
// ============================================================

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import type {
  ChatChannel,
  ChatConversation,
  ChatMessage,
  ChatAttachment,
  ChatReaction,
} from '@/types/chat'

const DEMO_CHANNELS: ChatChannel[] = [
  {
    id: 'chan-001',
    agency_id: 'demo-agency',
    name: 'geral',
    description: 'Comunicação geral de toda a agência Dois.Zero',
    channel_type: 'general',
    visibility: 'agency',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unread_count: 0,
    member_count: 8,
  },
  {
    id: 'chan-002',
    agency_id: 'demo-agency',
    name: 'squad-creative-alpha',
    description: 'Canal de discussões do Squad Alpha',
    channel_type: 'squad',
    visibility: 'agency',
    squad_id: 'squad-001',
    squad_name: 'Squad Alpha',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unread_count: 2,
    member_count: 5,
  },
  {
    id: 'chan-003',
    agency_id: 'demo-agency',
    name: 'proj-acme-rebranding',
    description: 'Discussões diretas sobre as entregas da Acme Corp',
    channel_type: 'project',
    visibility: 'private',
    project_id: 'proj-001',
    project_name: 'Rebranding & Redes Sociais 2026',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    unread_count: 1,
    member_count: 4,
  },
]

const DEMO_CONVERSATIONS: ChatConversation[] = [
  {
    id: 'conv-001',
    agency_id: 'demo-agency',
    conversation_type: 'direct',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    other_user: {
      id: 'user-002',
      name: 'Fernanda Lima',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      role: 'Head of Design',
    },
    unread_count: 0,
  },
  {
    id: 'conv-002',
    agency_id: 'demo-agency',
    conversation_type: 'direct',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    other_user: {
      id: 'user-003',
      name: 'Rafael Souza',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      role: 'Motion Designer',
    },
    unread_count: 1,
  },
]

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'chan-001': [
    {
      id: 'msg-101',
      agency_id: 'demo-agency',
      channel_id: 'chan-001',
      sender_id: 'user-002',
      sender_name: 'Fernanda Lima',
      sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      body: 'Bom dia time! O novo template de branding da Acme Corp já está disponível no Presentation Studio.',
      message_type: 'text',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      updated_at: new Date(Date.now() - 3600000).toISOString(),
      reactions: [
        {
          id: 'react-1',
          agency_id: 'demo-agency',
          message_id: 'msg-101',
          user_id: 'user-001',
          user_name: 'Lucas Mendes',
          emoji: '🔥',
          created_at: new Date().toISOString(),
        },
      ],
    },
    {
      id: 'msg-102',
      agency_id: 'demo-agency',
      channel_id: 'chan-001',
      sender_id: 'user-001',
      sender_name: 'Lucas Mendes',
      sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      body: 'Excelente trabalho @Fernanda! Vou agendar a call de alinhamento com a diretoria para quinta-feira.',
      message_type: 'text',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      updated_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  'conv-001': [
    {
      id: 'msg-201',
      agency_id: 'demo-agency',
      conversation_id: 'conv-001',
      sender_id: 'user-002',
      sender_name: 'Fernanda Lima',
      sender_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      body: 'Lucas, você conseguiu revisar os arquivos do Google Drive da Starlight Tech?',
      message_type: 'text',
      created_at: new Date(Date.now() - 7200000).toISOString(),
      updated_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
}

let demoChannelsStore = [...DEMO_CHANNELS]
let demoConversationsStore = [...DEMO_CONVERSATIONS]
let demoMessagesStore: Record<string, ChatMessage[]> = { ...INITIAL_MESSAGES }

export function useChannels() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['chat_channels'],
    initialData: isSupabaseConfigured ? undefined : demoChannelsStore,
    queryFn: async (): Promise<ChatChannel[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError1 } = await supabase.from('chat_channels').select('*').eq('agency_id', agencyId).order('name', { ascending: true })
          if (backendError1) throw backendError1
          return data ?? [] as ChatChannel[]
        } catch (err) {
          throw err
        }
      }
      return demoChannelsStore
    },
  })
}

export function useConversations() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  return useQuery({
    queryKey: ['chat_conversations'],
    initialData: isSupabaseConfigured ? undefined : demoConversationsStore,
    queryFn: async (): Promise<ChatConversation[]> => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data , error: backendError2 } = await supabase.from('chat_conversations').select('*').eq('agency_id', agencyId).order('updated_at', { ascending: false })
          if (backendError2) throw backendError2
          return data ?? [] as ChatConversation[]
        } catch (err) {
          throw err
        }
      }
      return demoConversationsStore
    },
  })
}

export function useMessages(targetId?: string, isConversation = false) {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  // Realtime subscription setup
  useEffect(() => {
    if (!targetId || !isSupabaseConfigured || !supabase) return

    const channel = supabase
      .channel(`chat_${targetId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: isConversation ? `conversation_id=eq.${targetId}` : `channel_id=eq.${targetId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['chat_messages', targetId] })
        }
      )
      .subscribe()

    return () => {
      supabase?.removeChannel(channel)
    }
  }, [targetId, isConversation, queryClient])

  return useQuery({
    queryKey: ['chat_messages', targetId],
    enabled: Boolean(targetId),
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!targetId) return []

      if (isSupabaseConfigured && supabase) {
        try {
          let query = supabase.from('chat_messages').select('*, profiles:sender_id(full_name), chat_attachments(*), chat_reactions(*)').eq('agency_id', agencyId).is('deleted_at', null).order('created_at', { ascending: false }).limit(100)
          if (isConversation) {
            query = query.eq('conversation_id', targetId)
          } else {
            query = query.eq('channel_id', targetId)
          }
          const { data , error: backendError3 } = await query
          if (backendError3) throw backendError3
          return (data ?? []).reverse().map((m: any) => ({ ...m, sender_name: m.profiles?.full_name || 'Usuário', attachments: m.chat_attachments || [], reactions: m.chat_reactions || [] })) as ChatMessage[]
        } catch (err) {
          throw err
        }
      }

      return demoMessagesStore[targetId] || []
    },
  })
}

export function useSendMessage() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      targetId: string
      isConversation?: boolean
      body: string
      attachments?: Partial<ChatAttachment>[]
      messageType?: 'text' | 'file' | 'system'
    }): Promise<ChatMessage> => {
      if (supabase && isSupabaseConfigured) {
        if (!auth.user || !agencyId) throw new Error('Sessão e agência são obrigatórias.')
        if (!payload.body.trim()) throw new Error('Informe uma mensagem.')
        if (payload.attachments?.length) throw new Error('Anexos dependem da integração de Storage privado. Envie uma mensagem de texto.')
        const { data, error } = await supabase.from('chat_messages').insert({
          agency_id: agencyId, sender_id: auth.user.id,
          channel_id: payload.isConversation ? null : payload.targetId,
          conversation_id: payload.isConversation ? payload.targetId : null,
          body: payload.body.trim(), message_type: 'text', client_message_id: crypto.randomUUID(),
        }).select('*').single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['chat_messages', payload.targetId] })
        return { ...data, sender_name: auth.name, attachments: [], reactions: [] } as ChatMessage
      }
      const newMsgId = `msg-${Date.now()}`
      const newMsg: ChatMessage = {
        id: newMsgId,
        agency_id: agencyId,
        channel_id: payload.isConversation ? null : payload.targetId,
        conversation_id: payload.isConversation ? payload.targetId : null,
        sender_id: auth.user?.id || 'demo-user',
        sender_name: 'Lucas Mendes',
        sender_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
        body: payload.body,
        message_type: payload.messageType || 'text',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        attachments: (payload.attachments || []).map((att, idx) => ({
          id: `att-${newMsgId}-${idx}`,
          agency_id: agencyId,
          message_id: newMsgId,
          storage_path: att.storage_path || `chat/${att.file_name}`,
          file_name: att.file_name || 'arquivo.pdf',
          mime_type: att.mime_type || 'application/pdf',
          file_size: att.file_size || 1024000,
          created_at: new Date().toISOString(),
          url: att.url || 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600',
        })),
        reactions: [],
      }

      if (!demoMessagesStore[payload.targetId]) {
        demoMessagesStore[payload.targetId] = []
      }
      demoMessagesStore[payload.targetId].push(newMsg)

      queryClient.invalidateQueries({ queryKey: ['chat_messages', payload.targetId] })
      return newMsg
    },
  })
}

export function useCreateChannel() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: {
      name: string
      description?: string
      channel_type: 'general' | 'squad' | 'project' | 'custom'
      visibility: 'agency' | 'private'
      squad_id?: string
      project_id?: string
    }): Promise<ChatChannel> => {
      if (supabase && isSupabaseConfigured) {
        if (!auth.user || !agencyId) throw new Error('Sessão e agência são obrigatórias.')
        if (payload.visibility === 'private') throw new Error('Criação de canal privado requer transação de membros no backend; integração pendente.')
        const { data, error } = await supabase.from('chat_channels').insert({
          ...payload, name: payload.name.trim(), agency_id: agencyId, created_by: auth.user.id,
        }).select('*').single()
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['chat_channels'] })
        return data as ChatChannel
      }
      const newChan: ChatChannel = {
        id: `chan-${Date.now()}`,
        agency_id: agencyId,
        name: payload.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        description: payload.description || '',
        channel_type: payload.channel_type,
        visibility: payload.visibility,
        squad_id: payload.squad_id || null,
        project_id: payload.project_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        unread_count: 0,
        member_count: 1,
      }

      demoChannelsStore.push(newChan)
      queryClient.invalidateQueries({ queryKey: ['chat_channels'] })
      return newChan
    },
  })
}

export function useAddReaction() {
  const auth = useAuth()
  const agencyId = auth.activeAgency?.agencyId ?? ''

  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ targetId, messageId, emoji }: { targetId: string; messageId: string; emoji: string }) => {
      if (supabase && isSupabaseConfigured) {
        if (!auth.user || !agencyId) throw new Error('Sessão e agência são obrigatórias.')
        const { data: existing, error: readError } = await supabase.from('chat_reactions').select('id').eq('agency_id', agencyId).eq('message_id', messageId).eq('user_id', auth.user.id).eq('emoji', emoji).maybeSingle()
        if (readError) throw readError
        const { error } = existing
          ? await supabase.from('chat_reactions').delete().eq('id', existing.id).eq('agency_id', agencyId).eq('user_id', auth.user.id)
          : await supabase.from('chat_reactions').insert({ agency_id: agencyId, message_id: messageId, user_id: auth.user.id, emoji })
        if (error) throw error
        queryClient.invalidateQueries({ queryKey: ['chat_messages', targetId] })
        return
      }
      const msgs = demoMessagesStore[targetId] || []
      const msg = msgs.find((m) => m.id === messageId)
      if (msg) {
        if (!msg.reactions) msg.reactions = []
        const existing = msg.reactions.find((r) => r.emoji === emoji && r.user_id === 'user-001')
        if (existing) {
          msg.reactions = msg.reactions.filter((r) => r.id !== existing.id)
        } else {
          msg.reactions.push({
            id: `react-${Date.now()}`,
            agency_id: agencyId,
            message_id: messageId,
            user_id: 'user-001',
            user_name: 'Lucas Mendes',
            emoji,
            created_at: new Date().toISOString(),
          })
        }
      }
      queryClient.invalidateQueries({ queryKey: ['chat_messages', targetId] })
    },
  })
}
