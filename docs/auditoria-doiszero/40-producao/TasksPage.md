# TasksPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/tasks`, `/tasks/:taskId`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:208-208`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/TasksPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/TasksPage.tsx:213-213` — `const MOCK_AGENCY_ID = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:43-43` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:73-73` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:108-108` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:131-131` — `.from('task_comments')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:151-151` — `.from('task_attachments')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:170-170` — `.from('task_links')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:186-186` — `.from('task_activity')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:203-203` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:212-212` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:285-285` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:296-296` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:327-327` — `.from('task_assignees')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:335-335` — `await supabase.from('task_activity').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/tasks/hooks/useTasks.ts:373-373` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:35-35` — `.from('projects')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:57-57` — `.from('projects')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:79-79` — `.from('project_boards')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:90-90` — `.from('board_columns')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:98-98` — `.from('tasks')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:132-132` — `const { data, error } = await supabase.rpc('get_project_progress', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:160-160` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:170-170` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:198-198` — `const { data, error } = await supabase.rpc('create_project_with_board', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:239-239` — `.from('projects')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:270-270` — `.from('projects')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:305-305` — `.from('board_columns')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/hooks/useProjects.ts:343-343` — `const { error } = await supabase.from('board_columns').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/lib/supabase/client.ts:43-43` — `supabase.from('agencies').select('id', { head: true }).limit(1),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.

## Abas visíveis no código

`calendar`, `list`
