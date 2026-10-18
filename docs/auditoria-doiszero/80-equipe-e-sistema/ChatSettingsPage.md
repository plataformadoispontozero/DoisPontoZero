# ChatSettingsPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/chat/settings`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:482-482`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/chat/ChatSettingsPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

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

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
