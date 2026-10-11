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
  Building2,
  LogOut,
  X,
} from 'lucide-react'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { navItems } from '@/components/navigation/NavLinks'
import { useBranding } from '@/hooks/useBranding'
import { IconButton } from '@/components/ui/IconButton'
import { Avatar } from '@/components/ui/Avatar'
import { Sheet, SheetHeader, SheetTitle, SheetContent } from '@/components/ui/Sheet'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export const MobileNav: React.FC = () => {
  const auth = useAuth()
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
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-[#101014] text-[#A1A1B0] border border-[#30303B] truncate max-w-[120px]">
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

        <div className="px-5 py-2.5 bg-[#101014]/60 border-b border-[#30303B] flex items-center gap-2 text-xs text-[#A1A1B0]">
          <Building2 className="w-4 h-4 text-[#7952FF]" />
          <span>{auth.activeAgency?.agencyName || branding.company.workspaceName}</span>
        </div>

        <SheetContent className="space-y-4 py-4 px-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#717182] px-3 block mb-2">
              Menu da Agência
            </span>
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-medium transition-colors min-h-[44px]',
                      isActive
                        ? 'bg-[#7952FF] text-[#F8F9FC] font-semibold'
                        : 'text-[#A1A1B0] hover:bg-[#252530] hover:text-[#F8F9FC]'
                    )
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </SheetContent>

        <div className="p-4 border-t border-[#30303B] flex items-center justify-between bg-[#1C1C24]">
          <div className="flex items-center gap-2.5">
            <Avatar name={auth.name || 'Usuário'} size="sm" status="online" />
            <div className="flex flex-col text-xs">
              <span className="font-semibold text-[#F8F9FC]">{auth.name || 'Usuário'}</span>
              <span className="text-[10px] text-[#A1A1B0]">{auth.isDemo ? 'Demonstração local' : auth.user?.email || ''}</span>
            </div>
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Encerrar sessão"
            className="text-[#717182] hover:text-[#FB7185] min-h-[44px] min-w-[44px]"
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
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#B8FF65]' : 'text-[#A1A1B0] hover:text-[#F8F9FC]'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Início</span>
        </NavLink>

        <NavLink
          to="/tasks"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#B8FF65]' : 'text-[#A1A1B0] hover:text-[#F8F9FC]'
            )
          }
        >
          <CheckSquare className="w-5 h-5" />
          <span>Tarefas</span>
        </NavLink>

        <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#B8FF65]' : 'text-[#A1A1B0] hover:text-[#F8F9FC]'
            )
          }
        >
          <FolderKanban className="w-5 h-5" />
          <span>Projetos</span>
        </NavLink>

        <NavLink
          to="/squads"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors py-1 min-w-[60px] min-h-[44px]',
              isActive ? 'text-[#B8FF65]' : 'text-[#A1A1B0] hover:text-[#F8F9FC]'
            )
          }
        >
          <Users2 className="w-5 h-5" />
          <span>Squads</span>
        </NavLink>

        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-[#A1A1B0] hover:text-[#F8F9FC] py-1 min-w-[60px] min-h-[44px] cursor-pointer"
          aria-label="Abrir todos os módulos"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span>Mais</span>
        </button>
      </nav>
    </>
  )
}
