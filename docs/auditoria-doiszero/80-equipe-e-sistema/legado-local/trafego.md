# Legado: /trafego

Página `GestaoTrafego`. Evidência estática: `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/App.tsx:90-90` e `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:1-438`.

Tabelas diretamente referidas: acompanhamento_semanal_trafego, campaign_metrics, campanhas_trafego, client_assignments, clientes, gestao_trafego. RPCs diretas: nenhuma.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Página e ações | rota acima; código presente | consultar inventário atual 01; equivalência funcional NÃO VERIFICADA | comparação operacional pendente | INVESTIGAR | existência não prova vantagem | copiar contratos legados | fluxo completo testado nos dois lados |

Autorização efetiva, RLS, notificações, histórico e próximo setor: NÃO VERIFICADOS nesta ficha; nomes de tabelas não comprovam persistência em ambiente real. Testes: NÃO TESTADO.

Abas declaradas na linha 245: `<TabsTrigger value="meta">Meta Ads</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:245-245`.

Abas declaradas na linha 246: `<TabsTrigger value="campanhas">Campanhas manuais</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:246-246`.

Abas declaradas na linha 247: `<TabsTrigger value="clients">Clientes</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:247-247`.

Abas declaradas na linha 248: `<TabsTrigger value="weekly">Acompanhamento Semanal</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:248-248`.

Abas declaradas na linha 249: `<TabsTrigger value="dashboard">Dashboard</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:249-249`.

Abas declaradas na linha 250: `<TabsTrigger value="demandas">Demandas</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/GestaoTrafego.tsx:250-250`.
