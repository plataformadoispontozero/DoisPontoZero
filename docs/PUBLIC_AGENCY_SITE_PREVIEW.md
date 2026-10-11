# Dois.Zero — página pública da agência

## Entrega para revisão

Preview: https://agency-site-preview-doispontozero.marketingrenatodesigner.workers.dev/

Versão Cloudflare: `fea27b9e-9353-419a-b3af-6d2a0a85c3cd`.

Editor: `/settings/public-site` (proprietário autenticado). Preview local: http://127.0.0.1:5180/.

A raiz `/` agora apresenta a agência; `/login`, recuperação de senha e workspace continuam separados. O preview usa `VITE_PUBLIC_SITE_PREVIEW=true`; produção deve usar `false`. Sem conteúdo publicado, produção apresenta “site em preparação”, sem publicar rascunhos ou estudos silenciosamente.

## Conteúdo e direção

Hero centralizada com logo, headline e três posters ao fundo. Galeria com peças diferentes e câmera por scroll em planos CSS 3D; sem pacote WebGL adicional. A câmera usa transformações de profundidade e rotação, preservando a rolagem nativa. Em mobile e `prefers-reduced-motion`, todos os projetos são apresentados em sequência estática. Controle de movimento e controle de pausa dos logos disponíveis.

Serviços, logos e contatos foram conferidos no site indicado pelo usuário: https://doispontozeroagencia.com/. Logos WebP foram copiados para `public/agency/` para servir pelo próprio Worker (aproximadamente 188 KB no disco para o conjunto). O WhatsApp usa a versão com nono dígito do número exibido no site; confirmar o contato na revisão comercial.

Os seis posters sem imagem são estudos autorais, identificados como conceitos. Não há resultados numéricos, clientes fictícios ou fotos inventadas de membros. O editor permite substituir imagens, cadastrar pessoas com foto autorizada e resultados verificados. Sem fotos cadastradas, a área de equipe apresenta as disciplinas da agência.

## Editor

Abas: hero, portfólio, clientes, equipe, FAQ, contatos e briefings recebidos. Rascunhos são salvos por agência neste navegador; só o proprietário da mesma agência pode visualizar `?draft=...`. O conteúdo publicado usa apenas a tabela pública específica, nunca os dados internos de clientes, equipe ou projetos. Campos de imagem aceitam URL HTTPS ou caminho local; upload preparado para PNG/JPEG/WebP até 2 MB.

A tela distingue salvar rascunho local, salvar no Supabase e marcar site publicado. Falhas reais de banco não simulam sucesso. Nenhum push publica conteúdo de banco automaticamente.

## Briefing rápido

`/brief`: contato → serviços/objetivo → revisão e consentimento. Não cria usuário Auth nem vínculo/permissão no workspace. O formulário valida o conteúdo, evita submit duplicado e confirma recebimento somente após resposta positiva da Edge Function. Nenhum dado pessoal é persistido no navegador por esse formulário.

Antes de ativar o backend, existe uma alternativa explícita de enviar o resumo pelo WhatsApp após consentimento. Esse botão abre um rascunho; o visitante confirma o envio no WhatsApp. Não existe confirmação fictícia de recebimento na plataforma.

## Supabase preparado, ainda não aplicado

Projeto consultado: `pvkhlobsiszrjtblpruu`.

Consulta de metadados confirmou que `agency_public_sites`, `agency_site_leads` e bucket `agency-site-media` ainda não existem. O arquivo `supabase/pending/public_agency_site.sql` é uma preparação aditiva, fora do histórico de migrations, não aplicada ao banco atual.

- Conteúdo publicado: leitura pública apenas das colunas de vitrine. Edição restrita a OWNER ativo da agência; helper em schema privado com search_path fixo e join de role por agência.
- Leads: privados, sem SELECT ou INSERT direto para anon; leitura somente pelo OWNER da agência. Escrita via service_role em RPC SECURITY INVOKER, após validação na Edge Function.
- Função `public-agency-brief`: allowlist de origens, limite de corpo, validação, consentimento, honeypot, Turnstile validado no servidor com hostname e action. Não expõe service_role no frontend, logs ou conteúdo público.
- RPC: idempotência por request_id, limite por e-mail (3/h) e por site (100/h), serialização por lock da linha do site. Sem alterações nos registros existentes de Auth, agência, CRM ou projetos.
- Storage: bucket público separado para mídia intencionalmente pública; INSERT apenas pelo OWNER sob o prefixo da própria agência, sem overwrite/delete concedidos.

A SQL/RLS está preparada e revisada, mas não foi executada ou homologada contra o banco remoto. Os testes de navegador com respostas controladas não comprovam RLS real. A função passou no `deno check`; isso também não comprova execução em produção.

## Ativação após revisão do preview

1. Aprovar o visual/conteúdo, confirmar contatos e fornecer os projetos/fotos reais.
2. Criar migration via `supabase migration new public_agency_site` (CLI), copiar o SQL revisado e aplicar somente essa alteração aditiva ao projeto autorizado. Não executar `db push` com todas as migrations pendentes.
3. Verificar RLS com OWNER da agência, outra agência e anon; verificar grants, leitura de drafts, tentativas de escrita e acesso a leads. Executar advisors.
4. Configurar Turnstile para os domínios usados. Chave pública em `VITE_TURNSTILE_SITE_KEY`; segredo somente nos secrets da Edge Function (`TURNSTILE_SECRET_KEY`). `PUBLIC_SITE_ALLOWED_ORIGINS` deve listar explicitamente as origens autorizadas.
5. Publicar a Edge Function com `verify_jwt=false` para formulário sem conta, mantendo a verificação server-side de Turnstile e de origem. Enviar todos os arquivos, deno.json/lock e a dependência `src/features/public-site/lead.ts` ao empacotar; não copiar chaves para o repo.
6. Salvar e publicar o conteúdo pelo editor, testar um briefing real autorizado e confirmar o registro privado na agência.
7. Commit/push da branch revisada. Build Cloudflare: `npm run build`; comando de preview conforme Workers Builds (`npx wrangler versions upload` na integração tradicional). Não é necessário merge para publicar um preview.
8. Promover a versão validada ao Worker existente somente conforme a publicação final acordada. Não recriar Worker ou DNS.

Fontes técnicas consultadas: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [configuração de funções](https://supabase.com/docs/guides/functions/function-configuration), [Turnstile no servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## Verificação

- `npm test`: 105/105 testes passaram, 24 arquivos.
- Site público: 18/18 E2E passaram em 1440×900, 768×1024 e 390×844.
- Regressão autenticação/agência: 48/48 E2E passaram, com API controlada (sem escrita remota).
- Tela de 320 px: menu visível e sem overflow horizontal.
- Build e typecheck passaram; lint sem erros, com avisos preexistentes do projeto.
- `deno check` da Edge Function preparada passou.
- `git diff --check` passou.
- Publicação somente em preview da Cloudflare concluída. Nenhuma migration, push, merge, alteração de DNS ou promoção ao domínio principal nesta etapa.

## Smoke test do preview remoto

Em 1440×900 e 390×844: raiz HTTP 200, logo carregada, CTA abre `/brief`, campos disponíveis e `/login` preserva o botão Google. Versão real consultada após upload. Capturas: `/private/tmp/doiszero-live-preview-1440.png` e `/private/tmp/doiszero-live-preview-390.png`.


## Ativação autorizada em 2026-10-11
Migration remota 20261011164211_public_agency_site aplicada isoladamente; tabelas, RLS e bucket agency-site-media criados. Conteúdo público do slug dois-zero publicado para a agência existente. Edge Function public-agency-brief v1 ativa com verificação obrigatória de Turnstile e origem. Confirmado anon sem SELECT de leads e sem execução da RPC; OWNER válido autorizado pelo helper. Build de produção com VITE_PUBLIC_SITE_PREVIEW=false passou.

Pendente: configurar widget Turnstile, VITE_TURNSTILE_SITE_KEY no build e TURNSTILE_SECRET_KEY/PUBLIC_SITE_ALLOWED_ORIGINS nas Edge Function secrets. Não há ferramenta disponível nesta sessão para criar widget ou gravar esses secrets. O formulário não confirma recebimento no banco sem essa configuração; alternativa WhatsApp disponível. Sem merge, DNS ou db push geral.


Worker existente publicado por Wrangler (a integração automática da branch permanece sem causa confirmada). Versão de produção: 72d5ab9a-f9f2-49c8-8497-1c63373bf31f; bundle index-BOFZZ7ys.js. Domínio preservado: https://doispontozero.renatodesigner.com.br/. Sem merge ou mudanças de DNS.


Smoke test da produção em 2026-10-11: domínio principal retornou HTTP 200 em 1440×900 e 390×844; logo carregada, CTA de briefing abriu `/brief` e `/login` preservou o botão Google. Essa verificação não comprova OAuth Google nem recebimento remoto de leads, que depende dos secrets Turnstile acima. Código preparado para envio na branch `codex/master-audit-15-1`, sem merge na principal.

Verificações remotas pontuais de RLS: helper autorizou o OWNER real e negou outro UID autenticado; anon não possui leitura de leads nem execução da RPC. Consulta de outro UID realizada em transação com rollback. Isso não substitui uma auditoria completa de RLS de todos os módulos.
