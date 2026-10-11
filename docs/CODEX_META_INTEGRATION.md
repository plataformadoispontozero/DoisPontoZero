# Prompt 17 — META INTEGRATION

Data: 11/10/2026. Status: **BLOCKED_EXTERNAL**. Execução exclusivamente local.

Rotas: /settings/integrations/meta planejada, NÃO registrada.

## Implementação e inventário

Usuário confirmou que ainda precisa criar aplicativo Meta. Não há OAuth Meta, tokens, callbacks ou chamadas de publicação implementados.

## Banco, permissões e bloqueios

Dependência de segurança A e staging. Backend confiável deverá validar sessão/membership, state aleatório uso único com expiry e vínculo ao usuário/agência; callback restrito, troca de código somente no servidor, permissões e ownership dos ativos. Secrets/tokens backend restritos e cifrados; nunca VITE, localStorage ou tabela legível pelo cliente. PKCE só se documentado para o fluxo escolhido.

Nenhuma migration remota, SQL remoto, deploy, push, merge, DNS ou operação Meta realizada. Contrato remoto completo e histórico de migrations ainda não reconciliados. Não declarar COMPLETED.

## Testes, evidências e próxima ação

Consultar CODEX_OPERATIONAL_TESTS.md, PROMPT_17_INVENTORY.json e a story docs/stories/prompt-17-operational-recovery.md. Mocks comprovam somente frontend; teste real de integração desta capacidade: NOT_RUN. Preparação do staging em staging/README.md; homologar base antes da fase dependente.

## Requisitos para criação do aplicativo

Criar aplicativo para a agência no Meta for Developers e configurar produto/fluxo compatível com Pages, Instagram profissional e ad accounts. Facebook Login e Instagram Login têm capacidades e nomes de escopos distintos; não combinar por suposição. Capacidade de anúncios somente leitura inicialmente, sem ads_management. Elaborar matriz endpoint/formato/escopo/nível de acesso e confirmar App Review/Advanced Access aplicáveis a ativos de clientes. Definir política de privacidade, exclusão de dados, callback HTTPS controlado e contas de teste autorizadas. Compartilhar apenas App ID; App Secret fica no backend.

Fontes primárias consultadas: [coleção Instagram mantida pela Meta](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [changelog Graph API](https://developers.facebook.com/docs/graph-api/changelog/), [Insights Marketing API](https://developers.facebook.com/docs/marketing-api/insights/). Em 11/10/2026, endpoints de documentação developers.facebook.com devolveram HTTP 429; página Postman carregou parcialmente. Versão vigente e matriz exata de permissões não confirmadas; não fixar versão presumida nem declarar esse gate PASS. Revisar documentação no momento da implementação e fixar versão explícita suportada no backend.
