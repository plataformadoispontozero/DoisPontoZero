import {
  LayoutDashboard,
  Calendar,
  Users,
  FolderKanban,
  CheckSquare,
  Users2,
  FileText,
  Compass,
  FileCheck2,
  CalendarDays,
  MessageSquare,
  Presentation,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  id: string
  label: string
  path: string
  icon: LucideIcon
  badge?: string
  section: 'main' | 'tools' | 'system'
  description: string
}

export const navItems: NavItem[] = [
  // MENU PRINCIPAL
  {
    id: 'dashboard',
    label: 'Visão Geral',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
    description: 'Acompanhamento consolidado de operações da agência.',
  },
  {
    id: 'calendar',
    label: 'Minha Agenda',
    path: '/calendar',
    icon: Calendar,
    section: 'main',
    description: 'Cronograma pessoal, reuniões e deadlines do dia.',
  },
  {
    id: 'clients',
    label: 'Clientes',
    path: '/clients',
    icon: Users,
    section: 'main',
    description: 'Gestão de marcas, contatos e contas ativas.',
  },
  {
    id: 'projects',
    label: 'Projetos',
    path: '/projects',
    icon: FolderKanban,
    section: 'main',
    description: 'Workflows criativos, kanban e entregas.',
  },
  {
    id: 'tasks',
    label: 'Tarefas',
    path: '/tasks',
    icon: CheckSquare,
    section: 'main',
    description: 'Fila de produção criativa e checklists técnicos.',
  },
  {
    id: 'squads',
    label: 'Squads',
    path: '/squads',
    icon: Users2,
    section: 'main',
    description: 'Equipes multidisciplinares e capacidade de horas.',
  },

  // FERRAMENTAS
  {
    id: 'briefings',
    label: 'Briefings',
    path: '/briefings',
    icon: FileText,
    section: 'tools',
    description: 'Entrada inteligente e formulários dinâmicos de demandas.',
  },
  {
    id: 'strategy',
    label: 'Estratégia',
    path: '/strategy',
    icon: Compass,
    section: 'tools',
    description: 'Diagnósticos, personas e planejamento de contas.',
  },
  {
    id: 'proposals',
    label: 'Propostas',
    path: '/proposals',
    icon: FileCheck2,
    section: 'tools',
    description: 'Orçamentos comerciais e precificação de squad.',
  },
  {
    id: 'meetings',
    label: 'Reuniões',
    path: '/meetings',
    icon: CalendarDays,
    section: 'tools',
    description: 'Alinhamentos, pautas e atas inteligentes.',
  },
  {
    id: 'chat',
    label: 'Chat',
    path: '/chat',
    icon: MessageSquare,
    section: 'tools',
    description: 'Comunicação interna em canais e squads.',
  },
  {
    id: 'presentations',
    label: 'Apresentações',
    path: '/presentations',
    icon: Presentation,
    section: 'tools',
    description: 'Decks de defesa criativa e pitchings.',
  },

  // SISTEMA
  {
    id: 'settings',
    label: 'Configurações',
    path: '/settings',
    icon: Settings,
    section: 'system',
    description: 'Parâmetros de sistema e White Label da agência.',
  },
]
