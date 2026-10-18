# Legado: /clientes/:id/briefing

Página `ClienteBriefing`. Evidência estática: `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/App.tsx:84-84` e `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteBriefing.tsx:1-561`.

Tabelas diretamente referidas: briefing_historico, briefings, clientes. RPCs diretas: nenhuma.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Página e ações | rota acima; código presente | consultar inventário atual 01; equivalência funcional NÃO VERIFICADA | comparação operacional pendente | INVESTIGAR | existência não prova vantagem | copiar contratos legados | fluxo completo testado nos dois lados |

Autorização efetiva, RLS, notificações, histórico e próximo setor: NÃO VERIFICADOS nesta ficha; nomes de tabelas não comprovam persistência em ambiente real. Testes: NÃO TESTADO.

Abas declaradas na linha 396: `<TabsTrigger value="briefing" className="text-xs gap-1.5"><FileText className="w-3 h-3" /> Briefing</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteBriefing.tsx:396-396`.

Abas declaradas na linha 397: `<TabsTrigger value="historico" className="text-xs gap-1.5"><Clock className="w-3 h-3" /> Histórico</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteBriefing.tsx:397-397`.
