# Kanban Geral exclusivo da gestão — aceite técnico

Escopo: fechar esta pendência primeiro; os demais módulos permanecem em suas próprias fases. Aurora Café é a referência fictícia. Nenhum aceite humano será inferido a partir de testes.

- [x] Auditar acesso global de OWNER/ADMIN/MANAGER e bloqueio de profissionais.
- [x] Corrigir a visibilidade de projetos para gestores sem associação individual.
- [x] Paginar o quadro sem ocultar silenciosamente demandas após 500 registros.
- [x] Grupos por cliente, filtros, responsáveis, prazos e ações de etapa.
- [x] Atualizar o agregado depois de alterar/arquivar demanda no pop-up.
- [x] Testar backend positivo/negativo com rollback e navegador desktop/celular.
- [ ] Atualizar diagnóstico, push, deploy e conferir produção.

Aceite operacional: gestor deve usar o quadro na rotina real; a implementação técnica não substitui esse aceite.

## Arquivos

- src/features/projects/ProjectsPage.tsx
- src/features/projects/components/TaskDetailPanel.tsx
- src/features/tasks/hooks/useTasks.ts
- src/features/projects/management-workflow.database.test.ts
- supabase/migrations/20261014120657_management_kanban_workflow.sql
- e2e/aurora-workflow.spec.ts
- src/features/settings/ReleaseDiagnostics.tsx
- src/features/settings/releaseEvidence.ts
- docs/RELEASE_STATUS.json
- docs/qa/management-kanban-2026-10-14.md
- docs/stories/management-kanban-acceptance.md
