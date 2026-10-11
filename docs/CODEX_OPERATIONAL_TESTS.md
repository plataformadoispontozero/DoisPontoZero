# Prompt 17 — resultados de execução

Data: 11/10/2026. Evidências desta execução não substituem homologação remota.

- Typecheck PASS: /private/tmp/dz17-typecheck-final.txt.
- Build PASS: /private/tmp/dz17-build-final.txt.
- Lint PASS com avisos existentes: /private/tmp/dz17-lint-final.txt.
- Vitest PASS final: 92 testes / 21 arquivos, /private/tmp/dz17-unit-security.txt. Typecheck após os testes: /private/tmp/dz17-typecheck-security.txt; lint final: /private/tmp/dz17-lint-security.txt.
- Scanner heurístico sem correspondências nos padrões verificados: PROMPT_17_SECRET_SCAN.json. Não inspecionou todo histórico do Git.
- SQL draft administrativo: NOT_RUN; supabase/pending/prompt17_member_role.sql fora de migrations.

## Regressões no navegador

Primeiras tentativas: bloqueadas antes do teste por executável Chromium ausente, apesar dos marcadores de instalação do cache. Instalação forçada reparou o cache; as tentativas bloqueadas não são PASS nem falhas funcionais do aplicativo.

Execução após reparo: suíte autenticada controlada com 45 casos e suíte local de regressão com 84 casos. Viewports: desktop 1440×900, tablet 768×1024, mobile 390×844. Resultados finais: **45/45 PASS** em 1,8 min e **84/84 PASS** em 2,4 min. Logs: /private/tmp/dz17-e2e-repaired.txt e /private/tmp/dz17-regression.txt.

Auth: login/session validation/logout, deep links/reload, viewer sem permissão, multivínculo/cache, backend indisponível, membership suspensa e agenda. Equipe: acesso por URL direta, convite bloqueado e detalhe desconhecido. API é interceptada; não comprova RLS.

Regressão local: Dashboard, Agenda, Clientes, Projetos, Tarefas, Squads, Briefings, Estratégia, Propostas, Drive, Apresentações, Reuniões, Chat e configurações. Esta suíte usa demonstração explícita SOMENTE no loopback sem Supabase. Não comprova persistência real, uploads, aprovação, export visual de todos os PDFs nem segurança no PostgreSQL.

## Integrações e segurança remotas

RLS A/B, escrita operacional, Storage, OAuth Meta, tokens, tráfego e publicação: NOT_RUN / BLOCKED. Não existem staging provisionado, app Meta ou contas externas de teste autorizadas/configuradas. Nenhuma campanha/post criado e nenhuma verba consumida. Nunca marcar esses recursos COMPLETED com mocks.

Arquivos de logs locais não são versionados. JSON/resultados de Playwright ficam em test-results/ (ignorado). Próximo passo: staging/README.md e reconciliação do schema; manter NO_GO para ativação completa.

Diff check final: PASS. Testes específicos de gravações de Equipe verificam que bloqueios/falhas propagam erro e não anunciam sucesso. Arquivo src/features/team/team-security.test.tsx.
