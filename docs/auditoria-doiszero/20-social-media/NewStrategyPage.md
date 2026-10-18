# NewStrategyPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/strategy/new`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:317-317`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/NewStrategyPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/NewStrategyPage.tsx:74-74` — `const DEMO_AGENCY_ID = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:111-111` — `.from('briefing_templates')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:143-143` — `.from('briefing_templates')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:191-191` — `const {data,error}=await supabase.rpc('save_briefing_template',{p_agency:agencyId,p_source_template:payload.source_template_id||null,p_payload:{...payload,status:payload.status||'draft',save_request_id:payload.save_reque`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:213-213` — `.from('briefings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:241-241` — `const agencyId=useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:249-249` — `.from('briefings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:300-300` — `.from('briefing_templates')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:311-311` — `.from('briefings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:328-328` — `await supabase.from('briefing_activity').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:364-364` — `.from('briefings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:372-372` — `await supabase.from('briefing_activity').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:409-409` — `const { error } = await supabase.from('briefing_public_links').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:420-420` — `.from('briefings')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:425-425` — `await supabase.from('briefing_activity').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:118-118` — `.from('clients')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:144-144` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:155-155` — `.from('clients')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:198-198` — `.from('clients')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:237-237` — `.from('clients')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/hooks/useClients.ts:272-272` — `.from('clients')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:301-301` — `.from('content_strategies')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:334-334` — `.from('content_strategies')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:385-385` — `.from('content_strategies')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:411-411` — `await supabase.from('strategy_activity').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:436-436` — `.from('content_strategies')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:457-457` — `const { data, error } = await supabase.rpc('delete_content_strategy', { p_agency_id: agencyId, p_strategy_id: strategyId })`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:484-484` — `.from('editorial_pillars')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:516-516` — `.from('editorial_pillars')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:551-551` — `.from('editorial_pillars')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:574-574` — `.from('editorial_pillars')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:606-606` — `.from('content_ideas')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:645-645` — `.from('content_ideas')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:682-682` — `.from('content_ideas')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/strategy/hooks/useStrategy.ts:715-715` — `.from('editorial_items')`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
