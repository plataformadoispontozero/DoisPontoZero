# Fase 06 — controles globais da sala

Pré-requisito: aceite explícito da Fase 05 em 15/10/2026.
Escopo: COMMAND 06 do documento do usuário. Reutilizar OfficeVoiceProvider, OfficeVoiceSession e RoomAudioRenderer, sem nova conexão ou alterações no banco.

- [x] Registrar homologação da Fase 05.
- [x] Barra global na estrutura autenticada, acima da navegação mobile.
- [x] Sala, estado, fala, microfone, saída, desbloqueio de áudio e atalho.
- [x] Flag própria, ativada somente no ambiente de homologação.
- [x] Dez transições, histórico, troca com falha, nova sessão e logout em testes controlados.
- [x] Regressão completa, tipos, lint e layout desktop/celular. Build verificado na publicação.
- [x] Publicar e conferir arquivos de homologação.
- [ ] Validação humana de áudio contínuo e aceite final; não iniciar Fase 07.

## Arquivos

- .env.example
- src/features/office/OfficeMiniBar.tsx
- src/features/office/OfficeMiniBar.test.tsx
- src/features/office/officeFeature.ts
- src/features/office/OfficeVoiceProvider.test.tsx
- src/features/office/voiceSession.test.ts
- src/features/office/OfficeOverview.tsx
- src/features/office/OfficePhaseStatus.tsx
- src/app/layouts/AppLayout.tsx
- e2e/fixtures/office-controls.html
- e2e/fixtures/office-controls.tsx
- e2e/office-controls.spec.ts
- playwright.office-controls.config.ts
- docs/office/PHASE_STATUS.json
- docs/RELEASE_STATUS.json
- docs/stories/office-phase05.md
- docs/stories/office-phase06.md
- docs/qa/office-phase05-2026-10-14.md
- docs/qa/office-phase06-2026-10-15.md
