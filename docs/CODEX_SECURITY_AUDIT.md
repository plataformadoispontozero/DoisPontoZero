> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# SECURITY AUDIT

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Bloqueadores P0 e P1

**P0: rotas internas sem guarda e identidade administrativa demonstrativa.** Evidências: src/app/providers/AppProviders.tsx sem AuthProvider; src/app/router/index.tsx sem ProtectedRoute; Sidebar com Admin Operações/admin@doiszero.local e logout somente toast; TopBar com logout alert. Login, forgot/reset não existem. Configurar URL/chave Supabase não cria sessão autenticada. Publicar esse frontend nessas condições é bloqueado. Não foi comprovado vazamento de dados remotos: isso depende das policies efetivas, ainda não auditadas com usuários A/B.

**P0: autorização multiagência não homologada.** Há SQL RLS local, mas não há catálogo remoto pg_policies/pg_proc/grants acessível. Policies e SECURITY DEFINER precisam verificar membership com EXISTS e tenant explícito, não assumir associação única. Conferir search_path fixo, EXECUTE por papel, WITH CHECK de tenant, membros removidos e RPCs públicos sanitizados. A mudança do Permission Studio impede sucesso simulado, mas não implementa RBAC completo.

**P1: schema e RPCs incompatíveis na cadeia local.** Ver inventário de migrations abaixo. Não aplicar os nove arquivos cegamente em um banco existente.

**P1: conexão não é autorização.** Corrigido checkSupabaseHealth: PGRST205, permission denied ou schema indisponível não passam como conectado. Uma consulta de metadados com limit=0 retornando 200 comprova relação exposta ao PostgREST; não comprova leitura de linhas, RLS correta ou login.

## Segredos e ambiente

Varredura de 302 blobs alcançáveis no histórico local: nenhum padrão reconhecido de private key, service_role JWT, sb_secret_, sbp_, tokens GitHub ou AWS encontrado. Evidência [history-secret-scan.json](evidence/history-secret-scan.json). Não certifica todos os formatos nem branches remotas não baixadas. Não houve impressão/cópia de credenciais. Clone sem .env operacional. .gitignore reforçado para .env.*, preservando .env.example; .wrangler e supabase/.temp ignorados. VITE_* é público: jamais colocar service role, Google client secret ou token administrativo nesse namespace.

## Nove migrations: análise estática, não execução SQL

| Arquivo | Evidência/risco |
|---|---|
| 20261010000001_phase02_schema_and_rls.sql | profiles sem agency_id; permissions.id UUID e permission_key/module/description definem contrato base |
| 20261010000002_phase04_projects_tasks.sql | tasks.created_by e board obrigatórios, statuses open/in_progress/review/done/archived; contrato que RPC posterior viola |
| 20261010000003_phase05_squads.sql | revisar DEFINER/search_path/grants e score; schema gamificação incompleto |
| 20261010000004_phase06_briefings.sql | seed fornece texto briefings.view em permissions.id UUID |
| 20261010000005_phase07_strategy.sql | coluna references sem aspas; seed usa permissions.action inexistente e diverge do contrato permission_key |
| 20261010000006_phase08_proposals.sql | seed usa permissions.name inexistente/texto em UUID |
| 20261010000007_phase09_drive_presentations.sql | mesmo conflito permissions.name/id; OAuth ausente no backend local |
| 20261010000008_phase10_meetings_chat.sql | policies usam profiles.agency_id inexistente; RPC assignee_id ausente, status todo inválido, omite created_by e pode faltar board; policies sem estratégia de reaplicação |
| 20261010000009_phase11_whitelabel.sql | depende dos helpers/contratos anteriores; validar tenant e grants antes de aplicação |

Há funções DEFINER sem search_path explícito em arquivos 03/05/06/07/08. São riscos locais a confirmar no catálogo remoto, não prova de que esse SQL foi aplicado. Não foi encontrado índice único de client_message_id para idempotência do chat. Storage e Realtime privados não receberam aceite de isolamento.

## Testes de segurança que faltam

BLOCKED: Agência A/B leitura/escrita negada; membro removido; usuário sem permissão; chat privado; download privado; token expirado/revogado e dados sanitizados; alteração de OWNER; grants RPC e cache após logout/troca de tenant. Requerem staging, duas agências, usuários de papéis distintos e fixtures autorizadas. Não executar ataques/escritas no banco existente para suprir esse bloqueio.

Headers em public/_headers incluem nosniff, frame-ancestors, CSP e política de referrer. CSP permite unsafe-inline e imagens https genéricas: endurecimento exige testar PDFs/fontes/OAuth. Headers não comprovam Auth/RLS e o preview Vite não simula sua aplicação Cloudflare.
