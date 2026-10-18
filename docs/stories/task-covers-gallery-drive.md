# Capas, galeria, fluxo por cliente e Drive

- [x] Capa automática/selecionável com referência da própria demanda.
- [x] Preview no Kanban expandido e detalhe da demanda.
- [x] Galeria por setas/teclado/arraste e somente Aprovar/Reprovar.
- [x] Retirar quadro antigo e acesso via Social Media.
- [x] Integrar autorização Google à criação e upload; preservar segurança.
- [x] Testes de banco, regressão, tipos, lint e backend.
- [ ] Testes finais de navegador, publicação e conferência real.
- [ ] Teste operacional de autorização/upload com conta real do responsável.

## Arquivos

- docs/RELEASE_STATUS.json
- docs/qa/task-covers-gallery-drive-2026-10-15.md
- docs/stories/task-covers-gallery-drive.md
- e2e/office-presence.spec.ts
- e2e/platform-readiness.spec.ts
- e2e/presentation-preview.spec.ts
- playwright.cards-gallery.config.ts
- src/app/router/index.tsx
- src/features/integrations/DemandProductionFiles.test.tsx
- src/features/integrations/DemandProductionFiles.tsx
- src/features/integrations/TaskCardCover.test.tsx
- src/features/integrations/TaskCardCover.tsx
- src/features/integrations/driveProduction.ts
- src/features/integrations/taskCardCovers.database.test.ts
- src/features/presentations/PresentationPreview.test.tsx
- src/features/presentations/PresentationPreview.tsx
- src/features/projects/LegacyProjectRedirect.tsx
- src/features/projects/NewProjectPage.tsx
- src/features/projects/components/ClientKanbanBoard.tsx
- src/features/projects/components/TaskDetailPanel.tsx
- src/features/social-media/SocialMediaPage.tsx
- supabase/functions/google-workspace/taskDrive.ts
- supabase/migrations/20261015152642_task_card_covers.sql
