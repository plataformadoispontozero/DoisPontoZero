# Kanban Geral exclusivo da gestão — 14/10/2026

## Escopo

Fechar primeiro a pendência do Kanban Geral. Aceite técnico concluído; a avaliação da rotina diária pertence ao gestor. O diagnóstico mantém esse aceite separado dos testes.

## Problemas encontrados e corrigidos

1. MANAGER sem vínculo individual ao projeto não via toda a operação. `can_access_project` agora verifica vínculo/agency ativos e reconhece OWNER/ADMIN/MANAGER com permissão adequada; membros profissionais preservam seu acesso por projeto.
2. O agregado não era invalidado ao criar/editar/mover/arquivar demandas. Os hooks atualizam o Kanban Geral; a movimentação aguarda a atualização dos caches antes de liberar outra operação.
3. O agregado tinha um limite de 500 registros, sem continuação. Novo RPC paginado, compatível com chamadas anteriores pelos parâmetros default. Paginação não perde registros na última página e a interface oferece carregamento adicional.
4. O pop-up atualizava coluna/status por PATCH. Agora usa o mesmo `move_task` autorizado que o quadro, com sincronização de status, conclusão e histórico e tratamento de falha.

## Operação do quadro

- Um grupo por cliente e quatro etapas: A fazer, Em produção, Em revisão e Concluído.
- Busca por cliente/projeto/demanda/responsável, filtro de cliente e etapa e opção de ocultar concluídas.
- Responsáveis e prazos nos cards; abertura central da demanda.
- Movimentação pelo seletor do card ou pelo pop-up, usando colunas do board correto.
- Cache/filtros isolados por usuário e agência; tentativa negada mantém a etapa anterior. Revogação no servidor oculta cards em cache e fecha o pop-up.
- Contagens representam as demandas carregadas; aviso e botão indicam páginas restantes.

## Validação

- 406 testes em 111 arquivos na regressão integral; ajustes finais com 13 testes de Projetos/Tarefas aprovados.
- 18 cenários únicos de navegador do Kanban (desktop/celular), incluindo: acesso negado ao profissional, filtros, 100+1 demandas paginadas, edição no pop-up, movimentação no card e pop-up, persistência após reload e falha da operação.
- Navegador usa APIs controladas; não é sessão humana autenticada na produção.
- Typecheck/lint aprovados (avisos legados); build registrado na publicação.

Banco real, fixture de papel e contexto `authenticated` em transações com rollback:

- MANAGER não membro nem criador do projeto Aurora: projeto visível e cinco demandas lidas em páginas de 2, 2 e 1.
- Papel MEMBER com permissões projects.view/tasks.view: agregado negado com 42501.
- MANAGER sem participação no projeto, com tasks.move: demanda movida de revisão para produção e encontrada no agregado com status in_progress; status/coluna/timestamp originais confirmados após rollback.
- A transação foi desfeita; não há mudança persistente nos papéis ou nas demandas Aurora.

Migration: `20261014120657_management_kanban_workflow.sql`. Função anterior mantida em private sem EXECUTE para anon/authenticated. RPC novo é invoker e respeita RLS. Advisors sem novos avisos de search_path ou ampliação anônima; pendências anteriores permanecem em suas fases.

## Aceite operacional

O gestor deve usar o quadro em /projects e confirmar que os grupos, filtros e movimentação atendem à rotina. Nenhuma confirmação foi inferida do pedido de implementação ou dos testes controlados. Após esse aceite, o item individual pode ser concluído no diagnóstico; as demais pendências seguem separadas.

## Publicação confirmada

- Implementação: `94f652e`; branch `codex/master-audit-15-1`, push concluído.
- Cloudflare: `cce37ccc-5d74-4116-bb3b-610ec9a500c7`.
- Bundles no domínio comparados byte a byte com o build: `index-DHlnHGDT.js`, `ProjectsPage-Cr6GxRRv.js`, `TaskDetailPanel-G9wXi-Hy.js`, `DiagnosticsPage-SoRs5htM.js`.
- Dados Aurora mantidos: 5 demandas. Movimento real de revisão para produção revertido por rollback; coluna/status/timestamp anteriores confirmados em consulta independente.
- Diagnóstico: validação técnica concluída; aceite operacional do gestor ainda não informado.
