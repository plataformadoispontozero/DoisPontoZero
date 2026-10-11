# Correção do filtro de notificações — 11/10/2026

Status: Tested; publicação autorizada em andamento.

Problema: agência com login OWNER válido exibe alerta global no dashboard. Consultas e updates usam notifications.user_id, enquanto o contrato SQL/TypeScript define recipient_id.

- [x] Confirmar contrato remoto somente leitura com limit=0: recipient_id HTTP 200; user_id HTTP 400 / 42703; nenhum registro buscado.
- [x] Corrigir leitura, marcação individual e marcação de todas as notificações para recipient_id, mantendo filtro agency_id.
- [x] Teste de regressão intercepta contrato e exige destinatário correto após login; desktop/tablet/mobile 3/3 PASS.
- [x] Build, typecheck, lint (com avisos), 81/81 testes unitários e git diff --check PASS.
- [ ] Push e deploy do frontend no Worker existente.

Arquivos: src/features/notifications/hooks/useNotifications.ts, e2e/agency-access.spec.ts, docs/stories/notification-recipient-hotfix.md.

Não foram alterados dados, schema ou RLS do Supabase. O smoke público não valida sessão autenticada do usuário; atualização da tela autenticada precisa confirmar ausência do aviso. Outras falhas de consultas continuam visíveis.
