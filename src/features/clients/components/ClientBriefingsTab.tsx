// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: CLIENT HUB — BRIEFINGS TAB COMPONENT
// Component for CRM integration (/clients/:clientId)
// ============================================================

import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Plus, Sparkles, Eye, Download, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useBriefings } from '@/features/briefing/hooks/useBriefings'
import { BRIEFING_STATUS_CONFIG } from '@/types/briefing'

export interface ClientBriefingsTabProps {
  clientId: string
  agencyId?: string
}

export const ClientBriefingsTab: React.FC<ClientBriefingsTabProps> = ({
  clientId,
  agencyId = 'demo-agency',
}) => {
  const navigate = useNavigate()
  const { data: briefings = [], isLoading, isError } = useBriefings(agencyId, { clientId })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#F8F9FC]">Briefings de formulário da conta</h3>
          <p className="text-xs text-[#B8B8C0]">
            Histórico de questionários e alinhamentos de escopo deste cliente.
          </p>
        </div>

        <Link to={`/briefings/new?clientId=${clientId}`}>
          <Button variant="primary" size="sm">
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Briefing</span>
          </Button>
        </Link>
      </div>

      {isError ? <p role="alert" className="rounded-xl border border-orange-500/30 p-4 text-sm">Não foi possível carregar os briefings deste cliente. Tente novamente.</p> : isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-[#1C1C24] animate-pulse" />
          ))}
        </div>
      ) : briefings.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#252530] text-[#C74410] flex items-center justify-center mx-auto">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-sm font-bold text-[#F8F9FC]">
              Nenhum briefing de formulário vinculado a esta conta
            </div>
            <p className="text-xs text-[#B8B8C0] max-w-sm mx-auto">
              Inicie um novo briefing criativo a partir dos modelos oficiais da agência.
            </p>
            <Link to={`/briefings/new?clientId=${clientId}`}>
              <Button variant="secondary" size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Criar Briefing para este Cliente
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {briefings.map((b) => {
            const statusCfg = BRIEFING_STATUS_CONFIG[b.status] || {
              label: b.status,
              badgeVariant: 'outline' as const,
            }

            return (
              <div
                key={b.id}
                className="p-4 rounded-xl bg-[#1C1C24] border border-[#30303B] hover:border-[#C74410]/50 transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={statusCfg.badgeVariant}>{statusCfg.label}</Badge>
                    <span className="text-xs text-[#C74410] font-medium">
                      {b.template?.name || 'Modelo Padrão'}
                    </span>
                    <span className="text-xs text-[#98989F]">V{b.template_version}.0</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#F8F9FC] truncate">{b.title}</h4>
                  {b.source_system === 'lovable' && <p className="text-xs text-orange-300">Migrado do Lovable{b.migration_review_pending ? ' · aguardando revisão' : ''}</p>}
                  <div className="text-[11px] text-[#98989F] flex items-center gap-2">
                    <span>Criado em: {new Date(b.created_at).toLocaleDateString('pt-BR')}</span>
                    {b.submitted_at && (
                      <>
                        <span>•</span>
                        <span>
                          Enviado pelo cliente:{' '}
                          {new Date(b.submitted_at).toLocaleDateString('pt-BR')}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/briefings/${b.id}/responses`)}
                    title="Consultar Respostas"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline ml-1">Respostas</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/briefings/${b.id}/export`)}
                    title="Baixar PDF Oficial"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C74410]" />
                    <span className="hidden sm:inline ml-1">PDF</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
