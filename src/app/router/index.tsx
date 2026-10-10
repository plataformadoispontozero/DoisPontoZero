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
import { NewProposalPage } from '@/features/proposals/NewProposalPage'
import { ProposalWorkspacePage } from '@/features/proposals/ProposalWorkspacePage'
import { ServiceCatalogPage } from '@/features/proposals/ServiceCatalogPage'
import { ProposalTemplatesPage } from '@/features/proposals/ProposalTemplatesPage'
import { ProposalExportPage } from '@/features/proposals/ProposalExportPage'
import { PublicProposalViewPage } from '@/features/proposals/public/PublicProposalViewPage'
import { DriveBrowserPage } from '@/features/drive/DriveBrowserPage'
import { DriveConnectionsPage } from '@/features/drive/DriveConnectionsPage'
import { NewPresentationPage } from '@/features/presentations/NewPresentationPage'
import { PresentationWorkspacePage } from '@/features/presentations/PresentationWorkspacePage'
import { PresentationExportPage } from '@/features/presentations/PresentationExportPage'
import { PublicShowcaseViewPage } from '@/features/presentations/public/PublicShowcaseViewPage'
import { MeetingsPage } from '@/features/meetings/MeetingsPage'
import { NewMeetingPage } from '@/features/meetings/NewMeetingPage'
import { MeetingWorkspacePage } from '@/features/meetings/MeetingWorkspacePage'
import { ChatPage } from '@/features/chat/ChatPage'
import { ChatSettingsPage } from '@/features/chat/ChatSettingsPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { CalendarIntegrationPage } from '@/features/settings/CalendarIntegrationPage'
import { PresentationsPage } from '@/features/presentations/PresentationsPage'
import { SettingsLayout } from '@/features/settings/components/SettingsLayout'
import { SettingsOverviewPage } from '@/features/settings/SettingsOverviewPage'
import { AgencySettingsPage } from '@/features/settings/AgencySettingsPage'
import { WhiteLabelStudioPage } from '@/features/settings/WhiteLabelStudioPage'
import { AppearanceSettingsPage } from '@/features/settings/AppearanceSettingsPage'
import { TeamManagementPage } from '@/features/settings/TeamManagementPage'
import { PermissionStudioPage } from '@/features/settings/PermissionStudioPage'
import { WorkspacePreferencesPage } from '@/features/settings/WorkspacePreferencesPage'
import { DocumentBrandingPage } from '@/features/settings/DocumentBrandingPage'
import { ClientExperiencePage } from '@/features/settings/ClientExperiencePage'
import { IntegrationsCenterPage } from '@/features/settings/IntegrationsCenterPage'
import { SecurityCenterPage } from '@/features/settings/SecurityCenterPage'
import { ActivityCenterPage } from '@/features/settings/ActivityCenterPage'
import { DiagnosticsPage } from '@/features/settings/DiagnosticsPage'

export const router = createBrowserRouter([
  // Public standalone routes for external clients (Briefing, Proposal, Showcase)
  {
    path: '/b/:publicToken',
    element: <PublicBriefingFormPage />,
  },
  {
    path: '/p/:publicToken',
    element: <PublicProposalViewPage />,
  },
  {
    path: '/showcase/:publicToken',
    element: <PublicShowcaseViewPage />,
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
        path: 'drive',
        element: <DriveBrowserPage />,
      },
      {
        path: 'drive/connections',
        element: <DriveConnectionsPage />,
      },
      {
        path: 'drive/clients/:clientId',
        element: <DriveBrowserPage />,
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
        path: 'proposals/new',
        element: <NewProposalPage />,
      },
      {
        path: 'proposals/templates',
        element: <ProposalTemplatesPage />,
      },
      {
        path: 'proposals/templates/new',
        element: <ProposalTemplatesPage />,
      },
      {
        path: 'proposals/templates/:templateId/edit',
        element: <ProposalTemplatesPage />,
      },
      {
        path: 'proposals/services',
        element: <ServiceCatalogPage />,
      },
      {
        path: 'proposals/:proposalId',
        element: <ProposalWorkspacePage />,
      },
      {
        path: 'proposals/:proposalId/edit',
        element: <ProposalWorkspacePage />,
      },
      {
        path: 'proposals/:proposalId/preview',
        element: <ProposalWorkspacePage />,
      },
      {
        path: 'proposals/:proposalId/versions',
        element: <ProposalWorkspacePage />,
      },
      {
        path: 'proposals/:proposalId/export',
        element: <ProposalExportPage />,
      },
      {
        path: 'meetings',
        element: <MeetingsPage />,
      },
      {
        path: 'meetings/new',
        element: <NewMeetingPage />,
      },
      {
        path: 'meetings/:meetingId',
        element: <MeetingWorkspacePage />,
      },
      {
        path: 'meetings/:meetingId/edit',
        element: <MeetingWorkspacePage />,
      },
      {
        path: 'meetings/:meetingId/agenda',
        element: <MeetingWorkspacePage />,
      },
      {
        path: 'meetings/:meetingId/minutes',
        element: <MeetingWorkspacePage />,
      },
      {
        path: 'meetings/:meetingId/actions',
        element: <MeetingWorkspacePage />,
      },
      {
        path: 'chat',
        element: <ChatPage />,
      },
      {
        path: 'chat/channels/:channelId',
        element: <ChatPage />,
      },
      {
        path: 'chat/direct/:conversationId',
        element: <ChatPage />,
      },
      {
        path: 'chat/settings',
        element: <ChatSettingsPage />,
      },
      {
        path: 'notifications',
        element: <NotificationsPage />,
      },
      {
        path: 'settings/integrations/calendar',
        element: <CalendarIntegrationPage />,
      },
      {
        path: 'presentations',
        element: <PresentationsPage />,
      },
      {
        path: 'presentations/new',
        element: <NewPresentationPage />,
      },
      {
        path: 'presentations/:presentationId',
        element: <PresentationWorkspacePage />,
      },
      {
        path: 'presentations/:presentationId/edit',
        element: <PresentationWorkspacePage />,
      },
      {
        path: 'presentations/:presentationId/preview',
        element: <PresentationWorkspacePage />,
      },
      {
        path: 'presentations/:presentationId/versions',
        element: <PresentationWorkspacePage />,
      },
      {
        path: 'presentations/:presentationId/export',
        element: <PresentationExportPage />,
      },
      {
        path: 'settings',
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            element: <SettingsOverviewPage />,
          },
          {
            path: 'agency',
            element: <AgencySettingsPage />,
          },
          {
            path: 'branding',
            element: <WhiteLabelStudioPage />,
          },
          {
            path: 'appearance',
            element: <AppearanceSettingsPage />,
          },
          {
            path: 'team',
            element: <TeamManagementPage />,
          },
          {
            path: 'permissions',
            element: <PermissionStudioPage />,
          },
          {
            path: 'workspace',
            element: <WorkspacePreferencesPage />,
          },
          {
            path: 'documents',
            element: <DocumentBrandingPage />,
          },
          {
            path: 'client-experience',
            element: <ClientExperiencePage />,
          },
          {
            path: 'integrations',
            element: <IntegrationsCenterPage />,
          },
          {
            path: 'security',
            element: <SecurityCenterPage />,
          },
          {
            path: 'activity',
            element: <ActivityCenterPage />,
          },
          {
            path: 'diagnostics',
            element: <DiagnosticsPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
])
