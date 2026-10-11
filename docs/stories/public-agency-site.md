# Site público configurável Dois.Zero

Status: Done — estrutura e conteúdo ativados no Supabase; Worker existente publicado; entrega autorizada para envio ao GitHub nesta revisão.

## Brief de conversão
Marca: Dois.Zero. Público: empresas que precisam de presença digital, identidade e campanhas. Oferta: serviços publicados em https://doispontozeroagencia.com/. Objetivo: receber briefing comercial e iniciar contato. Identidade: preto, violeta e verde da plataforma, tipografia editorial, planos de portfólio com profundidade. Sem métricas, cases ou pessoas inventadas. Aprovação do preview precede push, migração remota e promoção à produção.

## Critérios
- [x] `/` público; login e workspace preservados.
- [x] Hero centralizada, assets distintos da galeria com movimento de câmera em planos CSS 3D.
- [x] Logos reais em loop pausável; serviços, equipe configurável, FAQ e contatos.
- [x] Briefing rápido sem privilégios de workspace para clientes.
- [x] Editor nas configurações com rascunho, mídia e publicação explícita.
- [x] Preparação Supabase com RLS, conteúdo público separado de leads privados e proteção antispam.
- [x] Mobile, teclado, movimento reduzido e testes de regressão.
- [x] Preview entregue antes da publicação final.

## Arquivos
- `src/features/public-site/{PublicSitePage,PublicBriefPage,PublicSiteSettingsPage,Poster,Turnstile}.tsx`
- `src/features/public-site/{siteContent,usePublicSite,useSceneMotion,lead}.ts`
- `src/features/public-site/public-site.css` e `siteContent.test.ts`
- `src/app/router/index.tsx`, `src/features/auth/access.ts`, `src/features/settings/components/SettingsLayout.tsx`
- `public/agency/*.webp`, `public/_headers`, `index.html`
- `.env.example`, `.gitignore`
- `e2e/public-site.spec.ts`, `playwright.public-site.config.ts`
- `supabase/migrations/20261011164211_public_agency_site.sql` e espelho pending marcado como aplicado
- `supabase/functions/public-agency-brief/{index.ts,deno.json,deno.lock}`
- `docs/PUBLIC_AGENCY_SITE_PREVIEW.md`, esta story.

## Evidências
105 testes unitários; 18 E2E do site; 48 E2E de autenticação/agência; build, typecheck, lint e Deno check passaram. Capturas revisadas em desktop e mobile; 320 px sem overflow. Preview real Cloudflare retorna HTTP 200 e funciona nas rotas `/`, `/brief` e `/login` em desktop/celular.

## Limite da entrega para revisão
As respostas de Supabase nos E2E são controladas, sem homologação de RLS remoto. Schema, storage e Edge Function ativados no projeto existente em 2026-10-11. O recebimento de briefing no banco depende dessa ativação e do Turnstile; alternativa WhatsApp disponível. Sem fotos de equipe reais no material fornecido. Push e publicação autorizados pelo usuário em 2026-10-11. Turnstile continua pendente de configuração de chaves; nenhum envio ao banco é simulado.


## Hotfix do scroll — 2026-10-11
O carregamento remoto deixava a galeria ausente no primeiro efeito, sem reinstalar listeners quando o conteúdo aparecia. A inicialização agora depende da disponibilidade do site, do término do carregamento e da quantidade de painéis. Reproduzido no domínio publicado (progress vazio); validado com Supabase real em build corrigido (progress 0.3507 após scroll).

Hotfix validado com 18/18 E2E públicos, build de produção e `git diff --check`.


## Seção de equipe — 2026-10-11
Adicionado título Nossa equipe e quatro espaços claramente reservados para fotos: Designer, Social Media, Tráfego Pago e Videomaker. Quando o OWNER cadastra pessoas em Configurações > Site público > Equipe, os cartões reais substituem automaticamente os espaços reservados. Não foram inventados nomes nem fotos de pessoas.

Seção de equipe validada com build de produção, 18/18 E2E públicos e `git diff --check`.

Serviços agora expandem com explicação, exemplos de entregas e CTA para briefing com serviço selecionado. Escopo comercial é definido na proposta.

Serviços validados com build de produção, 18/18 E2E públicos e conferência manual em 1440/390 px: acordeão abre e CTA seleciona o serviço correto.


## Identidade oficial — 2026-10-11
Logo enviada pelo usuário aplicada sem alterações em hero e navegação, com suporte branco para legibilidade do desenho preto no site escuro. Paleta pública ajustada para laranja, preto e branco.

Identidade validada com build de produção, 18/18 E2E públicos e `git diff --check`. Laranja de interface `#ff5a1f` é uma aproximação visual; não foi fornecida uma especificação cromática exata.


## Refinamento visual — 2026-10-11
Logo com letras brancas e símbolo original laranja, sem suporte branco; maior contraste no CTA final e nomes da equipe; retratos com cantos arredondados. Câmera CSS 3D combina percurso vertical, profundidade e rotações. Botões e ícones respondem ao hover, respeitando movimento reduzido.

Refinamento validado com build de produção, 18/18 E2E públicos, revisão visual em desktop/mobile sem overflow e `git diff --check`.
