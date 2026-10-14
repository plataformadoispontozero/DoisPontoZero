import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useAgencyBranding, useAgencyPreferences, useSaveAgencyIdentity } from './hooks/useAgencySettings'
import { Building2, Save, CheckCircle2, Globe, Clock, DollarSign } from 'lucide-react'

const AgencySettingsPageForm: React.FC = () => {
  const { branding } = useAgencyBranding()
  const { preferences } = useAgencyPreferences()
  const saveIdentity = useSaveAgencyIdentity()

  const [formData, setFormData] = useState({
    displayName: branding.display_name,
    legalName: branding.legal_name,
    tagline: branding.tagline,
    email: branding.contact_email || '',
    phone: branding.contact_phone || '',
    website: branding.website_url || '',
    language: preferences.language,
    timezone: preferences.timezone,
    currency: preferences.currency,
    dateFormat: preferences.date_format,
    businessHours: branding.business_hours || '',
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await saveIdentity.mutateAsync({branding:{display_name:formData.displayName,legal_name:formData.legalName,tagline:formData.tagline,contact_email:formData.email,contact_phone:formData.phone,website_url:formData.website,business_hours:formData.businessHours},preferences:{language:formData.language,timezone:formData.timezone,currency:formData.currency,date_format:formData.dateFormat}})
      toast.success('Configurações da agência atualizadas com sucesso!')
    } catch {
      toast.error('Erro ao salvar as configurações da agência.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#C74410]" />
            Dados da Agência & Operação
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Gerencie os dados cadastrais, informações institucionais e parâmetros operacionais.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Cadastrais e Institucionais */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Identificação Institucional</CardTitle>
            <CardDescription className="text-xs">
              Informações visíveis em documentos oficiais e portais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Nome Comercial da Agência <span className="text-red-400">*</span>
              </label>
              <Input
                aria-label="Nome comercial da agência" value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Ex: Dois.Zero Creative Agency"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Razão Social <span className="text-red-400">*</span>
              </label>
              <Input
                aria-label="Razão social" value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                placeholder="Ex: Dois.Zero Sistemas Criativos Ltda."
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Slogan Institucional
              </label>
              <Input
                aria-label="Slogan institucional" value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Ex: Sua agência. Tudo conectado."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                  E-mail Oficial
                </label>
                <Input
                  type="email"
                  aria-label="E-mail oficial" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                  Telefone / WhatsApp
                </label>
                <Input
                  aria-label="Telefone da agência" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Website da Agência
              </label>
              <Input
                type="url"
                aria-label="Website da agência" value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferências Regionais & Operação */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Parâmetros Operacionais</CardTitle>
            <CardDescription className="text-xs">
              Fuso horário, moeda padrão, idioma e horário de funcionamento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-[#C74410]" />
                  Idioma do Sistema
                </label>
                <Select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  options={[
                    { value: 'pt-BR', label: 'Português (Brasil)' },
                    { value: 'en-US', label: 'English (US)' },
                    { value: 'es-ES', label: 'Español' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C74410]" />
                  Fuso Horário (Timezone)
                </label>
                <Select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  options={[
                    { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
                    { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
                    { value: 'America/New_York', label: 'New York (EST/GMT-5)' },
                    { value: 'Europe/Lisbon', label: 'Lisboa (WET/GMT+0)' },
                    { value: 'Europe/Paris', label: 'Paris' },
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#FF8759]" />
                  Moeda Padrão
                </label>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { value: 'BRL', label: 'Real (BRL R$)' },
                    { value: 'USD', label: 'Dólar (USD $)' },
                    { value: 'EUR', label: 'Euro (EUR €)' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                  Formato de Data
                </label>
                <Select
                  value={formData.dateFormat}
                  onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                  options={[
                    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Horário de Funcionamento
              </label>
              <Input
                aria-label="Horário de funcionamento" value={formData.businessHours}
                onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                placeholder="Ex: 09:00 - 18:00 (Seg-Sex)"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] text-xs space-y-1 text-[#B8B8C0]">
              <div className="flex items-center gap-2 font-semibold text-[#F8F9FC]">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                Isolamento Multiagência Ativo
              </div>
              <p className="text-[11px]">
                Todos os dados e parâmetros cadastrados acima são restritos exclusivamente aos membros autorizados do ID da sua agência.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

export const AgencySettingsPage: React.FC = () => {
  const source0 = useAgencyBranding()
  const source1 = useAgencyPreferences()
  if (source0.isError || source1.isError) return <div role="alert">Não foi possível carregar as configurações. <Button onClick={() => { void source0.refetch(); void source1.refetch() }}>Tentar novamente</Button></div>
  if (source0.isLoading || source1.isLoading) return <p role="status">Carregando configurações da agência…</p>
  return <AgencySettingsPageForm key={source0.branding.agency_id + ":" + source1.preferences.agency_id} />
}
