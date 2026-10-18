# Legado: /equipe/:userId

Página `ColaboradorProfile`. Evidência estática: `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/App.tsx:97-97` e `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ColaboradorProfile.tsx:1-367`.

Tabelas diretamente referidas: avaliacoes_estrategia, clientes, profiles, ranking_mensal, user_roles. RPCs diretas: nenhuma.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Página e ações | rota acima; código presente | consultar inventário atual 01; equivalência funcional NÃO VERIFICADA | comparação operacional pendente | INVESTIGAR | existência não prova vantagem | copiar contratos legados | fluxo completo testado nos dois lados |

Autorização efetiva, RLS, notificações, histórico e próximo setor: NÃO VERIFICADOS nesta ficha; nomes de tabelas não comprovam persistência em ambiente real. Testes: NÃO TESTADO.
