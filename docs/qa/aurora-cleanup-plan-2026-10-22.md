# Plano de limpeza Aurora Café — 22/10/2026

## Escopo comprovado

Cliente `d80253af-69ea-4d74-9224-24f39d8b2d61`, nome exato `Aurora Café — TESTE FICTÍCIO`, agência `a0f00e64-e8ba-44e5-b0cf-2ad7adb44211`. Recibo original: `aurora-cafe-cross-department-2026-10-14.md`. O coordenador confirmou inventário atual de dois projetos (`f1f42f39-2e8a-419f-aff2-765b4f691e41`, `451d44b6-2221-493b-aa30-2a77a9a82aca`), 16 tarefas, um briefing, uma reunião e nenhuma apresentação. Scripts abortam se o nome/agência/projetos/quantidade de tarefas divergir.

## Arquivos

- `scripts/cleanup/aurora-test-inventory.sql`: transação serializável, inventário e JSON completo de linhas planejadas, encerrada com ROLLBACK.
- `scripts/cleanup/aurora-test-data.sql`: mesma preparação e backup, exclusão controlada por dependências e ROLLBACK por padrão. A execução destrutiva exige marcar backup verificado dentro da transação e trocar apenas o ROLLBACK final por COMMIT após revisão.

O conjunto começa nas linhas com `client_id` exato, no cliente e na única mensagem comprovada no recibo (`a3707896-5788-49c6-b862-8d540f12e6f3`). Fecha dependências CASCADE com catálogo real, incluindo tabelas privadas, linhas com chave composta, versões/snapshots. Acrescenta apenas tabelas estruturais conhecidas para FK NO ACTION: avaliações de apresentações, versões editoriais e registro de ideias. As notificações exigem agência, tipo de recurso e ID já contido no conjunto; não se apaga por texto/nome/canal.

Antes de qualquer DELETE, referências externas SET NULL/NO ACTION fora do conjunto abortam. Desvios de agência/cliente/projeto abortam. As exclusões tentam filhos e repetem os pais desbloqueados, sem desabilitar constraints, triggers ou RLS. A ausência de progresso/ciclo aborta a transação. A chave física CTID só é usada dentro da mesma transação, com locks; nunca deve ser guardada e reutilizada depois.

## Backup e execução

1. Executar inventário em conexão privilegiada, salvar JSON completo em arquivo local fora do Git, acesso restrito. Conferir quantidade por tabela e conteúdo; o resultado pode conter dados privados, tokens hash, ciphertext e snapshots. Não imprimir o backup em relatório público.
2. Rever todos os objetos extras: o script abrange todos os vínculos do cliente comprovadamente fictício, não somente IDs do recibo antigo. Se aparecer objeto real vinculado por engano, corrigir o plano e não executar.
3. Reexecutar o script de limpeza com ROLLBACK para conferir guardas, backup e dependências. Marcar `app.aurora_backup_verified` somente após salvar o backup.
4. Para efetivar, revisar SQL concreto e usar COMMIT final. Guardar contagens e verificar ausência do cliente/projetos/tarefas; manter recibo sem conteúdo privado.

## Limites e risco

- Nenhum SQL remoto foi executado por esta frente. Nenhum dado, schema, credencial ou arquivo foi apagado. Nenhuma suíte/build/deploy/commit foi acionada.
- Sem ensaio de execução PostgreSQL nesta frente: plano precisa dry-run no catálogo atual. Locks curtos podem falhar sob uso concorrente; falha conserva dados.
- A origem dos IDs adicionais é a confirmação do coordenador, não pesquisa por título. Apenas o nome do cliente é igualdade completa; o marcador `TESTE FICTÍCIO` funciona como guarda extra para os dois IDs de projeto já provados.
- Não remove Auth/perfis/membros, logs de auditoria, repertório editorial compartilhado, referências Drive compartilhadas nem arquivos Google Drive/Storage. Auditoria é preservada; poderá conter menção histórica ao teste.
- A página e SVGs públicos `public/testes/aurora-cafe/` precisam remoção do deploy separada pelo coordenador. Modelos de briefing compartilhados não são apagados sem ID e prova de uso exclusivo.
- Notificações que apontem para tipos de recurso não listados são preservadas, exigindo inventário adicional. Respostas à mensagem de teste (SET NULL) fora do conjunto impedem limpeza, para não alterar conversa real.
- Os scripts não bloqueiam toda a agência; serviço ativo que tente gravar nesses registros pode receber timeout durante a manutenção. Usar janela de manutenção e backup consistente.
