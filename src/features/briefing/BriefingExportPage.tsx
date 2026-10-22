import {PdfPreview} from '@/components/pdf/PdfPreview'
// ============================================================
// DOIS.ZERO | 2.0
// FASE 06: PDF STUDIO — EXPORT & PREVIEW
// Route: /briefings/:briefingId/export
// ============================================================

import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  FileText,
  Download,
  Eye,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Building,
  Calendar,
  Layers,
  Settings2,
  RefreshCw,
  Lock,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { useBriefing } from './hooks/useBriefings'
import { transformBriefingToPdfModel } from './pdf/transformBriefingToPdfModel'
import { downloadBriefingPdf, generateBriefingPdfBlob } from './pdf/generateBriefingPdf'
import { useAgencyBranding, useAgencyDocumentSettings } from '@/features/settings/hooks/useAgencySettings'
import { resolveDocumentPdfBranding } from './pdf/documentBranding'
import type { BriefingPdfModel } from './pdf/types'
import { toast } from '@/components/ui/Toast'



export const BriefingExportPage: React.FC = () => {
  const { briefingId } = useParams<{ briefingId: string }>()
  const { data: realBriefing, isLoading } = useBriefing(briefingId)

  const briefing = realBriefing
  const savedBranding = useAgencyBranding()
  const savedDocuments = useAgencyDocumentSettings()
  const documentBranding = resolveDocumentPdfBranding(savedBranding.branding, savedDocuments.documentSettings)

  // Custom White Label options for PDF
  const [agencyNameOverride, setAgencyName] = useState<string>()
  const agencyName = agencyNameOverride ?? documentBranding.agencyName
  const [primaryColorOverride, setPrimaryColor] = useState<string>()
  const primaryColor = primaryColorOverride ?? documentBranding.primaryColor
  const [footerTextOverride, setFooterText] = useState<string>()
  const footerText = footerTextOverride ?? documentBranding.footerText ?? 'Documento confidencial gerado por 2.0.'
  const [previewBlob,setPreviewBlob]=useState<Blob|null>(null)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  useEffect(()=>()=>{if(previewBlobUrl)URL.revokeObjectURL(previewBlobUrl)},[previewBlobUrl])
  const [isGenerating, setIsGenerating] = useState(false)

  // Build PDF model lazily inside handlers to avoid render-time throw
  const buildModel = (): BriefingPdfModel =>
    transformBriefingToPdfModel(briefing as any, { ...documentBranding, agencyName, primaryColor, footerText })

  // Handle direct download
  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const m = buildModel()
      await downloadBriefingPdf(m)
      toast.success('PDF profissional gerado com sucesso!')
    } catch (err) {
      toast.error(`Erro ao gerar PDF: ${String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate PDF bytes for the internal page renderer
  const handlePreviewInBrowser = async () => {
    setIsGenerating(true)
    // Revoke previous blob URL
    try {
      const m = buildModel()
      const res = await generateBriefingPdfBlob(m)
      setPreviewBlob(res.blob);setPreviewBlobUrl(res.blobUrl)
      toast.success('Prévia do PDF renderizada no navegador!')
    } catch (err) {
      toast.error(`Erro ao renderizar prévia: ${String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Show loading spinner while briefing is fetching from Supabase
  if (isLoading || savedBranding.isLoading || savedDocuments.isLoading) {
    return (
      <div className="p-12 text-center text-content-secondary">
        <div className="animate-spin w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm">Carregando dados do briefing...</p>
      </div>
    )
  }

  // Only block when Supabase is configured, loading finished, and no briefing found
  if (!realBriefing || savedBranding.isError || savedDocuments.isError) {
    return (
      <div role="alert" className="p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-content-primary">Briefing não encontrado.</p>
        <p className="text-xs text-content-secondary">Este recurso não existe ou você não tem permissão para acessá-lo.</p>
      </div>
    )
  }

  // Safe to build display model at this point — briefing is guaranteed to be populated
  const model = buildModel()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="PDF Studio — Exportação Editorial"
        subtitle="Gerador de documentos com diagramação editorial, logotipo e marca-d'água personalizada da agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Briefings', href: '/briefings' },
          { label: 'Respostas', href: `/briefings/${briefingId}/responses` },
          { label: 'Exportar PDF' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to={`/briefings/${briefingId}/responses`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar às Respostas</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              disabled={isGenerating}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Gerando...' : 'Baixar PDF Oficial'}</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Document Specs & White Label (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Document Summary Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#30303B]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#C74410]" />
                  <h3 className="text-sm font-bold text-[#F8F9FC]">Especificações do Documento</h3>
                </div>
                <Badge variant="outline">A4 Vertical</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#98989F]">Identificador:</span>
                  <span className="font-mono text-[#F8F9FC] font-semibold">{model.documentId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#98989F]">Título:</span>
                  <span className="text-[#F8F9FC] font-medium text-right max-w-[200px] truncate">
                    {model.title}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#98989F]">Cliente / Conta:</span>
                  <span className="font-bold text-[#F8F9FC]">{model.clientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#98989F]">Categoria:</span>
                  <span className="text-[#C74410] font-semibold">{model.categoryLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#98989F]">Total de Perguntas:</span>
                  <span className="text-[#F8F9FC]">
                    {model.metadata.answeredQuestions} de {model.metadata.totalQuestions} respondidas (
                    {model.metadata.completionRate}%)
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#98989F]">Margens A4:</span>
                  <span className="text-[#B8B8C0]">Corpo 32mm • Inf. 20mm • Lat. 15,5mm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* White Label Customization Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#30303B]">
                <Settings2 className="w-4 h-4 text-[#C74410]" />
                <h3 className="text-sm font-bold text-[#F8F9FC]">Personalização White Label</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                    Nome da Agência no Cabeçalho e Rodapé
                  </label>
                  <Input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Nome da sua agência..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                    Cor Principal de Destaque
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-[#30303B]"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#B8B8C0] block mb-1">
                    Texto de Rodapé (Disclaimer)
                  </label>
                  <Input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Texto confidencial..."
                  />
                </div>

                <div className="p-3 bg-[#1C1C24] rounded-lg border border-[#30303B] text-[11px] text-[#B8B8C0] space-y-1">
                  <div className="font-semibold text-[#F8F9FC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C74410]" /> Marca-d'água Editorial
                  </div>
                  <p>
                    O símbolo da agência é aplicado centralizado com opacidade sutil (5%) em todas
                    as páginas do PDF para proteção de propriedade intelectual.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handlePreviewInBrowser}
                  disabled={isGenerating}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Visualizar Prévia do PDF</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: PDF Preview Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="min-h-[620px] flex flex-col justify-between overflow-hidden">
            <div className="p-4 bg-[#1C1C24] border-b border-[#30303B] flex items-center justify-between">
              <span className="text-xs font-bold text-[#F8F9FC]">Visualização do Documento PDF</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleDownload}
                  disabled={isGenerating}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </Button>
              </div>
            </div>

            <CardContent className="p-0 flex-1 flex flex-col items-center justify-center bg-[#111116]">
              {previewBlobUrl ? (
                <PdfPreview blob={previewBlob!} title="Prévia do PDF"/>
              ) : (
                <div className="p-12 text-center max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1C1C24] border border-[#30303B] flex items-center justify-center text-[#C74410] mx-auto shadow-xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#F8F9FC]">Pronto para Renderizar</h4>
                    <p className="text-xs text-[#B8B8C0] mt-1 leading-relaxed">
                      Clique em <strong>Visualizar Prévia</strong> para renderizar o PDF real
                      diretamente no navegador ou em <strong>Baixar PDF Oficial</strong> para
                      fazer o download do arquivo A4 formatado.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handlePreviewInBrowser}
                    disabled={isGenerating}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Carregar Prévia na Tela</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
