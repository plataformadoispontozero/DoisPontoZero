# Retirar a área de Propostas

Pedido de 14/10/2026: retirar completamente o módulo da aplicação e reparar os caminhos antigos. Substitui a melhoria de PDF de propostas; o trabalho de apresentações continua válido.

- [x] Remover páginas, hooks, editor, modelos, catálogo, geração PDF e visualização pública de propostas do frontend.
- [x] Retirar menu e agrupamento comercial, cartão de portal e permissões oferecidas pela interface.
- [x] Rotas /proposals/* redirecionam ao dashboard; /p/* apresenta aviso público sem consultar token ou proposta.
- [x] Dashboard conta calendários em aprovação; não consulta mais propostas.
- [x] Retirar a fase comercial da lista de módulos ativos no diagnóstico, preservando o manifesto histórico.
- [x] Preservar tabelas, registros e histórico no banco; nenhuma migration destrutiva.
- [x] Typecheck, lint, 349 testes de regressão e 16 casos de navegador aprovados.
- [x] Push f7bebb9, deploy 1a7772bb-d692-4d91-a23d-f8a5fc3a4375 e conferência do bundle publicado.

Arquivos: src/features/proposals/ (removido), src/types/proposals.ts (removido), src/features/clients/components/ClientProposalsTab.tsx (removido), src/features/retired/RetiredProposalPage.tsx; src/app/router/{index.tsx,router.test.tsx}; src/components/navigation/{NavLinks.ts,navigationConfig.ts}; src/features/auth/access.ts; src/app/layouts/AppLayout.tsx; src/features/dashboard/data/useDashboardData.ts; src/features/settings/{ClientExperiencePage.tsx,PermissionStudioPage.tsx,DiagnosticsPage.tsx,hooks/useAgencySettings.ts}; src/features/briefing/templates/BriefingTemplateEditorPage.tsx; src/types/briefing.ts; e2e/{agency-access.spec.ts,audit-routes.spec.ts,critical-flows.spec.ts,platform-readiness.spec.ts}.

As alterações anteriores de PermissionStudio e Diagnostics permanecem fora desta entrega; apenas as linhas de retirada do módulo são incluídas.

Arquivos de evidência adicionais: src/components/navigation/Navigation.test.tsx; e2e/aurora-workflow.spec.ts; docs/qa/remove-proposals-2026-10-14.md.
