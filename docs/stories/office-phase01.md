# Escritório Digital — Fase 01

## Escopo autorizado
Navegação e estrutura inicial. Reutilizar Chat, WorkRooms, histórico e permissões. Sem novas tabelas, presença global, SDK de chamadas, dispositivos ou alterações Tauri. A próxima fase só começa após conclusão e homologação desta.

## Checklist
- [x] Branch dedicada feat/escritorio-digital.
- [x] Flag VITE_ENABLE_DIGITAL_OFFICE, desligada por padrão.
- [x] Menu Escritório Digital e rotas /office e /office/lobby quando habilitado.
- [x] /chat, canais e conversas privadas preservados; acesso a Mensagens.
- [x] Permissão chat.access aplicada a office e subrotas.
- [x] Overview com contagem de salas autorizadas, loading/erro e recursos futuros indisponíveis.
- [x] Reutilização de ChatPage/WorkRooms; variante compacta sem cabeçalho repetido.
- [x] 429 testes de regressão e 10 cenários desktop/mobile (flag ligada/desligada).
- [x] Screenshots de desktop/celular revisados.
- [x] Build e ambiente separado de homologação conferidos; HTML publicado corresponde ao build.
- [x] Homologação pelo responsável: aceite explícito “homologar fase 1”. Fase 02 liberada, ainda não iniciada.

## Arquivos
- .env.example
- src/features/office/officeFeature.ts
- src/features/office/officeFeature.test.ts
- src/features/office/OfficePage.tsx
- src/features/office/OfficeOverview.tsx
- src/features/office/OfficePhaseStatus.tsx
- src/features/chat/ChatPage.tsx
- src/features/chat/WorkRooms.tsx
- src/features/auth/access.ts
- src/components/navigation/NavLinks.ts
- src/components/navigation/navigationConfig.ts
- src/app/router/index.tsx
- src/features/settings/ReleaseDiagnostics.tsx
- e2e/aurora-workflow.spec.ts
- docs/office/PHASE_STATUS.json
- docs/stories/office-phase01.md
- docs/qa/office-phase01-2026-10-14.md
