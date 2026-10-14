import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { toast } from '@/components/ui/Toast'
import { useAgencyPreferences } from './hooks/useAgencySettings'
import { Globe2, Save, Calendar, Clock, DollarSign, Layout, CheckCircle2 } from 'lucide-react'
import type { DefaultProjectView, DefaultTaskView } from '@/types/whitelabel'

const WorkspacePreferencesPageForm: React.FC = () => {
  const { preferences, updatePreferences } = useAgencyPreferences()

  const [formData, setFormData] = useState({
    language: preferences.language,
    timezone: preferences.timezone,
    currency: preferences.currency,
    dateFormat: preferences.date_format,
    timeFormat: preferences.time_format,
    weekStartsOn: preferences.week_starts_on,
    defaultProjectView: preferences.default_project_view,
    defaultTaskView: preferences.default_task_view,
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      await updatePreferences({
        language: formData.language,
        timezone: formData.timezone,
        currency: formData.currency,
        date_format: formData.dateFormat,
        time_format: formData.timeFormat,
        week_starts_on: Number(formData.weekStartsOn),
        default_project_view: formData.defaultProjectView as DefaultProjectView,
        default_task_view: formData.defaultTaskView as DefaultTaskView,
      })
      toast.success('Preferências do workspace salvas com sucesso!')
    } catch {
      toast.error('Erro ao salvar preferências.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#F8F9FC] flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#C74410]" />
            Preferências Gerais do Workspace
          </h3>
          <p className="text-xs text-[#B8B8C0]">
            Configure os padrões de exibição, fuso horário, visualizações iniciais de projetos e tarefas.
          </p>
        </div>
        <Button type="submit" variant="accent" size="sm" loading={isSaving}>
          <Save className="w-4 h-4" />
          <span>Salvar Preferências</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Idioma e Regionalização */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Regionalização & Padrões</CardTitle>
            <CardDescription className="text-xs">
              Idiomas suportados, moeda operacional e formato de exibição.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5">
                Idioma Principal da Interface
              </label>
              <Select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                options={[
                  { value: 'pt-BR', label: 'Português (Brasil) - Padrão' },
                  { value: 'en-US', label: 'English (United States)' },
                  { value: 'es-ES', label: 'Español' },
                ]}
              />
              <span className="text-[10px] text-[#98989F] mt-1 block">
                Toda a interface atual está 100% pronta e adaptada para pt-BR.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#C74410]" />
                Fuso Horário Padrão do Workspace
              </label>
              <Select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                options={[
                  { value: 'America/Sao_Paulo', label: 'Brasília / São Paulo (GMT-3)' },
                  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
                  { value: 'America/New_York', label: 'New York (EST/GMT-5)' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#FF8759]" />
                  Moeda Oficial
                </label>
                <Select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  options={[
                    { value: 'BRL', label: 'BRL (R$ - Real)' },
                    { value: 'USD', label: 'USD ($ - Dólar)' },
                    { value: 'EUR', label: 'EUR (€ - Euro)' },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#C74410]" />
                  Primeiro Dia da Semana
                </label>
                <Select
                  value={String(formData.weekStartsOn)}
                  onChange={(e) => setFormData({ ...formData, weekStartsOn: Number(e.target.value) })}
                  options={[
                    { value: '1', label: 'Segunda-feira' },
                    { value: '0', label: 'Domingo' },
                    { value: '6', label: 'Sábado' },
                  ]}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visualizações Padrão de Trabalho */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Visualizações Iniciais dos Módulos</CardTitle>
            <CardDescription className="text-xs">
              Defina como os módulos de Projetos e Tarefas abrem por padrão.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-[#C74410]" />
                Visualização Padrão de Projetos (/projects)
              </label>
              <Select
                value={formData.defaultProjectView}
                onChange={(e) => setFormData({ ...formData, defaultProjectView: e.target.value as DefaultProjectView })}
                options={[
                  { value: 'kanban', label: 'Quadro Kanban (Fluxo por Colunas)' },
                  { value: 'list', label: 'Lista Estruturada' },
                  { value: 'grid', label: 'Grade de Cards' },
                ]}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#B8B8C0] block mb-1.5 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-[#FF8759]" />
                Visualização Padrão de Tarefas (/tasks)
              </label>
              <Select
                value={formData.defaultTaskView}
                onChange={(e) => setFormData({ ...formData, defaultTaskView: e.target.value as DefaultTaskView })}
                options={[
                  { value: 'board', label: 'Quadro Kanban' },
                  { value: 'list', label: 'Visão em Lista' },
                  { value: 'calendar', label: 'Visão em Calendário' },
                ]}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-[#101014] border border-[#30303B] text-xs text-[#B8B8C0] space-y-1">
              <span className="font-semibold text-[#F8F9FC] block flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                Persistência em Supabase
              </span>
              <p className="text-[11px]">
                As preferências configuradas acima aplicam-se a todos os membros ativos da agência.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}

export const WorkspacePreferencesPage: React.FC = () => {
  const source0 = useAgencyPreferences()
  if (source0.isError) return <div role="alert">Não foi possível carregar as configurações. <Button onClick={() => { void source0.refetch() }}>Tentar novamente</Button></div>
  if (source0.isLoading) return <p role="status">Carregando configurações da agência…</p>
  return <WorkspacePreferencesPageForm key={source0.preferences.agency_id} />
}
