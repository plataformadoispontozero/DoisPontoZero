# MonthlyEditorialPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/editorial`, `/editorial/new`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:86-86`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:59-59` — `const agency = useAgencyId(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:90-90` — `.from("clients")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:100-100` — `const historicalBriefs=useQuery({queryKey:['editorial-legacy-briefs',agency,client],enabled:!!client,queryFn:async()=>{const r=await supabase!.from('client_legacy_records').select('id,payload,source_created_at').eq('agen`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:101-101` — `const historicalStrategies=useQuery({queryKey:['editorial-legacy-strategies',agency,client],enabled:!!client,queryFn:async()=>{const r=await supabase!.from('client_legacy_records').select('id,payload,source_created_at').`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:111-111` — `.from("briefings")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:125-125` — `const r = await supabase!.rpc("get_editorial_briefing", {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:145-145` — `.from("monthly_editorial_campaigns")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:158-158` — `let request = supabase!.from("monthly_editorial_campaigns").select("*").eq("agency_id", agency).eq("id", params.get("campaignId")!);`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:170-170` — `.from("monthly_editorial_feedback")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:189-189` — `.from("editorial_campaign_versions")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:239-239` — `const r = await supabase.rpc("save_monthly_editorial", {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:739-739` — `const r = await supabase!.rpc("share_monthly_editorial", {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:1115-1115` — `const r = await supabase!.rpc("produce_monthly_editorial", {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/lib/supabase/client.ts:43-43` — `supabase.from('agencies').select('id', { head: true }).limit(1),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:22-22` — `.from("content_strategies")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:41-41` — `.from("editorial_pillars")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:61-61` — `.from("editorial_idea_registry")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:90-90` — `const result=await supabase!.from('client_legacy_records').select('id,payload').eq('agency_id',agency).eq('client_id',client).eq('source_kind','calendarios').order('id').range(page*100,page*100+99);`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:98-98` — `.from("content_strategies")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:106-106` — `.from("content_ideas")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/useCampaignInputs.ts:144-144` — `.from("editorial_repertoire_versions")`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/RepertoireEditor.tsx:16-16` — `const auth = useAuth(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/RepertoireEditor.tsx:75-75` — `const r = await supabase!.rpc("save_editorial_repertoire", {`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
