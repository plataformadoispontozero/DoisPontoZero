# Prompt 17 — CREATIVE PRODUCTION

Data: 11/10/2026. Status: **BLOCKED_SECURITY**. Execução exclusivamente local.

Rotas: /production/design e /production/video planejadas, NÃO registradas.

## Implementação e inventário

Inventário identifica tasks, task_assignees, project_members, task_attachments, task_comments e histórico existentes. Não adicionar segundo gerenciador de tarefas.

## Banco, permissões e bloqueios

Antes de implementar, homologar tarefa/projeto/RLS/Storage. Versões e aprovações devem vincular o mesmo task_id e agency_id; especialidade não é RBAC. Pipeline configurável; formatos e metadados de vídeo não armazenam binários em PostgreSQL. Nenhuma migration executável preparada sem reconciliar contrato existente.

Nenhuma migration remota, SQL remoto, deploy, push, merge, DNS ou operação Meta realizada. Contrato remoto completo e histórico de migrations ainda não reconciliados. Não declarar COMPLETED.

## Testes, evidências e próxima ação

Consultar CODEX_OPERATIONAL_TESTS.md, PROMPT_17_INVENTORY.json e a story docs/stories/prompt-17-operational-recovery.md. Mocks comprovam somente frontend; teste real de integração desta capacidade: NOT_RUN. Preparação do staging em staging/README.md; homologar base antes da fase dependente.
