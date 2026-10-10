// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: PROJECT WORKSPACE CHAT TAB
// ============================================================

import React, { useState } from 'react'
import { MessageSquare, Send, Hash, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMessages, useSendMessage } from '../../chat/hooks/useChat'

interface ProjectChatTabProps {
  projectId: string
  projectName: string
}

export const ProjectChatTab: React.FC<ProjectChatTabProps> = ({ projectId, projectName }) => {
  // Use channel for project or fallback to channel id
  const targetChannelId = 'chan-003'
  const { data: messages, isLoading } = useMessages(targetChannelId)
  const sendMessageMutation = useSendMessage()

  const [text, setText] = useState('')

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    const txt = text
    setText('')
    await sendMessageMutation.mutateAsync({
      targetId: targetChannelId,
      body: txt,
    })
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-content-primary flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-brand-primary" />
            Discussão do Projeto: {projectName}
          </h3>
          <p className="text-xs text-content-secondary">
            Canal de bate-papo exclusivo para membros alocados neste projeto.
          </p>
        </div>
      </div>

      <Card className="p-4 flex flex-col h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-3 p-2">
          {isLoading ? (
            <div className="text-center text-xs text-content-tertiary">Carregando mensagens do projeto...</div>
          ) : (messages || []).length === 0 ? (
            <div className="text-center text-xs text-content-tertiary">Nenhuma mensagem neste projeto ainda.</div>
          ) : (
            (messages || []).map((m) => (
              <div key={m.id} className="flex items-start space-x-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary font-bold text-[10px] flex items-center justify-center shrink-0">
                  {m.sender_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-content-primary">{m.sender_name}</span>
                    <span className="text-[10px] text-content-tertiary">
                      {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-content-secondary mt-0.5">{m.body}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSend} className="pt-3 border-t border-surface-border flex items-center space-x-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enviar mensagem para a equipe do projeto..."
            className="flex-1 px-3 py-1.5 bg-surface-subtle border border-surface-border rounded-lg text-content-primary text-xs focus:outline-none focus:border-brand-primary"
          />
          <Button variant="primary" size="sm" type="submit" disabled={!text.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
