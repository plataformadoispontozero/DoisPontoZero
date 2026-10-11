# CHANGELOG DA AUDITORIA 15.1

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Correções efetivas

| Arquivo | Alteração | Validação |
|---|---|---|
| public/_redirects | remove catch-all /index.html 200 que gerava loop 100324; comentários do fallback nativo | build copia arquivo sem regra ativa; deploy não executado |
| src/lib/supabase/client.ts | health delega a consulta necessária; qualquer erro é falha operacional | Vitest 3 testes novos |
| src/lib/supabase/health.ts | isola classificação de resultado, timeout e cleanup; não presume schema válido por erro com code | PGRST205/42501/PGRST301, sucesso vazio e timeout |
| src/lib/supabase/health.test.ts | regressão de falso positivo e timer | 78/78 testes totais |
| src/app/router/index.tsx | /agenda redireciona para calendário existente | E2E três viewports |
| src/features/settings/PermissionStudioPage.tsx | desabilita salvamento sem backend e elimina toast de sucesso; RLS não homologada e matriz preview | E2E verifica disabled/badge; não certifica RBAC |
| .gitignore | .env.*, exceção .env.example, .wrangler e supabase/.temp | inspeção; não copia credenciais |
| package.json | scripts lint e typecheck com ferramentas já instaladas | ambos executados |
| e2e/app.spec.ts | escolhe shell visível no viewport em vez da primeira Matriz Criativa em sidebar oculta | E2E baseline responsivo |
| e2e/audit-routes.spec.ts | quinze entradas × três tamanhos + alias e bloqueio de sucesso simulado | smoke real no navegador, sem backend |
| playwright.audit.config.ts | build preview isolado em 127.0.0.1:4175, dois workers e evidências | evita servidor antigo ou porta ocupada |
| docs/PHASE_STATUS.json | fases em progresso, aceite real pendente, production_ready false; preserva historical_claims | build e diagnóstico E2E |

## Documentação e evidências

CODEX_MASTER_AUDIT, ARCHITECTURE_AUDIT, ROUTE_AUDIT, FEATURE_GAPS, SECURITY_AUDIT, TEST_REPORT, RECOVERY_ROADMAP e este CHANGELOG; DEPLOY_BLOCKERS_REPORT; story local; JSON/CSV e logs txt em docs/evidence. Evidências de screenshot são renderização local, sem dados de produção.

## Limites e risco remanescente

Não foram implementados Auth/RBAC, OAuth ou mutations remotas completas; os bloqueadores permanecem explícitos. Não houve mudança de SQL histórico, permissões remotas, DNS ou Cloudflare ativo. Todo diff está local e revisável. Não executar deploy dessa branch apenas porque os testes UI passaram.


## 11/10/2026 — Recovery 02

Provider Supabase Auth real, estados explícitos, guardas, deep links, seleção validada de agência, cache por usuário/tenant, shell sem Admin Demo público e Permission Studio com leitura real/salvamento bloqueado. Rotas públicas preservadas e propostas fictícias bloqueadas fora de demo explícita. Rotas carregadas sob demanda. Ajustes operacionais iniciados antes do Recovery 02 foram preservados. Sem alterações de migrations históricas ou operações remotas. Resultados e limites em RECOVERY_02_REPORT.md e RECOVERY_02_TESTS.md.
