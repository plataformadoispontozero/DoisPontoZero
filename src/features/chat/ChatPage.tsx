// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: TEAM CHAT MAIN PAGE
// 2-Column Responsive Layout (Sidebar + Messages Feed)
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Plus,
  Search,
  Send,
  Paperclip,
  Smile,
  Hash,
  User,
  Users,
  FolderKanban,
  MoreVertical,
  Settings,
  SmilePlus,
  FileText,
  Image as ImageIcon,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Dialog } from '@/components/ui/Dialog'
import { useChannels, useConversations, useMessages, useSendMessage, useCreateChannel, useAddReaction } from './hooks/useChat'
import { useSquads } from '../squads/hooks/useSquads'
import { useProjects } from '../projects/hooks/useProjects'
import type { ChatChannel, ChatMessage, ChannelType, ChannelVisibility } from '@/types/chat'

export const ChatPage: React.FC = () => {
  const { channelId, conversationId } = useParams<{ channelId?: string; conversationId?: string }>()
  const navigate = useNavigate()

  const { data: channels, isLoading: isLoadingChannels } = useChannels()
  const { data: conversations } = useConversations()
  const { data: squads = [] } = useSquads('agency-001')
  const { data: projects = [] } = useProjects()

  const safeChannels = channels || []
  const safeConversations = conversations || []

  // Active Target Selection
  const activeChannelId = channelId || (!conversationId && safeChannels[0]?.id ? safeChannels[0].id : null)
  const activeConversationId = conversationId || null
  const isConversationMode = Boolean(activeConversationId)
  const activeTargetId = isConversationMode ? activeConversationId : activeChannelId

  const { data: messages, isLoading: isLoadingMessages } = useMessages(activeTargetId || undefined, isConversationMode)
  const sendMessageMutation = useSendMessage()
  const createChannelMutation = useCreateChannel()
  const addReactionMutation = useAddReaction()

  const activeChannel = safeChannels.find((c) => c.id === activeChannelId)
  const activeConversation = safeConversations.find((c) => c.id === activeConversationId)

  // Message Input State
  const [inputText, setInputText] = useState('')
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelType>('general')
  const [newChannelVisibility, setNewChannelVisibility] = useState<ChannelVisibility>('agency')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeTargetId) return

    const textToSend = inputText
    setInputText('')

    await sendMessageMutation.mutateAsync({
      targetId: activeTargetId,
      isConversation: isConversationMode,
      body: textToSend,
    })
  }

  const handleCreateChannelSubmit = async () => {
    if (!newChannelName.trim()) return
    const created = await createChannelMutation.mutateAsync({
      name: newChannelName,
      description: newChannelDesc,
      channel_type: newChannelType,
      visibility: newChannelVisibility,
    })
    setNewChannelName('')
    setNewChannelDesc('')
    setIsCreateChannelOpen(false)
    navigate(`/chat/channels/${created.id}`)
  }

  const handleEmojiClick = async (msgId: string, emoji: string) => {
    if (!activeTargetId) return
    await addReactionMutation.mutateAsync({
      targetId: activeTargetId,
      messageId: msgId,
      emoji,
    })
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col md:flex-row bg-surface-card border border-surface-border rounded-xl overflow-hidden animate-in fade-in duration-200">
      {/* SIDEBAR DE CONVERSAS E CANAIS */}
      <div className="w-full md:w-72 border-r border-surface-border flex flex-col bg-surface-subtle/50 shrink-0">
        {/* Sidebar Header */}
        <div className="p-3 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center">
            <MessageSquare className="w-4 h-4 mr-1.5 text-brand-primary" />
            Team Chat
          </h2>
          <Button variant="ghost" size="sm" onClick={() => setIsCreateChannelOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Channels & DMs Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {/* Section: Canais */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary px-2">Canais</span>
            {safeChannels.map((chan) => {
              const isActive = activeChannelId === chan.id && !isConversationMode
              return (
                <button
                  key={chan.id}
                  onClick={() => navigate(`/chat/channels/${chan.id}`)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
                    isActive ? 'bg-brand-primary/15 text-brand-primary font-semibold' : 'text-content-secondary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Hash className="w-3.5 h-3.5 text-content-tertiary shrink-0" />
                    <span className="truncate">{chan.name}</span>
                  </div>
                  {chan.unread_count && chan.unread_count > 0 ? (
                    <Badge variant="accent">{chan.unread_count}</Badge>
                  ) : null}
                </button>
              )
            })}
          </div>

          {/* Section: Mensagens Diretas */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary px-2">Mensagens Diretas</span>
            {safeConversations.map((conv) => {
              const isActive = activeConversationId === conv.id
              return (
                <button
                  key={conv.id}
                  onClick={() => navigate(`/chat/direct/${conv.id}`)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-all ${
                    isActive ? 'bg-brand-primary/15 text-brand-primary font-semibold' : 'text-content-secondary hover:bg-surface-elevated'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{conv.other_user?.name || 'Membro Agência'}</span>
                  </div>
                  {conv.unread_count && conv.unread_count > 0 ? (
                    <Badge variant="accent">{conv.unread_count}</Badge>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL DE MENSAGENS */}
      <div className="flex-1 flex flex-col h-full bg-surface-card overflow-hidden">
        {/* Chat Header */}
        <div className="p-3.5 border-b border-surface-border flex items-center justify-between bg-surface-card">
          <div className="flex items-center space-x-2">
            {isConversationMode ? (
              <User className="w-4 h-4 text-brand-primary" />
            ) : (
              <Hash className="w-4 h-4 text-brand-primary" />
            )}
            <div>
              <h3 className="text-sm font-bold text-content-primary">
                {isConversationMode ? activeConversation?.other_user?.name : activeChannel?.name}
              </h3>
              <p className="text-[10px] text-content-tertiary">
                {isConversationMode
                  ? activeConversation?.other_user?.role || 'Membro Agência'
                  : activeChannel?.description || 'Canal de comunicação interna.'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/chat/settings')}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoadingMessages ? (
            <div className="p-8 text-center text-xs text-content-tertiary">
              <div className="animate-spin w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-2" />
              Sincronizando mensagens...
            </div>
          ) : (messages || []).length === 0 ? (
            <div className="p-12 text-center text-xs text-content-tertiary space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-content-tertiary mb-2 opacity-50" />
              <p className="font-semibold text-content-secondary">Nenhuma mensagem neste canal ainda</p>
              <p>Envie a primeira mensagem para iniciar a conversa.</p>
            </div>
          ) : (
            (messages || []).map((msg) => (
              <div key={msg.id} className="flex items-start space-x-3 group">
                <img
                  src={msg.sender_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full border border-surface-border shrink-0 mt-0.5 object-cover"
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-content-primary">{msg.sender_name || 'Membro'}</span>
                    <span className="text-[10px] text-content-tertiary">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-content-secondary leading-relaxed bg-surface-subtle p-3 rounded-lg border border-surface-border inline-block max-w-xl">
                    {msg.body}
                  </div>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att) => (
                        <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 p-2 bg-surface-elevated rounded border border-surface-border text-[11px] text-brand-primary hover:underline">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{att.file_name}</span>
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-2 pt-1">
                    {(msg.reactions || []).map((r) => (
                      <button key={r.id} onClick={() => handleEmojiClick(msg.id, r.emoji)} className="px-1.5 py-0.5 bg-surface-subtle border border-surface-border rounded text-[11px] hover:border-brand-primary">
                        {r.emoji} 1
                      </button>
                    ))}
                    <button onClick={() => handleEmojiClick(msg.id, '👍')} className="opacity-0 group-hover:opacity-100 transition-opacity text-content-tertiary hover:text-content-primary text-xs">
                      +👍
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-surface-border bg-surface-card flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enviar mensagem em #${isConversationMode ? activeConversation?.other_user?.name : activeChannel?.name || 'chat'}...`}
            className="flex-1 px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          />
          <Button variant="primary" size="sm" type="submit" disabled={!inputText.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </div>

      {/* DIALOG: CREATE CHANNEL */}
      <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
        <div className="p-6 space-y-4">
          <h3 className="text-base font-bold text-content-primary">Criar Novo Canal</h3>
          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Nome do Canal *</label>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="ex: squad-design ou proj-rebranding"
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-secondary mb-1">Descrição</label>
            <input
              type="text"
              value={newChannelDesc}
              onChange={(e) => setNewChannelDesc(e.target.value)}
              placeholder="Objetivo principal do canal..."
              className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Tipo de Canal</label>
              <select
                value={newChannelType}
                onChange={(e) => setNewChannelType(e.target.value as ChannelType)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="general">Geral</option>
                <option value="squad">Squad</option>
                <option value="project">Projeto</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Visibilidade</label>
              <select
                value={newChannelVisibility}
                onChange={(e) => setNewChannelVisibility(e.target.value as ChannelVisibility)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="agency">Toda Agência (Público)</option>
                <option value="private">Privado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => setIsCreateChannelOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateChannelSubmit} disabled={!newChannelName.trim()}>
              Criar Canal
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
