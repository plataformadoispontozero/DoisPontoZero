import { isManagementRole } from '@/features/auth/access'
import { toast } from '@/components/ui/Toast'
import { useAuth } from '@/features/auth/AuthProvider'
import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Search,
  CheckSquare,
  Sparkles,
  Command,
  Settings,
  User,
  Shield,
  LogOut,
  FolderKanban,
  ArrowRight,
} from 'lucide-react'
import { useBranding } from '@/hooks/useBranding'
import { navItems } from '@/components/navigation/NavLinks'
import { navigationContext } from './navigationConfig'
import { Avatar } from '@/components/ui/Avatar'
import { IconButton } from '@/components/ui/IconButton'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/Dropdown'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/Dialog'
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetContent,
} from '@/components/ui/Sheet'
import { Input } from '@/components/ui/Input'

import { useNotifications } from '@/features/notifications/hooks/useNotifications'

export const TopBar: React.FC = () => {
  const auth = useAuth()
  const logout = () => void auth.signOut().catch(() => toast.error('Não foi possível encerrar a sessão. Tente novamente.'))

  const { branding } = useBranding()
  const location = useLocation()
  const navigate = useNavigate()

  const { data: notifications } = useNotifications()
  const unreadNotifications = (notifications || []).filter((n) => !n.read_at)

  // Estados de Dialog e Sheet do Header
  const [searchDialogOpen, setSearchDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tasksSheetOpen, setTasksSheetOpen] = useState(false)

  // Determina título contextual e breadcrumb
  const currentNavItem = navItems.find(item => item.id === navigationContext(location.pathname))

  const currentTitle = currentNavItem ? currentNavItem.label : 'Visão Geral'

  return (
    <>
      <header className="hidden md:flex h-14 items-center justify-between px-6 border-b border-[#30303B] bg-[#101014]/80 backdrop-blur-md sticky top-0 z-20">
        {/* ESQUERDA: Breadcrumb & Título Contextual */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#98989F] font-medium">2.0</span>
          <span className="text-[#30303B]">/</span>
          <span className="text-[#F8F9FC] font-semibold">{currentTitle}</span>
        </div>

        {/* DIREITA: Busca, Tarefas Rápidas, Notificações, Avatar do Usuário */}
        <div className="flex items-center gap-3">
          {/* Busca com Atalho */}
          <button
            onClick={() => setSearchDialogOpen(true)}
            className="flex items-center gap-2.5 h-8 px-3 rounded-lg bg-[#1C1C24] border border-[#30303B] text-xs text-[#98989F] hover:border-[#424252] hover:text-[#B8B8C0] transition-colors cursor-pointer w-56 lg:w-64"
            aria-label="Abrir busca global"
          >
            <Search className="w-3.5 h-3.5 text-[#B8B8C0]" />
            <span className="truncate flex-1 text-left">Buscar na agência...</span>
            <span className="flex items-center gap-0.5 text-[10px] text-[#98989F] bg-[#101014] px-1 py-0.5 rounded border border-[#30303B]">
              <Command className="w-2.5 h-2.5" />
              <span>K</span>
            </span>
          </button>

          {/* Acesso Rápido às Tarefas */}
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Acesso rápido às tarefas"
            onClick={() => setTasksSheetOpen(true)}
            className="text-[#B8B8C0] hover:text-[#F8F9FC]"
          >
            <CheckSquare className="w-4 h-4" />
          </IconButton>

          {/* Notificações com Dropdown */}
          <Dropdown>
            <DropdownTrigger>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Notificações do sistema"
                className="relative text-[#B8B8C0] hover:text-[#F8F9FC]"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#FF8759] animate-pulse" />
                )}
              </IconButton>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-80 p-0">
              <div className="p-3 border-b border-[#30303B] flex items-center justify-between">
                <span className="font-heading text-xs font-semibold text-[#F8F9FC]">
                  Notificações
                </span>
                <Badge variant="accent" className="text-[10px] py-0">{unreadNotifications.length} novas</Badge>
              </div>
              {unreadNotifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#B8B8C0]">
                  <p className="font-medium text-[#F8F9FC] mb-1">Tudo em dia!</p>
                  <p className="text-[11px] text-[#98989F]">
                    Nenhum alerta pendente para a sua equipe no momento.
                  </p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-surface-border">
                  {unreadNotifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => navigate('/notifications')}
                      className="p-3 hover:bg-surface-elevated transition-colors cursor-pointer space-y-0.5"
                    >
                      <p className="text-xs font-semibold text-content-primary leading-snug">{n.title}</p>
                      <p className="text-[11px] text-content-secondary line-clamp-1">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-2 border-t border-[#30303B] text-center bg-surface-subtle">
                <button
                  onClick={() => navigate('/notifications')}
                  className="text-[11px] font-semibold text-brand-primary hover:underline"
                >
                  Ver Central de Notificações
                </button>
              </div>
            </DropdownContent>
          </Dropdown>

          <div className="h-4 w-px bg-[#30303B]" />

          {/* Avatar e Menu do Usuário */}
          <Dropdown>
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer p-0.5 rounded-lg hover:bg-[#1C1C24] transition-colors">
                <Avatar src={auth.avatarUrl||undefined} name={auth.name || 'Usuário'} size="sm" status="online" />
              </div>
            </DropdownTrigger>
            <DropdownContent align="right" className="w-56">
              <div className="p-2 border-b border-[#30303B] mb-1">
                <p className="text-xs font-semibold text-[#F8F9FC]">{auth.name || 'Usuário'}</p>
                <p className="text-[11px] text-[#B8B8C0] truncate">
                  {auth.activeAgency?.agencyName || branding.company.workspaceName}
                </p>
              </div>
              <DropdownItem onClick={() => navigate('/profile')}><User className="w-3.5 h-3.5 text-[#C74410]"/><span>Meu perfil</span></DropdownItem>
              <DropdownItem onClick={() => navigate('/settings')}>
                <Settings className="w-3.5 h-3.5 text-[#C74410]" />
                <span>Configurações do Workspace</span>
              </DropdownItem>
              <DropdownItem onClick={() => navigate(isManagementRole(auth.activeAgency?.roleName)?'/projects':'/tasks')}>
                <FolderKanban className="w-3.5 h-3.5 text-[#FF8759]" />
                <span>Minha produção</span>
              </DropdownItem>
              <DropdownSeparator />
              <DropdownItem
                danger
                onClick={logout}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </header>

      {/* DIALOG DE BUSCA */}
      <Dialog open={searchDialogOpen} onOpenChange={setSearchDialogOpen}>
        <DialogHeader onClose={() => setSearchDialogOpen(false)}>
          <DialogTitle>Busca Global na Agência</DialogTitle>
          <DialogDescription>
            Pesquise por clientes, projetos, arquivos e briefings.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Input
            placeholder="Digite o nome de um projeto, cliente ou tarefa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-[#B8B8C0]" />}
            autoFocus
          />
          <div className="p-4 rounded-xl bg-[#101014] border border-[#30303B] text-center text-xs text-[#B8B8C0]">
            <Sparkles className="w-5 h-5 text-[#FF8759] mx-auto mb-2" />
            <p className="font-semibold text-[#F8F9FC]">Busca Rápida de Projetos & Demandas</p>
            <p className="text-[11px] text-[#98989F] mt-1 max-w-xs mx-auto">
              Navegue pelos módulos de Projetos e Tarefas para pesquisar e filtrar entregáveis em tempo real.
            </p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSearchDialogOpen(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </Dialog>

      {/* SHEET DE TAREFAS RÁPIDAS */}
      <Sheet open={tasksSheetOpen} onOpenChange={setTasksSheetOpen} side="right">
        <SheetHeader onClose={() => setTasksSheetOpen(false)}>
          <SheetTitle>Tarefas Rápidas</SheetTitle>
          <SheetDescription>
            Painel de entregas prioritárias do seu dia.
          </SheetDescription>
        </SheetHeader>
        <SheetContent className="flex flex-col items-center justify-center text-center p-6">
          <div className="w-12 h-12 rounded-xl bg-[#252530] flex items-center justify-center text-[#34D399] mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h4 className="font-heading text-sm font-semibold text-[#F8F9FC]">
            Nenhuma tarefa pendente
          </h4>
          <p className="text-xs text-[#B8B8C0] max-w-xs mt-1 mb-5">
            Sua fila pessoal está zerada. Novas tarefas atribuídas aparecerão aqui para checklist rápido.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setTasksSheetOpen(false)
              navigate('/tasks')
            }}
            className="text-xs gap-1.5"
          >
            <span>Ir para Módulo de Tarefas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </SheetContent>
      </Sheet>
    </>
  )
}
