# Reuniões: persistência operacional e isolamento
Status: Publicado — aceite externo pendente.

A auditoria encontrou três RPCs chamadas pelo frontend e ausentes no banco remoto. As policies antigas também usavam correlação incorreta com profiles.

- [x] Criar reunião com vínculos e participantes reais, atomicamente.
- [x] Persistir pauta, ata, decisões e ações, com controle de concorrência e proteção de ata finalizada.
- [x] Converter ação em tarefa no backlog real do projeto, uma única vez.
- [x] Isolar leitura por agência ativa e projeto; restringir writes aos RPCs autorizados.
- [x] Remover responsável fictício, tratar erros e navegação da conversão.
- [x] Testar autorização negativa, rollback, concorrência e idempotência; validar gates.

File list: supabase/migrations/20261013151719_meeting_operational_transactions.sql; src/features/meetings/hooks/useMeetings.ts; src/features/meetings/MeetingWorkspacePage.tsx; src/features/meetings/MeetingsPage.tsx; src/features/meetings/hooks/meetingTransactions.test.tsx; src/features/meetings/meeting-transactions.database.test.ts; docs/stories/meeting-operational-transactions.md.

Não são enviados e-mails, mensagens ou eventos ao Google. Testes locais não comprovam homologação de duas contas reais.

Validação local: 8 testes de reuniões passaram (4 PostgreSQL PGlite com SQL real + 4 UI/hooks), typecheck passou, lint sem erros com avisos legados. Nenhuma reunião/demanda real criada ou alterada. Migrations e smoke remoto por transação rollback serão coordenados pelo agente de release.

## Fechamento web em 14/10/2026

Implementação e testes revisados no pacote atual. Verificações de banco e limites externos: docs/qa/phase-closure-web-2026-10-14.md. Publicação registrada após o deploy; avisos antigos sobre migrations ainda ausentes são históricos.

Deploy confirmado: `0294b685-da52-43a8-8b97-2c40cd675b51`; commit `62e18ee`. Homologações humanas/externas permanecem explícitas no relatório atual.
