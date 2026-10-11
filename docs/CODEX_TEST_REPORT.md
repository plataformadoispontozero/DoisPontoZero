> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# RELATÓRIO DE TESTES

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Execução real

| Categoria | Resultado | Evidência e limite |
|---|---|---|
| Instalação npm ci | PASS; 217 pacotes, auditoria reportou 0 vulnerabilidades | lockfile existente; não certifica Auth/RLS |
| Build baseline | PASS | evidence/build-before.txt |
| Unit baseline | 75/75, 16 arquivos | evidence/unit-before.txt |
| TypeScript | PASS | npm run typecheck, evidence/typecheck.txt |
| Lint | exit 0, avisos existentes | npm run lint, evidence/lint.txt; avisos não eliminados |
| Unit após correções | 78/78, 17 arquivos | evidence/unit-after.txt; mocks/pure functions não provam backend |
| Build final | PASS, bundles grandes continuam | evidence/build-final.txt |
| E2E primeira execução viável | 83/84 | falha de seletor em sidebar mobile oculta, corrigida |
| E2E final | 84 casos únicos aprovados após reteste: rodada completa 82/84 + baseline corrigido 6/6 | evidence/e2e-final-run.txt, e2e-baseline-fixed.txt e e2e-summary.json |
| Backend real read-only | 89/89 GET de relação com limit=0 retornam 200 | evidence/supabase-readonly-relations.json; não é CRUD/RLS |
| Histórico/schema/RLS/RPC/Storage/Realtime reais | BLOCKED | faltam acesso administrativo e fixtures autenticadas staging |

O primeiro lançamento de Chromium no sandbox falhou por EPERM; execução local de navegador foi autorizada fora desse sandbox e repetida. Falha de ambiente não foi registrada como bug da plataforma nem como PASS. Playwright final usa produção local via Vite preview sem .env Supabase; os testes existentes intitulados “fluxos críticos” são assertivas de UI, não integrações reais.

## Fluxos integrados A–J

| Fluxo | Resultado | Motivo |
|---|---|---|
| A login/dashboard/logout | BLOCKED / implementação MISSING | Auth e logout real ausentes |
| B cliente/projeto/tarefa/Kanban | BLOCKED backend | navegação UI passa; nenhum registro real criado/movido |
| C cliente/briefing/resposta/PDF | BLOCKED backend/PDF visual | renderer existe; token real, resposta e arquivo não homologados |
| D briefing/estratégia/pauta/tarefa | BLOCKED | contratos/RPC/migrations não reconciliados |
| E cliente/proposta/preço/aceite | BLOCKED backend | unit pricing não prova cálculo/aceite autoritativo |
| F projeto/arquivo/apresentação | BLOCKED OAuth/Storage | conexão Drive simulada |
| G reunião/decisão/ação/tarefa | BLOCKED | memória e RPC incompatible com tasks |
| H A/mensagem/B/Realtime | BLOCKED | envio em memória e ausência de duas sessões reais |
| I agência A/recurso/B negado | BLOCKED | sem usuários/fixtures staging e catálogo RLS |
| J branding/save/reload | BLOCKED backend | defaults demo e tenant não autenticado |

## Responsividade e acessibilidade

Quinze entradas com reload em 1440x900, 768x1024 e 390x844; screenshots por rota. Assertivas: main visível, URL correta, nenhum pageerror/unexpected application error e sem overflow horizontal no documento. Nenhum aceite geral WCAG, focus trap, teclado, sheets/modais ou formulários internos inferido. Kanban com registros e colunas não exercitado; PDFs exportados não renderizados para inspeção visual. Esses casos estão NOT_RUN/BLOCKED conforme exigem dados reais. As 151 entradas do plano do kit permanecem sem execução individual: esta suíte não pode ser contabilizada como 151 PASS.

## Regressão dos bugs corrigidos

Health retorna connected=false para PGRST205, 42501 e PGRST301; sucesso sem linhas aceita conectividade; timeout limpa timer. /agenda preserva rota /calendar. Permission Studio não permite anunciar matriz persistida quando o serviço não está integrado. Remover _redirects evita reenviar regra problemática, mas aceite da API Cloudflare depende de publicação futura autorizada.

## Evidências visuais

45 screenshots preservados em docs/evidence/screenshots. Dashboard desktop, tablet e mobile inspecionados visualmente: sem corte/overflow evidente, com quebras de linha mais densas no tablet. O card de status ainda mostra alegações históricas de produção/RBAC/módulos que não representam homologação real; gap permanece registrado. Não houve mudança cosmética para mascarar esse problema.
