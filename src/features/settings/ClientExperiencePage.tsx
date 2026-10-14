import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { toast } from '@/components/ui/Toast'
import { useAgencyPortalSettings } from './hooks/useAgencySettings'
import { MonitorCheck, Save, Globe, Mail, CheckCircle2, ExternalLink } from 'lucide-react'

export const ClientExperiencePage: React.FC = () => {
  const { portalSettings, updatePortalSettings } = useAgencyPortalSettings()

  const [formData, setFormData] = useState({
    portalTitle: portalSettings.portal_title,
    welcomeMessage: portalSettings.welcome_message,
    showAgencyLogo: portalSettings.show_agency_logo,
    showClientLogo: portalSettings.show_client_logo,
    footerText: portalSettings.footer_text,
    contactEmail: portalSettings.contact_email,
    websiteUrl: portalSettings.website_url,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePortalSettings({
        portal_title: formData.portalTitle,
        welcome_message: formData.welcomeMessage,
        show_agency_logo: formData.showAgencyLogo,
        show_client_logo: formData.showClientLogo,
        footer_text: formData.footerText,
        contact_email: formData.contactEmail,
        website_url: formData.websiteUrl,
      })
      toast.success('Configurações dos Portais Públicos atualizadas!')
    } catch {
      toast.error('Erro ao salvar preferências do portal.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <MonitorCheck className="w-5 h-5 text-[#C74410]" />
            Client Experience & Portais Públicos
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Personalize a identidade dos links compartilhados de briefings, propostas e apresentações.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identidade dos Portais do Cliente</CardTitle>
            <CardDescription className="text-xs">
              Configurações visíveis nos links públicos (/b/:token, /p/:token, /showcase/:token).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Título Oficial do Portal
              </label>
              <Input
                value={formData.portalTitle}
                onChange={(e) => setFormData({ ...formData, portalTitle: e.target.value })}
                placeholder="Ex: Portal de Colaboração & Entregas"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Mensagem de Boas-Vindas Inicial
              </label>
              <Textarea
                rows={3}
                value={formData.welcomeMessage}
                onChange={(e) => setFormData({ ...formData, welcomeMessage: e.target.value })}
                placeholder="Ex: Bem-vindo ao portal de colaboração da nossa agência."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[#C74410]" />
                  E-mail de Suporte ao Cliente
                </label>
                <Input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#FF8759]" />
                  Website Institucional
                </label>
                <Input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Rodapé dos Portais
              </label>
              <Input
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Portais Ativos Afetados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Portais Públicos Ativos</CardTitle>
            <CardDescription className="text-xs">
              Experiências que herdam esta configuração da agência.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-[#F8F9FC] block">
                  Formulário Público de Briefing
                </span>
                <span className="text-[10px] text-[#B8B8C0] font-mono">
                  /b/:publicToken
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#FF8759] uppercase px-2 py-0.5 rounded bg-[#FF8759]/10">
                Ativo
              </span>
            </div>


            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-[#F8F9FC] block">
                  Apresentações Executivas & Showcase
                </span>
                <span className="text-[10px] text-[#B8B8C0] font-mono">
                  /showcase/:publicToken
                </span>
              </div>
              <span className="text-[10px] font-bold text-[#FF8759] uppercase px-2 py-0.5 rounded bg-[#FF8759]/10">
                Ativo
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] text-xs text-[#B8B8C0] space-y-1">
              <span className="font-semibold text-[#F8F9FC] block flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                Proteção de Marca da agência
              </span>
              <p className="text-[11px]">
                Nenhum portal externo exibirá marcas obrigatórias do fornecedor. A agência tem total autonomia visual.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
