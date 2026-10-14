# Aurora Café — homologação e observações de operação

- [x] Cadastro fictício, briefing, estratégia e calendário no ambiente atual.
- [x] Pedido de ajuste, revisão, aprovação e produção simulados por funções canônicas.
- [x] Corrigir status na movimentação entre colunas, preservando autorização e histórico.
- [x] Pop-up central compartilhado para demandas.
- [x] Social Media geral e filtros opcionais; demandas por cliente.
- [x] Kanban por cliente nos três setores.
- [x] Artes de demonstração, apresentação, proposta e reunião vinculadas.
- [x] Testes backend, unitários, tipos e navegador com fixtures.
- [ ] Push e deploy confirmados.
- [ ] Aviso final no chat da equipe.

Não inclui upload Drive, anúncios Meta ou vídeo final; isso permanece explicitamente não testado.

Arquivos: TaskDetailPanel.tsx; DepartmentPage.tsx; SocialMediaPage.tsx e teste; useTasks.ts; types/projects.ts; taskGroups.ts e teste; move-status.database.test.ts; migration 20261014011725; PresentationPreview.tsx e teste; e2e/aurora-workflow.spec.ts; public/testes/aurora-cafe; docs/qa/aurora-cafe-cross-department-2026-10-14.md; esta story.

Relatório: ../qa/aurora-cafe-cross-department-2026-10-14.md.
Rollback: reverter o commit frontend; substituir move_task pela definição anterior se necessário. Nenhum dado real foi ajustado automaticamente pela migration. Manter os registros fictícios conforme autorização do usuário.
