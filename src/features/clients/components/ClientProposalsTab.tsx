// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: CLIENT HUB PROPOSALS TAB INTEGRATION
// Displays proposals linked to a client inside Client Hub (/clients/:clientId)
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { FileCheck2, Plus, ExternalLink, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProposals } from '@/features/proposals/hooks/useProposals'
import { formatCurrencyCents } from '@/features/proposals/services/pricingEngine'

interface Props {
  clientId: string
  clientName: string
}

export const ClientProposalsTab: React.FC<Props> = ({ clientId, clientName }) => {
  const { data: proposals = [], isLoading } = useProposals()

  const clientProposals = proposals.filter((p) => p.client_id === clientId || p.client_name === clientName)

  if (isLoading) {
    return <div className="p-4 text-xs text-text-muted">Carregando propostas do cliente...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-text-primary text-sm">Propostas Comercial do Cliente</h4>
          <p className="text-xs text-text-muted">Histórico de orçamentos, apresentações e negociações ativas.</p>
        </div>

        <Link to="/proposals/new">
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nova Proposta
          </Button>
        </Link>
      </div>

      {clientProposals.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-border/60 rounded-xl space-y-2">
          <FileCheck2 className="w-8 h-8 text-text-muted mx-auto opacity-50" />
          <p className="text-xs text-text-muted">Nenhuma proposta comercial criada para este cliente ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {clientProposals.map((prop) => (
            <div
              key={prop.id}
              className="p-3 rounded-lg border border-border/40 bg-surface-hover/30 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-text-muted">{prop.proposal_number}</span>
                  <span className="font-semibold text-text-primary">{prop.title}</span>
                </div>
                <span className="text-[10px] text-text-muted mt-0.5 block">
                  Status: {prop.status} • Total: {prop.pricing ? formatCurrencyCents(prop.pricing.total_cents) : 'R$ 0,00'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/proposals/${prop.id}`}>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Abrir Workspace
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
