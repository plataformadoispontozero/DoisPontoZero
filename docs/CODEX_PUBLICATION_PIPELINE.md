# Prompt 17 — PUBLICATION PIPELINE

Data: 11/10/2026. Status: **BLOCKED_EXTERNAL**. Execução exclusivamente local.

Rotas: Calendário editorial existente; publicação externa NÃO implementada.

## Implementação e inventário

Não há fila persistente nem executor Meta. Nenhum post real criado. A interface editorial atual não prova publicação na Meta.

## Banco, permissões e bloqueios

Depende de staging, tokens seguros, ativos/permissões aprovados e Storage privado homologado. Estado DRAFT→IN_REVIEW→APPROVED→SCHEDULED→PUBLISHING→PUBLISHED/FAILED/CANCELLED. Worker de fila deve revalidar tenant/cliente/aprovação, usar idempotência por job/ativo, controlar lease/retry/backoff/cancelamento e persistir external ID. Falhas ambíguas exigem reconciliação antes de reenviar. Nenhum setTimeout de browser como scheduler real.

Nenhuma migration remota, SQL remoto, deploy, push, merge, DNS ou operação Meta realizada. Contrato remoto completo e histórico de migrations ainda não reconciliados. Não declarar COMPLETED.

## Testes, evidências e próxima ação

Consultar CODEX_OPERATIONAL_TESTS.md, PROMPT_17_INVENTORY.json e a story docs/stories/prompt-17-operational-recovery.md. Mocks comprovam somente frontend; teste real de integração desta capacidade: NOT_RUN. Preparação do staging em staging/README.md; homologar base antes da fase dependente.
