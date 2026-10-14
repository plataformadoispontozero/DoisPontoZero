# Produção agrupada por cliente e etapa, com prazo de 48 horas

## Requisitos confirmados
- Grupos recolhidos por padrão; cabeçalho apenas com cliente e quantidade.
- Arrastar uma peça ou o grupo da coluna, sem seletor de etapa.
- Uma peça muda de coluna sem mover as demais; peças do mesmo cliente se unem no destino.
- Cards com etiqueta Poster/Carrossel/Roteiro, copy principal e data de envio para produção.
- Prazo: 48 horas corridas após aprovação do calendário editorial, não após recebimento do briefing.
- Prioridade e avisos compactos de urgência, curto/médio prazo e atraso; datas completas nos detalhes.
- Aproveitar seletivamente a experiência operacional do legado de Design, Vídeo e Tráfego.

## Checklist
- [x] Comparação do legado local em somente leitura.
- [x] Agrupamento por cliente em cada coluna, recolhido por padrão.
- [x] Etiquetas, copy principal, data de envio; seletores removidos.
- [x] Relógio de 48 horas baseado em aprovação comprovada e preservado ao mover.
- [x] Datas de briefing, criação, aprovação, prazo e envio à revisão nos detalhes.
- [x] Migration versionada, proteção de escrita da data de aprovação e acesso por demanda.
- [x] Regressão de 417 testes e validação do banco real.
- [x] Validação final de navegador.
- [x] Publicação confirmada.
- [ ] Aceite operacional humano no quadro publicado.

## Arquivos
- src/features/projects/components/ClientKanbanBoard.tsx
- src/features/projects/ProjectsPage.tsx
- src/features/projects/components/TaskDetailPanel.tsx
- src/features/tasks/hooks/useTasks.ts
- src/features/production/productionTiming.ts
- src/features/production/useProductionTiming.ts
- src/features/production/ProductionTimeline.tsx
- src/features/production/productionTiming.test.ts
- src/features/production/productionTiming.database.test.ts
- src/components/ui/Dialog.tsx
- e2e/aurora-workflow.spec.ts
- supabase/migrations/20261014133556_editorial_approval_production_sla.sql
- supabase/migrations/20261014133920_production_timing_safe_activity_metadata.sql
- docs/RELEASE_STATUS.json
- docs/stories/production-grouped-sla.md
- docs/qa/production-grouped-sla-2026-10-14.md
