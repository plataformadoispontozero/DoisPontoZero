# ChatPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/chat`, `/chat/channels/:channelId`, `/chat/direct/:conversationId`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:464-464`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/ChatPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/ChatPage.tsx:41-41` — `const agencyId = useAgencyId()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:87-87` — `client.from('agency_members').select('agency_id, role_id, agencies(id, name, status), roles(id, name)').eq('user_id', user.id).eq('status', 'active'),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:88-88` — `client.from('profiles').select('full_name, avatar_url').eq('id', user.id).maybeSingle(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:102-102` — `const { data, error } = await client.from('role_permissions').select('allowed, permissions(permission_key)').eq('role_id', activeAgency.roleId).eq('allowed', true)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:144-144` — `export function useAuth() {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:149-149` — `export function useAgencyId() { return useAuth().activeAgency?.agencyId ?? '' }`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:150-150` — `export function usePermission(key: string) {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useRoomPresence.ts:7-7` — `const auth=useAuth(),agency=auth.activeAgency?.agencyId,userId=auth.user?.id`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useRoomPresence.ts:10-10` — `useEffect(()=>{if(!visible||!agency||!userId||!channelId||!supabase||!isSupabaseConfigured)return;const client=supabase;return()=>{void client.rpc('leave_chat_work_room',{p_agency:agency,p_channel:channelId}).then(()=>un`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useRoomPresence.ts:11-11` — `return useQuery({queryKey:['chat_room_presence',agency,channelId,userId],enabled:!!(visible&&agency&&userId&&channelId&&supabase&&isSupabaseConfigured),refetchInterval:15000,queryFn:async():Promise<RoomParticipant[]>=>{c`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:152-152` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:163-163` — `const { data , error: backendError1 } = await supabase.rpc('chat_directory', {p_agency: agencyId})`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:176-176` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:187-187` — `const { data , error: backendError2 } = await supabase.rpc('chat_directory', {p_agency: agencyId})`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:200-200` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:239-239` — `let query = supabase.from('chat_messages').select('*, profiles:sender_id(full_name), chat_attachments(*), chat_reactions(*)').eq('agency_id', agencyId).is('deleted_at', null).order('created_at', { ascending: false }).lim`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:259-259` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:276-276` — `const { data, error } = await supabase.from('chat_messages').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:325-325` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:342-342` — `const { data: id, error } = await supabase.rpc('chat_create_channel', {p_agency:agencyId,p_name:payload.name.trim(),p_description:payload.description||'',p_type:payload.channel_type,p_visibility:payload.visibility,p_memb`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:370-370` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:379-379` — `const { data: existing, error: readError } = await supabase.from('chat_reactions').select('id').eq('agency_id', agencyId).eq('message_id', messageId).eq('user_id', auth.user.id).eq('emoji', emoji).maybeSingle()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:382-382` — `? await supabase.from('chat_reactions').delete().eq('id', existing.id).eq('agency_id', agencyId).eq('user_id', auth.user.id)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/hooks/useChat.ts:383-383` — `: await supabase.from('chat_reactions').insert({ agency_id: agencyId, message_id: messageId, user_id: auth.user.id, emoji })`
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

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
