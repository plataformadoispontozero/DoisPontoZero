# Prompt 17 — PAID TRAFFIC

Data: 11/10/2026. Status: **BLOCKED_EXTERNAL**. Execução exclusivamente local.

Rotas: /traffic e /clients/:clientId/traffic planejadas, NÃO registradas.

## Implementação e inventário

Não existem insights ou contas de anúncios sincronizadas. Nenhuma métrica exibida/inventada. Planejamento prioriza leitura; escrita em anúncios exige autorização própria.

## Banco, permissões e bloqueios

Depende de OAuth/ads_read, ativos autorizados e isolamento A/B. Sync server-side paginado, upsert por agency/client/account/external_id/data/nivel/janela; moeda/timezone/atribuição preservadas. Alcance não é soma; ausência é null/indisponível, não zero; ROAS somente com receita confiável e gasto positivo.

Nenhuma migration remota, SQL remoto, deploy, push, merge, DNS ou operação Meta realizada. Contrato remoto completo e histórico de migrations ainda não reconciliados. Não declarar COMPLETED.

## Testes, evidências e próxima ação

Consultar CODEX_OPERATIONAL_TESTS.md, PROMPT_17_INVENTORY.json e a story docs/stories/prompt-17-operational-recovery.md. Mocks comprovam somente frontend; teste real de integração desta capacidade: NOT_RUN. Preparação do staging em staging/README.md; homologar base antes da fase dependente.
