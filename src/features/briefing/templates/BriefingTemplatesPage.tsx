import { INITIAL_BRIEFING_TEMPLATES } from "../constants/initialTemplates"
import { useAgencyId } from '@/features/auth/AuthProvider'
// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 06: BRIEFING STUDIO — TEMPLATES LIST
// /briefings/templates
// ============================================================

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText,
  Plus,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Copy,
  Archive,
  Edit3,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useBriefingTemplates } from '../hooks/useBriefings'
import { BRIEFING_CATEGORY_CONFIG, type BriefingCategory } from '@/types/briefing'
import { toast } from '@/components/ui/Toast'

const DEMO_AGENCY_ID = 'demo-agency'

export const BriefingTemplatesPage: React.FC = () => {
  const DEMO_AGENCY_ID = useAgencyId()

  const navigate = useNavigate()
  const { data: templates = [], isLoading } = useBriefingTemplates(DEMO_AGENCY_ID)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const categories = Object.keys(BRIEFING_CATEGORY_CONFIG) as BriefingCategory[]

  const filteredTemplates = templates.filter((tpl) => {
    const matchesSearch =
      tpl.name.toLowerCase().includes(search.toLowerCase()) ||
      (tpl.description?.toLowerCase() ?? '').includes(search.toLowerCase())
    const matchesCat = selectedCategory === 'all' || tpl.category === selectedCategory
    return matchesSearch && matchesCat
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Biblioteca de Modelos de Briefing"
        subtitle="Templates padronizados e versionados para captação consistente de demandas criativas."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Briefings', href: '/briefings' },
          { label: 'Modelos' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/briefings/new">
              <Button variant="secondary" size="sm">
                <FileText className="w-3.5 h-3.5" />
                <span>Novo Briefing</span>
              </Button>
            </Link>
            <Link to="/briefings/templates/new">
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Modelo</span>
              </Button>
            </Link>
          </div>
        }
      />

      <section className="space-y-3" aria-label="Modelos iniciais personalizáveis"><h2 className="text-lg font-semibold">Comece com um modelo da agência</h2><p className="text-sm text-zinc-300">Personalize as perguntas e salve ou publique. Estes pontos de partida só se tornam modelos cadastrados após salvar.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{INITIAL_BRIEFING_TEMPLATES.map(t=><article className="rounded-xl border border-white/15 p-4 space-y-3" key={t.id}><h3 className="font-semibold">{t.name}</h3><p className="text-sm text-zinc-400">{t.description}</p><p className="text-xs text-zinc-400">{t.sections.reduce((n,s)=>n+s.questions.length,0)} perguntas · editável</p><Link className="inline-block rounded-lg bg-orange-700 px-3 py-2 text-sm text-white" to={`/briefings/templates/new?starterId=${t.id}`}>Personalizar modelo de {t.name}</Link></article>)}</div></section>

      {/* Filter and search bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#98989F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="pl-9">
              <Input
                placeholder="Buscar modelo por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-[#C74410] text-white'
                  : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC]'
              }`}
            >
              Todos ({templates.length})
            </button>
            {categories.map((catKey) => {
              const catCfg = BRIEFING_CATEGORY_CONFIG[catKey]
              const count = templates.filter((t) => t.category === catKey).length
              if (count === 0 && selectedCategory !== catKey) return null
              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedCategory(catKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                    selectedCategory === catKey
                      ? 'bg-[#C74410] text-white'
                      : 'bg-[#1C1C24] text-[#B8B8C0] hover:text-[#F8F9FC]'
                  }`}
                >
                  {catCfg.label} ({count})
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-[#1C1C24] border border-[#30303B] p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-[#252530] flex items-center justify-center text-[#C74410] mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#F8F9FC]">Nenhum modelo encontrado</h3>
            <p className="text-sm text-[#B8B8C0] max-w-md mt-1 mb-4">
              {search
                ? `Não encontramos templates correspondentes a "${search}".`
                : 'Crie seu primeiro modelo personalizado no Form Builder ou utilize um dos modelos padrão.'}
            </p>
            <Link to="/briefings/templates/new">
              <Button variant="primary" size="sm">
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Novo Modelo</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const catCfg = BRIEFING_CATEGORY_CONFIG[template.category] || BRIEFING_CATEGORY_CONFIG.general
            const totalSections = template.sections?.length ?? 0
            const totalQuestions = template.questions?.length ?? 0

            return (
              <Card
                key={template.id}
                className="hover:border-[#C74410]/50 transition-all flex flex-col justify-between group"
              >
                <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: catCfg.color }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#B8B8C0]">
                          {catCfg.label}
                        </span>
                      </div>
                      <Badge variant="outline">
                        V{template.version}.0
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#F8F9FC] group-hover:text-[#C74410] transition-colors leading-snug">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-[#B8B8C0] mt-1.5 line-clamp-2 leading-relaxed">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#30303B]/60 flex items-center justify-between text-xs text-[#98989F]">
                    <div className="flex items-center gap-3">
                      <span>{totalSections} seções</span>
                      <span>•</span>
                      <span>{totalQuestions} perguntas</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/briefings/new?templateId=${template.id}`)}
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/briefings/templates/${template.id}/edit`)}
                        title="Editar Modelo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
