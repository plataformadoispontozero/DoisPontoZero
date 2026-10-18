# SquadsPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/squads`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:220-220`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadsPage.tsx:1203-1203` — `const MOCK_AGENCY_ID = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/SquadMembersPanel.tsx:8-8` — `const team=useAgencyTeam(agencyId),add=useAddSquadMember(squad.id,agencyId),remove=useRemoveSquadMember(squad.id,agencyId),canEdit=usePermission('squads.manage_members');`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:40-40` — `.from('squads')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:63-63` — `.from('squads')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:85-85` — `.from('squad_goals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:101-101` — `.from('squad_goals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:118-118` — `.from('squad_performance_snapshots')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:140-140` — `.rpc('compute_squad_ranking', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:222-222` — `.from('squads')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:254-254` — `.from('squads')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:279-279` — `.from('squads')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:300-300` — `.from('squad_members')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:324-324` — `.from('squad_members')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:347-347` — `.from('squad_goals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:396-396` — `.from('squad_goals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/squads/hooks/useSquads.ts:419-419` — `const { data, error } = await supabase.rpc('upsert_performance_snapshot', {`
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

## Abas visíveis no código

`goals`, `performance`, `ranking`, `squads`
