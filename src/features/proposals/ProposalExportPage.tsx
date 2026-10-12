// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL EXPORT PAGE
// Dedicated export page for generating and downloading official PDF
// ============================================================

import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, FileCheck2, ArrowLeft, Eye, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useProposal } from './hooks/useProposals'
import { downloadProposalPdf, generateProposalPdfBlob } from './pdf/generateProposalPdf'
import { transformProposalToPdfModel } from './pdf/transformProposalToPdfModel'
import { toast } from '@/components/ui/Toast'

export const ProposalExportPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  const navigate = useNavigate()
  const { data: proposal, isLoading } = useProposal(proposalId)
  const [isDownloading, setIsDownloading] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)

  if (isLoading) {
    return (
      <div className="p-12 text-center text-content-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm">Carregando dados para exportação...</p>
      </div>
    )
  }
  if (!proposal) return <div className="p-8 text-center text-text-muted">Proposta não encontrada.</div>

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const model = transformProposalToPdfModel(proposal)
      await downloadProposalPdf(model)
      toast.success('PDF da proposta gerado com sucesso!')
    } catch (err) {
      console.error('Erro ao exportar PDF da proposta:', err)
      toast.error(`Erro ao gerar PDF: ${String(err)}`)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreview = async () => {
    setIsPreviewing(true)
    if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl)
    try {
      const model = transformProposalToPdfModel(proposal)
      const res = await generateProposalPdfBlob(model)
      setPreviewBlobUrl(res.blobUrl)
      toast.success('Prévia da proposta carregada!')
    } catch (err) {
      console.error('Erro ao gerar prévia da proposta:', err)
      toast.error(`Erro ao renderizar prévia: ${String(err)}`)
    } finally {
      setIsPreviewing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <PageHeader
        title="Exportar PDF da Proposta"
        subtitle={`Proposta ${proposal.proposal_number} • ${proposal.title}`}
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: proposal.proposal_number, href: `/proposals/${proposal.id}` },
          { label: 'Exportar PDF' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Summary */}
        <Card className="lg:col-span-2 p-6 space-y-5 border-border/60">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <FileCheck2 className="w-7 h-7" />
          </div>

          <div className="text-center">
            <h3 className="text-base font-bold text-text-primary">{proposal.title}</h3>
            <p className="text-xs text-text-muted mt-1">Cliente: {proposal.client_name}</p>
          </div>

          <div className="p-3 rounded-xl bg-surface-hover/60 border border-border/40 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-text-muted">Status:</span>
              <span className="font-semibold text-text-primary">{proposal.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Seções:</span>
              <span className="font-semibold text-text-primary">{proposal.sections?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Itens:</span>
              <span className="font-semibold text-text-primary">{proposal.items?.length || 0}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={handlePreview} disabled={isPreviewing || isDownloading} className="w-full">
              {isPreviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Eye className="w-3.5 h-3.5 mr-1" />}
              {isPreviewing ? 'Carregando prévia...' : 'Visualizar Prévia'}
            </Button>
            <Button variant="primary" size="sm" onClick={handleDownload} disabled={isDownloading || isPreviewing} className="w-full">
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Download className="w-3.5 h-3.5 mr-1" />}
              {isDownloading ? 'Gerando PDF...' : 'Baixar PDF Oficial'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/proposals/${proposal.id}`)} className="w-full">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar ao Workspace
            </Button>
          </div>
        </Card>

        {/* Right: Preview iframe */}
        <Card className="lg:col-span-3 min-h-[560px] flex flex-col overflow-hidden border-border/60">
          <div className="p-3 bg-surface-subtle border-b border-border/60 flex items-center justify-between">
            <span className="text-xs font-semibold text-text-primary">Visualização do Documento</span>
            {previewBlobUrl && (
              <Button variant="primary" size="sm" onClick={handleDownload} disabled={isDownloading}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Download
              </Button>
            )}
          </div>
          <div className="flex-1 flex items-center justify-center bg-[#111116]">
            {previewBlobUrl ? (
              <iframe src={previewBlobUrl} className="w-full h-[560px] border-none" title="Prévia da Proposta em PDF" />
            ) : (
              <div className="p-10 text-center space-y-3">
                <FileCheck2 className="w-10 h-10 text-text-muted/40 mx-auto" />
                <p className="text-xs text-text-muted">Clique em <strong>Visualizar Prévia</strong> para renderizar o documento aqui.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
