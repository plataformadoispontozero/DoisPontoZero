# Dois.Zero | Creative Agency OS
# Inventário Detalhado de Funcionalidades (Feature Inventory)

**Data de Auditoria:** 10 de Outubro de 2026  
**Versão:** Release 0.2.0-rc1  
**Total de Módulos Operacionais:** 12  
**Total de Tabelas Auditadas:** 65+  

---

## Tabela de Inventário de Recursos por Módulo

| Módulo | Funcionalidade | Rota | Serviço / Hook | Tabela PostgreSQL | Permissão | Teste Automatizado | Status | Pendência |
|---|---|---|---|---|---|---|---|---|
| **Fundação** | Shell & Navegação Responsiva | `/` | `useBranding` | `agencies` | `agency.view` | `Navigation.test.tsx` | COMPLETED | Nenhuma |
| **Dashboard** | Indicadores Operacionais Reais | `/dashboard` | `useDashboardData` | `projects`, `tasks`, `meetings` | `dashboard.view` | `DashboardPage.test.tsx` | COMPLETED | Nenhuma |
| **Dashboard** | Atividades Recentes Auditadas | `/dashboard` | `useDashboardData` | `agency_settings_history` | `dashboard.view` | `DashboardPage.test.tsx` | COMPLETED | Nenhuma |
| **CRM** | Listagem de Clientes | `/clients` | `useClients` | `clients` | `clients.view` | `clients.test.tsx` | COMPLETED | Nenhuma |
| **CRM** | Cadastro & Edição de Cliente | `/clients/new` | `useClients` | `clients` | `clients.manage` | `clients.test.tsx` | COMPLETED | Nenhuma |
| **CRM** | Hub Integrado (Tabs 360°) | `/clients/:id` | `useClients` | `clients`, `projects`, `briefings` | `clients.view` | `clients.test.tsx` | COMPLETED | Nenhuma |
| **Projetos** | Listagem & Filtros de Projetos | `/projects` | `useProjects` | `projects` | `projects.view` | `projects.test.tsx` | COMPLETED | Nenhuma |
| **Projetos** | Criação Transacional de Projeto | `/projects/new` | `useProjects` | `projects`, `boards` | `projects.create` | `projects.test.tsx` | COMPLETED | Nenhuma |
| **Kanban** | Quadro Drag & Drop com @dnd-kit | `/projects/:id` | `useBoards` | `boards`, `columns`, `tasks` | `tasks.edit` | `projects.test.tsx` | COMPLETED | Nenhuma |
| **Tarefas** | Painel Unificado & Subtarefas | `/tasks` | `useTasks` | `tasks`, `task_checklists` | `tasks.view` | `projects.test.tsx` | COMPLETED | Nenhuma |
| **Squads** | Gestão de Equipes & Líderes | `/squads` | `useSquads` | `squads`, `squad_members` | `squads.manage` | Vitest Unit | COMPLETED | Nenhuma |
| **Squads** | Metas & Ranking Gamificado | `/squads` | `useSquads` | `squad_goals`, `squad_performance`| `squads.view` | Vitest Unit | COMPLETED | Nenhuma |
| **Briefings**| Builder Visual de Formulários | `/briefings/templates/new` | `useBriefingTemplates` | `briefing_templates`, `questions` | `briefings.create` | `briefing.test.tsx` | COMPLETED | Nenhuma |
| **Briefings**| Portal Público de Preenchimento| `/b/:publicToken`| `usePublicBriefing` | `briefing_responses` (RPC) | Pública (Token Hash) | `briefing.test.tsx` | COMPLETED | Nenhuma |
| **Briefings**| PDF Editorial com Marca-d'água | `/briefings/:id` | `@react-pdf/renderer` | `briefings` | `briefings.export` | `briefing.test.tsx` | COMPLETED | Nenhuma |
| **Estratégia**| Matriz de Pilares & Distribuição| `/strategy/:id` | `useStrategy` | `content_strategies`, `pillars` | `strategy.manage` | `strategy.test.tsx` | COMPLETED | Nenhuma |
| **Estratégia**| Gerador Determinístico de Pautas| `/strategy/:id` | `editorialEngine.ts`| `editorial_items`, `ideas` | `strategy.edit` | `strategy.test.tsx` | COMPLETED | Nenhuma |
| **Propostas** | Catálogo & Motor de Precificação| `/proposals/new` | `pricingEngine.ts` | `proposal_items`, `services` | `proposals.manage` | `proposals.test.tsx` | COMPLETED | Nenhuma |
| **Propostas** | Link Público de Aceite Comercial| `/p/:publicToken` | `usePublicProposal` | `proposals` (RPC Token Hash) | Pública (Token Hash) | `proposals.test.tsx` | COMPLETED | Nenhuma |
| **Drive** | Navegador de Arquivos & Pastas | `/drive/browser` | `useDrive` | `google_connections`, `drive_files`| `drive.view` | `drive.test.tsx` | CONDITIONAL | Requer OAuth Google em produção |
| **Showcase** | Presentation Studio & Seções | `/presentations`| `usePresentations` | `presentations`, `sections` | `presentations.manage`| `presentations.test.tsx` | COMPLETED | Nenhuma |
| **Showcase** | Portal Público Responsivo | `/showcase/:token`| `usePublicPresentation`| `presentations` (RPC Token Hash) | Pública (Token Hash) | `presentations.test.tsx` | COMPLETED | Nenhuma |
| **Meetings** | Pautas, Atas & Action Items | `/meetings/:id` | `useMeetings` | `meetings`, `meeting_action_items` | `meetings.manage` | `meetings.test.tsx` | COMPLETED | Nenhuma |
| **Meetings** | Conversão em Tarefa Kanban | `/meetings/:id` | `convertActionItem` | RPC `convert_action_item_to_task` | `tasks.create` | `meetings.test.tsx` | COMPLETED | Nenhuma |
| **Chat** | Canais, DMs e Supabase Realtime| `/chat` | `useChat` | `chat_channels`, `chat_messages` | `chat.participate` | `chat.test.tsx` | COMPLETED | Nenhuma |
| **Notificações**| Central & Badge Unread TopBar | `/notifications`| `useNotifications` | `notifications` | `notifications.view` | `notifications.test.tsx` | COMPLETED | Nenhuma |
| **White Label**| Cores, Tipos e WCAG 2.2 AA | `/settings/branding`| `useAgencyBranding` | `agency_branding` | `settings.branding` | `settings.test.tsx` | COMPLETED | Nenhuma |
| **Permissões**| Permission Studio (5 Roles) | `/settings/permissions`| `useAgencyPermissions`| `roles`, `role_permissions` | `settings.security` | `settings.test.tsx` | COMPLETED | Nenhuma |
| **Equipe** | Gestão de Membros & Convites | `/settings/team` | `useAgencyTeam` | `agency_members`, `invitations` | `settings.team` | `settings.test.tsx` | COMPLETED | Nenhuma |
| **Diagnóstico**| Manifesto Auditado Fases 01-11 | `/settings/diagnostics`| `DiagnosticsPage` | Manifesto Técnico em Código | `system.diagnostics` | `settings.test.tsx` | COMPLETED | Nenhuma |
