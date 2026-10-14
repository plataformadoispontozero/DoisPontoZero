# Escritório Digital — Fase 03

## Escopo
Presença global sem mídia, após aceite explícito das Fases 01 e 02. Reutiliza sessão, QueryScope, cliente Supabase e hook de presença de sala. Voz, câmera, Tauri e convites fora do escopo.

## Checklist
- [x] Provider acima das páginas e guards, no escopo de usuário/agência.
- [x] Hook de sala usa controlador global no escritório; comportamento legado protegido pela flag.
- [x] Tópicos privados por tenant/usuário, identidade autenticada no backend; sem heartbeat Postgres.
- [x] Abas agregadas por usuário e nomes/avatares derivados do diretório autorizado.
- [x] Disponível, ausente, ocupado, em sala de mensagens e offline; idle de cinco minutos.
- [x] Navegar/ocultar aba não faz leave; saída, mudança de escopo e perda de acesso limpam conexões.
- [x] Falhas de transporte/track limpam indicadores e reconexão tem controle explícito.
- [x] 445 testes em 121 arquivos; 11 novos testes de controlador/provider/RLS.
- [x] 10 cenários de navegador desktop/celular: 8 com flag ligada, 2 com flag desligada.
- [x] SQL remoto com identidade autorizada e rollback; WSS real anônimo recusado.
- [x] Typecheck, lint e build; aviso novo de Fast Refresh corrigido.
- [x] Publicação e conferência: HTML, bundle principal e diagnóstico correspondem ao build validado.
- [ ] Homologação com dois membros reais: presença, navegação, refresh, saída e reconexão.
- [ ] Aceite do responsável. Fase 04 bloqueada.

## Arquivos
- src/app/providers/AppProviders.tsx
- src/features/chat/ChatPage.tsx
- src/features/chat/hooks/useRoomPresence.ts
- src/features/office/OfficePresenceProvider.tsx
- src/features/office/OfficePresenceContext.ts
- src/features/office/OfficePresencePanel.tsx
- src/features/office/OfficePresenceProvider.test.tsx
- src/features/office/presenceSession.ts
- src/features/office/presenceSession.test.ts
- src/features/office/office-presence.database.test.ts
- src/features/office/office.generated.ts
- src/features/office/OfficeOverview.tsx
- src/features/office/OfficePhaseStatus.tsx
- supabase/migrations/20261014192432_office_phase03_private_presence.sql
- e2e/aurora-workflow.spec.ts
- docs/office/PHASE_STATUS.json
- docs/stories/office-phase03.md
- docs/qa/office-phase03-2026-10-14.md
