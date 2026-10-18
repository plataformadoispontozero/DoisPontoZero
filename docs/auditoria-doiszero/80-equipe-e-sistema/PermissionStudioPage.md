# PermissionStudioPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/settings/permissions`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:617-617`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:12-12` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:23-23` — `supabase.from('roles').select('id, name').eq('agency_id', agencyId).order('name'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:24-24` — `supabase.from('permissions').select('id, permission_key, module, description').order('permission_key'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:30-30` — `const result = permissionIds.length ? await supabase.from('role_permissions').select('role_id, permission_id, allowed').in('role_id', permissionIds) : { data: [], error: null }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/PermissionStudioPage.tsx:47-47` — `const { error } = await supabase.rpc('set_agency_role_permissions', { p_agency_id: agencyId, p_changes: changes })`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/lib/supabase/client.ts:43-43` — `supabase.from('agencies').select('id', { head: true }).limit(1),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:252-252` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:253-253` — `const currentAgencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:262-262` — `.from('agency_branding')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:284-284` — `.from('agency_branding')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:312-312` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:313-313` — `const currentAgencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:322-322` — `.from('agency_preferences')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:342-342` — `.from('agency_preferences')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:370-370` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:371-371` — `const currentAgencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:380-380` — `.from('agency_document_settings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:400-400` — `.from('agency_document_settings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:428-428` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/hooks/useAgencySettings.ts:429-429` — `const currentAgencyId = useAgencyId()`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
