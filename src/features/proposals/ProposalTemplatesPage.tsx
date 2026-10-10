// ============================================================
// DOIS.ZERO | CREATIVE AGENCY OS
// FASE 08: PROPOSAL TEMPLATES PAGE
// Manage reusable commercial templates
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Layers, Plus, FileCheck2, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useProposalTemplates } from './hooks/useProposals'

export const ProposalTemplatesPage: React.FC = () => {
  const { data: templates = [], isLoading } = useProposalTemplates()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Templates de Propostas Comerciais"
        subtitle="Modelos padronizados com estrutura editorial e entregáveis pré-configurados."
        breadcrumbs={[
          { label: 'Propostas', href: '/proposals' },
          { label: 'Templates' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tmpl) => (
          <Card key={tmpl.id} className="p-5 flex flex-col justify-between border-border/60 hover:border-primary/40 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="neutral">{tmpl.category}</Badge>
                <span className="text-[10px] text-text-muted">Versão {tmpl.version}</span>
              </div>

              <div>
                <h4 className="font-semibold text-text-primary text-base">{tmpl.name}</h4>
                <p className="text-xs text-text-muted mt-1 line-clamp-2">{tmpl.description}</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {tmpl.sections_snapshot.length} seções • {tmpl.items_snapshot.length} serviços
              </span>

              <Link to="/proposals/new">
                <Button variant="outline" size="sm">
                  Usar Template
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
