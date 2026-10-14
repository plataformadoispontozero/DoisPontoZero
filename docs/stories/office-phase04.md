# Escritório Digital — Fase 04

## Escopo
Backend seguro de tokens após homologação da Fase 03. Reutiliza Supabase Edge Functions, Auth e autorização de salas da Fase 02. Sem chamadas no frontend, dispositivos, mídia ou novas rotas de voz.

## Checklist
- [x] JWT verificado no servidor por auth.getUser.
- [x] Identidade, agência, sala, squad, habilitação e namespace resolvidos no banco.
- [x] SDK oficial LiveKit 2.19.1 pinado, Deno lock e TTL de 120 segundos.
- [x] Grants restritos à sala e microfone; sem administração, gravação, dados, câmera/tela.
- [x] Limite atômico de dez emissões por usuário/agência a cada 60 segundos; contador privado.
- [x] CORS restrito, payload limitado, no-store, erros e logs sem segredos.
- [x] Ausência de secrets retorna 503; exemplos vazios e instruções de configuração segura.
- [x] Oito testes Deno com assinatura real do SDK e quatro testes novos de SQL/RLS.
- [x] Cinco testes HTTP no endpoint publicado; SQL remoto verificado com rollback.
- [x] 449 testes de regressão, typecheck, lint, build e dois diagnósticos desktop/celular aprovados.
- [x] Diagnóstico publicado e comparado ao build; Edge Function v1 publicada e testada.
- [x] Configuração real LiveKit e emissão autenticada no ambiente real.
- [x] Homologação pelo responsável confirmada após teste real; Fase 05 disponível, sem iniciar.

## Arquivos
- .env.example
- supabase/config.toml
- supabase/functions/office-room-token/index.ts
- supabase/functions/office-room-token/handler.ts
- supabase/functions/office-room-token/issuer.ts
- supabase/functions/office-room-token/handler_test.ts
- supabase/functions/office-room-token/deno.json
- supabase/functions/office-room-token/deno.lock
- supabase/migrations/20261014195239_office_phase04_voice_token.sql
- src/features/office/officeDatabase.fixture.ts
- src/features/office/office-data.database.test.ts
- src/features/office/office-voice.database.test.ts
- src/features/office/OfficePhaseStatus.tsx
- src/features/chat/hooks/useRoomPresence.ts (dependências do effect explicitadas)
- e2e/aurora-workflow.spec.ts
- docs/office/PHASE_STATUS.json
- docs/office/LIVEKIT_SETUP.md
- docs/stories/office-phase04.md
- docs/qa/office-phase04-2026-10-14.md
