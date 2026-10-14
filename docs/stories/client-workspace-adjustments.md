# Organização da operação por cliente e diagnóstico

Pedido: concluir os ajustes de grupos por cliente, calendários, Kanban exclusivo de gestão, briefings, Minha Agenda, métricas Meta e PDF de apresentações; exibir evidências no Diagnóstico Técnico. Propostas segue removido.

- [x] Social Media e Tarefas com grupos recolhíveis por cliente.
- [x] Tarefas inicialmente exibem clientes com demandas em andamento; concluídos podem ser incluídos.
- [x] Kanban geral de gestão por cliente e status; autorização no backend e RLS preservada.
- [x] Calendários e briefings organizados por cliente.
- [x] Agenda pessoal com mês, semana, dia e lista.
- [x] Meta por campanha e período, sem métricas inventadas ou somar alcance deduplicado.
- [x] PDF de apresentações com materiais visuais e preview/download consistente.
- [x] Diagnóstico registra entregas, verificação e limites, sem concluir fases sem aceite.
- [x] 353 testes de regressão, 34 cenários de navegador e renderização PDF aprovados.
- [x] Migration 20261014022802, Meta Edge Function v2, push 2d2ae80, deploy 14f4945d-b36e-4e32-af05-f7ce1ff6843f e verificação remota.

Arquivo de evidências: docs/qa/client-workspace-adjustments-2026-10-14.md.
File list: src/features/tasks/{ClientTaskGroups.tsx,TasksPage.tsx}; src/features/social-media/SocialMediaPage.tsx; src/features/projects/{ProjectsPage.tsx,management-kanban.database.test.ts}; src/features/auth/{access.ts,ProtectedWorkspace.tsx}; src/components/navigation/{NavLinks.ts,NavigationGroups.tsx}; src/features/editorial/MonthlyEditorialPage.tsx; src/features/briefing/BriefingPage.tsx; src/features/calendar/CalendarPage.tsx; src/features/integrations/{ClientMetaPanel.tsx,metaInsights.test.ts}; supabase/functions/meta-workspace/{index.ts,insights.ts}; src/features/presentations/PresentationExportPage.tsx; src/features/presentations/pdf/{PresentationPdfDocument.tsx,preparePresentationMedia.ts,preparePresentationMedia.test.ts,generatePresentationPdf.ts,types.ts,transformPresentationToPdfModel.ts}; src/features/settings/{DiagnosticsPage.tsx,ReleaseDiagnostics.tsx,releaseEvidence.ts}; docs/RELEASE_STATUS.json; migration management_kanban; testes de rotas e navegador.

Arquivos adicionais: src/components/navigation/Navigation.test.tsx; src/components/navigation/TopBar.tsx; src/features/dashboard/DashboardPage.tsx; src/features/projects/{NewProjectPage.tsx,ProjectWorkspacePage.tsx}; src/features/presentations/pdf/{PresentationPdfHeader.tsx,PresentationPdfFooter.tsx}; src/features/settings/releaseEvidence.test.ts. Migration final: supabase/migrations/20261014022802_management_kanban.sql.
