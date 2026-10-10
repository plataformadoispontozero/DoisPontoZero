import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
} from 'lucide-react'
import { BrandLogo, BrandSymbol } from '@/components/shared/BrandLogo'
import { navItems } from '@/components/navigation/NavLinks'
import { useBranding } from '@/hooks/useBranding'
import { IconButton } from '@/components/ui/IconButton'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
}) => {
  const { branding } = useBranding()

  const mainItems = navItems.filter((i) => i.section === 'main')
  const toolItems = navItems.filter((i) => i.section === 'tools')
  const systemItems = navItems.filter((i) => i.section === 'system')

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-[#1C1C24] border-r border-[#30303B] transition-[width] duration-200 z-30 select-none shrink-0',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
      aria-label="Navegação Principal"
    >
      {/* Topo da Sidebar: Logotipo e Toggle */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#30303B]/80">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7952FF] rounded-lg"
          title={branding.name}
        >
          {collapsed ? (
            <BrandSymbol size={32} />
          ) : (
            <BrandLogo collapsed={false} size="md" />
          )}
        </NavLink>

        <IconButton
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="text-[#A1A1B0] hover:text-[#F8F9FC] shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </IconButton>
      </div>

      {/* Identificação do Workspace */}
      <div className="px-3 py-2 border-b border-[#30303B]/60">
        <div
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-[#101014]/60 border border-[#30303B]/60 text-xs text-[#A1A1B0]',
            collapsed ? 'justify-center px-0' : ''
          )}
          title={`Workspace: ${branding.company.workspaceName}`}
        >
          <Building2 className="w-4 h-4 text-[#7952FF] shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-[#717182] uppercase tracking-wider font-semibold">
                Workspace
              </span>
              <span className="font-medium text-[#F8F9FC] truncate">
                {branding.company.workspaceName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navegação Categorizada com Scroll */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {/* Menu Principal */}
        <div>
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717182] px-3 mb-1.5 block">
              Menu Principal
            </span>
          )}
          <ul className="space-y-1">
            {mainItems.map((item) => {
              const navLinkElement = (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 group relative',
                      isActive
                        ? 'bg-[#7952FF] text-[#F8F9FC] shadow-sm shadow-[#7952FF]/20 font-semibold'
                        : 'text-[#A1A1B0] hover:bg-[#252530] hover:text-[#F8F9FC]',
                      collapsed && 'justify-center px-0'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )

              return (
                <li key={item.id}>
                  {collapsed ? (
                    <Tooltip content={item.label} position="right" className="w-full">
                      {navLinkElement}
                    </Tooltip>
                  ) : (
                    navLinkElement
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Ferramentas */}
        <div>
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717182] px-3 mb-1.5 block">
              Ferramentas
            </span>
          )}
          <ul className="space-y-1">
            {toolItems.map((item) => {
              const navLinkElement = (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 group relative',
                      isActive
                        ? 'bg-[#7952FF] text-[#F8F9FC] shadow-sm shadow-[#7952FF]/20 font-semibold'
                        : 'text-[#A1A1B0] hover:bg-[#252530] hover:text-[#F8F9FC]',
                      collapsed && 'justify-center px-0'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )

              return (
                <li key={item.id}>
                  {collapsed ? (
                    <Tooltip content={item.label} position="right" className="w-full">
                      {navLinkElement}
                    </Tooltip>
                  ) : (
                    navLinkElement
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        {/* Sistema */}
        <div>
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717182] px-3 mb-1.5 block">
              Sistema
            </span>
          )}
          <ul className="space-y-1">
            {systemItems.map((item) => {
              const navLinkElement = (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-[background-color,color] duration-150 group relative',
                      isActive
                        ? 'bg-[#7952FF] text-[#F8F9FC] shadow-sm shadow-[#7952FF]/20 font-semibold'
                        : 'text-[#A1A1B0] hover:bg-[#252530] hover:text-[#F8F9FC]',
                      collapsed && 'justify-center px-0'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              )

              return (
                <li key={item.id}>
                  {collapsed ? (
                    <Tooltip content={item.label} position="right" className="w-full">
                      {navLinkElement}
                    </Tooltip>
                  ) : (
                    navLinkElement
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Menu de Usuário & Rodapé da Sidebar */}
      <div className="p-2.5 border-t border-[#30303B]/80">
        <div
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-xl bg-[#101014]/60 border border-[#30303B]/60 hover:bg-[#101014] transition-colors',
            collapsed ? 'justify-center p-1.5' : ''
          )}
        >
          <Avatar name="Admin Operações" size="sm" status="online" />
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#F8F9FC] truncate">
                Admin Operações
              </span>
              <span className="text-[10px] text-[#A1A1B0] truncate">
                admin@doiszero.local
              </span>
            </div>
          )}
          {!collapsed && (
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Sair do sistema"
              className="text-[#717182] hover:text-[#FB7185] shrink-0"
              onClick={() => toast.info('Sessão administrativa local ativa.')}
            >
              <LogOut className="w-3.5 h-3.5" />
            </IconButton>
          )}
        </div>
      </div>
    </aside>
  )
}
