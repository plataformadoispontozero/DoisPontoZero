# Auditoria e dry run dos briefings legados

## Escopo autorizado

Pedido completo em anexo de 12/10/2026 exige começar somente pela auditoria/dry run e apresentar relatório antes de confirmar piloto/migração definitiva. Lovable é origem somente leitura. Não executar migração total nem publicar dados automaticamente.

## Critérios e checklist

- [x] Descobrir estruturas reais por information_schema e SELECT, sem assumir nomes.
- [x] Contabilizar 23 briefings, 554 históricos, 0 task_briefings, 326 textos de demanda e 91 contextos de estratégia.
- [x] Auditar destino existente (23 snapshots e 0 formulários nativos); reutilização proposta sem tabela duplicada.
- [x] Gerar mapeamento de todas as 64 colunas, relações, datas/status e responsabilidades pendentes.
- [x] Backups sanitizados privados fora de Git; mapas cliente/usuário e relatório dry run.
- [x] Reconciliação 23 = 23 idênticos; 554 relacionados sem órfãos; 4 usuários pendentes.
- [x] Scripts offline sem conexão/escrita em banco, recusando modo migrate.
- [x] Testes de cliente incorreto/ausente, duplicação, divergência, sanitização e bloqueio de migração.
- [x] Typecheck passou na árvore corrente.
- [ ] Apresentar relatório ao usuário e obter confirmação para piloto (não pedido de aprovação técnica inventado: instrução explícita do usuário).
- [ ] Testar piloto visual autenticado e acesso remoto a anexos (não disponível/executado nesta fase).
- [ ] Revisar RLS nativo e esquema de histórico antes de qualquer materialização.

## Arquivos

- docs/BRIEFING_MIGRATION_MAP.md
- scripts/migrate-briefings/audit.mjs
- scripts/migrate-briefings/source-audit.sql
- scripts/migrate-briefings/target-audit.sql
- src/features/clients/briefingMigration.test.ts
- package.json (comandos briefing:audit/export/dry-run/verify)
- Backups fora do repo: /Users/designer/Documents/Codex/2026-10-12/briefing-audit/

## Evidência e limites

4 testes unitários passaram; typecheck passou. Somente SELECTs executados na fonte e destino. Relatório identifica RLS nativo de leitura por membership de agência mais amplo que autorização por cliente solicitada. Usuários não foram criados/remapeados automaticamente. 554 linhas prontas apenas para revisão de relação; não importadas. Verificação offline compara backups capturados, não declara acesso autenticado ao browser nem arquivos Drive válidos. @devops controla push/deploy das funcionalidades separadas; esta fase não realiza importação definitiva.

## Backup adicional fornecido

- [x] Inspecionado backup-agencia-2026-10-12.json de 8 MB, sem copiar arquivo bruto para Git.
- [x] Reconciliados 29 clientes/23 briefs/102 calendários/326 demandas: sem novos briefings; 1 calendário ausente frente aos 103 da origem.
- [x] Conteúdos presentes são idênticos após sanitização; histórico de 554 alterações não incluído no arquivo.
- [x] Detectados 148 nomes de campos sensíveis; nenhuma string binária data:base64; nenhum valor sensível impresso.
- [x] Relatório de reconciliação privado salvo fora do repositório; zero writes em banco.
