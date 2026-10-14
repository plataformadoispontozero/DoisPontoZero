# Kanban por cliente e copy completa de produção

## Solicitação
Um único card por cliente; movimentação de uma peça, de peças selecionadas ou de todo o grupo, também em Design e Videomaker. Criação de demanda com título, texto de apoio, CTA, legenda, hashtags, direção criativa e ângulo/enquadramento. Registrar a entrega técnica no diagnóstico sem inferir aceite humano.

## Checklist
- [x] Card único por cliente com etapas individuais e primeira etapa pendente como posição do grupo.
- [x] Arraste de cliente e demanda, seleção manual e atalhos por formato.
- [x] Movimentação transacional por seleção; permissões e histórico preservados.
- [x] Formulário completo para post, carrossel e vídeo, com lâminas/cenas e rolagem responsiva.
- [x] Conversão editorial preserva copy, direção, câmera e áudio; hashtags sugeridas derivadas do tema.
- [x] Diagnóstico registra validação técnica e mantém aceite operacional pendente.
- [x] Regressão, typecheck e lint.
- [x] Build e publicação confirmados.
- [ ] Aceite operacional do gestor na versão publicada.

## Arquivos
- src/features/projects/components/ClientKanbanBoard.tsx
- src/features/projects/components/creativeDemand.ts
- src/features/projects/components/creativeDemand.test.ts
- src/features/projects/components/CreateTaskDialog.tsx
- src/features/projects/components/parseDemandContent.ts
- src/features/projects/ProjectsPage.tsx
- src/features/production/DepartmentPage.tsx
- src/features/tasks/hooks/useTasks.ts
- src/features/editorial/EditorialPieceEditor.tsx
- src/features/editorial/monthlyPlanner.ts
- src/features/editorial/campaignEngine.ts
- src/features/projects/management-workflow.database.test.ts
- supabase/migrations/20261014130519_client_group_moves_and_creative_demands.sql
- e2e/aurora-workflow.spec.ts
- docs/RELEASE_STATUS.json
- docs/qa/client-kanban-creative-demands-2026-10-14.md
- docs/stories/client-kanban-creative-demands.md
