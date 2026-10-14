# Notificações operacionais persistentes
Status: Local verified — aplicação remota e release aguardam gate combinado.

A plataforma tinha cinco sons e detecção local de novos clientes/calendários, mas esses eventos não geravam registros no histórico. Sem a página aberta não existia aviso persistente desses acontecimentos.

- [x] Gerar notificações de calendário aprovado/ajustes/produção, novo cliente e tarefa em produção por transições reais no servidor.
- [x] Destinatários ativos e autorizados, gestores e responsáveis realmente vinculados; sem adivinhar atribuições.
- [x] Feedback público notifica a agência; imports de serviço e ações próprias não geram ruído.
- [x] Não duplicar triggers existentes nem som local com som de registro persistente.
- [x] Histórico abre campanha/tarefa/cliente corretos e preserva cinco categorias sonoras.
- [x] Testes de SQL real, ausência de duplicatas, suspensão/tenant e rollback; gates locais.

File list: supabase/migrations/20261014060740_operational_event_notifications.sql; src/features/notifications/NotificationSoundController.tsx; src/features/notifications/NotificationSoundController.test.tsx; src/features/notifications/notificationSounds.ts; src/features/notifications/notificationSounds.test.ts; src/features/notifications/notificationHistory.ts; src/features/notifications/notificationHistory.test.ts; src/features/notifications/operational-events.database.test.ts; src/types/notifications.ts; docs/stories/operational-event-notifications.md.

Não implementa entrega push com aplicativo fechado, SMTP nem chamadas externas. Nenhuma notificação real enviada na implementação.

Verificação local: 9 testes em 5 arquivos passaram, incluindo 4 testes PostgreSQL PGlite executando a migration real; typecheck passou; lint exit0 com avisos legados. Repetição de updates, tenant, usuário suspenso, falta de permissão, ausência de vínculo de projeto, rollback e ACL dos helpers foram exercitados. Leitura inicial não toca sons históricos; novos registros da própria conta tocam uma vez. Nenhuma notificação real foi enviada; smoke remoto deve executar e desfazer fixtures em transação.

## Fechamento web em 14/10/2026

Implementação e testes revisados no pacote atual. Verificações de banco e limites externos: docs/qa/phase-closure-web-2026-10-14.md. Publicação registrada após o deploy; avisos antigos sobre migrations ainda ausentes são históricos.
