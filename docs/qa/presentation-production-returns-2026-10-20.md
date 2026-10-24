# Avaliações do cliente → produção

- Painel com miniatura, comentário, status, filtros e histórico separado da última decisão.
- Reenvio permite reabrir uma demanda de produção acessível do mesmo cliente ou criar ajuste por setor.
- Nova demanda sem responsável/prazo; projeto de ajustes criado quando necessário e reutilizado por apresentação.
- Comentário do cliente, material e caminho da apresentação registrados na conversa e atividade da demanda.
- Reenvios idempotentes por avaliação; avaliações antigas e aprovadas bloqueadas no servidor.
- RPC exige apresentações.edit, tasks.move e tasks.comment; criação também exige tasks.create e, quando necessário, projects.create.
- Tabela de recibos com RLS e somente leitura para usuários com presentations.view; escrita exclusivamente pelo RPC autenticado.

## Validação

- 65 testes em 20 arquivos de apresentações aprovados; seis casos novos cobrem painel e confirmação.
- Typecheck e builds produção/homologação aprovados.
- Supabase: fixtures transacionais com rollback validaram criação, reabertura, responsável preservado, remoção de completed_at, comentário, idempotência e rejeição de avaliação antiga/aprovada/sem sessão.
- Detectada assinatura legada de create_task_with_assignees publicada. Correção isolada: RPC de reenvio insere a nova demanda na mesma transação após validar projeto/quadro/coluna/permissões, sem alterar o RPC legado global.
- Conselheiro de segurança: sem apontamentos para a nova tabela/RPC. Permanecem apontamentos preexistentes de funções públicas, tabelas privadas e proteção de senhas vazadas desativada.
- UI real em produção: 2 pendentes / 1 aprovado; miniaturas e botões presentes. Diálogo carregou destinos, setor e projeto. Cancelado sem criar demandas reais.
- Screenshot: /tmp/dois-production-review-panel-20261020.png.

## Publicação

- Migrações 20261020214759 e 20261020215238 aplicadas ao projeto pvkhlobsiszrjtblpruu.
- Produção Worker dc57e968-b864-43d2-a44a-d0f3127dac70.
- Homologação reconstruída com controles, chamadas e mídia habilitados; produção mantém chamadas e mídia desabilitados conforme configuração existente.
- Homologação Worker e0673f85-c1df-4a3f-b6e9-3977e15ea31f.
