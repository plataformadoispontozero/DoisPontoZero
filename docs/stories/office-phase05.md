# Fase 05 — Salas de voz, microfone desligado ao entrar

Reutiliza sessão autenticada, permissões por agência/sala, office_directory, office_configure_room, emissor office-room-token e histórico do Chat. Escopo COMMAND 05 do documento do responsável.

- [x] SDKs oficiais compatíveis e versões fixas.
- [x] Conexão controlada acima das páginas e um renderizador oficial de áudio remoto.
- [x] Entrada explícita; microfone e câmera sem captura na entrada.
- [x] Controle de microfone, saída, participantes, indicação de fala, qualidade e reconexão.
- [x] Tratamento de acesso recusado, autoplay, troca/cancelamento e logout/revogação.
- [x] Habilitação de sala existente pelo RPC autorizado da Fase 02; nenhum schema novo.
- [x] Regressão (461 testes), typecheck, lint e build; oito cenários de navegador.
- [x] Publicação do ambiente separado de homologação e conferência de headers.
- [x] Teste de voz com dois membros relatado pelo usuário no Safari e Google Chrome; captura confirma dois participantes.
- [x] Conferência real da presença global após correção da reconexão, confirmada pelo responsável em 15/10/2026.
- [ ] Aceite explícito do responsável; Fase 06 bloqueada até homologação.

## Arquivos
- package.json e package-lock.json
- public/_headers
- src/app/providers/AppProviders.tsx
- src/features/office/voiceSession.ts e voiceSession.test.ts
- src/features/office/OfficeVoiceContext.ts
- src/features/office/OfficeVoiceProvider.tsx e OfficeVoiceProvider.test.tsx
- src/features/office/OfficeVoicePanel.tsx
- src/features/office/OfficeOverview.tsx e OfficePresencePanel.tsx
- src/features/office/OfficePhaseStatus.tsx
- docs/office/PHASE_STATUS.json
- docs/qa/office-phase05-2026-10-14.md
- e2e/aurora-workflow.spec.ts
