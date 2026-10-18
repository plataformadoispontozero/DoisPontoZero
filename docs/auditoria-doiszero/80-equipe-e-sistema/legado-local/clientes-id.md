# Legado: /clientes/:id

Página `ClienteDetail`. Evidência estática: `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/App.tsx:80-80` e `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteDetail.tsx:1-553`.

Tabelas diretamente referidas: calendarios, clientes, profiles. RPCs diretas: nenhuma.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Página e ações | rota acima; código presente | consultar inventário atual 01; equivalência funcional NÃO VERIFICADA | comparação operacional pendente | INVESTIGAR | existência não prova vantagem | copiar contratos legados | fluxo completo testado nos dois lados |

Autorização efetiva, RLS, notificações, histórico e próximo setor: NÃO VERIFICADOS nesta ficha; nomes de tabelas não comprovam persistência em ambiente real. Testes: NÃO TESTADO.

Abas declaradas na linha 283: `<TabsTrigger key={t.v} value={t.v}`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteDetail.tsx:283-283`.
