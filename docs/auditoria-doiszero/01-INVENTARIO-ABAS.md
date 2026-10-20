# Inventário de rotas e abas

Data: 14/10/2026. Atual `991ccac18b0d1f6de604745034508481d503fa6c`, branch `codex/master-audit-15-1`; origem `https://github.com/plataformadoispontozero/DoisPontoZero.git`.

Legado `https://github.com/midiadoiszero-bit/doispontozero.git`: `git ls-remote` retornou **Repository not found** depois de habilitar rede. Não distingue repo privado de URL incorreta. Nenhuma branch/SHA legada inventada.

## Rotas atuais (102)

| Rota | Componente ou alias | Evidência |
|---|---|---|
| `/` | `src/features/public-site/PublicSitePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:8-8` |
| `/portfolio/:projectId` | `src/features/public-site/PublicPortfolioPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:15-15` |
| `/brief` | `src/features/public-site/PublicBriefPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:22-22` |
| `/material-review` | `src/features/integrations/MaterialReviewPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:28-28` |
| `/login` | `src/features/auth/AuthPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:29-29` |
| `/register` | `src/features/team/TeamRegistrationPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:30-30` |
| `/forgot-password` | `src/features/auth/AuthPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:31-31` |
| `/accept-invitation` | `src/features/team/AcceptInvitationPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:33-33` |
| `/reset-password` | `src/features/auth/AuthPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:39-39` |
| `/approve-calendar/:token` | `src/features/editorial/PublicEditorialApprovalPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:41-41` |
| `/b/:publicToken` | `src/features/briefing/public/PublicBriefingFormPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:50-50` |
| `/p/:publicToken` | `src/features/proposals/public/PublicProposalViewPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:58-58` |
| `/showcase/:publicToken` | `src/features/presentations/public/PublicShowcaseViewPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:66-66` |
| `/social-media` | `src/features/social-media/SocialMediaPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:82-82` |
| `/editorial` | `src/features/editorial/MonthlyEditorialPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:86-86` |
| `/editorial/new` | `src/features/editorial/MonthlyEditorialPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:93-93` |
| `/production/:department` | `src/features/production/DepartmentPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:99-99` |
| `/dashboard` | `src/features/dashboard/DashboardPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:106-106` |
| `/agenda` | `Alias/layout/fallback; sem lazy import no bloco` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:113-113` |
| `/calendar` | `src/features/calendar/CalendarPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:117-117` |
| `/clients` | `src/features/clients/ClientsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:124-124` |
| `/clients/new` | `src/features/clients/ClientsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:131-131` |
| `/clients/:clientId` | `src/features/clients/ClientsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:138-138` |
| `/clients/:clientId/workspace` | `src/features/clients/ClientWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:145-145` |
| `/clients/:clientId/edit` | `src/features/clients/ClientsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:152-152` |
| `/team` | `src/features/team/TeamDirectoryPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:159-159` |
| `/team/new` | `src/features/team/TeamDirectoryPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:166-166` |
| `/team/:memberId` | `src/features/team/TeamDirectoryPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:173-173` |
| `/projects` | `src/features/projects/ProjectsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:180-180` |
| `/projects/new` | `src/features/projects/NewProjectPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:187-187` |
| `/projects/:projectId` | `src/features/projects/ProjectWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:194-194` |
| `/projects/:projectId/settings` | `src/features/projects/ProjectWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:201-201` |
| `/tasks` | `src/features/tasks/TasksPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:208-208` |
| `/tasks/:taskId` | `src/features/tasks/TasksPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:214-214` |
| `/squads` | `src/features/squads/SquadsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:220-220` |
| `/drive` | `src/features/drive/DriveBrowserPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:226-226` |
| `/drive/connections` | `src/features/drive/DriveConnectionsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:233-233` |
| `/drive/clients/:clientId` | `src/features/drive/DriveBrowserPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:240-240` |
| `/briefings` | `src/features/briefing/BriefingPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:247-247` |
| `/briefings/templates` | `src/features/briefing/templates/BriefingTemplatesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:254-254` |
| `/briefings/templates/new` | `src/features/briefing/templates/BriefingTemplateEditorPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:262-262` |
| `/briefings/templates/:templateId/edit` | `src/features/briefing/templates/BriefingTemplateEditorPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:270-270` |
| `/briefings/new` | `src/features/briefing/NewBriefingPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:278-278` |
| `/briefings/:briefingId` | `src/features/briefing/BriefingResponsesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:285-285` |
| `/briefings/:briefingId/responses` | `src/features/briefing/BriefingResponsesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:292-292` |
| `/briefings/:briefingId/export` | `src/features/briefing/BriefingExportPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:299-299` |
| `/briefing` | `Alias/layout/fallback; sem lazy import no bloco` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:306-306` |
| `/strategy` | `src/features/strategy/StrategyPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:310-310` |
| `/strategy/new` | `src/features/strategy/NewStrategyPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:317-317` |
| `/strategy/:strategyId` | `src/features/strategy/StrategyWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:324-324` |
| `/proposals` | `src/features/proposals/ProposalsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:331-331` |
| `/proposals/new` | `src/features/proposals/NewProposalPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:338-338` |
| `/proposals/templates` | `src/features/proposals/ProposalTemplatesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:345-345` |
| `/proposals/templates/new` | `src/features/proposals/ProposalTemplatesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:353-353` |
| `/proposals/templates/:templateId/edit` | `src/features/proposals/ProposalTemplatesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:361-361` |
| `/proposals/services` | `src/features/proposals/ServiceCatalogPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:369-369` |
| `/proposals/:proposalId` | `src/features/proposals/ProposalWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:376-376` |
| `/proposals/:proposalId/edit` | `src/features/proposals/ProposalWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:384-384` |
| `/proposals/:proposalId/preview` | `src/features/proposals/ProposalWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:392-392` |
| `/proposals/:proposalId/versions` | `src/features/proposals/ProposalWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:400-400` |
| `/proposals/:proposalId/export` | `src/features/proposals/ProposalExportPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:408-408` |
| `/meetings` | `src/features/meetings/MeetingsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:415-415` |
| `/meetings/new` | `src/features/meetings/NewMeetingPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:422-422` |
| `/meetings/:meetingId` | `src/features/meetings/MeetingWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:429-429` |
| `/meetings/:meetingId/edit` | `src/features/meetings/MeetingWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:436-436` |
| `/meetings/:meetingId/agenda` | `src/features/meetings/MeetingWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:443-443` |
| `/meetings/:meetingId/minutes` | `src/features/meetings/MeetingWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:450-450` |
| `/meetings/:meetingId/actions` | `src/features/meetings/MeetingWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:457-457` |
| `/chat` | `src/features/chat/ChatPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:464-464` |
| `/chat/channels/:channelId` | `src/features/chat/ChatPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:470-470` |
| `/chat/direct/:conversationId` | `src/features/chat/ChatPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:476-476` |
| `/chat/settings` | `src/features/chat/ChatSettingsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:482-482` |
| `/notifications` | `src/features/notifications/NotificationsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:489-489` |
| `/settings/integrations/calendar` | `src/features/settings/CalendarIntegrationPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:497-497` |
| `/presentations` | `src/features/presentations/PresentationsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:505-505` |
| `/presentations/new` | `src/features/presentations/NewPresentationPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:513-513` |
| `/presentations/:presentationId` | `src/features/presentations/PresentationWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:521-521` |
| `/presentations/:presentationId/edit` | `src/features/presentations/PresentationWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:529-529` |
| `/presentations/:presentationId/preview` | `src/features/presentations/PresentationWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:537-537` |
| `/presentations/:presentationId/versions` | `src/features/presentations/PresentationWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:545-545` |
| `/presentations/:presentationId/export` | `src/features/presentations/PresentationExportPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:553-553` |
| `/profile` | `src/features/team/MyProfilePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:561-561` |
| `/settings` | `src/features/settings/SettingsOverviewPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:565-565` |
| `/settings/public-site` | `src/features/public-site/PublicSiteSettingsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:577-577` |
| `/settings/agency` | `src/features/settings/AgencySettingsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:585-585` |
| `/settings/branding` | `src/features/settings/WhiteLabelStudioPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:593-593` |
| `/settings/appearance` | `src/features/settings/AppearanceSettingsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:601-601` |
| `/settings/team` | `src/features/settings/TeamManagementPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:609-609` |
| `/settings/permissions` | `src/features/settings/PermissionStudioPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:617-617` |
| `/settings/workspace` | `src/features/settings/WorkspacePreferencesPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:625-625` |
| `/settings/documents` | `src/features/settings/DocumentBrandingPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:633-633` |
| `/settings/client-experience` | `src/features/settings/ClientExperiencePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:641-641` |
| `/settings/integrations` | `src/features/settings/IntegrationsCenterPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:649-649` |
| `/settings/integrations/meta` | `src/features/settings/MetaWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:657-657` |
| `/settings/integrations/google` | `src/features/settings/GoogleWorkspacePage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:661-661` |
| `/settings/notifications` | `src/features/notifications/NotificationsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:668-668` |
| `/settings/apps` | `src/features/app-install/AppsInstallPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:670-670` |
| `/settings/integrations/import-clients` | `src/features/settings/import-clients/ImportClientsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:678-678` |
| `/settings/security` | `src/features/settings/SecurityCenterPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:686-686` |
| `/settings/activity` | `src/features/settings/ActivityCenterPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:694-694` |
| `/settings/diagnostics` | `src/features/settings/DiagnosticsPage.tsx` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:702-702` |
| `/*` | `Alias/layout/fallback; sem lazy import no bloco` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:711-711` |

## Abas internas detectadas

| Módulo | Aba | Evidência | Relatório |
|---|---|---|---|
| ProjectWorkspacePage | `calendar` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/ProjectWorkspacePage.tsx:453-453` | [calendar](40-producao/ProjectWorkspacePage--calendar.md) |
| ProjectWorkspacePage | `kanban` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/ProjectWorkspacePage.tsx:59-59` | [kanban](40-producao/ProjectWorkspacePage--kanban.md) |
| ProjectWorkspacePage | `list` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/ProjectWorkspacePage.tsx:125-125` | [list](40-producao/ProjectWorkspacePage--list.md) |
| TasksPage | `calendar` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/TasksPage.tsx:221-221` | [calendar](40-producao/TasksPage--calendar.md) |
| TasksPage | `list` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/TasksPage.tsx:105-105` | [list](40-producao/TasksPage--list.md) |
| SquadsPage | `goals` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:976-976` | [goals](80-equipe-e-sistema/SquadsPage--goals.md) |
| SquadsPage | `performance` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:716-716` | [performance](80-equipe-e-sistema/SquadsPage--performance.md) |
| SquadsPage | `ranking` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:796-796` | [ranking](80-equipe-e-sistema/SquadsPage--ranking.md) |
| SquadsPage | `squads` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:51-51` | [squads](80-equipe-e-sistema/SquadsPage--squads.md) |
| StrategyWorkspacePage | `editorial` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/StrategyWorkspacePage.tsx:60-60` | [editorial](20-social-media/StrategyWorkspacePage--editorial.md) |
| StrategyWorkspacePage | `ideas` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/StrategyWorkspacePage.tsx:59-59` | [ideas](20-social-media/StrategyWorkspacePage--ideas.md) |
| StrategyWorkspacePage | `overview` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/StrategyWorkspacePage.tsx:64-64` | [overview](20-social-media/StrategyWorkspacePage--overview.md) |
| StrategyWorkspacePage | `pillars` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/StrategyWorkspacePage.tsx:58-58` | [pillars](20-social-media/StrategyWorkspacePage--pillars.md) |
| ProposalWorkspacePage | `export` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/ProposalWorkspacePage.tsx:45-45` | [export](60-comercial/ProposalWorkspacePage--export.md) |
| ProposalWorkspacePage | `pricing` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/ProposalWorkspacePage.tsx:5-5` | [pricing](60-comercial/ProposalWorkspacePage--pricing.md) |
| ProposalWorkspacePage | `sections` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/ProposalWorkspacePage.tsx:71-71` | [sections](60-comercial/ProposalWorkspacePage--sections.md) |
| ProposalWorkspacePage | `versions` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/ProposalWorkspacePage.tsx:71-71` | [versions](60-comercial/ProposalWorkspacePage--versions.md) |
| MeetingWorkspacePage | `actions` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | [actions](80-equipe-e-sistema/MeetingWorkspacePage--actions.md) |
| MeetingWorkspacePage | `agenda` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | [agenda](80-equipe-e-sistema/MeetingWorkspacePage--agenda.md) |
| MeetingWorkspacePage | `decisions` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | [decisions](80-equipe-e-sistema/MeetingWorkspacePage--decisions.md) |
| MeetingWorkspacePage | `minutes` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | [minutes](80-equipe-e-sistema/MeetingWorkspacePage--minutes.md) |
| MeetingWorkspacePage | `overview` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | [overview](80-equipe-e-sistema/MeetingWorkspacePage--overview.md) |
| PresentationWorkspacePage | `editor` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/PresentationWorkspacePage.tsx:50-50` | [editor](70-cliente-e-publico/PresentationWorkspacePage--editor.md) |
| PresentationWorkspacePage | `preview` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/PresentationWorkspacePage.tsx:50-50` | [preview](70-cliente-e-publico/PresentationWorkspacePage--preview.md) |
| PresentationWorkspacePage | `publish` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/PresentationWorkspacePage.tsx:43-43` | [publish](70-cliente-e-publico/PresentationWorkspacePage--publish.md) |
| PresentationWorkspacePage | `versions` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/presentations/PresentationWorkspacePage.tsx:35-35` | [versions](70-cliente-e-publico/PresentationWorkspacePage--versions.md) |
| WhiteLabelStudioPage | `colors` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/WhiteLabelStudioPage.tsx:30-30` | [colors](80-equipe-e-sistema/WhiteLabelStudioPage--colors.md) |
| WhiteLabelStudioPage | `identity` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/WhiteLabelStudioPage.tsx:30-30` | [identity](80-equipe-e-sistema/WhiteLabelStudioPage--identity.md) |
| WhiteLabelStudioPage | `typography` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/WhiteLabelStudioPage.tsx:30-30` | [typography](80-equipe-e-sistema/WhiteLabelStudioPage--typography.md) |

Inventário estático dos lazy imports e controles de aba. Não equivale a smoke executado. Rotas públicas não são automaticamente anônimas para todos os dados: verificar tokens e projeções do respectivo contrato. Abas legadas: **NÃO VERIFICADAS**.

## Complementos verificados

ClientHubModal possui sete seções (algumas condicionais às permissões), TaskDetailPanel quatro abas. Produção possui três destinos reais no parâmetro department.

- [10-gestor/ClientHubModal--visao-geral.md](10-gestor/ClientHubModal--visao-geral.md)
- [10-gestor/ClientHubModal--dados-e-links.md](10-gestor/ClientHubModal--dados-e-links.md)
- [10-gestor/ClientHubModal--arquivos-no-drive.md](10-gestor/ClientHubModal--arquivos-no-drive.md)
- [10-gestor/ClientHubModal--historico.md](10-gestor/ClientHubModal--historico.md)
- [10-gestor/ClientHubModal--briefings.md](10-gestor/ClientHubModal--briefings.md)
- [10-gestor/ClientHubModal--calendario.md](10-gestor/ClientHubModal--calendario.md)
- [10-gestor/ClientHubModal--apresentacoes.md](10-gestor/ClientHubModal--apresentacoes.md)
- [40-producao/TaskDetailPanel--comments.md](40-producao/TaskDetailPanel--comments.md)
- [40-producao/TaskDetailPanel--links.md](40-producao/TaskDetailPanel--links.md)
- [40-producao/TaskDetailPanel--attachments.md](40-producao/TaskDetailPanel--attachments.md)
- [40-producao/TaskDetailPanel--activity.md](40-producao/TaskDetailPanel--activity.md)
- [40-producao/Design.md](40-producao/Design.md)
- [40-producao/Video-Motion.md](40-producao/Video-Motion.md)
- [40-producao/Trafego-Pago.md](40-producao/Trafego-Pago.md)


## Complemento 14/10/2026 — fonte local recuperada

O bloqueio anterior de acesso ao GitHub permanece registrado como histórico. A pasta fornecida permite agora auditoria estática; branch/commit e equivalência com o deploy legado permanecem NÃO VERIFICADOS. Identificação e fichas: [fonte local](96A-FONTE-LEGADA-LOCAL.md). 39 declarações de rota encontradas em App.tsx, incluindo wildcard; 39 fichas de páginas geradas. Dependências transitivas e testes operacionais ainda pendentes: isto não encerra a auditoria integral.

| Capacidade | Evidência legada | Evidência atual | Decisão e limite |
|---|---|---|---|
| Briefing → estratégia → geração por cliente/mês | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteFluxoCalendario.tsx:42-78` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:1-120` | ADAPTAR RECURSO candidato: navegação progressiva; nenhum ganho operacional medido |
| Envio audiovisual explícito, herança de responsável | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/components/videomaker/SendToVideoProduction.tsx:138-193` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:105-124` | PORTAR REGRA candidata; reaproveitar tasks atuais, não criar video_productions paralelo |
| Arquivo no Drive e metadados da demanda | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/components/producao/DemandProductionFiles.tsx:220-280` | integração atual preservada; equivalência detalhada NÃO VERIFICADA | MANTER NOVO; aproveitar requisitos de UX, não credenciais/connector legado |
| SLA por etapa centralizado | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/config/production-sla.ts:1-23` | regra temporal atual NÃO VERIFICADA neste complemento | INVESTIGAR; definir gatilho, fuso e horas úteis antes de adotar 24/48 |

**Alertas verificáveis no código:** o envio audiovisual legado cria `status: backlog`, não comprova Backlog exclusivo de revisão interna nem recepção em Briefados. O upload usa XMLHttpRequest para o arquivo inteiro (DemandProductionFiles linhas73–89 e232); criar sessão resumível não comprova envio em chunks ou retomada. Falha no registro de metadados depois do upload mantém arquivo no Drive e exige reconciliação; não repetir upload cegamente. Não copiar autenticação por conta de serviço para substituir o OAuth atual.

**Pilotos candidatos:** ADOC-001 organizar a preparação editorial em etapas sem motor novo; ADOC-002 conferência e liberação explícita usando tarefas atuais e responsável validado; ADOC-003 consistência da copy/versão preservando snapshots e locks atuais. Os cards originais seguem históricos; esta comparação não comprova vantagens operacionais nem autoriza implementação. Backlog interno continua requisito solicitado que não foi comprovado no legado.

**Testes essenciais — NÃO TESTADO:** papéis/RLS; isolamento A/B; revisão interna sem tarefa prematura; captação condicional; aprovação e copy idêntica nos setores; envio repetido idempotente; upload e reconciliação de metadados; refresh/erro/mobile. Scripts dos projetos não foram executados para evitar conexões e efeitos remotos durante leitura do legado.

Preservar Auth, OAuth/Drive, IDs, tasks/projetos canônicos, snapshots de aprovação e design atual. Não trazer tabelas duplicadas, rotas/auth legadas ou semântica backlog ambígua. Ganho antes/depois e fluxo transativo completo ainda precisam de evidência antes da aprovação final de adoção.
