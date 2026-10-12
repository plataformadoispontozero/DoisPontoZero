import { AuthPage } from "@/features/auth/AuthPage";
import { ProtectedWorkspace } from "@/features/auth/ProtectedWorkspace";
import { createBrowserRouter, Navigate, redirect } from "react-router-dom";
import { SettingsLayout } from "@/features/settings/components/SettingsLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: async () => ({
      Component: (await import("@/features/public-site/PublicSitePage"))
        .PublicSitePage,
    }),
  },
  {
    path: "/portfolio/:projectId",
    lazy: async () => ({
      Component: (await import("@/features/public-site/PublicPortfolioPage"))
        .PublicPortfolioPage,
    }),
  },
  {
    path: "/brief",
    lazy: async () => ({
      Component: (await import("@/features/public-site/PublicBriefPage"))
        .PublicBriefPage,
    }),
  },
  { path: "/material-review", lazy: async () => ({ Component: (await import("@/features/integrations/MaterialReviewPage")).default }) },
  { path: "/login", element: <AuthPage /> },
  { path: "/register", lazy: async () => ({ Component: (await import("@/features/team/TeamRegistrationPage")).TeamRegistrationPage }) },
  { path: "/forgot-password", element: <AuthPage mode="forgot" /> },
  {
    path: "/accept-invitation",
    lazy: async () => ({
      Component: (await import("@/features/team/AcceptInvitationPage"))
        .AcceptInvitationPage,
    }),
  },
  { path: "/reset-password", element: <AuthPage mode="reset" /> },
  {
    path: "/approve-calendar/:token",
    lazy: async () => ({
      Component: (
        await import("@/features/editorial/PublicEditorialApprovalPage")
      ).PublicEditorialApprovalPage,
    }),
  },
  // Public standalone routes for external clients (Briefing, Proposal, Showcase)
  {
    path: "/b/:publicToken",
    lazy: async () => ({
      Component: (
        await import("@/features/briefing/public/PublicBriefingFormPage")
      ).PublicBriefingFormPage,
    }),
  },
  {
    path: "/p/:publicToken",
    lazy: async () => ({
      Component: (
        await import("@/features/proposals/public/PublicProposalViewPage")
      ).PublicProposalViewPage,
    }),
  },
  {
    path: "/showcase/:publicToken",
    lazy: async () => ({
      Component: (
        await import("@/features/presentations/public/PublicShowcaseViewPage")
      ).PublicShowcaseViewPage,
    }),
  },
  {
    hydrateFallbackElement: (
      <main className="p-8 text-[#F8F9FC]" role="status">
        Carregando aplicativo…
      </main>
    ),
    element: <ProtectedWorkspace />,
    children: [
      {
        path: "editorial",
        lazy: async () => ({
          Component: (await import("@/features/editorial/MonthlyEditorialPage"))
            .MonthlyEditorialPage,
        }),
      },
      {
        path: "production/:department",
        lazy: async () => ({
          Component: (await import("@/features/production/DepartmentPage"))
            .DepartmentPage,
        }),
      },
      {
        path: "dashboard",
        lazy: async () => ({
          Component: (await import("@/features/dashboard/DashboardPage"))
            .DashboardPage,
        }),
      },
      {
        path: "agenda",
        loader: () => redirect("/calendar"),
      },
      {
        path: "calendar",
        lazy: async () => ({
          Component: (await import("@/features/calendar/CalendarPage"))
            .CalendarPage,
        }),
      },
      {
        path: "clients",
        lazy: async () => ({
          Component: (await import("@/features/clients/ClientsPage"))
            .ClientsPage,
        }),
      },
      {
        path: "clients/new",
        lazy: async () => ({
          Component: (await import("@/features/clients/ClientsPage"))
            .ClientsPage,
        }),
      },
      {
        path: "clients/:clientId",
        lazy: async () => ({
          Component: (await import("@/features/clients/ClientsPage"))
            .ClientsPage,
        }),
      },
      {
        path: "clients/:clientId/workspace",
        lazy: async () => ({
          Component: (await import("@/features/clients/ClientWorkspacePage"))
            .default,
        }),
      },
      {
        path: "clients/:clientId/edit",
        lazy: async () => ({
          Component: (await import("@/features/clients/ClientsPage"))
            .ClientsPage,
        }),
      },
      {
        path: "team",
        lazy: async () => ({
          Component: (await import("@/features/team/TeamDirectoryPage"))
            .TeamDirectoryPage,
        }),
      },
      {
        path: "team/new",
        lazy: async () => ({
          Component: (await import("@/features/team/TeamDirectoryPage"))
            .TeamDirectoryPage,
        }),
      },
      {
        path: "team/:memberId",
        lazy: async () => ({
          Component: (await import("@/features/team/TeamDirectoryPage"))
            .TeamDirectoryPage,
        }),
      },
      {
        path: "projects",
        lazy: async () => ({
          Component: (await import("@/features/projects/ProjectsPage"))
            .ProjectsPage,
        }),
      },
      {
        path: "projects/new",
        lazy: async () => ({
          Component: (await import("@/features/projects/NewProjectPage"))
            .NewProjectPage,
        }),
      },
      {
        path: "projects/:projectId",
        lazy: async () => ({
          Component: (await import("@/features/projects/ProjectWorkspacePage"))
            .ProjectWorkspacePage,
        }),
      },
      {
        path: "projects/:projectId/settings",
        lazy: async () => ({
          Component: (await import("@/features/projects/ProjectWorkspacePage"))
            .ProjectWorkspacePage,
        }),
      },
      {
        path: "tasks",
        lazy: async () => ({
          Component: (await import("@/features/tasks/TasksPage")).TasksPage,
        }),
      },
      {
        path: "tasks/:taskId",
        lazy: async () => ({
          Component: (await import("@/features/tasks/TasksPage")).TasksPage,
        }),
      },
      {
        path: "squads",
        lazy: async () => ({
          Component: (await import("@/features/squads/SquadsPage")).SquadsPage,
        }),
      },
      {
        path: "drive",
        lazy: async () => ({
          Component: (await import("@/features/drive/DriveBrowserPage"))
            .DriveBrowserPage,
        }),
      },
      {
        path: "drive/connections",
        lazy: async () => ({
          Component: (await import("@/features/drive/DriveConnectionsPage"))
            .DriveConnectionsPage,
        }),
      },
      {
        path: "drive/clients/:clientId",
        lazy: async () => ({
          Component: (await import("@/features/drive/DriveBrowserPage"))
            .DriveBrowserPage,
        }),
      },
      {
        path: "briefings",
        lazy: async () => ({
          Component: (await import("@/features/briefing/BriefingPage"))
            .BriefingPage,
        }),
      },
      {
        path: "briefings/templates",
        lazy: async () => ({
          Component: (
            await import("@/features/briefing/templates/BriefingTemplatesPage")
          ).BriefingTemplatesPage,
        }),
      },
      {
        path: "briefings/templates/new",
        lazy: async () => ({
          Component: (
            await import("@/features/briefing/templates/BriefingTemplateEditorPage")
          ).BriefingTemplateEditorPage,
        }),
      },
      {
        path: "briefings/templates/:templateId/edit",
        lazy: async () => ({
          Component: (
            await import("@/features/briefing/templates/BriefingTemplateEditorPage")
          ).BriefingTemplateEditorPage,
        }),
      },
      {
        path: "briefings/new",
        lazy: async () => ({
          Component: (await import("@/features/briefing/NewBriefingPage"))
            .NewBriefingPage,
        }),
      },
      {
        path: "briefings/:briefingId",
        lazy: async () => ({
          Component: (await import("@/features/briefing/BriefingResponsesPage"))
            .BriefingResponsesPage,
        }),
      },
      {
        path: "briefings/:briefingId/responses",
        lazy: async () => ({
          Component: (await import("@/features/briefing/BriefingResponsesPage"))
            .BriefingResponsesPage,
        }),
      },
      {
        path: "briefings/:briefingId/export",
        lazy: async () => ({
          Component: (await import("@/features/briefing/BriefingExportPage"))
            .BriefingExportPage,
        }),
      },
      {
        path: "briefing",
        element: <Navigate to="/briefings" replace />,
      },
      {
        path: "strategy",
        lazy: async () => ({
          Component: (await import("@/features/strategy/StrategyPage"))
            .StrategyPage,
        }),
      },
      {
        path: "strategy/new",
        lazy: async () => ({
          Component: (await import("@/features/strategy/NewStrategyPage"))
            .NewStrategyPage,
        }),
      },
      {
        path: "strategy/:strategyId",
        lazy: async () => ({
          Component: (await import("@/features/strategy/StrategyWorkspacePage"))
            .StrategyWorkspacePage,
        }),
      },
      {
        path: "proposals",
        lazy: async () => ({
          Component: (await import("@/features/proposals/ProposalsPage"))
            .ProposalsPage,
        }),
      },
      {
        path: "proposals/new",
        lazy: async () => ({
          Component: (await import("@/features/proposals/NewProposalPage"))
            .NewProposalPage,
        }),
      },
      {
        path: "proposals/templates",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalTemplatesPage")
          ).ProposalTemplatesPage,
        }),
      },
      {
        path: "proposals/templates/new",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalTemplatesPage")
          ).ProposalTemplatesPage,
        }),
      },
      {
        path: "proposals/templates/:templateId/edit",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalTemplatesPage")
          ).ProposalTemplatesPage,
        }),
      },
      {
        path: "proposals/services",
        lazy: async () => ({
          Component: (await import("@/features/proposals/ServiceCatalogPage"))
            .ServiceCatalogPage,
        }),
      },
      {
        path: "proposals/:proposalId",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalWorkspacePage")
          ).ProposalWorkspacePage,
        }),
      },
      {
        path: "proposals/:proposalId/edit",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalWorkspacePage")
          ).ProposalWorkspacePage,
        }),
      },
      {
        path: "proposals/:proposalId/preview",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalWorkspacePage")
          ).ProposalWorkspacePage,
        }),
      },
      {
        path: "proposals/:proposalId/versions",
        lazy: async () => ({
          Component: (
            await import("@/features/proposals/ProposalWorkspacePage")
          ).ProposalWorkspacePage,
        }),
      },
      {
        path: "proposals/:proposalId/export",
        lazy: async () => ({
          Component: (await import("@/features/proposals/ProposalExportPage"))
            .ProposalExportPage,
        }),
      },
      {
        path: "meetings",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingsPage"))
            .MeetingsPage,
        }),
      },
      {
        path: "meetings/new",
        lazy: async () => ({
          Component: (await import("@/features/meetings/NewMeetingPage"))
            .NewMeetingPage,
        }),
      },
      {
        path: "meetings/:meetingId",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingWorkspacePage"))
            .MeetingWorkspacePage,
        }),
      },
      {
        path: "meetings/:meetingId/edit",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingWorkspacePage"))
            .MeetingWorkspacePage,
        }),
      },
      {
        path: "meetings/:meetingId/agenda",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingWorkspacePage"))
            .MeetingWorkspacePage,
        }),
      },
      {
        path: "meetings/:meetingId/minutes",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingWorkspacePage"))
            .MeetingWorkspacePage,
        }),
      },
      {
        path: "meetings/:meetingId/actions",
        lazy: async () => ({
          Component: (await import("@/features/meetings/MeetingWorkspacePage"))
            .MeetingWorkspacePage,
        }),
      },
      {
        path: "chat",
        lazy: async () => ({
          Component: (await import("@/features/chat/ChatPage")).ChatPage,
        }),
      },
      {
        path: "chat/channels/:channelId",
        lazy: async () => ({
          Component: (await import("@/features/chat/ChatPage")).ChatPage,
        }),
      },
      {
        path: "chat/direct/:conversationId",
        lazy: async () => ({
          Component: (await import("@/features/chat/ChatPage")).ChatPage,
        }),
      },
      {
        path: "chat/settings",
        lazy: async () => ({
          Component: (await import("@/features/chat/ChatSettingsPage"))
            .ChatSettingsPage,
        }),
      },
      {
        path: "notifications",
        lazy: async () => ({
          Component: (
            await import("@/features/notifications/NotificationsPage")
          ).NotificationsPage,
        }),
      },
      {
        path: "settings/integrations/calendar",
        lazy: async () => ({
          Component: (
            await import("@/features/settings/CalendarIntegrationPage")
          ).CalendarIntegrationPage,
        }),
      },
      {
        path: "presentations",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationsPage")
          ).PresentationsPage,
        }),
      },
      {
        path: "presentations/new",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/NewPresentationPage")
          ).NewPresentationPage,
        }),
      },
      {
        path: "presentations/:presentationId",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationWorkspacePage")
          ).PresentationWorkspacePage,
        }),
      },
      {
        path: "presentations/:presentationId/edit",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationWorkspacePage")
          ).PresentationWorkspacePage,
        }),
      },
      {
        path: "presentations/:presentationId/preview",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationWorkspacePage")
          ).PresentationWorkspacePage,
        }),
      },
      {
        path: "presentations/:presentationId/versions",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationWorkspacePage")
          ).PresentationWorkspacePage,
        }),
      },
      {
        path: "presentations/:presentationId/export",
        lazy: async () => ({
          Component: (
            await import("@/features/presentations/PresentationExportPage")
          ).PresentationExportPage,
        }),
      },
      {
        path: "settings",
        element: <SettingsLayout />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (
                await import("@/features/settings/SettingsOverviewPage")
              ).SettingsOverviewPage,
            }),
          },
          {
            path: "public-site",
            lazy: async () => ({
              Component: (
                await import("@/features/public-site/PublicSiteSettingsPage")
              ).PublicSiteSettingsPage,
            }),
          },
          {
            path: "agency",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/AgencySettingsPage")
              ).AgencySettingsPage,
            }),
          },
          {
            path: "branding",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/WhiteLabelStudioPage")
              ).WhiteLabelStudioPage,
            }),
          },
          {
            path: "appearance",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/AppearanceSettingsPage")
              ).AppearanceSettingsPage,
            }),
          },
          {
            path: "team",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/TeamManagementPage")
              ).TeamManagementPage,
            }),
          },
          {
            path: "permissions",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/PermissionStudioPage")
              ).PermissionStudioPage,
            }),
          },
          {
            path: "workspace",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/WorkspacePreferencesPage")
              ).WorkspacePreferencesPage,
            }),
          },
          {
            path: "documents",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/DocumentBrandingPage")
              ).DocumentBrandingPage,
            }),
          },
          {
            path: "client-experience",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/ClientExperiencePage")
              ).ClientExperiencePage,
            }),
          },
          {
            path: "integrations",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/IntegrationsCenterPage")
              ).IntegrationsCenterPage,
            }),
          },
          {
            path: "integrations/meta",
            lazy: async () => ({ Component: (await import("@/features/settings/MetaWorkspacePage")).default }),
          },
          {
            path: "integrations/google",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/GoogleWorkspacePage")
              ).default,
            }),
          },
          { path: "notifications", lazy: async () => ({ Component: (await import("@/features/notifications/NotificationsPage")).NotificationsPage }) },
          {
            path: "apps",
            lazy: async () => ({
              Component: (
                await import("@/features/app-install/AppsInstallPage")
              ).default,
            }),
          },
          {
            path: "integrations/import-clients",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/import-clients/ImportClientsPage")
              ).default,
            }),
          },
          {
            path: "security",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/SecurityCenterPage")
              ).SecurityCenterPage,
            }),
          },
          {
            path: "activity",
            lazy: async () => ({
              Component: (
                await import("@/features/settings/ActivityCenterPage")
              ).ActivityCenterPage,
            }),
          },
          {
            path: "diagnostics",
            lazy: async () => ({
              Component: (await import("@/features/settings/DiagnosticsPage"))
                .DiagnosticsPage,
            }),
          },
        ],
      },
      {
        path: "*",
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },
]);
