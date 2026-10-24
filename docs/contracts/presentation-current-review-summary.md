# Resumo interno de avaliações atuais de apresentação

`get_presentation_current_review(p_agency uuid,p_presentation uuid)` exige autenticação, `presentations.view` e vínculo da apresentação à agência.

Retorna:

- `total`, `approved`, `adjustments`, `pending`: quantidades de materiais atuais; ajustes incluem `changes_requested` e `rejected`.
- `reviews`: última decisão de cada material no link não revogado mais recente, somente se a impressão digital corresponder ao conteúdo atual.
- `history`: demais avaliações, separadas explicitamente; não representam aprovação atual.
- `completion`: `{completedAt,total}` ou null; somente conclusão do mesmo link/conteúdo, com todos os materiais ainda aprovados.
- `linkGeneratedAt`: data real do link considerado ou null.

Cada review contém `id`, `agency_id`, `presentation_id`, `asset_id`, `public_link_id`, `decision`, `note`, `created_at`.

Expiração de link não apaga avaliações recebidas. Revogação retira o link do resumo atual. Conteúdo alterado, novo link ou avaliações antigas sem impressão digital não herdam aprovação. O histórico continua acessível à equipe autorizada. Nenhum token, segredo ou identificador de conteúdo interno é retornado.

Não executamos testes nem mutações em dados reais. Migração `20261023114742_presentation_current_review_summary.sql` depende da migração de impressão digital/conclusão `20261023113323`.

## Link amigável escolhido

A implementação do integrador usa `/apresentacao/:clientSlug/:accessKey`, com o token atual de 192 bits convertido de 48 caracteres hexadecimais para 32 caracteres base64url. A segurança e as APIs existentes são preservadas; o nome do cliente é somente visual. O token é decodificado em memória, sem tabela de alias ou mudança na Edge Function. Não houve alteração do backend de compartilhamento nesta entrega.
