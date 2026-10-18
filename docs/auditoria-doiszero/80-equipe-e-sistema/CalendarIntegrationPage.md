# CalendarIntegrationPage — auditoria seletiva

Fonte atual: commit `991ccac18b0d1f6de604745034508481d503fa6c`. Rotas: `/settings/integrations/calendar`.

## Matriz

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Rota e interface existente | NÃO VERIFICADO: acesso ao repositório bloqueado | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:497-497`; `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/CalendarIntegrationPage.tsx:1-1` | Código presente; não exercitado nesta auditoria | MANTER NOVO | Preservar base existente enquanto o ganho alternativo não for demonstrado | Substituição pode perder contratos/guards | Baseline do módulo, fluxo autenticado e teste de regressão |
| Solução alternativa do legado | Sem SHA nem fonte recuperados | Rota atual inventariada acima | Comparação lado a lado bloqueada | INVESTIGAR | Não confundir relato com comportamento comprovado | Portar dependências ou regras desconhecidas | Recuperar fonte autorizada e prova funcional antes da decisão |

## Rastro técnico estático

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/GoogleWorkspacePage.tsx:22-22` — `const auth = useAuth();`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/GoogleWorkspacePage.tsx:30-30` — `const auth = useAuth(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/GoogleWorkspacePage.tsx:31-31` — `agency = useAgencyId(),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/GoogleWorkspacePage.tsx:32-32` — `settingsAllowed = usePermission("settings.edit"),`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/settings/GoogleWorkspacePage.tsx:33-33` — `clientsAllowed = usePermission("clients.view"),`

A extração cobre o componente e imports imediatos. Não certifica todos os caminhos transitivos, RPCs remotos ou autorização. Referências de hooks/tabelas não são prova de persistência.

## Contratos a preservar

- Componente, rotas e IDs atuais; autorização em `ProtectedWorkspace` e no backend.
- Entidades atuais, estados de loading/erro e navegação responsiva.
- Não introduzir autenticação, engine, tabelas ou conector paralelo.
- Superfície de mudança: **nenhuma aprovada**. Qualquer estimativa depende do card e da comparação faltante.
- Rollback futuro: PR isolado e contrato compatível; evitar apagar dados e reverter migrations destrutivamente.

## Testes

Nesta execução: **NÃO TESTADO** operacionalmente. Somente leitura de fonte. Resultados históricos gerais não homologam automaticamente esta aba. Testes futuros: papéis permitidos/negados, erro de API, refresh, mobile e persistência coerente entre setores.
