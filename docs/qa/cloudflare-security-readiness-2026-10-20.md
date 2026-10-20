# Auditoria de segurança e publicação — 20/10/2026

Idioma: pt-BR. Candidato auditado: branch `feat/escritorio-digital`, commit `ba85aaa`. Árvore limpa no início da auditoria. Esta entrega acrescenta somente o relatório; não publica frontend nem altera banco, funções, segredos ou DNS.

## Parecer

**NO-GO para uma nova promoção de release até reconciliar o candidato com o backend e completar os gates abaixo.** Isso não significa que a aplicação já publicada esteja indisponível. A resposta pública de `/office` foi HTTP 200 com cabeçalhos de segurança presentes. A inspeção é pontual; não certifica todas as rotas nem todos os acessos de tenant.

O relatório fornecido pelo responsável é histórico, de 16/10. Foram revistas suas hipóteses com o código atual e consultas autenticadas somente de leitura ao Supabase. Não foi alterado o estado das homologações do Escritório com base nesta auditoria.

## Achados e critérios de saída

| Prioridade | Evidência atual | Consequência e ação |
|---|---|---|
| Alta | `supabase/functions/team-registration/index.ts:30` usa `public-registration` como identidade compartilhada. O código remoto da função v3 também contém essa constante e não contém chamada `siteverify`. A migration de reserva limita esse bucket a 10 por hora, e o e-mail a 3 por hora. | Um solicitante pode consumir o limite compartilhado e impedir outros cadastros. Existe limite conservador, portanto não se trata de criação ilimitada. Implementar desafio validado no servidor e política por solicitante com origem de IP confiável; manter limite global como proteção adicional. Validar abuso controlado e respostas sem enumeração antes de promover a correção. |
| Alta | Histórico remoto tem 71 migrations; a branch local tem 66. Há cinco nomes equivalentes registrados com timestamps diferentes e cinco entradas remotas sem arquivo correspondente nesta branch. | Não executar `db push` nem reaplicar migrations por nome. Recuperar arquivos canônicos das branches corretas e comparar o conteúdo com objetos remotos antes de reconciliar o histórico. |
| Alta | `.github/workflows/ci.yml:5`/`:7` cobre `principal`/`release/*`, mas o candidato está em `feat/escritorio-digital`. `:36` deixa lint falhar; não há E2E nem dry-run Wrangler. | O workflow versionado não garante CI para push desta branch nem PR destinado a outra branch. Confirmar branch de produção e proteções no GitHub; adicionar gates de PR que executem no destino efetivo. |
| Média | CI usa Node 20 (`ci.yml:25`), mas o Wrangler instalado declara Node >=22; Vite instalado exige ^20.19 ou >=22.12. | Alinhar Node >=22.12 entre CI e Cloudflare antes de acrescentar dry-run/deploy ao pipeline. Node 20 no CI atual pode compilar o Vite se o patch for suficiente; não satisfaz o Wrangler instalado. |
| Média | Build CI define somente `VITE_APP_ENV`, sem validação de URL/chave pública Supabase e flags. | Compilação verde não comprova configuração operacional. Validar os valores públicos esperados sem imprimir tokens, e registrar flags no artefato de release. |
| Revisão | Advisor remoto: 8 RPCs SECURITY DEFINER executáveis por anon e 36 por authenticated. | Algumas são APIs públicas intencionais com token. Revisar corpo, grants, expiração e escopo por tenant; não revogar em massa nem classificar todos os avisos como exploração confirmada. |
| Revisão | Advisor remoto: 17 tabelas com RLS habilitada e sem policy (16 em `private`, uma `public.monthly_editorial_shares`). | Ausência de policy normalmente nega acesso direto aos papéis sujeitos a RLS; não prova exposição. Confirmar grants e acesso exclusivo pelas RPCs previstas. |
| Média | Advisor remoto: proteção contra senhas vazadas desativada. | Avaliar suporte do plano e ativação pelo responsável; nenhuma configuração Auth foi modificada nesta sessão. |

## Divergência de migrations confirmada

Pares local → remoto (mesmo nome descritivo, conteúdo ainda não comparado):

- `20261014143610` → `20261014144312`: client_department_assignments.
- `20261014184243` → `20261014184538`: office_phase02_tenant_data.
- `20261014192432` → `20261014193338`: office_phase03_private_presence.
- `20261014195239` → `20261014195927`: office_phase04_voice_token.
- `20261014204158` → `20261014204735`: livekit_settings_encrypted.

Entradas remotas sem arquivo nesta branch:

- `20261014210119_temporary_office_phase04_qa_fixture`.
- `20261014210529_remove_temporary_office_phase04_qa_fixture`.
- `20261015152642_task_card_covers`.
- `20261018120000_atomic_task_creation`.
- `20261018150000_task_carousel_gallery`.

A migration `20261018230000_office_phase07_voice_invitations` está nos dois inventários. Igualdade de histórico não garante igualdade de schema; os corpos completos, grants e checksums ainda precisam de reconciliação.

## Correções ao relatório histórico

1. `public/_headers` não está envolvido em comentário de bloco: a linha `/*` é um padrão de URL. Não há fechamento `*/`. O domínio entrega os cabeçalhos configurados, conforme a requisição HEAD desta sessão. Não remover essa linha.
2. `wrangler.jsonc` usa Worker Static Assets `doispontozero`, diretório `dist` e fallback `single-page-application`; não contém `previews: {}` nesta revisão.
3. O projeto Supabase pôde ser consultado nesta sessão: `pvkhlobsiszrjtblpruu`, nome `doispontozero`, estado `ACTIVE_HEALTHY`. As funções `team-registration` e `office-room-token` estão ACTIVE, versão 3. `verify_jwt=false` não dispensa autenticação no handler de operações privilegiadas; não foi tratado isoladamente como falha.
4. O código remoto de `office-room-token` contém uma única definição de `createTokenHandler`, valida chamadas privadas e inclui CAMERA e SCREEN_SHARE no issuer. Isso confirma o suporte backend publicado; não comprova captura/transmissão real de dispositivos.

## Verificações executadas

- HEAD de `https://doispontozero.renatodesigner.com.br/office`: HTTP 200, `Content-Type: text/html`, CSP, `Permissions-Policy`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` presentes. HTML: `Cache-Control: public, max-age=0, must-revalidate`. `CF-Cache-Status: HIT` não significa, sozinho, conteúdo obsoleto.
- `npm audit --json` no lockfile atual: zero vulnerabilidades reportadas (413 dependências no inventário). Resultado pontual, não garantia de ausência de vulnerabilidades.
- 871 caminhos rastreados inspecionados por heurística para marcadores de chave privada, tokens GitHub clássicos, chave secreta Supabase e identificador AWS: nenhuma correspondência. Só `.env.example` entre os arquivos de ambiente rastreados; nenhum backup/chave privada nos padrões de nomes consultados. Histórico consultado de `.env`, `.env.local`, `*.pem` e `*.key` sem caminhos retornados. Gitleaks não instalado; isso não equivale a varredura integral de segredos/histórico, JWTs ou valores de alta entropia.
- `git diff --check`: passou antes desta entrega.
- Consultas autenticadas Supabase: projetos, migrations, inventário/código das duas funções e Security Advisor. Não foram consultados registros de clientes nem executados testes de carga/cadastro em produção.
- Suíte funcional/build/E2E não foram repetidos nesta auditoria documental. Os 491 testes aprovados anteriormente são evidência histórica e não substituem CI no SHA de um próximo release.

## Gate para o próximo release

1. Reconciliar migrations e selecionar branch/SHA que preserve também as correções de capa/carrossel existentes no backend.
2. Corrigir proteção do cadastro e validar em staging isolado. O worker de homologação conhecido compartilha backend de produção; não usá-lo como isolamento de banco.
3. Alinhar Node/CI, tornar lint bloqueante, testar E2E críticos e validar build configurado e Wrangler sem publicação.
4. Conferir pipeline real, branch, variáveis, domínio e versão de rollback no painel Cloudflare e CI/proteções no GitHub. Estes itens não foram verificados novamente nesta auditoria.
5. No candidato final, comparar bundle servido com o artefato, testar HTML/assets, deep links, login/logout, isolamento de tenant e fluxo de cada módulo alterado. Guardar SHA, flags, version/deployment ID e resultado do smoke test.

Nenhuma autorização adicional de produção é inferida do texto histórico. A autorização já dada para deploys anteriores não substitui a identificação do próximo candidato.

## Fontes

- [Cloudflare — headers de Static Assets](https://developers.cloudflare.com/workers/static-assets/headers/).
- [Supabase — RPC privilegiada executável por anon](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).
- [Supabase — RPC privilegiada executável por authenticated](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- [Supabase — RLS sem policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- [Supabase — proteção de senhas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

O índice `https://supabase.com/changelog.md` foi solicitado conforme a skill, mas o leitor web retornou erro. Nenhuma implementação dependente de API nova foi feita.
