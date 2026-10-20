# Legado: /aprovacoes

Página `Aprovacoes`. Evidência estática: `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/App.tsx:74-74` e `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/Aprovacoes.tsx:1-452`.

Tabelas diretamente referidas: calendar_approvals, calendar_content_edits, calendarios, client_assignments, clientes, demand_comments, demand_status_history, demands, historico_aprovacao_calendario, profiles. RPCs diretas: nenhuma.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Página e ações | rota acima; código presente | consultar inventário atual 01; equivalência funcional NÃO VERIFICADA | comparação operacional pendente | INVESTIGAR | existência não prova vantagem | copiar contratos legados | fluxo completo testado nos dois lados |

Autorização efetiva, RLS, notificações, histórico e próximo setor: NÃO VERIFICADOS nesta ficha; nomes de tabelas não comprovam persistência em ambiente real. Testes: NÃO TESTADO.

Abas declaradas na linha 273: `<TabsTrigger value="aprovacoes" className="text-[12px]">Aprovações do cliente</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/Aprovacoes.tsx:273-273`.

Abas declaradas na linha 274: `<TabsTrigger value="liberacao" className="text-[12px]">Liberar para produção{libCount ?  (${libCount}) : ''}</TabsTrigger>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/Aprovacoes.tsx:274-274`.

Abas declaradas na linha 305: `<TabsList className="h-9"><TabsTrigger value="atuais" className="text-[12px]">Atuais</TabsTrigger><TabsTrigger value="arquivados" className="text-[12px]">Arquivados</TabsTrigger></TabsList>`. Evidência `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/Aprovacoes.tsx:305-305`.
