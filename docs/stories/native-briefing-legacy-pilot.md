# Piloto de briefing histórico nativo — um cliente

## Escopo autorizado
Um briefing de Ambience, com seu histórico, passa das referências legadas para as estruturas nativas de briefing. A origem permanece somente leitura. Nenhuma pessoa, aprovação atual, link público, produção ou demanda é criada automaticamente.

## Contrato
`private.import_legacy_briefing(p_agency uuid,p_client uuid,p_source_id uuid,p_history jsonb default '[]')` executável somente por `service_role`. Restrito aos IDs do piloto autorizado. Retorna `{briefing_id,already_imported,answers,versions}`.

Lê o snapshot sanitizado existente em `client_legacy_records`, valida agência/cliente/origem, datas e status e ordena 54 campos em seis seções semânticas. Cada valor JSON original é preservado, incluindo booleano e nulos. Histórico é validado por briefing/cliente, ordenado por data e armazenado em `briefing_versions.snapshot.legacy_history`; a última versão guarda `legacy_snapshot`.

## Critérios
- [x] Metadados source_system/project/id/status/dates/snapshot sem promover status histórico a aprovação atual.
- [x] Criado/atribuído a pessoa permanece NULL; revisão e atribuição pendentes explícitas.
- [x] Fonte UUIDs originais somente em metadados, sem criar usuários.
- [x] Unicidade e bloqueio transacional impedem duplicações; conflito rejeita alterações de origem.
- [x] Repetição não sobrescreve edição humana na plataforma.
- [x] Restrictive SELECT protege briefing/respostas/versões mesmo com antigas políticas FOR ALL.
- [x] Falha de histórico reverte template, perguntas, respostas, briefing e versões.
- [x] Testes PGlite de idempotência, tipos, mapping, conflito, rollback e permissões.
- [x] Aplicar migration e executar piloto duas vezes via root/DevOps, verificando contagens.

## Arquivos
- `supabase/migrations/20261012151609_native_briefing_legacy_pilot.sql`
- `src/features/briefing/legacy-briefing-pilot.database.test.ts`

## Validação
Quatro testes de PostgreSQL local executam a migration real contra tabelas mínimas e valores fictícios. O piloto produtivo e a conferência de 54 respostas/19 versões são separados, coordenados pelo root. Sem acesso de escrita ao sistema de origem.

## Evidências remotas
- Migração canonical `20261012151609` aplicada. Piloto executado duas vezes: mesmo briefing, 54 respostas e 19 versões (18 histórico); segunda execução `already_imported=true`.
- Snapshot/datas iguais e zero valores JSON divergentes. Draft com revisão pendente, autor/atribuição/aprovação NULL. RPC de importação negada a authenticated; advisors sem novos avisos.
- Três E2E de respostas booleanas, banner histórico e versões passaram com backend simulado em desktop/tablet/mobile; não constituem leitura visual real do cadastro. Sem arquivos de backup versionados.

- Gates: 255 testes em 63 arquivos, lint e build aprovados. CodeRabbit indisponível.
