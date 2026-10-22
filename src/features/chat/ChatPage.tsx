import {officeEnabled} from '@/features/office/officeFeature'
import {OfficeOverview} from '@/features/office/OfficeOverview'
import {useOfficeVoice} from '@/features/office/OfficeVoiceContext'
import { useAgencyId, usePermission } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: TEAM CHAT MAIN PAGE
// 2-Column Responsive Layout (Sidebar + Messages Feed)
// ============================================================

import React, { useState, useEffect } from 'react'
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
import { Select } from '@/components/ui/Select'
import {ChatDrivePicker,ChatDriveAttachment} from './ChatDriveAttachments'
import {WorkRooms} from './WorkRooms'
import {useRoomPresence} from './hooks/useRoomPresence'
import { Dialog } from '@/components/ui/Dialog'
import { useChannels, useConversations, useMessages, useSendMessage, useCreateChannel, useAddReaction, useChatMembers, useStartDirect, useMarkChatRead } from './hooks/useChat'
import { useSquads } from '../squads/hooks/useSquads'
import { useProjects } from '../projects/hooks/useProjects'
import type { ChatChannel, ChatMessage, ChannelType, ChannelVisibility } from '@/types/chat'

export const ChatPage: React.FC<{officeMode?:boolean}> = ({officeMode=false}) => {
  const voice = useOfficeVoice()
  const [showRoomNavigation,setShowRoomNavigation] = useState(false)
  const focusedOffice = officeMode && Boolean(voice.roomId)
  const agencyId = useAgencyId()
  const canMeet = usePermission('meetings.view')
  const canCreateRoom = usePermission('chat.create_channels')
  const { channelId, conversationId } = useParams<{ channelId?: string; conversationId?: string }>()
  const navigate = useNavigate()

  const { data: channels, isLoading: isLoadingChannels, error: channelsError } = useChannels()
  const { data: conversations, error: conversationsError } = useConversations()
  const { data: squads = [] } = useSquads(agencyId)
  const { data: projects = [] } = useProjects()

  const safeChannels = channels || []
  const safeConversations = conversations || []

  // Active Target Selection
  const activeChannelId = channelId || null
  const roomPresence=useRoomPresence(safeChannels.some(c=>c.id===channelId)?channelId:null)
  const activeConversationId = conversationId || null
  const isConversationMode = Boolean(activeConversationId)
  const activeTargetId = isConversationMode ? activeConversationId : activeChannelId

  const { data: messages, isLoading: isLoadingMessages, error: messagesError } = useMessages(activeTargetId || undefined, isConversationMode)
  const sendMessageMutation = useSendMessage()
  const createChannelMutation = useCreateChannel()
  const addReactionMutation = useAddReaction()

  const activeChannel = safeChannels.find((c) => c.id === activeChannelId)
  const activeConversation = safeConversations.find((c) => c.id === activeConversationId)

  const {data:members=[],error:membersError,isLoading:isLoadingMembers}=useChatMembers()
  const startDirect=useStartDirect()
  const markRead=useMarkChatRead()
  const [actionError,setActionError]=useState('')
  const [selectedMembers,setSelectedMembers]=useState<string[]>([])
  const [directMember, setDirectMember] = useState('')
  const [directFailed, setDirectFailed] = useState(false)
  const errorMessage = (error: unknown, fallback: string) => error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : fallback
  const openDirect = async (memberId: string) => {
    if (!memberId || startDirect.isPending) return
    setDirectMember(memberId); setActionError(''); setDirectFailed(false)
    try {
      const id = await startDirect.mutateAsync(memberId)
      setDirectMember(''); navigate(`/chat/direct/${id}`)
    } catch (error) { setDirectFailed(true); setActionError(errorMessage(error, 'Não foi possível abrir conversa. Tente novamente.')) }
  }
  const lastMessage=messages?.at(-1)?.id
  useEffect(()=>{if(activeTargetId&&lastMessage)markRead.mutate({target:activeTargetId,direct:isConversationMode,last:lastMessage})},[activeTargetId,lastMessage,isConversationMode])
  // Message Input State
  const [drivePickerOpen,setDrivePickerOpen]=useState(false)
  const [inputText, setInputText] = useState('')
  const [roomSearch,setRoomSearch]=useState('')
  const showingRooms=!channelId&&!conversationId
  const visibleChannels=safeChannels.filter(room=>!roomSearch.trim()||room.name.toLocaleLowerCase('pt-BR').includes(roomSearch.toLocaleLowerCase('pt-BR')))
  const openCreate=()=>{if(!canCreateRoom)return;setSelectedMembers([]);setNewChannelVisibility('agency');setNewChannelType('general');setActionError('');setIsCreateChannelOpen(true)}
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelDesc, setNewChannelDesc] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelType>('general')
  const [newChannelVisibility, setNewChannelVisibility] = useState<ChannelVisibility>('agency')

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !activeTargetId) return

    const textToSend = inputText
    setActionError('')
    try { await sendMessageMutation.mutateAsync({
      targetId: activeTargetId,
      isConversation: isConversationMode,
      body: textToSend,
    });setInputText('') } catch(error){setActionError(error instanceof Error?error.message:'Não foi possível enviar. Tente novamente.')}
  }

  const handleCreateChannelSubmit = async () => {
    if (!newChannelName.trim()) return
    setActionError('')
    try { const created = await createChannelMutation.mutateAsync({
      name: newChannelName,
      description: newChannelDesc,
      channel_type: newChannelType,
      visibility: newChannelVisibility,
      members:newChannelVisibility === 'private' ? selectedMembers : [],
    })
    setNewChannelName('')
    setNewChannelDesc('')
    setSelectedMembers([])
    setNewChannelType('general')
    setNewChannelVisibility('agency')
    setIsCreateChannelOpen(false)
    navigate(`/chat/channels/${created.id}`)
    } catch(error){setActionError(errorMessage(error, 'Não foi possível criar canal'))}
  }

  const handleEmojiClick = async (msgId: string, emoji: string) => {
    if (!activeTargetId) return
    try { await addReactionMutation.mutateAsync({
      targetId: activeTargetId,
      messageId: msgId,
      emoji,
    }) } catch(error){setActionError(error instanceof Error?error.message:'Não foi possível alterar reação')}
  }

  return (
    <div className="h-[calc(100dvh-8.5rem)] min-h-[540px] max-h-[1000px] flex flex-col md:flex-row bg-surface-card border border-surface-border rounded-xl overflow-hidden animate-in fade-in duration-200">
      {/* SIDEBAR DE CONVERSAS E CANAIS */}
      <div hidden={focusedOffice&&!showRoomNavigation} className={`${focusedOffice&&!showRoomNavigation?'hidden':'flex'} w-full md:w-72 max-h-56 md:max-h-none border-r border-surface-border flex-col bg-surface-subtle/50 shrink-0`}>
        {/* Sidebar Header */}
        <div className="p-3 border-b border-surface-border flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-content-secondary flex items-center">
            <MessageSquare className="w-4 h-4 mr-1.5 text-brand-primary" />
            {officeMode?'Escritório Digital':officeEnabled?'Mensagens · Escritório Digital':'Team Chat · Salas'}
          </h2>
          <Button variant="ghost" size="sm" aria-label="Criar novo canal" disabled={!canCreateRoom} onClick={openCreate}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Channels & DMs Navigation */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          <button className="w-full rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-2 text-left font-semibold text-orange-300" onClick={()=>navigate('/chat')}>Visão das salas</button>
          <label className="block space-y-2">Buscar salas<input className="w-full rounded-lg border border-white/15 bg-black/20 p-2 text-white" value={roomSearch} onChange={e=>setRoomSearch(e.target.value)} placeholder="Nome da sala..."/></label>
          {/* Section: Canais */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-content-tertiary px-2">Salas de trabalho</span>
            {visibleChannels.map((chan) => {
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
            <Select aria-label="Iniciar mensagem direta" value={directMember} style={{ colorScheme: 'dark' }} disabled={startDirect.isPending || isLoadingMembers || Boolean(membersError) || members.length === 0} onChange={e => void openDirect(e.target.value)}>
              <option value="">{isLoadingMembers ? 'Carregando membros...' : membersError ? 'Falha ao carregar membros' : members.length === 0 ? 'Nenhum outro membro ativo' : 'Conversar com membro...'}</option>
              {members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
            </Select>
            {startDirect.isPending && <p role="status" className="px-2 text-content-secondary">Abrindo conversa...</p>}
            {directFailed && directMember && <Button variant="ghost" size="sm" disabled={startDirect.isPending || Boolean(membersError)} onClick={() => void openDirect(directMember)}>Tentar abrir conversa novamente</Button>}
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
                    <User className="w-3 h-3 shrink-0" />
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
      <div className="min-w-0 min-h-0 flex-1 flex flex-col h-full bg-surface-card overflow-hidden">
        {focusedOffice&&<div className="border-b border-surface-border px-4 py-2"><button type="button" aria-expanded={showRoomNavigation} className="min-h-11 rounded-lg border border-surface-border px-3 text-sm" onClick={()=>setShowRoomNavigation(value=>!value)}>{showRoomNavigation?'Recolher salas e mensagens':'Mostrar salas e mensagens'}</button></div>}
        {(actionError||channelsError||conversationsError||messagesError||membersError||markRead.error)&&<div role="alert" className="p-3 text-sm text-red-400">{actionError||'Não foi possível sincronizar o chat. Confira sua conexão e tente novamente.'}</div>}
        {showingRooms?<div className="flex-1 overflow-y-auto"><>{officeMode&&<OfficeOverview rooms={safeChannels.length} loading={isLoadingChannels} failed={!!channelsError}/>}<WorkRooms compact={officeMode} rooms={visibleChannels} onEnter={id=>navigate(`/chat/channels/${id}`)} onCreate={openCreate} canCreate={canCreateRoom} onMeetings={canMeet?()=>navigate('/meetings'):undefined}/></></div>:<>
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
            <Button variant="ghost" size="sm" aria-label="Configurações das salas" onClick={() => navigate('/chat/settings')}>
              <Settings className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {!isConversationMode&&<div className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-3 text-xs text-zinc-400" aria-label="Presença na sala">{roomPresence.isError?<span role="status">Presença indisponível. As mensagens continuam disponíveis.</span>:roomPresence.isFetching&&!roomPresence.data?<span>Verificando presença…</span>:<><span title="Presença da equipe na sala de mensagens">Presentes nesta sala</span>{roomPresence.data?.map(person=><span key={person.user_id} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1">{person.avatar_url?<img src={person.avatar_url} alt="" className="h-5 w-5 rounded-full"/>:<span aria-hidden="true" className="h-2 w-2 rounded-full bg-orange-400"/>}{person.name||'Membro da equipe'}</span>)}</>}</div>}
        {/* Message Feed */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-white/[0.01] to-transparent">
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
            (messages || []).map((msg) => {
              const reactionCounts = Array.from(
                (msg.reactions || []).reduce((counts, reaction) => {
                  counts.set(reaction.emoji, (counts.get(reaction.emoji) || 0) + 1)
                  return counts
                }, new Map<string, number>())
              )
              return (
              <div key={msg.id} className="flex items-start space-x-3 group">
                {msg.sender_avatar?<img src={msg.sender_avatar} alt={msg.sender_name||'Membro da equipe'} className="h-9 w-9 rounded-xl object-cover"/>:<div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 font-semibold text-orange-300">{(msg.sender_name||'M').slice(0,1).toUpperCase()}</div>}

                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-content-primary">{msg.sender_name || 'Membro'}</span>
                    <span className="text-[10px] text-content-tertiary">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="text-xs text-content-secondary leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/10 inline-block max-w-xl whitespace-pre-wrap break-words">
                    {msg.body}
                  </div>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.attachments.map((att) => (
                        <ChatDriveAttachment key={att.id} attachment={att}/>
                      ))}
                    </div>
                  )}

                  {/* Reactions */}
                  <div className="flex items-center space-x-2 pt-1">
                    {reactionCounts.map(([emoji, count]) => (
                      <button key={emoji} onClick={() => handleEmojiClick(msg.id, emoji)} className="px-1.5 py-0.5 bg-surface-subtle border border-surface-border rounded text-[11px] hover:border-brand-primary">
                        {emoji} {count}
                      </button>
                    ))}
                    <button onClick={() => handleEmojiClick(msg.id, '👍')} className="opacity-0 group-hover:opacity-100 transition-opacity text-content-tertiary hover:text-content-primary text-xs">
                      +👍
                    </button>
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>

        {/* Message Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-surface-border bg-surface-card flex items-center space-x-2">
          <button type="button" aria-label="Compartilhar material do Drive" title="Compartilhar material do Drive" disabled={!activeTargetId||Boolean(messagesError)} onClick={()=>setDrivePickerOpen(true)} className="p-2 rounded-lg text-orange-300 hover:bg-orange-500/10"><Paperclip className="h-4 w-4"/></button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Enviar mensagem em #${isConversationMode ? activeConversation?.other_user?.name : activeChannel?.name || 'chat'}...`}
            className="flex-1 px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          />
          <Button variant="primary" size="sm" type="submit" disabled={!inputText.trim() || !activeTargetId || sendMessageMutation.isPending || Boolean(messagesError)}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
        </>}
      </div>

      <Dialog open={drivePickerOpen} onOpenChange={setDrivePickerOpen}>{drivePickerOpen&&activeTargetId&&<ChatDrivePicker key={activeTargetId} targetId={activeTargetId} direct={isConversationMode} onDone={()=>setDrivePickerOpen(false)}/>}</Dialog>
      {/* DIALOG: CREATE CHANNEL */}
      <Dialog open={isCreateChannelOpen} onOpenChange={open => {setIsCreateChannelOpen(open); if (!open) {setSelectedMembers([]); setActionError('')}}}>
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
              <Select
                aria-label="Tipo de Canal"
                style={{ colorScheme: 'dark' }}
                value={newChannelType}
                onChange={(e) => setNewChannelType(e.target.value as ChannelType)}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="general">Geral</option>
                <option value="squad">Squad</option>
                <option value="project">Projeto</option>
                <option value="custom">Personalizado</option>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-secondary mb-1">Visibilidade</label>
              <Select
                aria-label="Visibilidade"
                style={{ colorScheme: 'dark' }}
                value={newChannelVisibility}
                onChange={(e) => {setNewChannelVisibility(e.target.value as ChannelVisibility); setSelectedMembers([])}}
                className="w-full px-3 py-2 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
              >
                <option value="agency">Toda Agência (Público)</option>
                <option value="private">Privado</option>
              </Select>
            </div>
          </div>

          {newChannelVisibility==='private'&&<fieldset><legend className="text-sm">Participantes do canal privado</legend>{members.map(m=><label key={m.id} className="flex gap-2 p-1"><input type="checkbox" checked={selectedMembers.includes(m.id)} onChange={e=>setSelectedMembers(v=>e.target.checked?[...v,m.id]:v.filter(id=>id!==m.id))}/>{m.name}</label>)}<p className="text-xs">Você participa como criador.</p></fieldset>}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={() => {setIsCreateChannelOpen(false);setSelectedMembers([]);setActionError('')}}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleCreateChannelSubmit} disabled={!newChannelName.trim() || createChannelMutation.isPending || (newChannelVisibility === 'private' && (isLoadingMembers || Boolean(membersError)))}>
              Criar Canal
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
