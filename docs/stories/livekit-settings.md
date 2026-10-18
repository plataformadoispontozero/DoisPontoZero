# LiveKit — configuração segura pela plataforma

## Escopo
Complemento solicitado pelo usuário à Fase 04: cadastrar credenciais na área de configurações, sem enviá-las pelo chat. Reutiliza criptografia, autenticação e armazenamento de integrações; sem chamadas de mídia.

## Checklist
- [x] Página e cartão de integração, somente administração.
- [x] URL e chaves criptografadas por agência; senha mascarada e removida dos campos após envio.
- [x] Backend valida sessão, OWNER/ADMIN e settings.edit; sem retorno de keys.
- [x] URLs LiveKit Cloud permitidas; customização apenas server-side.
- [x] Teste de conexão consulta ListRooms sem criar salas ou ativar dispositivos.
- [x] Emissor usa configuração da agência; testes do SDK continuam passando.
- [x] Testes de API/criptografia, UI, SQL e endpoint real.
- [x] 452 testes de regressão, tipos, lint, build e dois testes de navegador aprovados.
- [x] Publicação final conferida: HTML e bundle do formulário iguais ao build.
- [x] Usuário cadastra credenciais reais e testa a conexão.
- [x] Teste final de emissão real e homologação da Fase 04.

## Arquivos
- src/app/router/index.tsx
- src/features/settings/IntegrationsCenterPage.tsx
- src/features/settings/LivekitSettingsPage.tsx
- src/features/settings/LivekitSettingsPage.test.tsx
- src/features/office/livekit-settings.database.test.ts
- src/features/office/OfficePhaseStatus.tsx
- supabase/functions/_shared/livekitConfig.ts
- supabase/functions/livekit-config/index.ts
- supabase/functions/livekit-config/index_test.ts
- supabase/functions/livekit-config/deno.json
- supabase/functions/livekit-config/deno.lock
- supabase/functions/office-room-token/index.ts
- supabase/functions/office-room-token/handler.ts
- supabase/config.toml
- supabase/migrations/20261014204158_livekit_settings_encrypted.sql
- e2e/aurora-workflow.spec.ts
- docs/office/LIVEKIT_SETUP.md
- docs/qa/office-phase04-2026-10-14.md
- docs/stories/livekit-settings.md

## Teste autenticado complementar
- [x] Botão explícito, JWT/role/permissões atuais, emissor publicado e validação LiveKit.
- [x] Sala privada temporária, limpeza confirmada e audit sem chaves/tokens.
- [x] Testes de backend e UI.
- [x] Resultado real registrado e homologação da Fase 04.
Arquivos adicionais: supabase/functions/livekit-config/testToken.ts; supabase/functions/livekit-config/testToken_test.ts.
