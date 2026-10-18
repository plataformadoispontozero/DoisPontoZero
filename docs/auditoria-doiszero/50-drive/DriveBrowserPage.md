# DriveBrowserPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/drive`, `/drive/clients/:clientId`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:226-226`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/DriveBrowserPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:99-99` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:108-108` — `.from('google_connections')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:126-126` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:135-135` — `let query = supabase.from('drive_file_references').select('*').eq('agency_id', agencyId)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:151-151` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:194-194` — `.from('drive_file_references')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:225-225` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:235-235` — `.from('client_drive_folders')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:252-252` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:274-274` — `await supabase.from('client_drive_folders').insert(newFolder)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:288-288` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:305-305` — `await supabase.from('google_connections').upsert(DEMO_GOOGLE_CONNECTION)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:307-307` — `await supabase.from('google_connections').delete().eq('agency_id', agencyId)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/drive/hooks/useDrive.ts:322-322` — `const auth = useAuth()`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
