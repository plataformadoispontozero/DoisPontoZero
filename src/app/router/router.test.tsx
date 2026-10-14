import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AppProviders } from '@/app/providers/AppProviders'
import { AppLayout } from '@/app/layouts/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { SquadsPage } from '@/features/squads/SquadsPage'
import { BriefingPage } from '@/features/briefing/BriefingPage'
import { StrategyPage } from '@/features/strategy/StrategyPage'
import { MeetingsPage } from '@/features/meetings/MeetingsPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { PresentationsPage } from '@/features/presentations/PresentationsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

const routes = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'squads', element: <SquadsPage /> },
      { path: 'briefings', element: <BriefingPage /> },
      { path: 'strategy', element: <StrategyPage /> },
      { path: 'meetings', element: <MeetingsPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'presentations', element: <PresentationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]

describe('All 12 Phase 01 Functional Routes Render Test', () => {
  const testRoute = (initialPath: string, expectedHeadingMatch: RegExp | string) => {
    const memoryRouter = createMemoryRouter(routes, {
      initialEntries: [initialPath],
    })

    const { unmount } = render(
      <AppProviders>
        <RouterProvider router={memoryRouter} />
      </AppProviders>
    )

    expect(screen.getByRole('heading', { name: expectedHeadingMatch })).toBeInTheDocument()
    unmount()
  }

  it('renders route: /dashboard (Visão Geral)', () => {
    testRoute('/dashboard', /Visão Geral/i)
  })

  it('renders route: /calendar (Minha Agenda)', () => {
    testRoute('/calendar', /Minha Agenda/i)
  })

  it('renders route: /clients (Clientes)', () => {
    testRoute('/clients', /Clientes & Contas/i)
  })

  it('renders route: /projects (Projetos)', () => {
    testRoute('/projects', /Projetos & Demandas/i)
  })

  it('renders route: /tasks (Tarefas)', () => {
    testRoute('/tasks', /Tarefas & Produção/i)
  })

  it('renders route: /squads (Squads)', () => {
    testRoute('/squads', /Squads & Equipes/i)
  })

  it('renders route: /briefings (Briefings)', () => {
    testRoute('/briefings', /Briefing Studio|Briefings & Formulários/i)
  })

  it('renders route: /strategy (Estratégia)', () => {
    testRoute('/strategy', /Strategy Studio|Estratégia & Diagnósticos/i)
  })


  it('renders route: /meetings (Reuniões)', () => {
    testRoute('/meetings', /Meeting Hub|Reuniões & Alinhamentos/i)
  })

  it('renders route: /chat (Chat)', () => {
    testRoute('/chat', /Team Chat|Chat & Canais Internos/i)
  })

  it('renders route: /presentations (Apresentações)', () => {
    testRoute('/presentations', /Presentation Studio/i)
  })

  it('renders route: /settings (Configurações)', () => {
    testRoute('/settings', /Configurações do Sistema/i)
  })
})
