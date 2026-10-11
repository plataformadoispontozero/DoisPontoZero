# Prompt 17 — recuperação incremental

Status: IN_PROGRESS. Não fazer push, deploy, merge, DNS ou SQL remoto.

| Etapa | Dependência | Arquivos/entidades | Risco | Aceite e testes |
|---|---|---|---|---|
| A — inventário e segurança | export de metadados e staging | Auth/access, diagnostics, inventário | P0 RLS/RPC | sessão, A/B, membership, Storage e funções reais |
| B — Equipe | memberships existentes; RPC segura para escrita | team, useAgencyTeam, roles | privilégio/último OWNER | leitura, rota direta, convite/alteração confirmados no servidor |
| C — Design e Vídeo | A, modelos de tarefas e Storage homologados | tasks, projects, versões/aprovações | arquivos privados/transações parciais | tarefa única vinculada à entrega, upload/revisão/persistência real |
| D — Meta | A, aplicativo, secret backend, revisão | backend OAuth, conexões e ativos | token/CSRF/tenant | callback, state uso único, revogação, contas de teste |
| E — Tráfego | D capacidade ads_read | insights, sync e Client Hub | atribuição/isolamento | paginação, moeda, timezone, dados ausentes e cliente A/B |
| F — Publicação | D + aprovação + fila persistente | editorial, jobs/attempts | publicação duplicada | idempotência, retry/cancelamento e teste externo autorizado |
| G — Client Hub | contratos C/E/F | abas existentes CRM | troca de cliente/cache | client_id autorizado em URL e consulta, reload/troca |
| H — homologação | fases anteriores | testes e release gate | falso PASS | evidências locais separadas de integração real |

Checklist:
- [x] Inventário de rotas e tabelas locais.
- [x] Recuperar diretório Equipe a partir dos vínculos reais, sem novo cadastro redundante.
- [x] Bloquear mudança insegura de papel; revogação exige resultado confirmado.
- [x] Menu desktop/drawer respeita permissões; rotas têm guard independente.
- [ ] Homologar RLS/RPC/Storage e histórico remoto em staging.
- [ ] Profissões, especialidades, disponibilidade, carga e escrita de Equipe.
- [ ] Produção, Meta, tráfego e publicação reais — dependências ainda bloqueadas.
- [x] Regressão de navegador concluída e relatórios finais atualizados (45 + 84; APIs controladas/demo local, não RLS).

Lista de arquivos: src/features/team/TeamDirectoryPage.tsx; src/features/settings/hooks/useAgencySettings.ts; src/features/settings/TeamManagementPage.tsx; src/features/auth/access.ts; src/features/auth/access.test.ts; src/app/router/index.tsx; src/components/navigation/{NavLinks.ts,Sidebar.tsx,MobileNav.tsx,Navigation.test.tsx}; e2e/agency-access.spec.ts; docs/PROMPT_17_*.json; docs/CODEX_{TEAM_RECOVERY,CREATIVE_PRODUCTION,META_INTEGRATION,PAID_TRAFFIC,PUBLICATION_PIPELINE,OPERATIONAL_TESTS,RELEASE_GATE}.md; docs/PHASE_STATUS.json; esta story.

Arquivos adicionais: staging/{README.md,frontend.env.example}; supabase/pending/prompt17_member_role.sql (DRAFT, NOT_RUN).

Teste adicional: src/features/team/team-security.test.tsx. Checks finais: 92 unitários, 45 E2E de acesso e 84 E2E locais PASS; typecheck/build/lint/diff PASS (lint com avisos).
