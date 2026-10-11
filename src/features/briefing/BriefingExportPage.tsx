import { isSupabaseConfigured } from '@/lib/supabase/client'
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
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
import { useBranding } from '@/app/providers/BrandingProvider'
import { transformBriefingToPdfModel } from './pdf/transformBriefingToPdfModel'
import { downloadBriefingPdf, generateBriefingPdfBlob } from './pdf/generateBriefingPdf'
import { INITIAL_BRIEFING_TEMPLATES } from './constants/initialTemplates'
import type { BriefingPdfModel } from './pdf/types'
import { toast } from '@/components/ui/Toast'

const DEMO_AGENCY_ID = 'demo-agency'

export const BriefingExportPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const { briefingId } = useParams<{ briefingId: string }>()
  const { branding: appBranding } = useBranding()
  const { data: realBriefing, isLoading } = useBriefing(briefingId)

  // Fallback demo briefing if empty
  const fallbackTpl = INITIAL_BRIEFING_TEMPLATES[0]
  const briefing =
    realBriefing || {
      id: briefingId || 'demo-briefing-1',
      agency_id: DEMO_AGENCY_ID,
      client_id: 'client-1',
      template_id: fallbackTpl.id,
      template_version: 1,
      title: 'Briefing de Identidade Visual e Posicionamento',
      description: 'Demandas estruturais para rebranding corporativo e manual de marca.',
      status: 'submitted' as const,
      created_by: null,
      assigned_to: null,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      approved_at: null,
      archived_at: null,
      client: {
        id: 'client-1',
        agency_id: DEMO_AGENCY_ID,
        name: 'Natura Cosméticos',
        slug: 'natura',
        logo_url: null,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      template: {
        id: fallbackTpl.id,
        agency_id: DEMO_AGENCY_ID,
        name: fallbackTpl.name,
        description: fallbackTpl.description,
        category: fallbackTpl.category,
        status: 'published' as const,
        version: 1,
        created_by: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: null,
        sections: fallbackTpl.sections.map((s, idx) => ({
          id: s.id,
          agency_id: DEMO_AGENCY_ID,
          template_id: fallbackTpl.id,
          title: s.title,
          description: s.description ?? null,
          position: idx,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })),
        questions: fallbackTpl.sections.flatMap((s) =>
          s.questions.map((q, qIdx) => ({
            id: q.id,
            agency_id: DEMO_AGENCY_ID,
            template_id: fallbackTpl.id,
            section_id: s.id,
            question_key: q.question_key,
            label: q.label,
            description: q.description ?? null,
            question_type: q.question_type,
            is_required: q.is_required,
            position: qIdx,
            options: q.options || [],
            validation_rules: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
        ),
      },
      answers: [
        {
          id: 'ans-1',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-1-1',
          answer_value:
            'A empresa nasceu com a meta de conectar produtos naturais sustentáveis com o consumidor contemporâneo.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-2',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-1-2',
          answer_value: 'Democratizar a pureza botânica com zero crueldade e embalagens circulares.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-3',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-2-1',
          answer_value: 'Cosméticos 100% orgânicos com fórmula bioativa patenteada.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-4',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-3-1',
          answer_value: 'Público 25-45 anos, consciente, urbano, classes A/B.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'ans-5',
          agency_id: DEMO_AGENCY_ID,
          briefing_id: briefingId || 'demo-briefing-1',
          question_id: 'q-br-8-1',
          answer_value: ['logo', 'manual', 'colors_typo'],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    }

  // Custom White Label options for PDF
  const [agencyName, setAgencyName] = useState(appBranding.company.legalName || 'Dois.Zero Creative Agency')
  const [primaryColor, setPrimaryColor] = useState(appBranding.colors.primary || '#7952FF')
  const [footerText, setFooterText] = useState('Documento confidencial gerado por Creative Agency OS.')
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Construct PDF Model
  const model: BriefingPdfModel = transformBriefingToPdfModel(briefing as any, {
    agencyName,
    primaryColor,
    footerText,
  })

  // Handle direct download
  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      await downloadBriefingPdf(model)
      toast.success('PDF profissional gerado com sucesso!')
    } catch (err) {
      toast.error(`Erro ao gerar PDF: ${String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // Generate preview in iframe
  const handlePreviewInBrowser = async () => {
    setIsGenerating(true)
    try {
      const res = await generateBriefingPdfBlob(model)
      setPreviewBlobUrl(res.blobUrl)
      toast.success('Prévia do PDF renderizada no navegador!')
    } catch (err) {
      toast.error(`Erro ao renderizar prévia: ${String(err)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (isSupabaseConfigured && (!realBriefing)) return <div role="alert">Recurso indisponível, carregando ou sem permissão. Nenhum exemplo substitui o recurso da agência.</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="PDF Studio — Exportação Editorial"
        subtitle="Gerador de documentos A4 com diagramação editorial, logotipo e marca-d'água personalizada da agência."
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
                  <FileText className="w-4 h-4 text-[#7952FF]" />
                  <h3 className="text-sm font-bold text-[#F8F9FC]">Especificações do Documento</h3>
                </div>
                <Badge variant="outline">A4 Vertical</Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#717182]">Identificador:</span>
                  <span className="font-mono text-[#F8F9FC] font-semibold">{model.documentId}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#717182]">Título:</span>
                  <span className="text-[#F8F9FC] font-medium text-right max-w-[200px] truncate">
                    {model.title}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#717182]">Cliente / Conta:</span>
                  <span className="font-bold text-[#F8F9FC]">{model.clientName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#717182]">Categoria:</span>
                  <span className="text-[#7952FF] font-semibold">{model.categoryLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#30303B]/60">
                  <span className="text-[#717182]">Total de Perguntas:</span>
                  <span className="text-[#F8F9FC]">
                    {model.metadata.answeredQuestions} de {model.metadata.totalQuestions} respondidas (
                    {model.metadata.completionRate}%)
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#717182]">Margens A4:</span>
                  <span className="text-[#A1A1B0]">Sup. 25mm • Inf. 20mm • Lat. 20mm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* White Label Customization Card */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#30303B]">
                <Settings2 className="w-4 h-4 text-[#7952FF]" />
                <h3 className="text-sm font-bold text-[#F8F9FC]">Personalização White Label</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-[#A1A1B0] block mb-1">
                    Nome da Agência no Cabeçalho e Rodapé
                  </label>
                  <Input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Nome da sua agência..."
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A1A1B0] block mb-1">
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
                  <label className="text-xs font-medium text-[#A1A1B0] block mb-1">
                    Texto de Rodapé (Disclaimer)
                  </label>
                  <Input
                    value={footerText}
                    onChange={(e) => setFooterText(e.target.value)}
                    placeholder="Texto confidencial..."
                  />
                </div>

                <div className="p-3 bg-[#1C1C24] rounded-lg border border-[#30303B] text-[11px] text-[#A1A1B0] space-y-1">
                  <div className="font-semibold text-[#F8F9FC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#7952FF]" /> Marca-d'água Editorial
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
                <iframe
                  src={previewBlobUrl}
                  className="w-full h-[620px] border-none"
                  title="Prévia do PDF"
                />
              ) : (
                <div className="p-12 text-center max-w-sm space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#1C1C24] border border-[#30303B] flex items-center justify-center text-[#7952FF] mx-auto shadow-xl">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#F8F9FC]">Pronto para Renderizar</h4>
                    <p className="text-xs text-[#A1A1B0] mt-1 leading-relaxed">
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
