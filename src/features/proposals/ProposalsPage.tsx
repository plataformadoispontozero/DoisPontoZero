import React from 'react'
import { FileCheck2, Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/Button'

export const ProposalsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Propostas & Orçamentos"
        subtitle="Geração de propostas comerciais interativas, precificação por squad e aprovação online."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Propostas' },
        ]}
        actions={
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Proposta</span>
          </Button>
        }
      />

      <EmptyState
        icon={FileCheck2}
        title="Nenhuma proposta em negociação"
        subtitle="Módulo Comercial & Escopo de Agência"
        description="Elabore propostas com cálculo automatizado de margem, honorários fixos (retainer) ou projetos pontuais, com link público interativo e assinatura."
        statusBadge="Fase 01: Design System & Rotas"
        features={[
          'Precificação baseada em horas de squad ou entregáveis',
          'Links públicos interativos com rastreamento de visualização',
          'Aceite digital com validade jurídica e geração de contrato',
          'Transição automática de proposta aprovada para novo projeto',
        ]}
        actionLabel="Elaborar Primeira Proposta"
        onAction={() => alert('Módulo comercial estará disponível na fase correspondente.')}
      />
    </div>
  )
}
