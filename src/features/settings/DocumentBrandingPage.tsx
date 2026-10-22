import React, { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useAgencyDocumentSettings, useAgencyBranding } from './hooks/useAgencySettings'
import { FileSpreadsheet, Save, FileText, CheckCircle2, Eye } from 'lucide-react'
import { PdfPreview } from '@/components/pdf/PdfPreview'
import { resolveDocumentPdfBranding, platformDocumentText } from '@/features/briefing/pdf/documentBranding'
import type { BriefingPdfModel } from '@/features/briefing/pdf/types'
import type { HeaderStyle, PageFormat } from '@/types/whitelabel'

const DocumentBrandingPageForm: React.FC = () => {
  const { branding } = useAgencyBranding()
  const { documentSettings, updateDocumentSettings } = useAgencyDocumentSettings()

  const [formData, setFormData] = useState({
    headerStyle: documentSettings.header_style,
    footerText: platformDocumentText(documentSettings.footer_text),
    showLogo: documentSettings.show_logo,
    showWatermark: documentSettings.show_watermark,
    watermarkOpacity: documentSettings.watermark_opacity,
    pageFormat: documentSettings.page_format,
    documentFont: documentSettings.document_font,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [previewError, setPreviewError] = useState('')
  const [isPreviewing, setIsPreviewing] = useState(false)
  const generation = useRef(0)
  useEffect(() => () => { generation.current++ }, [])
  const preview = async () => {
    const request = ++generation.current
    setIsPreviewing(true); setPreviewError('')
    try {
      const pdfBranding = resolveDocumentPdfBranding(branding, {...documentSettings,
        header_style:formData.headerStyle,footer_text:formData.footerText,show_logo:formData.showLogo,
        show_watermark:formData.showWatermark,watermark_opacity:Number(formData.watermarkOpacity),
        page_format:formData.pageFormat,document_font:formData.documentFont,
      })
      const model: BriefingPdfModel = {
        briefingId:'preview-only',documentId:'PRÉVIA',title:'Direção estratégica',clientName:'Cliente',
        category:'social_media',categoryLabel:'Social Media',version:1,statusLabel:'Prévia não salva',
        formattedDate:new Intl.DateTimeFormat('pt-BR').format(new Date()),branding:pdfBranding,
        metadata:{totalQuestions:2,answeredQuestions:2,completionRate:100,generatedAt:new Date().toISOString()},
        sections:[{id:'preview-section',title:'Contexto do cliente',questions:[
          {id:'objective',label:'Objetivo',questionType:'text',answerText:'Apresentar o objetivo da campanha e as informações confirmadas no briefing.',hasAnswer:true},
          {id:'audience',label:'Público e comunicação',questionType:'text',answerText:'Organizar o público-alvo, o tom de voz e a direção visual aprovados para o cliente.',hasAnswer:true},
        ]}],
      }
      const {generateBriefingPdfBlob} = await import('@/features/briefing/pdf/generateBriefingPdf')
      const result = await generateBriefingPdfBlob(model)
      URL.revokeObjectURL(result.blobUrl)
      if (request === generation.current) setPreviewBlob(result.blob)
    } catch { if (request === generation.current) setPreviewError('Não foi possível gerar a prévia. Tente novamente.') }
    finally { if (request === generation.current) setIsPreviewing(false) }
  }


  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateDocumentSettings({
        header_style: formData.headerStyle as HeaderStyle,
        footer_text: formData.footerText,
        show_logo: formData.showLogo,
        show_watermark: formData.showWatermark,
        watermark_opacity: Number(formData.watermarkOpacity),
        page_format: formData.pageFormat as PageFormat,
        document_font: formData.documentFont,
      })
      toast.success('Configurações de branding de documentos PDF atualizadas!')
    } catch {
      toast.error('Erro ao salvar configurações de documentos.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C74410]" />
            Branding de Documentos PDF
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Defina o layout, cabeçalhos, marca-d'água e rodapé aplicados nos relatórios e exportações da agência.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Parâmetros PDF</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo de Controles (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Layout do Cabeçalho & Formato</CardTitle>
              <CardDescription className="text-xs">
                Estilo de cabeçalho, opacidade da marca-d'água e formato de folha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                  Estilo de Cabeçalho do Documento
                </label>
                <Select
                  value={formData.headerStyle}
                  onChange={(e) => setFormData({ ...formData, headerStyle: e.target.value as HeaderStyle })}
                  options={[
                    { value: 'centered_logo', label: 'Logotipo Centralizado com Linha Divisória (Padrão)' },
                    { value: 'left_logo', label: 'Logotipo alinhado à esquerda com nome da agência' },
                    { value: 'minimal', label: 'Cabeçalho Minimalista com barra superior' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                    Formato de Página
                  </label>
                  <Select
                    value={formData.pageFormat}
                    onChange={(e) => setFormData({ ...formData, pageFormat: e.target.value as PageFormat })}
                    options={[
                      { value: 'A4', label: 'A4 (210 × 297 mm)' },
                      { value: 'Letter', label: 'Carta / Letter (216 × 279 mm)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                    Fonte dos Documentos
                  </label>
                  <Select
                    value={formData.documentFont}
                    onChange={(e) => setFormData({ ...formData, documentFont: e.target.value })}
                    options={[
                      { value: 'Helvetica', label: 'Helvetica / Neue (Padrão)' },
                      { value: 'Times-Roman', label: 'Times New Roman' },
                      { value: 'Courier', label: 'Courier Mono' },
                    ]}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={formData.showLogo} onChange={e=>setFormData({...formData,showLogo:e.target.checked})}/>Exibir logotipo oficial da agência</label>
              {/* Slider de Opacidade de Marca d'Água */}
              <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showWatermark"
                      checked={formData.showWatermark}
                      onChange={(e) => setFormData({ ...formData, showWatermark: e.target.checked })}
                      className="w-4 h-4 rounded border-[#30303B] bg-[#1C1C24] text-[#C74410]"
                    />
                    <label htmlFor="showWatermark" className="text-xs font-semibold text-[#F8F9FC] cursor-pointer">
                      Exibir Símbolo como Marca-d'Água no Fundo
                    </label>
                  </div>
                  <span className="text-xs font-mono text-[#FF8759]">
                    {Math.round(formData.watermarkOpacity * 100)}% Opacidade
                  </span>
                </div>

                {formData.showWatermark && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0.01"
                      max="0.20"
                      step="0.01"
                      value={formData.watermarkOpacity}
                      onChange={(e) => setFormData({ ...formData, watermarkOpacity: parseFloat(e.target.value) })}
                      className="w-full accent-[#C74410] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#98989F]">
                      <span>1% (Discreto)</span>
                      <span>Sugerido (4% a 8%)</span>
                      <span>20% (Visível)</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                  Texto do Rodapé Oficial
                </label>
                <Input
                  value={formData.footerText}
                  onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  placeholder="Ex: Documento confidencial gerado pela plataforma 2.0"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Prévia real do PDF ({formData.pageFormat})</h4>
            <Button type="button" variant="secondary" loading={isPreviewing} onClick={()=>void preview()}><Eye className="h-4 w-4"/>Atualizar prévia PDF</Button>
          </div>
          <p className="text-xs text-content-secondary">Gerada pelo mesmo modelo dos briefings, com logotipo, símbolo central, conteúdo e paginação. Atualize a prévia após alterar os parâmetros; ela não cadastra nenhum briefing.</p>
          {previewError && <p role="alert" className="text-sm text-red-400">{previewError}</p>}
          {previewBlob ? <PdfPreview blob={previewBlob} title="Prévia real do branding PDF"/> : <div className="rounded-xl border border-dashed border-border-default p-8 text-center text-sm text-content-secondary">Clique em Atualizar prévia PDF para conferir o documento gerado.</div>}
        </div>
      </div>
    </form>
  )
}

export const DocumentBrandingPage: React.FC = () => {
  const source0 = useAgencyBranding()
  const source1 = useAgencyDocumentSettings()
  if (source0.isError || source1.isError) return <div role="alert">Não foi possível carregar as configurações. <Button onClick={() => { void source0.refetch(); void source1.refetch() }}>Tentar novamente</Button></div>
  if (source0.isLoading || source1.isLoading) return <p role="status">Carregando configurações da agência…</p>
  return <DocumentBrandingPageForm key={source0.branding.agency_id + ":" + source1.documentSettings.agency_id} />
}
