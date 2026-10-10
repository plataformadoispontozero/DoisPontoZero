// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 10: CHAT SETTINGS PAGE
// ============================================================

import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Settings, Hash, Shield, Bell, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useChannels } from './hooks/useChat'

export const ChatSettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { data: channels } = useChannels()
  const safeChannels = channels || []

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar ao Chat
        </Button>
        <div>
          <h1 className="text-xl font-bold text-content-primary">Configurações do Team Chat</h1>
          <p className="text-xs text-content-secondary">Gerencie canais, permissões de membros e retenção de mensagens.</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-content-primary flex items-center">
            <Hash className="w-4 h-4 mr-2 text-brand-primary" />
            Canais Ativos na Agência ({safeChannels.length})
          </h2>

          <div className="space-y-2">
            {safeChannels.map((c) => (
              <div key={c.id} className="p-3 bg-surface-subtle border border-surface-border rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-content-primary">#{c.name}</span>
                  <p className="text-content-tertiary">{c.description || 'Canal de agência'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="neutral">{c.channel_type}</Badge>
                  <Badge variant={c.visibility === 'agency' ? 'success' : 'accent'}>{c.visibility}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-bold text-content-primary flex items-center">
            <Bell className="w-4 h-4 mr-2 text-brand-primary" />
            Preferências de Notificação
          </h2>

          <div className="space-y-3 text-xs text-content-secondary">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-surface-border text-brand-primary focus:ring-brand-primary" />
              <span>Receber notificações de mensagens diretas</span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded border-surface-border text-brand-primary focus:ring-brand-primary" />
              <span>Receber notificações de menções (@)</span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  )
}
