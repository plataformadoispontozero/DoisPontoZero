import { NavigationGroups } from './NavigationGroups'
import { WorkspaceSelector } from './WorkspaceSelector'
import { routePermission } from '@/features/auth/access'
import { useAuth } from '@/features/auth/AuthProvider'
import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Menu,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users2,
  MoreHorizontal,
  LogOut,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { useBranding } from '@/hooks/useBranding'
import { IconButton } from '@/components/ui/IconButton'
import { Avatar } from '@/components/ui/Avatar'
import { Sheet, SheetHeader, SheetContent } from '@/components/ui/Sheet'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export const MobileNav: React.FC = () => {
  const auth = useAuth()
  const canOpen = (path: string) => { const permission = routePermission(path); return auth.isDemo || auth.activeAgency?.roleName === 'OWNER' || !permission || auth.permissions.has(permission) }
  const logout = () => void auth.signOut().catch(() => toast.error('Não foi possível encerrar a sessão. Tente novamente.'))

  const [drawerOpen, setDrawerOpen] = useState(false)
  const location = useLocation()
  const { branding } = useBranding()

  // Fecha o menu Sheet automaticamente ao selecionar uma rota
  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <>
      {/* Header Compacto Mobile */}
      <header className="md:hidden sticky top-0 z-40 bg-[#1C1C24]/95 backdrop-blur-md border-b border-[#30303B] h-14 px-4 flex items-center justify-between">
        <NavLink to="/dashboard" className="flex items-center gap-2 focus-visible:outline-none">
          <BrandLogo size="sm" />
        </NavLink>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#101014] text-[#B8B8C0] border border-[#30303B] truncate max-w-[120px]">
            {auth.activeAgency?.agencyName || branding.company.workspaceName}
          </span>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label={drawerOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="text-[#F8F9FC] min-h-[44px] min-w-[44px]"
          >
            <Menu className="w-5 h-5" />
          </IconButton>
        </div>
      </header>

      {/* Menu Lateral em Sheet */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen} side="left">
        <SheetHeader onClose={() => setDrawerOpen(false)}>
          <div className="flex items-center gap-2">
            <BrandLogo size="sm" />
          </div>
        </SheetHeader>

        <div className="shrink-0 px-4 border-b border-[var(--color-border)]"><WorkspaceSelector mobile /></div>
        <SheetContent className="min-h-0 space-y-4 py-4 px-3"><NavigationGroups scope="mobile" /></SheetContent>
        <div className="shrink-0 px-3 py-2 border-t border-[var(--color-border)]"><NavigationGroups footer scope="mobile-footer" /></div>

        <div className="p-4 border-t border-[#30303B] flex items-center justify-between bg-[#1C1C24]">
          <div className="flex items-center gap-2.5">
            <Avatar name={auth.name || 'Usuário'} size="sm" status="online" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-[#F8F9FC]">{auth.name || 'Usuário'}</span>
              <span className="text-[10px] text-[#B8B8C0]">{auth.isDemo ? 'Demonstração local' : auth.user?.email || ''}</span>
            </div>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Encerrar sessão"
            className="text-[#98989F] hover:text-[#FB7185] min-h-[44px] min-w-[44px]"
            onClick={logout}
          >
            <LogOut className="w-4 h-4" />
          </IconButton>
        </div>
      </Sheet>

      {/* Bottom Bar Mobile Fixa para Acesso Rápido de Polegar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1C1C24]/95 backdrop-blur-md border-t border-[#30303B] h-16 px-2 flex items-center justify-around"
        aria-label="Navegação rápida mobile"
      >
        {canOpen('/dashboard') && <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#FF8759]' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </NavLink>}

        {canOpen('/tasks') && <NavLink
          to="/tasks"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#FF8759]' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
            )
          }
        >
          <CheckSquare className="w-5 h-5" />
          <span>Tarefas</span>
        </NavLink>}

        {canOpen('/projects') && <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#FF8759]' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
            )
          }
        >
          <FolderKanban className="w-5 h-5" />
          <span>Projetos</span>
        </NavLink>}

        {canOpen('/squads') && <NavLink
          to="/squads"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#FF8759]' : 'text-[#B8B8C0] hover:text-[#F8F9FC]'
            )
          }
        >
          <Users2 className="w-5 h-5" />
          <span>Squads</span>
        </NavLink>}

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#B8B8C0] hover:text-[#F8F9FC] py-1 min-w-[60px] min-h-[44px] cursor-pointer"
          aria-label="Abrir todos os módulos"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>Mais</span>
        </button>
      </nav>
    </>
  )
}
