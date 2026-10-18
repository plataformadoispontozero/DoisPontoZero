# DashboardPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/dashboard`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:106-106`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/DashboardPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/DashboardPage.tsx:30-30` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:10-10` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:18-18` — `supabase.from('projects').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:19-19` — `supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).in('status', ['open','in_progress','review']),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:20-20` — `supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).in('status', ['open','in_progress','review']).gte('due_date', now.toISOString().slice(0,10)).lte('due_date', end.toISOString()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:21-21` — `supabase.from('proposals').select('id', { count: 'exact', head: true }).eq('agency_id', agencyId).eq('status', 'internal_review'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:22-22` — `supabase.from('projects').select('id,name,status,due_date,clients(name)').eq('agency_id', agencyId).order('updated_at', { ascending: false }).limit(5),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:23-23` — `supabase.from('tasks').select('id,title,priority,status,due_date,projects(name,clients(name)),task_assignees!inner(user_id)').eq('agency_id', agencyId).eq('task_assignees.user_id', auth.user?.id || '').in('status',['open`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:24-24` — `supabase.from('meetings').select('id,title,starts_at,location_type,meeting_url').eq('agency_id', agencyId).eq('status','scheduled').gte('starts_at', now.toISOString()).order('starts_at', { ascending: true }).limit(3),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/dashboard/data/useDashboardData.ts:25-25` — `supabase.from('audit_logs').select('id,action,entity_type,created_at').eq('agency_id', agencyId).order('created_at', { ascending: false }).limit(5),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/lib/supabase/client.ts:43-43` — `supabase.from('agencies').select('id', { head: true }).limit(1),`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
