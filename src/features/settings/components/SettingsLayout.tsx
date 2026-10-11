import React from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Building2,
  Palette,
  SunMoon,
  Users,
  ShieldCheck,
  Globe2,
  FileSpreadsheet,
  MonitorCheck,
  Layers,
  ShieldAlert,
  Activity,
  Cpu,
  LayoutGrid,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export interface SettingsTabItem {
  id: string
  label: string
  path: string
  icon: React.ElementType
  badge?: string
}

export const settingsTabs: SettingsTabItem[] = [
  { id: 'overview', label: 'Visão Geral', path: '/settings', icon: LayoutGrid },
  { id: 'public-site', label: 'Site público da agência', path: '/settings/public-site', icon: Globe2 },
  { id: 'agency', label: 'Dados da Agência', path: '/settings/agency', icon: Building2 },
  { id: 'branding', label: 'White Label Studio', path: '/settings/branding', icon: Palette, badge: 'Pro' },
  { id: 'appearance', label: 'Aparência & Tema', path: '/settings/appearance', icon: SunMoon },
  { id: 'team', label: 'Gestão de Equipe', path: '/settings/team', icon: Users },
  { id: 'permissions', label: 'Permission Studio', path: '/settings/permissions', icon: ShieldCheck },
  { id: 'workspace', label: 'Preferências', path: '/settings/workspace', icon: Globe2 },
  { id: 'documents', label: 'Branding de PDFs', path: '/settings/documents', icon: FileSpreadsheet },
  { id: 'client-experience', label: 'Client Portals', path: '/settings/client-experience', icon: MonitorCheck },
  { id: 'integrations', label: 'Integrações', path: '/settings/integrations', icon: Layers },
  { id: 'security', label: 'Segurança', path: '/settings/security', icon: ShieldAlert },
  { id: 'activity', label: 'Atividades', path: '/settings/activity', icon: Activity },
  { id: 'diagnostics', label: 'Diagnósticos', path: '/settings/diagnostics', icon: Cpu },
]

export const SettingsLayout: React.FC = () => {
  const location = useLocation()

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Central de Configurações do Workspace"
        subtitle="Administração da agência, personalização de marca White Label, equipe e controle de segurança."
        breadcrumbs={[
          { label: 'Visão Geral', href: '/dashboard' },
          { label: 'Configurações' },
        ]}
        badge={
          <Badge variant="accent" className="text-xs py-1">
            White Label OS v0.2.0
          </Badge>
        }
      />

      {/* Navegação Secundária Adaptativa */}
      <div className="border-b border-[#30303B] overflow-x-auto pb-1 scrollbar-none">
        <nav className="flex items-center gap-1.5 min-w-max">
          {settingsTabs.map((tab) => {
            const Icon = tab.icon
            const isActive =
              tab.path === '/settings'
                ? location.pathname === '/settings'
                : location.pathname.startsWith(tab.path)

            return (
              <NavLink
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 select-none whitespace-nowrap',
                  isActive
                    ? 'bg-[#C74410] text-white shadow-sm shadow-[#C74410]/30'
                    : 'text-[#B8B8C0] hover:text-[#F8F9FC] hover:bg-[#1C1C24]'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
                      isActive ? 'bg-white/20 text-white' : 'bg-[#FF8759]/20 text-[#FF8759]'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>

      {/* Sub-rotas ativas */}
      <div className="pt-2">
        <Outlet />
      </div>
    </div>
  )
}
