# Recovery 02 — contratos verificados no código local

Data: 11/10/2026. Checkout: `/Users/designer/Documents/DoisPontoZero`; branch `codex/master-audit-15-1`; base `1120f9088a159705e550097fd42c58683babc7dd`. Alterações existentes preservadas. Fonte: nove migrations locais e consumidores TypeScript; não equivale ao schema remoto aplicado.

## Autenticação e agência

| Recurso | Contrato local | Consumidor/limite |
|---|---|---|
| auth.users | UUID administrado pelo Supabase Auth | SDK getSession, onAuthStateChange, getUser, signInWithPassword, signOut; nenhum usuário criado |
| profiles | id FK auth.users, full_name, avatar_url, timestamps | AuthProvider lê o próprio perfil; não possui agency_id na migration 01 |
| agencies | id, name, slug, status active/suspended/archived | Apenas agências active entram no seletor |
| agency_members | agency_id, user_id, role_id, status active/invited/suspended; unique agência/usuário | Consulta por usuário autenticado e status active; agência selecionada deve constar no resultado |
| roles | id, agency_id, name, is_system; unique agência/nome | Papel vem do vínculo, nunca de formulário/localStorage |
| permissions | id, permission_key, module, description | Catálogo global; leitura autenticada prevista na migration |
| role_permissions | role_id, permission_id, allowed; unique papel/permissão | AuthProvider lê concessões do papel selecionado; OWNER especial corresponde ao helper SQL histórico |
| agency_invitations | token_hash, role_id, invited_by, expires_at | Entrega e aceite seguro ainda bloqueados |
| audit_logs | eventos de agência/ator | Trilha necessária para operações administrativas; não homologada remotamente |

`src/lib/supabase/client.ts` reutiliza o SDK existente com chave pública. Sessão e renovação pertencem ao SDK; a aplicação armazena somente a preferência de agência, validada novamente contra memberships. Nenhuma senha/token é persistida por mecanismo próprio.

## Contexto e consumidores

AuthProvider envolve AppProviders. QueryClient, Branding e Toast são remontados por usuário/agência; cache anterior é cancelado e limpo. AppLayout, Sidebar, MobileNav, TopBar, Dashboard, páginas principais e hooks passam a consumir agência/ator do contexto. ProtectedWorkspace valida sessão, membership e permissão de rota antes do layout privado. Filtros frontend não substituem RLS. Realtime deve ser reinscrito após troca de contexto; validação efetiva do servidor permanece BLOCKED.

Rotas públicas mantidas fora do guard: `/b/:publicToken`, `/p/:publicToken`, `/showcase/:publicToken`. Briefing usa get_public_briefing(p_token_hash); showcase usa get_public_showcase(p_token). Proposta está bloqueada fora da demonstração local até reconciliar get_public_proposal: a função histórica também grava eventos/status e referencia colunas inexistentes no contrato inicial. Nenhum teste chama essa RPC no projeto remoto.

## Permission Studio

Leitura real: roles da agência, permissions, grants dos role_ids retornados. OWNER protegido na UI. Salvamento explicitamente bloqueado: set_agency_role_permissions não está confirmado no histórico/schema remoto. Há rascunho fora de migrations, `supabase/pending/agency_recovery.sql`; não aplicado nem validado em PostgreSQL. Não houve salvamento simulado.

## Incompatibilidades a reconciliar

- Migration 08: políticas usam profiles.agency_id, ausente na migration 01 e incompatível com múltiplas memberships.
- Membership.role_id referencia roles.id, mas falta constraint composta para garantir que papel e vínculo pertencem à mesma agência. SQL incremental deverá impedir papel externo e promoção administrativa indevida.
- Política de último OWNER protege DELETE por contagem, porém UPDATE também precisa impedir rebaixamento/suspensão do último OWNER e concorrência.
- get_public_proposal usa clients.company_name/agencies.primary_color ausentes no schema inicial; não verifica explicitamente status publicado antes de retornar e realiza writes de visualização.
- Helpers/RPCs de fases posteriores divergem em search_path e privilégios EXECUTE. Policies amplas FOR ALL não implementam todas as permissões por ação.
- Storage/Reatime e catálogo remoto de functions/policies/constraints não foram exportados; 89 respostas HTTP 200 históricas não comprovam esses contratos.

Não alterar as migrations históricas. Próximo passo: exportação administrativa somente leitura do schema/histórico, comparação, migrations incrementais revisadas e execução apenas em staging descartável autorizado.
