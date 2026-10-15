# Correção da presença global — Fase 05 em homologação

- [x] Confirmar diretório e autorização real de presença com rollback, sem alterar dados.
- [x] Reproduzir travamento em reconexão com SDK real e duas sessões controladas.
- [x] Ordenar retirada de presença antes da remoção do canal; limitar espera e ignorar retirada em canal não inscrito.
- [x] Testes unitários do ciclo e da ausência de confirmação.
- [x] Navegador, typecheck, lint e regressão afetada finais.
- [x] Registrar teste real de voz informado pelo usuário; manter Fase 05 em homologação e Fase 06 bloqueada.
- [ ] Push, deploy e conferência dos artefatos publicados.
- [ ] Aceite real da presença pelo responsável.

## Arquivos
- src/features/office/presenceSession.ts e presenceSession.test.ts
- src/features/office/OfficePhaseStatus.tsx
- e2e/office-presence.spec.ts
- playwright.office-presence.config.ts
- docs/office/PHASE_STATUS.json
- docs/stories/office-phase05.md
- docs/qa/office-presence-reconnect-2026-10-15.md
