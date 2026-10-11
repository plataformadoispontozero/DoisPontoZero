import React from 'react'
import {
  Palette,
  Terminal,
  Database,
  CheckCircle2,
} from 'lucide-react'
import { useBranding } from '@/hooks/useBranding'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { isSupabaseConfigured } from '@/lib/supabase/client'

export const SettingsPage: React.FC = () => {
  const { branding } = useBranding()

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Configurações do Sistema"
        subtitle="Parâmetros do Creative Agency OS, identidade White Label e infraestrutura local."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Configurações' },
        ]}
        badge={
          <Badge variant="accent" className="text-xs py-1">
            Ambiente Operacional
          </Badge>
        }
      />

      {/* Grid de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel White Label Ativo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#C74410]" />
              <CardTitle>Configuração White Label Centralizada</CardTitle>
            </div>
            <CardDescription>
              Valores definidos em <code className="text-[#FF8759]">src/config/branding.ts</code> consumidos por todos os componentes do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Visualização da Marca */}
            <div className="p-4 rounded-xl bg-[#101014] border border-[#30303B] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BrandLogo size="lg" showSlogan />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">Símbolo Ativo</Badge>
                <Badge variant="neutral">v{branding.version}</Badge>
              </div>
            </div>

            {/* Tabela de Parâmetros de Marca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                <span className="text-[#98989F] block mb-1">Nome da Plataforma</span>
                <span className="font-medium text-[#F8F9FC] text-sm">{branding.name}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                <span className="text-[#98989F] block mb-1">Categoria do Produto</span>
                <span className="font-medium text-[#F8F9FC] text-sm">{branding.category}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                <span className="text-[#98989F] block mb-1">Slogan Oficial</span>
                <span className="font-medium text-[#F8F9FC] text-sm">{branding.slogan}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                <span className="text-[#98989F] block mb-1">Workspace Padrão</span>
                <span className="font-medium text-[#F8F9FC] text-sm">{branding.company.workspaceName}</span>
              </div>
            </div>

            {/* Amostras de Cores da Paleta */}
            <div>
              <span className="text-xs font-semibold text-[#B8B8C0] uppercase tracking-wider block mb-2.5">
                Paleta de Cores do Sistema
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#101014] border border-[#30303B] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Background</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.background}</span>
                </div>
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#1C1C24] border border-[#30303B] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Surface</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.surface}</span>
                </div>
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#252530] border border-[#30303B] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Elevated</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.surfaceElevated}</span>
                </div>
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#C74410] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Primary</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.primary}</span>
                </div>
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#FF8759] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Accent</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.accent}</span>
                </div>
                <div className="p-2 rounded-lg border border-[#30303B] bg-[#101014] flex flex-col items-center text-center">
                  <div className="w-5 h-5 rounded bg-[#34D399] mb-1" />
                  <span className="text-[10px] text-[#F8F9FC]">Success</span>
                  <span className="text-[9px] text-[#98989F] font-mono">{branding.colors.success}</span>
                </div>
              </div>
            </div>

            {/* Tipografia */}
            <div>
              <span className="text-xs font-semibold text-[#B8B8C0] uppercase tracking-wider block mb-2">
                Tipografia do Sistema
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                  <span className="text-[#98989F] block mb-1">Títulos & Headings</span>
                  <span className="font-heading font-bold text-sm text-[#F8F9FC]">
                    {branding.typography.heading}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-[#101014]/60 border border-[#30303B]">
                  <span className="text-[#98989F] block mb-1">Interface & Textos</span>
                  <span className="font-sans text-xs text-[#F8F9FC]">
                    {branding.typography.sans}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações de Engenharia e Ambiente Local */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#FF8759]" />
                <CardTitle className="text-sm">Ambiente de Execução</CardTitle>
              </div>
              <CardDescription>
                Especificações de Engenharia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-[#30303B]">
                <span className="text-[#B8B8C0]">Framework</span>
                <span className="font-mono text-[#F8F9FC]">React 19 + TypeScript</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#30303B]">
                <span className="text-[#B8B8C0]">Bundler</span>
                <span className="font-mono text-[#F8F9FC]">Vite 8.3</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#30303B]">
                <span className="text-[#B8B8C0]">Design System</span>
                <span className="font-mono text-[#F8F9FC]">17 Componentes UI</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#30303B]">
                <span className="text-[#B8B8C0]">Rotas Registradas</span>
                <span className="font-mono text-[#F8F9FC]">14 Módulos Ativos</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-[#30303B]">
                <span className="text-[#B8B8C0]">Roteador</span>
                <span className="font-mono text-[#F8F9FC]">React Router DOM v7</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[#B8B8C0]">Test Runner</span>
                <span className="font-mono text-[#F8F9FC]">Vitest</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#C74410]" />
                <CardTitle className="text-sm">Infraestrutura & Persistência</CardTitle>
              </div>
              <CardDescription>
                Status de banco de dados e persistência
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-[#B8B8C0]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8759] mt-0.5 shrink-0" />
                <span>Migrations PostgreSQL (Fases 02 & 04)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8759] mt-0.5 shrink-0" />
                <span>Políticas de Row Level Security (RLS)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF8759] mt-0.5 shrink-0" />
                <span>
                  Modo: {isSupabaseConfigured ? 'Supabase Remoto Ativo' : 'Demonstração Local'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
