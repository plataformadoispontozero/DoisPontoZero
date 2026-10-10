import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/app/layouts/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { CalendarPage } from '@/features/calendar/CalendarPage'
import { ClientsPage } from '@/features/clients/ClientsPage'
import { ProjectsPage } from '@/features/projects/ProjectsPage'
import { NewProjectPage } from '@/features/projects/NewProjectPage'
import { ProjectWorkspacePage } from '@/features/projects/ProjectWorkspacePage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { SquadsPage } from '@/features/squads/SquadsPage'
import { BriefingPage } from '@/features/briefing/BriefingPage'
import { BriefingTemplatesPage } from '@/features/briefing/templates/BriefingTemplatesPage'
import { BriefingTemplateEditorPage } from '@/features/briefing/templates/BriefingTemplateEditorPage'
import { NewBriefingPage } from '@/features/briefing/NewBriefingPage'
import { BriefingResponsesPage } from '@/features/briefing/BriefingResponsesPage'
import { BriefingExportPage } from '@/features/briefing/BriefingExportPage'
import { PublicBriefingFormPage } from '@/features/briefing/public/PublicBriefingFormPage'
import { StrategyPage } from '@/features/strategy/StrategyPage'
import { NewStrategyPage } from '@/features/strategy/NewStrategyPage'
import { StrategyWorkspacePage } from '@/features/strategy/StrategyWorkspacePage'
import { ProposalsPage } from '@/features/proposals/ProposalsPage'
import { MeetingsPage } from '@/features/meetings/MeetingsPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { PresentationsPage } from '@/features/presentations/PresentationsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export const router = createBrowserRouter([
  // Public standalone route for clients filling briefings outside the admin AppLayout
  {
    path: '/b/:publicToken',
    element: <PublicBriefingFormPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'calendar',
        element: <CalendarPage />,
      },
      {
        path: 'clients',
        element: <ClientsPage />,
      },
      {
        path: 'projects',
        element: <ProjectsPage />,
      },
      {
        path: 'projects/new',
        element: <NewProjectPage />,
      },
      {
        path: 'projects/:projectId',
        element: <ProjectWorkspacePage />,
      },
      {
        path: 'projects/:projectId/settings',
        element: <ProjectWorkspacePage />,
      },
      {
        path: 'tasks',
        element: <TasksPage />,
      },
      {
        path: 'tasks/:taskId',
        element: <TasksPage />,
      },
      {
        path: 'squads',
        element: <SquadsPage />,
      },
      {
        path: 'briefings',
        element: <BriefingPage />,
      },
      {
        path: 'briefings/templates',
        element: <BriefingTemplatesPage />,
      },
      {
        path: 'briefings/templates/new',
        element: <BriefingTemplateEditorPage />,
      },
      {
        path: 'briefings/templates/:templateId/edit',
        element: <BriefingTemplateEditorPage />,
      },
      {
        path: 'briefings/new',
        element: <NewBriefingPage />,
      },
      {
        path: 'briefings/:briefingId',
        element: <BriefingResponsesPage />,
      },
      {
        path: 'briefings/:briefingId/responses',
        element: <BriefingResponsesPage />,
      },
      {
        path: 'briefings/:briefingId/export',
        element: <BriefingExportPage />,
      },
      {
        path: 'briefing',
        element: <Navigate to="/briefings" replace />,
      },
      {
        path: 'strategy',
        element: <StrategyPage />,
      },
      {
        path: 'strategy/new',
        element: <NewStrategyPage />,
      },
      {
        path: 'strategy/:strategyId',
        element: <StrategyWorkspacePage />,
      },
      {
        path: 'proposals',
        element: <ProposalsPage />,
      },
      {
        path: 'meetings',
        element: <MeetingsPage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'presentations',
        element: <PresentationsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
])
