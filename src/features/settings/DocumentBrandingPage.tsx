import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useAgencyDocumentSettings, useAgencyBranding } from './hooks/useAgencySettings'
import { FileSpreadsheet, Save, FileText, CheckCircle2, Eye } from 'lucide-react'
import type { HeaderStyle, PageFormat } from '@/types/whitelabel'

export const DocumentBrandingPage: React.FC = () => {
  const { branding } = useAgencyBranding()
  const { documentSettings, updateDocumentSettings } = useAgencyDocumentSettings()

  const [formData, setFormData] = useState({
    headerStyle: documentSettings.header_style,
    footerText: documentSettings.footer_text,
    showLogo: documentSettings.show_logo,
    showWatermark: documentSettings.show_watermark,
    watermarkOpacity: documentSettings.watermark_opacity,
    pageFormat: documentSettings.page_format,
    documentFont: documentSettings.document_font,
  })

  const [isSaving, setIsSaving] = useState(false)

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
                    Fonte dos Documentos (@react-pdf)
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
                  placeholder="Ex: Documento confidencial gerado via Creative Agency OS"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel Direito de Previsualização da Folha PDF (Col 5) */}
        <div className="lg:col-span-5 space-y-3">
          <span className="text-xs font-semibold text-[#B8B8C0] flex items-center gap-1.5 px-1">
            <Eye className="w-3.5 h-3.5 text-[#FF8759]" />
            Simulação da Folha PDF ({formData.pageFormat})
          </span>

          <div className="bg-white text-black rounded-xl p-6 shadow-2xl relative min-h-[420px] flex flex-col justify-between text-xs overflow-hidden">
            {/* Marca d'água de fundo */}
            {formData.showWatermark && (
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                style={{ opacity: formData.watermarkOpacity }}
              >
                <div
                  className="w-48 h-48 rounded-full border-8 border-current flex items-center justify-center font-bold text-6xl text-slate-800"
                  style={{ color: branding.primary_color }}
                >
                  {branding.display_name.charAt(0)}
                </div>
              </div>
            )}

            {/* Cabeçalho do PDF */}
            <div className="border-b border-slate-200 pb-3 relative z-10 text-center space-y-1">
              <h2
                className="text-base font-bold text-slate-900"
                style={{ color: branding.primary_color }}
              >
                {branding.display_name}
              </h2>
              <p className="text-[10px] text-slate-500">{branding.tagline}</p>
            </div>

            {/* Conteúdo Exemplo */}
            <div className="space-y-3 py-4 relative z-10 text-slate-700">
              <div className="h-3 bg-slate-200 rounded w-3/4" />
              <div className="h-2.5 bg-slate-100 rounded w-full" />
              <div className="h-2.5 bg-slate-100 rounded w-5/6" />
              <div className="h-2.5 bg-slate-100 rounded w-4/6" />
              <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-[11px] block text-slate-900">
                  Resumo de Escopo & Entregáveis
                </span>
                <span className="text-[10px] text-slate-500">
                  Branding, Motion Design e Campanha Digital.
                </span>
              </div>
            </div>

            {/* Rodapé do PDF */}
            <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-[9px] text-slate-400 relative z-10">
              <span>{formData.footerText}</span>
              <span>Página 1 de 1</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
