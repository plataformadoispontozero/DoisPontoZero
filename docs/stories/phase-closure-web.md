# Fechamento por fases da plataforma web

Solicitado em 14/10/2026. Referência: Aurora Café — TESTE FICTÍCIO. Escopo de colaboração confirmado: chat, presença e acesso às reuniões. Configurações reais verificadas com rollback.

- [x] Auditar pendências e distinguir implementação, publicação e aceite externo.
- [x] Fases 01/02: regressão de shell/auth; matriz com gravação, OWNER protegido e revogação no servidor.
- [x] Fases 03–07: regressão de clientes, produção, squads, briefings e editorial; ranking/progresso e permissões de Estratégia protegidos.
- [x] Fase 09: regressão de apresentações/PDF e Meta; publicar seleção de material Drive no chat com validação de escopo.
- [x] Fase 10: reunião/ata/decisão/ação/tarefa transacionais; salas/presença/acesso a reuniões e notificações persistentes.
- [x] Fase 11: Configurações carregam dados reais, contatos/identidade/preferências com gravação atômica; registros ausentes inicializados.
- [x] Fase 05: aniversário automático respeitando fuso, duplicação anual e acesso privado; execuções no servidor verificadas.
- [x] Fase 12: gates de segurança, scopes/ACLs e regressão final incluindo 18 páginas de Configurações nos dois viewports.
- [ ] Publicação e conferência do domínio/bundles.

## Limites de aceite

Conta de anúncios Aurora ainda não vinculada; leitura Meta real depende da autorização. Drive privado, SMTP e uso simultâneo por dois membros requerem sessões/conexões reais. Proteção de senhas vazadas desativada no Auth; configuração externa não alterável pelas ferramentas disponíveis. Backups devem ser restaurados em ambiente isolado antes do aceite correspondente. Apps nativos assinados e áudio/vídeo nas salas fora do escopo web confirmado.

Evidência detalhada, versões de migrations e resultados: docs/qa/phase-closure-web-2026-10-14.md. `production_ready` permanece falso; nenhum dado da fonte Lovable foi alterado.

## Arquivos

Lista do pacote registrada no commit de implementação: hooks e páginas de Auth/Chat/Reuniões/Notificações/Configurações, testes relacionados, tipos, Google Workspace/chatDrive, migrations de permissões/configurações/aniversários/ACLs, manifesto de fases e relatório de QA. Arquivos de auditorias antigas e artefatos locais da CLI não pertencem ao pacote.

Lista detalhada:

- docs/PHASE_STATUS.json
- docs/PHASE_STATUS.md
- docs/RELEASE_STATUS.json
- e2e/aurora-workflow.spec.ts
- src/features/auth/AuthPage.tsx
- src/features/chat/ChatPage.tsx
- src/features/chat/WorkRooms.tsx
- src/features/chat/chat.selectors.test.tsx
- src/features/chat/hooks/useChat.ts
- src/features/meetings/MeetingWorkspacePage.tsx
- src/features/meetings/MeetingsPage.tsx
- src/features/meetings/hooks/meetingTransactions.test.tsx
- src/features/meetings/hooks/useMeetings.ts
- src/features/notifications/NotificationSoundController.tsx
- src/features/notifications/notificationHistory.test.ts
- src/features/notifications/notificationHistory.ts
- src/features/notifications/notificationSounds.test.ts
- src/features/notifications/notificationSounds.ts
- src/features/settings/AgencySettingsPage.tsx
- src/features/settings/ClientExperiencePage.tsx
- src/features/settings/DiagnosticsPage.tsx
- src/features/settings/DocumentBrandingPage.tsx
- src/features/settings/IntegrationsCenterPage.tsx
- src/features/settings/PermissionStudioPage.tsx
- src/features/settings/SecurityCenterPage.tsx
- src/features/settings/WhiteLabelStudioPage.tsx
- src/features/settings/WorkspacePreferencesPage.tsx
- src/features/settings/hooks/useAgencySettings.ts
- src/features/settings/releaseEvidence.test.ts
- src/features/settings/releaseEvidence.ts
- src/features/settings/settings.test.tsx
- src/types/chat.ts
- src/types/notifications.ts
- src/types/whitelabel.ts
- supabase/functions/google-workspace/index.ts
- docs/qa/phase-closure-web-2026-10-14.md
- docs/stories/chat-drive-attachments.md
- docs/stories/guarded-operational-rpc-access.md
- docs/stories/integrations-context-hardening.md
- docs/stories/meeting-operational-transactions.md
- docs/stories/operational-event-notifications.md
- docs/stories/permission-studio-completion.md
- docs/stories/phase-closure-web.md
- docs/stories/phase-evidence-reconciliation.md
- src/features/auth/active-access.database.test.ts
- src/features/chat/ChatDriveAttachments.test.tsx
- src/features/chat/ChatDriveAttachments.tsx
- src/features/chat/chat-drive.database.test.ts
- src/features/chat/chat-permissions.database.test.ts
- src/features/chat/chatDrive.test.ts
- src/features/meetings/legacy-conversion.database.test.ts
- src/features/meetings/meeting-transactions.database.test.ts
- src/features/notifications/NotificationSoundController.test.tsx
- src/features/notifications/operational-events.database.test.ts
- src/features/settings/IntegrationsCenterPage.test.tsx
- src/features/settings/PermissionStudioPage.test.tsx
- src/features/settings/agency-identity.database.test.ts
- src/features/settings/birthday-job.database.test.ts
- src/features/settings/permission-studio.database.test.ts
- src/features/squads/guarded-operational-rpc.database.test.ts
- src/features/strategy/strategy-access.database.test.ts
- src/features/strategy/strategy-policies.database.test.ts
- supabase/functions/google-workspace/chatDrive.ts
- supabase/migrations/20261013151444_permission_studio_transaction.sql
- supabase/migrations/20261013151719_meeting_operational_transactions.sql
- supabase/migrations/20261014054349_guarded_operational_rpc_access.sql
- supabase/migrations/20261014054352_disable_legacy_meeting_conversion.sql
- supabase/migrations/20261014060449_active_access_helpers.sql
- supabase/migrations/20261014060734_chat_drive_attachments.sql
- supabase/migrations/20261014060740_operational_event_notifications.sql
- supabase/migrations/20261014061123_strategy_access_and_retired_proposal_rpcs.sql
- supabase/migrations/20261014061507_agency_identity_atomic_settings.sql
- supabase/migrations/20261014061603_initialize_missing_agency_settings.sql
- supabase/migrations/20261014061827_scheduled_member_birthdays.sql
- supabase/migrations/20261014101946_chat_permission_revocation.sql
- supabase/migrations/20261014101950_authenticated_operational_function_acls.sql
- supabase/migrations/20261014102539_strategy_catalog_permission_gates.sql
