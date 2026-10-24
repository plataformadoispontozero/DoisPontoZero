# Retornos de apresentação restritos à demanda

Migração `20261023224323_scoped_presentation_task_returns.sql`.

## Envio

`return_presentation_review_to_production` conserva os argumentos `p_agency`, `p_review`, `p_task`, `p_project`, `p_department` e acrescenta `p_assignee_ids uuid[] default null`.

- Exige membro ativo autorizado a apresentações editar e tarefas visualizar/mover/comentar.
- Apenas última avaliação atual de material, com impressão digital atual e link ativo mais recente, pode ser reenviada.
- Nova demanda exige tarefas criar/atribuir e 1–200 responsáveis ativos. Em projeto existente, precisam ser membros desse projeto. Quando o projeto é criado nesta transação, somente os selecionados são vinculados antes de criar a tarefa.
- Demanda existente mantém responsáveis; exige ao menos um ativo. O RPC não modifica atribuições existentes.
- Novo envio grava snapshot independente em `task_presentation_returns`, comentário restrito, evento restrito e notificações somente aos atribuídos ativos e ao remetente com acesso de tarefas. Não há broadcast a gestores.
- O gatilho geral de atribuições por setor e o gatilho de notificações de produção são suprimidos somente nesta operação transacional. Comportamento normal das demais demandas é preservado.
- Demanda nova recebe título/descrição genéricos; conteúdo do cliente permanece somente no histórico protegido.

## Leitura

`get_task_presentation_returns(p_agency uuid,p_task uuid)` retorna uma lista ou `[]` para quem não pode ler os registros. Cada entrada contém `id` (UUID da avaliação original), `asset_id`, `material_title`, `presentation_id`, `presentation_title`, `note`, `decision`, `returned_at`, `actor_name`, `has_preview`.

Somente remetente e atribuídos ATUAIS, ainda ativos na agência e com `tasks.view`, podem ler o registro. Gestor sem atribuição não ganha exceção. Isso vale para a tabela principal, tabela operacional antiga, comentário e atividade; o cartão da tarefa permanece acessível ao remetente por policy específica. As demais regras de gestão de projetos não são restringidas.

`get_task_presentation_return_media(p_review uuid)` valida os mesmos participantes e retorna `{agencyId,fileReferenceId,googleFileId,folderId,modifiedTime,mimeType,name,previewAvailable}`. Não retorna token Google nem depende da existência atual da apresentação/material/referência. A Edge usa JWT do usuário para chamar o RPC e devolve apenas preview de imagem pela ação `task-review-return-media`.

## Preservação e limites

- IDs da apresentação/material/avaliação/referência no snapshot não têm FK de exclusão. O histórico sobrevive à exclusão dessas origens. Excluir a própria tarefa pode remover seu histórico por CASCADE.
- Nome do autor, comentário, material e metadados do arquivo são snapshots persistidos. A referência Drive não é uma cópia binária independente: arquivo removido, acesso perdido ou conteúdo sobrescrito pode tornar a prévia indisponível.
- `file_snapshot_verified` tem padrão false. Só habilita preview quando existem ID, MIME e data de modificação. A Edge deve comparar data de modificação antes de mostrar para evitar apresentar um arquivo sobrescrito como original.
- A migração preserva retornos antigos existentes no novo snapshot; imagens antigas só são verificadas se hash de conteúdo coincide e data de modificação não é posterior ao retorno. Caso contrário não se inventa prévia histórica.
- Comentários gerados pelo sistema são identificados por tarefa, autor, timestamp e texto exato para receber tag de escopo. Descrição antiga é movida para o snapshot protegido somente quando corresponde exatamente ao texto gerado; descrições personalizadas permanecem intactas.
- Comentários e atividades de retorno são imutáveis; a identidade das respectivas notificações não pode ser alterada por UPDATE para escapar da regra de leitura. Marcações de lida permanecem possíveis.
- Notificações antigas do mesmo evento de produção também ficam restritas na leitura.

## Evidências de catálogo · 24/10/2026

Consultas remotas somente de leitura confirmaram: retorno antigo tinha CASCADE em apresentação/material/avaliação; `task_comments` e `task_activity` eram visíveis por acesso genérico da tarefa; `task_activity` não tinha policies UPDATE/DELETE; notifications possui policy ALL do destinatário; existe trigger de atribuição automática por setor e notificação geral a gestores. A migração trata explicitamente esses caminhos. Não há dependentes catalogados das assinaturas antigas do RPC, substituídas por uma assinatura com sexto argumento opcional para evitar ambiguidade no PostgREST.

Sem testes, aplicação SQL, envios reais ou deploy nesta implementação. O backfill descrito só ocorrerá quando o integrador aplicar a migração revisada.
