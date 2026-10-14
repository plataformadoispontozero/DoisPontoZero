import { isManagementRole } from '@/features/auth/access'
import { useAgencyId, useAuth } from '@/features/auth/AuthProvider'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderKanban, Calendar, User, Users, Flag, Building2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { useCreateProject } from '@/features/projects/hooks/useProjects'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { CreateProjectForm, Priority, ProjectStatus } from '@/types/projects'

// -------------------------------------------------------
// Mock data until Supabase context is available
// In production, these would come from useAgencyContext()
// -------------------------------------------------------
const MOCK_AGENCY_ID = 'demo-agency'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'active', label: 'Ativo' },
  { value: 'on_hold', label: 'Em pausa' },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-400',
  high: 'text-orange-400',
  normal: 'text-[#B8B8C0]',
  low: 'text-sky-400',
}

export const NewProjectPage: React.FC = () => {
  const MOCK_AGENCY_ID = useAgencyId()

  const navigate = useNavigate()
  const managementPath=isManagementRole(useAuth().activeAgency?.roleName)?'/projects':'/tasks'
  const createProject = useCreateProject()

  const [form, setForm] = useState<CreateProjectForm>({
    name: '',
    client_id: null,
    description: '',
    priority: 'normal',
    status: 'planning',
    start_date: null,
    due_date: null,
    owner_id: null,
    member_ids: [],
  })

  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectForm, string>>>({})

  const validate = (): boolean => {
    const newErrors: typeof errors = {}
    if (!form.name.trim()) newErrors.name = 'O nome do projeto é obrigatório.'
    if (form.name.trim().length > 120) newErrors.name = 'Máximo de 120 caracteres.'
    if (form.due_date && form.start_date && form.due_date < form.start_date) {
      newErrors.due_date = 'O prazo não pode ser anterior à data de início.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || createProject.isPending) return

    try {
      const newProjectId = await createProject.mutateAsync({
        ...form,
        name: form.name.trim(),
        agency_id: MOCK_AGENCY_ID,
      })
      toast.success('Projeto criado com sucesso!')
      navigate(`/projects/${newProjectId}`)
    } catch (err) {
      toast.error('Erro ao criar projeto. Verifique os dados e tente novamente.')
      console.error(err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-3xl">
      <PageHeader
        title="Novo Projeto"
        subtitle="Configure um novo fluxo de trabalho criativo para sua agência."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Projetos', href: managementPath },
          { label: 'Novo Projeto' },
        ]}
        actions={
          <Button variant="ghost" size="sm" onClick={() => navigate(managementPath)}>
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar</span>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#C74410]/10">
                <FolderKanban className="w-4 h-4 text-[#C74410]" />
              </div>
              <CardTitle className="text-sm">Informações do Projeto</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Nome do projeto <span className="text-red-400">*</span>
              </label>
              <Input
                id="project-name"
                placeholder="Ex.: Campanha de Lançamento Q1 2026"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={errors.name ? 'border-red-500/50' : ''}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                Descrição
              </label>
              <Textarea
                id="project-description"
                placeholder="Objetivo, escopo e contexto do projeto..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block flex items-center gap-1.5">
                  <Flag className="w-3 h-3" /> Prioridade
                </label>
                <Select
                  id="project-priority"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value as Priority }))
                  }
                  options={PRIORITY_OPTIONS}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                  Status inicial
                </label>
                <Select
                  id="project-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))
                  }
                  options={STATUS_OPTIONS}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#FF8759]/10">
                <Calendar className="w-4 h-4 text-[#FF8759]" />
              </div>
              <CardTitle className="text-sm">Prazos</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                  Data de início
                </label>
                <Input
                  id="project-start-date"
                  type="date"
                  value={form.start_date ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, start_date: e.target.value || null }))
                  }
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#B8B8C0] mb-1.5 block">
                  Prazo de entrega
                </label>
                <Input
                  id="project-due-date"
                  type="date"
                  value={form.due_date ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, due_date: e.target.value || null }))
                  }
                  className={errors.due_date ? 'border-red-500/50' : ''}
                />
                {errors.due_date && (
                  <p className="text-xs text-red-400 mt-1">{errors.due_date}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#34D399]/10">
                <Users className="w-4 h-4 text-[#34D399]" />
              </div>
              <CardTitle className="text-sm">Equipe</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 rounded-xl border border-dashed border-[#30303B] text-center">
              <p className="text-xs text-[#B8B8C0] mb-1">
                Seleção de responsável e participantes
              </p>
              <p className="text-[11px] text-[#98989F]">
                Disponível após conectar ao Supabase e configurar membros da agência.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 pb-6">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(managementPath)}
          >
            Cancelar
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              variant="primary"
              loading={createProject.isPending}
              disabled={createProject.isPending}
            >
              <FolderKanban className="w-4 h-4" />
              Criar Projeto
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
