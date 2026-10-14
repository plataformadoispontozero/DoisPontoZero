# Fechamento de RPCs legadas sem autorização
Status: In Progress

Auditoria remota identificou ranking de squads, escrita de snapshots de performance e progresso de projetos como SECURITY DEFINER sem guardas de sessão/tenant. Os bodies remotos correspondem aos arquivos históricos: hashes MD5 normalizados 04da46fee9cd6a4f2760a2bc5a42468e, 8e23cb73de5625a146c59beb4b8c68f4 e d4bc999fcda194c978a649079650f38d. MD5 aqui é comparação de conteúdo, não mecanismo de segurança.

- [ ] Preservar implementações/resultados antigos em schema privado, sem DROP/CASCADE.
- [ ] Revogar acesso direto dos clientes às implementações antigas; wrappers públicos invoker e helpers guardados.
- [ ] Exigir agência/membership ativos, squads.view_ranking/squads.manage_perf e projects.view + acesso real ao projeto.
- [ ] Testar OWNER/admin permitido, outsider/anônimo/suspenso/revogado negado, projeto privado e ausência de bypass.
- [ ] Validar testes, typecheck e lint; aplicação remota pelo agente de release.

File list: supabase/migrations/20261014054349_guarded_operational_rpc_access.sql; src/features/squads/guarded-operational-rpc.database.test.ts; docs/stories/guarded-operational-rpc-access.md.

Nenhum snapshot ou tarefa real foi alterado. Testes locais executam SQL real em PGlite. Validação remota deve usar rollback.

## Fechamento web em 14/10/2026

Implementação e testes revisados no pacote atual. Verificações de banco e limites externos: docs/qa/phase-closure-web-2026-10-14.md. Publicação registrada após o deploy; avisos antigos sobre migrations ainda ausentes são históricos.
