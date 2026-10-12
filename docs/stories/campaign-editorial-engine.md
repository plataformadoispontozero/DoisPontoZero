# Evolução do motor editorial de campanhas

Status: Implementado, validado e publicado. Backend aplicado; push e deploy confirmados.

Fonte: especificação enviada pelo usuário em 12/10/2026. Escopo: Fase 1 incremental, sem IA, preservando aprovação e produção. Padrões confirmados: distribuição automática ajustável; prévia; sete slides; reels 30s; repertório editável apenas por OWNER/ADMIN/MANAGER; repetição bloqueada.

- [x] Briefing + estratégia/pilares explicitamente conectados por cliente/agência.
- [x] Repertório versionado com edição autorizada; quotas exatas e geração determinística.
- [x] Tom/restrições/termos influenciam seleção; lacunas explícitas e direção visual por formato.
- [x] Histórico inclui versões antigas e ideias descartadas; duplicidade validada no servidor/transação.
- [x] Prévia estratégica, similaridade e esgotamento; revisão humana; rastreabilidade de fonte/regras/alterações.
- [x] Regressão de geração/aprovação/produção e isolamento, typecheck/lint/build.

Fase 2 (não parte desta primeira evolução): sazonalidade/datas preferidas; exceções recorrentes justificadas; relatórios de desempenho; editor livre de blocos de texto. Nenhuma publicação automática ou conexão Meta/IA.


## Evidências

131 testes unitários; 72 regressões de interface (desktop/tablet/mobile); testes finais de geração/aprovação e integração estratégia/pilares; SQL real em rollback antes/depois da migration; typecheck, lint sem erros e build. Ver `docs/CODEX_CAMPAIGN_EDITORIAL_ENGINE.md` para limites, avisos e implantação. Código publicado: `e487494`; Worker `0930289d-8b18-4bd6-82e6-4b54ecc7f4a1`.

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

## Correção incremental — fontes importadas e preparação de temas (12/10/2026)

Status: Validado localmente; publicação pendente.

Problema: clientes com perfil preenchido e sem pilares nativos não tinham temas elegíveis. O comando de geração era rejeitado e a ficha de calendários mostrava somente campanhas nativas, ocultando documentos históricos nessa seção.

- [x] Sugestões com fonte explícita a partir de nicho/posicionamento do cadastro, campos reconhecidos de briefing e focos extraídos da estratégia histórica.
- [x] Edição e confirmação explícita pela equipe antes de aplicar temas; nenhuma promoção automática a fatos aprovados.
- [x] Mensagem clara dos campos obrigatórios ausentes (objetivo, público e temas/pilares).
- [x] Temas/títulos estruturados de calendários históricos participam da checagem de repetição, inclusive registros rejeitados; isolamento por cliente.
- [x] Calendários históricos visíveis na seção Calendário do cliente com rótulo de histórico e estados originais preservados.
- [x] Typecheck e 21 testes direcionados aprovados; 9 E2E de perfil → revisão → geração → payload de salvamento, briefing e estratégia aprovados em desktop/tablet/mobile. Lint sem erros (avisos preexistentes e de estado em efeitos) e build aprovados. APIs controladas; não constituem homologação real de RLS/dados de produção.
- [ ] Push e deploy confirmados por DevOps.

Arquivos desta correção: `src/features/editorial/editorialContext.ts`, `editorialContext.test.ts`, `MonthlyEditorialPage.tsx`, `useCampaignInputs.ts`; `src/features/clients/components/ClientHubModal.tsx`, `ClientLegacyPanel.tsx`; `e2e/editorial-profile.spec.ts`.

Limites: documentos históricos permanecem imutáveis, sem aprovações nativas presumidas. Sem migração de esquema e sem campanha real gravada nesta correção. Textos longos livres não são convertidos automaticamente em fatos/pilares; os blocos intermediários da geração ainda exigem complementação humana.

### Validação combinada de publicação — 12/10/2026

- 203 testes em 52 arquivos passaram; lint, typecheck via build e build de produção passaram.
- E2E editorial de geração, revisão e payload salvo passou nos três viewports com backend simulado; não constitui homologação real de OAuth.
- Migração central Google aplicada como `20261012134754`; Google Workspace v7, connection-config v3 e drive-material-approval v4 ativos. RPCs centrais bloqueados para anon/authenticated e tabela privada com RLS.
- Conta Google real e consentimento dos escopos ainda dependem da configuração e autorização pelo administrador. CodeRabbit indisponível.
