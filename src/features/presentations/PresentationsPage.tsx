import React from 'react'
import { Presentation, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'

export const PresentationsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Apresentações & Decks"
        subtitle="Geração de decks de defesa criativa, relatórios de mídia e entregáveis executivos."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Apresentações' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Deck</span>
          </Button>
        }
      />

      <EmptyState
        icon={Presentation}
        title="Nenhuma apresentação criada"
        subtitle="Pitch Decks & Defesas Criativas White Label"
        description="Apresente campanhas com visual cinematográfico, modo apresentação fullscreen e link interativo protegido por senha para clientes."
        statusBadge="Fase 01: Design System & Rotas"
        features={[
          'Modelos modernos com identidade visual da agência ou do cliente',
          'Modo apresentação fullscreen responsivo',
          'Incorporação de vídeos em 4K, motion boards e protótipos',
          'Métricas de tempo de visualização de cada slide pelo cliente',
        ]}
        actionLabel="Criar Novo Deck Criativo"
        onAction={() => alert('Módulo de apresentações estará disponível em fase posterior.')}
      />
    </div>
  )
}
