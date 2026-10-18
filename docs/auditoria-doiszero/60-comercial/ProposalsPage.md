# ProposalsPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/proposals`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:331-331`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/ProposalsPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:103-103` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:112-112` — `.from('proposals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:146-146` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:157-157` — `.from('proposals')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:193-193` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:202-202` — `.from('agency_services')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:222-222` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:231-231` — `.from('proposal_templates')`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:251-251` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:269-269` — `const { data, error } = await supabase.rpc('create_agency_proposal', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:360-360` — `await supabase.from('proposals').insert({`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:386-386` — `const auth = useAuth()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:403-403` — `const { data, error } = await supabase.rpc('save_agency_proposal', {`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/proposals/hooks/useProposals.ts:452-452` — `await supabase.from('proposals').update({`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
