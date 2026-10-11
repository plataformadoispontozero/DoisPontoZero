# Diagnóstico Cloudflare — 2026-10-11

Commit local e remoto: `29104f5`, branch `codex/master-audit-15-1`, árvore limpa.

## Verificações realizadas

- `npm run build`: passou.
- `npm run test`: 23 arquivos, 99 testes passaram.
- `npx wrangler deploy --dry-run`: passou; 95 arquivos de assets identificados, sem publicação.
- Hospedagem: Workers Static Assets; `assets.not_found_handling = single-page-application`.
- `public/_redirects` contém apenas comentários; não há a antiga regra de loop.
- Domínio `/login` responde com o bundle anterior `index-IwUJ-zKi.js`; o build local gera `index-CBXje3mK.js`.
- Última implantação ativa consultada: `dbb0309e-432f-4f95-a201-de99d4181e1e`.

## Limite do diagnóstico

O painel enviado mostra falhas de preview da branch. O log do build `b4050dcf-7aac-46cd-93e3-a69c2df479f9` ainda não foi fornecido e não há ferramenta de leitura do navegador autenticado disponível. Não é possível atribuir uma causa exata à falha remota com base apenas no print. O sucesso local não comprova as variáveis, versão Node, token ou comandos configurados no Workers Builds.

Previews de branches não promovem automaticamente a versão para produção. A configuração do painel deve ser conferida com o log: comando de build `npm run build`, comando de produção `npx wrangler deploy`, comando de preview conforme a configuração atual do Workers Builds (tradicionalmente `npx wrangler versions upload`).

Fonte oficial: https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/

## Próximo passo

Obter o trecho final do log remoto, corrigir a causa demonstrada e validar a publicação apropriada. Nenhum deploy, merge, alteração de DNS ou alteração de banco foi executado nesta verificação.

## Publicação de preview

Upload real concluído para commit 29104f5 com `wrangler versions upload --preview-alias codex-master-audit-15-1 --keep-vars`. Versão: `2cf1bc6a-3ca6-4dbc-b488-ff03e7a2c1db`.

URL: https://codex-master-audit-15-1-doispontozero.marketingrenatodesigner.workers.dev

Somente preview; produção não promovida. O log do pipeline GitHub continua necessário para identificar sua falha.
