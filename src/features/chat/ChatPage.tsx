import React from 'react'
import { MessageSquare, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'

export const ChatPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Chat & Canais Internos"
        subtitle="Canais por squad, threads por projeto e conversas diretas para colaboração ágil."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Chat' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Canal</span>
          </Button>
        }
      />

      <EmptyState
        icon={MessageSquare}
        title="Nenhuma conversa ativa no momento"
        subtitle="Comunicação Integrada ao Fluxo de Trabalho"
        description="Centralize discussões sobre peças, roteiros e campanhas diretamente ao lado dos arquivos, reduzindo o ruído de múltiplos apps de mensagem."
        statusBadge="Fase 01: Design System & Rotas"
        features={[
          'Canais por squad, projeto ou tópicos gerais da agência',
          'Mensagens com menções a membros (@) e projetos (#)',
          'Envio direto de previews de imagem, vídeo e áudio',
          'Integrações com bots de notificações de entrega',
        ]}
        actionLabel="Criar Canal Geral"
        onAction={() => alert('Mensageria em tempo real será implementada em fase posterior.')}
      />
    </div>
  )
}
