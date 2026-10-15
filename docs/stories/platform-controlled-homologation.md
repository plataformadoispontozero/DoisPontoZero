# Homologação técnica por fase da plataforma

- [x] Inventário de fases e critérios pendentes; preservar módulo Propostas removido.
- [x] Suite de navegador reproduzível em desktop/tablet/mobile.
- [x] Executar, corrigir e registrar cenários de cada fase.
- [x] Verificar restore controlado, segurança e checks de banco remoto delimitados.
- [x] Regressão, lint, typecheck e build.
- [x] Diagnósticos com homologação técnica separada de critérios externos/reais.
- [ ] Push e deploy de produção/revisão com flags adequadas e conferência pública.

## Arquivos
- playwright.homologation.config.ts
- src/features/platform/controlled-restore.database.test.ts
- docs/PLATFORM_HOMOLOGATION_STATUS.json
- docs/PHASE_STATUS.json e docs/RELEASE_STATUS.json
- docs/qa/platform-homologation-2026-10-14.md
- src/features/settings/DiagnosticsPage.tsx e releaseEvidence.ts/test.ts

Arquivos adicionais: vite.config.ts; src/app/providers/AppProviders.tsx; src/features/office/voiceState.ts, voiceErrors.ts/test.ts, voiceSession.ts, OfficeVoiceProvider.tsx, OfficeVoiceContext.ts; BriefingPage.tsx; ClientBriefingsTab.tsx; MonthlyEditorialPage.tsx/test.tsx e monthlyPlanner.ts; supabase/functions/google-workspace/index.ts/index_test.ts; e2e/agency-access, aurora-workflow, editorial-profile, native-briefing-pilot, platform-readiness, presentation-preview e public-site; scripts/qa/phase-test-matrix.py.
