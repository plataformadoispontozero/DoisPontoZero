# Evolução do motor editorial de campanhas

Status: Implementado e validado; backend aplicado. Interface aguarda push/deploy.

Fonte: especificação enviada pelo usuário em 12/10/2026. Escopo: Fase 1 incremental, sem IA, preservando aprovação e produção. Padrões confirmados: distribuição automática ajustável; prévia; sete slides; reels 30s; repertório editável apenas por OWNER/ADMIN/MANAGER; repetição bloqueada.

- [x] Briefing + estratégia/pilares explicitamente conectados por cliente/agência.
- [x] Repertório versionado com edição autorizada; quotas exatas e geração determinística.
- [x] Tom/restrições/termos influenciam seleção; lacunas explícitas e direção visual por formato.
- [x] Histórico inclui versões antigas e ideias descartadas; duplicidade validada no servidor/transação.
- [x] Prévia estratégica, similaridade e esgotamento; revisão humana; rastreabilidade de fonte/regras/alterações.
- [x] Regressão de geração/aprovação/produção e isolamento, typecheck/lint/build.

Fase 2 (não parte desta primeira evolução): sazonalidade/datas preferidas; exceções recorrentes justificadas; relatórios de desempenho; editor livre de blocos de texto. Nenhuma publicação automática ou conexão Meta/IA.


## Evidências

131 testes unitários; 72 regressões de interface (desktop/tablet/mobile); testes finais de geração/aprovação e integração estratégia/pilares; SQL real em rollback antes/depois da migration; typecheck, lint sem erros e build. Ver `docs/CODEX_CAMPAIGN_EDITORIAL_ENGINE.md` para limites, avisos e implantação. Não foi publicado frontend nesta rodada.

## File list

- `src/features/editorial/campaignEngine.ts`
- `src/features/editorial/campaignEngine.test.ts`
- `src/features/editorial/monthlyPlanner.ts`
- `src/features/editorial/monthlyPlanner.test.ts`
- `src/features/editorial/useCampaignInputs.ts`
- `src/features/editorial/RepertoireEditor.tsx`
- `src/features/editorial/MonthlyEditorialPage.tsx`
- `src/features/strategy/services/editorialEngine.ts`
- `src/features/strategy/services/editorialEngine.test.ts`
- `e2e/agency-access.spec.ts`
- `supabase/migrations/20261012033627_campaign_editorial_engine.sql`
- `supabase/tests/campaign_editorial_engine.sql`
- `docs/ANALISE_MOTOR_EDITORIAL.md`
- `docs/CODEX_CAMPAIGN_EDITORIAL_ENGINE.md`
- `docs/stories/campaign-editorial-engine.md`
