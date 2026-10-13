# Estratégia: contexto do cliente e exclusão protegida

Responsáveis: @po critérios; @dev implementação; @qa validação; @devops publicação.

## Critérios
- [x] Selecionar cliente importa cadastro e briefing nativo, com origem visível e edição humana preservada.
- [x] Trocar cliente limpa informações anteriores e rejeita respostas atrasadas.
- [x] Exclusão individual pede confirmação e valida agência, permissão e dependências no servidor.
- [x] Estratégias com calendário, proposta, material aprovado ou tarefa são preservadas.
- [x] Testes e gates executados.

Validação local: 15 testes específicos passaram; typecheck e lint sem erros. Publicação global por @devops após ROOT_READY.

## Arquivos
- src/features/strategy/NewStrategyPage.tsx
- src/features/strategy/StrategyPage.tsx
- src/features/strategy/hooks/useStrategy.ts
- src/features/strategy/NewStrategyPage.test.tsx
- src/features/strategy/strategy-delete.database.test.ts
- supabase/migrations/20261013000947_strategy_delete_guard.sql
- src/features/strategy/StrategyPage.test.tsx

## QA Results
- PASS: cadastro/briefing nativo, preservação de edição humana, troca de cliente e confirmação individual.
- PASS: 10 testes SQL de autorização, tenant, dependências atuais/históricas e referências JSON; 5 testes UI.
- PASS: rollback no Supabase com papel authenticated; exclusão temporária e isolamento validados, nenhum dado de teste persistido.
- Migration aplicada: `20261013000947_strategy_delete_guard.sql`.
- Status: Ready for Review; publicação global em andamento.

## Publicação
Push/deploy concluídos: commit `7d11ad7`, Cloudflare `eb1f3cce-8a57-4363-988b-7a7b03665100`, bundle público `index-DkveCMNt.js` confirmado. Validação documentada em `docs/qa/strategy-editorial-work-rooms-2026-10-13.md`.
