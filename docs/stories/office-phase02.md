# Escritório Digital — Fase 02

## Escopo
Modelo persistente mínimo, reutilizando Chat, agência, perfil, papel, squad e membros. Migration aditiva; sem presença global, áudio, vídeo ou Tauri. Fase 01 homologada explicitamente pelo usuário.

## Checklist
- [x] Schema remoto e tipos atuais inspecionados.
- [x] Salas e membros reutilizados; office_enabled desligado por padrão.
- [x] Preferências reutilizadas: sala preferida, auto-join opt-in false e IDs locais de dispositivos limitados; sem segredos ou mídia.
- [x] Agência, permissão atual, sala privada, squad e habilitação verificados no backend.
- [x] Configuração restrita à gestão com permissões atuais; sem escrita direta no canal.
- [x] Policies preparadas para tópicos privados office:agência:sala; nenhum cliente de Realtime iniciado.
- [x] Migration aplicada e SQL real validado com rollback; nenhum dado de teste persistido.
- [x] Tipos regenerados do schema real, recortados às tabelas e RPCs desta fase.
- [x] Cinco testes de SQL/RLS com duas agências, squads e preferências.
- [x] 434 testes de regressão, typecheck, lint, build e diagnóstico desktop/celular (2 cenários).
- [x] Publicação do diagnóstico em homologação; HTML público corresponde ao build.
- [ ] Aceite do responsável. Fase 03 bloqueada.

## Arquivos
- supabase/migrations/20261014184243_office_phase02_tenant_data.sql
- src/features/office/office-data.database.test.ts
- src/features/office/office.generated.ts
- src/features/office/OfficePhaseStatus.tsx
- e2e/aurora-workflow.spec.ts
- docs/office/PHASE_STATUS.json
- docs/stories/office-phase02.md
- docs/qa/office-phase02-2026-10-14.md
