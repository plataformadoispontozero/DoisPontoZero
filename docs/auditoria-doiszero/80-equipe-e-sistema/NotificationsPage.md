# NotificationsPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/notifications`, `/settings/notifications`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:489-489`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/NotificationsPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:53-53` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:64-64` — `if(['OWNER','ADMIN','MANAGER'].includes(auth.activeAgency?.roleName||'')){const birthday=await supabase.rpc('sync_member_birthdays',{p_agency:agencyId});if(birthday.error)throw birthday.error;}`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:65-65` — `const { data , error: backendError1 } = await supabase.from('notifications').select('*').eq('agency_id', agencyId).eq('recipient_id', auth.user?.id || '').order('created_at', { ascending: false })`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:78-78` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:86-86` — `const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id',id).eq('agency_id',agencyId).eq('recipient_id',auth.user?.id || '').select('id').single()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:101-101` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/notifications/hooks/useNotifications.ts:109-109` — `const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('agency_id',agencyId).eq('recipient_id',auth.user?.id || '').is('read_at',null)`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
