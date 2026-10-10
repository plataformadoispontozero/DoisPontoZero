// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL EXPORT PAGE
// Dedicated export page for generating and downloading official PDF
// ============================================================

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, FileCheck2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useProposal } from './hooks/useProposals'
import { downloadProposalPdf } from './pdf/generateProposalPdf'
import { transformProposalToPdfModel } from './pdf/transformProposalToPdfModel'

export const ProposalExportPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  const navigate = useNavigate()
  const { data: proposal, isLoading } = useProposal(proposalId)

  if (isLoading) return <div className="p-8 text-center text-text-muted">Carregando dados para exportação...</div>
  if (!proposal) return <div className="p-8 text-center text-text-muted">Proposta não encontrada.</div>

  const handleDownload = () => {
    const model = transformProposalToPdfModel(proposal)
    downloadProposalPdf(model)
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Exportar PDF da Proposta"
        subtitle={`Proposta ${proposal.proposal_number} • ${proposal.title}`}
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: proposal.proposal_number, href: `/proposals/${proposal.id}` },
          { label: 'Exportar PDF' },
        ]}
      />

      <Card className="p-8 text-center space-y-6 border-border/60">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
          <FileCheck2 className="w-8 h-8" />
        </div>

        <div>
          <h3 className="text-xl font-bold text-text-primary">{proposal.title}</h3>
          <p className="text-sm text-text-muted mt-1">Cliente: {proposal.client_name}</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-hover/60 border border-border/40 text-left space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-text-muted">Status:</span>
            <span className="font-semibold text-text-primary">{proposal.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Seções Incluídas:</span>
            <span className="font-semibold text-text-primary">{proposal.sections?.length || 0} seções</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Serviços / Itens:</span>
            <span className="font-semibold text-text-primary">{proposal.items?.length || 0} itens</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-4 border-t border-border/40">
          <Button variant="outline" onClick={() => navigate(`/proposals/${proposal.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Voltar ao Workspace
          </Button>

          <Button variant="primary" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1.5" />
            Gerar e Baixar PDF
          </Button>
        </div>
      </Card>
    </div>
  )
}
