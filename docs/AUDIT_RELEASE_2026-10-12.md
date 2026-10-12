# Auditoria e release — 2026-10-12

## Resultado do release

- **Branch publicada:** `codex/master-audit-15-1`
- **Commit:** `929699bfb5bba759a520dad3158e708e757af537`
- **Frontend publicado:** <https://doispontozero.marketingrenatodesigner.workers.dev>
- **Versão Cloudflare:** `947f7213-2779-4d44-bbee-7010406b1838`

## Correções incluídas

- Geração de link público de apresentações passou a chamar uma RPC autenticada, com token aleatório e hash persistido no banco.
- Publicação de apresentação registra `published_at`.
- Reações do Team Chat são agrupadas e exibem a contagem correta por emoji.
- Gerador editorial passou a interpretar frequências textuais como `3 vezes por semana` e normalizar datas no calendário local.
- Importador editorial exibe falhas parciais em vez de ocultá-las.
- Migration adicionada: `supabase/migrations/20261012050000_presentation_public_links_rpc.sql`.

## Gates executados

| Gate | Resultado |
|---|---|
| `npm run typecheck` | PASS |
| `npm run lint` | PASS com 519 avisos preexistentes, 0 erros |
| Testes não-DB | PASS — 59 arquivos, 248 testes |
| Regressões focadas de Chat, Apresentações e Editorial | PASS — 3 arquivos, 8 testes |
| `npm run build` | PASS |
| Smoke HTTP `/`, `/login`, `/dashboard`, `/presentations`, `/chat` | PASS — HTTP 200 |
| `/manus-routes.json` | PASS — HTTP 200 e JSON válido |

## Pendências que impedem declarar 100%

1. A execução completa da suíte encontrou **6 falhas em 5 arquivos de integração de banco**: briefing legado/pilot, Drive de tarefas, briefing legado/full, perfil de membro e cadastro de equipe. Os demais testes executados passaram. Essas falhas precisam ser reproduzidas contra uma instância Supabase limpa e analisadas individualmente antes de um selo de produção.
2. A RPC nova foi commitada e publicada no GitHub, mas **não foi aplicada no Supabase remoto** porque o ambiente possui apenas `SUPABASE_URL` e `SUPABASE_KEY`, sem URL de conexão/admin password ou vínculo CLI ao projeto. Aplicar a migration requer acesso administrativo ao projeto Supabase.
3. O lint mantém avisos antigos de imports não usados, mutações de argumentos e efeitos React; não há erros bloqueantes.

## Próximo passo operacional

Aplicar a migration no projeto Supabase `pvkhlobsiszrjtblpruu` com `supabase db push` autenticado ou pelo SQL Editor. Depois, repetir os testes de integração de banco e validar a criação/abertura de um link público de apresentação em ambiente autenticado.

## Atualização em 13/10/2026

A RPC de links foi confirmada aplicada no Supabase remoto. A suite repetida com um worker passou após corrigir o fuso do fixture de aniversário (73 arquivos, 302 testes). Ver o relatório de retomada em `docs/AUDIT_RESUME_2026-10-13.md` para correções e limites de validação atuais.
