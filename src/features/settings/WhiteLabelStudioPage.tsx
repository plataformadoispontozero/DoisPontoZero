import React, { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/Sheet'
import { toast } from '@/components/ui/Toast'
import { useAgencyBranding } from './hooks/useAgencySettings'
import { calculateContrastRatio, ALLOWED_GOOGLE_FONTS } from '@/lib/contrast'
import { BrandPreview } from './components/BrandPreview'
import {
  Palette,
  Type,
  Image as ImageIcon,
  Save,
  RotateCcw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  UploadCloud,
} from 'lucide-react'
import type { AgencyBrandingData } from '@/types/whitelabel'

export const WhiteLabelStudioPage: React.FC = () => {
  const { branding, updateBranding, isLoading } = useAgencyBranding()

  // State local para rascunho de edições
  const [draft, setDraft] = useState<AgencyBrandingData>({ ...branding })
  const [activeTab, setActiveTab] = useState<'identity' | 'colors' | 'typography' | 'preview'>('identity')
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => { if (!isLoading) setDraft({ ...branding }) }, [branding, isLoading])

  // Contrast validations
  const textBgContrast = calculateContrastRatio(draft.text_color, draft.background_color)
  const primaryBgContrast = calculateContrastRatio(draft.primary_color, draft.background_color)
  const accentBgContrast = calculateContrastRatio(draft.accent_color, draft.background_color)

  const hasContrastWarning = !textBgContrast.normalTextPass

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updateBranding(draft)
      toast.success('Identidade de marca e temas da agência salvos com sucesso!')
    } catch {
      toast.error('Erro ao salvar as configurações da agência.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetToDefault = () => {
    setDraft({
      ...branding,
      display_name: 'Dois.Zero',
      tagline: 'Sua agência. Tudo conectado.',
      primary_color: '#C74410',
      secondary_color: '#B8B8C0',
      accent_color: '#FF8759',
      background_color: '#101014',
      surface_color: '#1C1C24',
      text_color: '#F8F9FC',
      heading_font: 'Space Grotesk',
      body_font: 'Inter',
    })
    toast.info('Valores padrão restaurados no rascunho.')
  }

  const handleFileUpload = (field: 'logo_light_path' | 'logo_dark_path' | 'symbol_path' | 'favicon_path', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de formato seguro
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato não suportado. Utilize PNG, JPG, WebP ou SVG sanitizado.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 2MB.')
      return
    }

    // Gerar preview URL
    const previewUrl = URL.createObjectURL(file)
    setDraft({ ...draft, [field]: previewUrl })
    toast.success(`Asset ${file.name} carregado no rascunho!`)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      {/* Header do Identidade da Agência */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#C74410]" />
            Identidade da Agência
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Personalize a identidade da sua agência em toda a plataforma, documentos e portais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="text-[#B8B8C0] hover:text-[#F8F9FC]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </Button>

          {/* Botão de Preview Mobile via Sheet */}
          <div className="lg:hidden">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPreviewOpen(true)}>
              <Eye className="w-4 h-4" />
              <span>Ver Preview</span>
            </Button>
            <Sheet open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <SheetContent className="h-[90vh] bg-[#101014] p-4 overflow-y-auto">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-base text-[#F8F9FC]">
                    Pré-visualização da Agência
                  </SheetTitle>
                </SheetHeader>
                <BrandPreview branding={draft} isDraft />
              </SheetContent>
            </Sheet>
          </div>

          <Button type="submit" variant="accent" size="sm" loading={isSaving}>
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </Button>
        </div>
      </div>

      {/* Navegação Interna de Seções */}
      <div className="flex items-center gap-2 border-b border-[#30303B] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('identity')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'identity' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:bg-[#1C1C24]'
          }`}
        >
          Identidade & Logos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'colors' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:bg-[#1C1C24]'
          }`}
        >
          Editor de Cores & WCAG
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('typography')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            activeTab === 'typography' ? 'bg-[#C74410] text-white' : 'text-[#B8B8C0] hover:bg-[#1C1C24]'
          }`}
        >
          Tipografia do Sistema
        </button>
      </div>

      {/* Estrutura Desktop 2 Colunas (Editor Esquerdo + Live Preview Direito) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Formulários e Controles (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* SEÇÃO 1: IDENTIDADE & ASSETS */}
          {activeTab === 'identity' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#C74410]" />
                  Logotipos & Identidade de Marca
                </CardTitle>
                <CardDescription className="text-xs">
                  Envie os assets de imagem oficiais da agência (PNG, WebP ou SVG).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                      Nome da Agência
                    </label>
                    <Input
                      value={draft.display_name}
                      onChange={(e) => setDraft({ ...draft, display_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                      Slogan / Tagline
                    </label>
                    <Input
                      value={draft.tagline}
                      onChange={(e) => setDraft({ ...draft, tagline: e.target.value })}
                    />
                  </div>
                </div>

                {/* Uploads de Imagens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 rounded-xl border border-[#30303B] bg-[#101014] space-y-2">
                    <span className="text-xs font-semibold text-[#F8F9FC] block">
                      Símbolo / Ícone (Favicon & Avatar)
                    </span>
                    <div className="flex items-center gap-3">
                      {draft.symbol_path ? (
                        <img src={draft.symbol_path} alt="Symbol" className="w-10 h-10 object-contain rounded bg-[#1C1C24] p-1" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-[#C74410]/20 text-[#C74410] flex items-center justify-center font-bold">
                          {draft.display_name.charAt(0)}
                        </div>
                      )}
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#30303B] bg-[#1C1C24] hover:bg-[#252530] text-xs font-medium text-[#F8F9FC] flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF8759]" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('symbol_path', e)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-[#30303B] bg-[#101014] space-y-2">
                    <span className="text-xs font-semibold text-[#F8F9FC] block">
                      Logotipo Principal
                    </span>
                    <div className="flex items-center gap-3">
                      {draft.logo_light_path ? (
                        <img src={draft.logo_light_path} alt="Logo" className="h-8 object-contain rounded bg-[#1C1C24] p-1" />
                      ) : (
                        <span className="text-xs text-[#98989F]">Usando texto padrão</span>
                      )}
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-[#30303B] bg-[#1C1C24] hover:bg-[#252530] text-xs font-medium text-[#F8F9FC] flex items-center gap-1.5">
                        <UploadCloud className="w-3.5 h-3.5 text-[#FF8759]" />
                        <span>Upload</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload('logo_light_path', e)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO 2: EDITOR DE CORES & WCAG */}
          {activeTab === 'colors' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#FF8759]" />
                  Editor de Cores & Acessibilidade WCAG 2.2 AA
                </CardTitle>
                <CardDescription className="text-xs">
                  Ajuste os tokens semânticos e verifique automaticamente a taxa de contraste de acessibilidade.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Validação de Contraste WCAG Alert */}
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                    hasContrastWarning
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5">
                      {hasContrastWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      <span>
                        Taxa de Contraste do Texto: {textBgContrast.formattedRatio} (WCAG 2.2 AA)
                      </span>
                    </div>
                    <span>{textBgContrast.normalTextPass ? 'APROVADO' : 'ATENÇÃO'}</span>
                  </div>
                  {textBgContrast.suggestion && (
                    <p className="text-[11px] opacity-90">{textBgContrast.suggestion}</p>
                  )}
                </div>

                {/* Grid dos Pickers de Cor */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cor Primária */}
                  <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F8F9FC]">Cor Principal (Primary)</span>
                      <span className="text-[10px] text-[#B8B8C0] font-mono">{draft.primary_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.primary_color}
                        onChange={(e) => setDraft({ ...draft, primary_color: e.target.value })}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <Input
                        value={draft.primary_color}
                        onChange={(e) => setDraft({ ...draft, primary_color: e.target.value })}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                    <div className="text-[10px] text-[#B8B8C0] flex items-center justify-between">
                      <span>Contraste no Fundo:</span>
                      <span className="font-semibold text-[#F8F9FC]">{primaryBgContrast.formattedRatio}</span>
                    </div>
                  </div>

                  {/* Cor Accent */}
                  <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F8F9FC]">Cor de Destaque (Accent)</span>
                      <span className="text-[10px] text-[#B8B8C0] font-mono">{draft.accent_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.accent_color}
                        onChange={(e) => setDraft({ ...draft, accent_color: e.target.value })}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <Input
                        value={draft.accent_color}
                        onChange={(e) => setDraft({ ...draft, accent_color: e.target.value })}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                    <div className="text-[10px] text-[#B8B8C0] flex items-center justify-between">
                      <span>Contraste no Fundo:</span>
                      <span className="font-semibold text-[#F8F9FC]">{accentBgContrast.formattedRatio}</span>
                    </div>
                  </div>

                  {/* Background */}
                  <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F8F9FC]">Background da Plataforma</span>
                      <span className="text-[10px] text-[#B8B8C0] font-mono">{draft.background_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.background_color}
                        onChange={(e) => setDraft({ ...draft, background_color: e.target.value })}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <Input
                        value={draft.background_color}
                        onChange={(e) => setDraft({ ...draft, background_color: e.target.value })}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>

                  {/* Surface */}
                  <div className="p-3 rounded-xl bg-[#101014] border border-[#30303B] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#F8F9FC]">Cor dos Cards & Surface</span>
                      <span className="text-[10px] text-[#B8B8C0] font-mono">{draft.surface_color}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.surface_color}
                        onChange={(e) => setDraft({ ...draft, surface_color: e.target.value })}
                        className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                      />
                      <Input
                        value={draft.surface_color}
                        onChange={(e) => setDraft({ ...draft, surface_color: e.target.value })}
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SEÇÃO 3: TIPOGRAFIA DO SISTEMA */}
          {activeTab === 'typography' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="w-4 h-4 text-[#C74410]" />
                  Tipografia Oficial
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione as fontes autorizadas do Google Fonts para a interface e títulos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                      Fonte dos Títulos (Headings)
                    </label>
                    <Select
                      value={draft.heading_font}
                      onChange={(e) => setDraft({ ...draft, heading_font: e.target.value })}
                      options={ALLOWED_GOOGLE_FONTS.map((f) => ({
                        value: f.name,
                        label: `${f.name} (${f.category})`,
                      }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                      Fonte do Corpo (Body & UI)
                    </label>
                    <Select
                      value={draft.body_font}
                      onChange={(e) => setDraft({ ...draft, body_font: e.target.value })}
                      options={ALLOWED_GOOGLE_FONTS.map((f) => ({
                        value: f.name,
                        label: `${f.name} (${f.category})`,
                      }))}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101014] border border-[#30303B] space-y-2">
                  <span className="text-[10px] text-[#B8B8C0] font-semibold uppercase tracking-wider block">
                    Amostra em Tempo Real
                  </span>
                  <h4
                    className="text-lg font-bold text-[#F8F9FC]"
                    style={{ fontFamily: draft.heading_font }}
                  >
                    Dois.Zero — Creative Agency OS
                  </h4>
                  <p
                    className="text-xs text-[#B8B8C0] leading-relaxed"
                    style={{ fontFamily: draft.body_font }}
                  >
                    Sistema operacional completo para gestão de agências, squads multidisciplinares e produção de conteúdo de alto impacto.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Painel Direito: Live Preview Interativo (Col 5 - Oculto em Mobile) */}
        <div className="hidden lg:block lg:col-span-5 space-y-3 sticky top-20">
          <div className="flex items-center justify-between text-xs font-semibold text-[#B8B8C0] px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FF8759]" />
              Live Preview da Agência
            </span>
            <span className="text-[10px] text-[#98989F] font-mono">
              Atualização Automática
            </span>
          </div>
          <BrandPreview branding={draft} isDraft />
        </div>
      </div>
    </form>
  )
}
