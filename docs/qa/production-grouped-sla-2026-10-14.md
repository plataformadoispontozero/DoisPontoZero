# Produção agrupada e prazo de 48 horas — 14/10/2026

## Antes e depois
Antes, um cliente aparecia uma única vez na primeira etapa pendente, com todas as demandas abertas e seletores de etapa. Isso escondia visualmente o destino de uma peça movida. Agora cada etapa contém grupos recolhidos por cliente: mover um Poster cria ou atualiza o grupo daquele cliente na coluna de destino, deixando as outras peças na origem. Arrastar um grupo move somente as demandas daquele cliente naquela coluna. O cabeçalho contém cliente e quantidade; as peças mostram formato, copy principal, prioridade, data de envio e aviso de prazo quando disponível. Detalhes e datas completas permanecem no pop-up.

## Adoção seletiva do legado
Fonte local somente leitura: `/Users/designer/Downloads/doispontozero-main`.

- `src/pages/DesignerKanban.tsx`: aproveitado agrupamento por cliente dentro da coluna, abertura por grupo e atenção a atrasos. Mantido o motor canônico novo de tarefas e suas permissões.
- `src/components/designer/DemandCard.tsx`: adaptadas etiqueta por formato, prioridade e prazo compacto. O visual permanece no sistema novo.
- `src/pages/ControleVideomaker.tsx` e `src/config/production-sla.ts`: usados como referência de acompanhamento de etapa. Os limites específicos antigos de roteiro/edição não foram copiados: a regra confirmada nesta conversa é de 48 horas corridas após aprovação editorial.
- `src/pages/GestaoTrafego.tsx`: preservado o contexto do setor; o componente comum atende seu quadro sem substituir as métricas Meta e suas integrações atuais.
- Autenticação, OAuth, tabelas do legado e dados de clientes antigos não foram importados nesta entrega.

## Prazo e origem dos dados
`monthly_editorial_campaigns.approved_at` é marcado pelo servidor quando o calendário entra em aprovado, preservado na liberação para produção e não pode ser alterado por edição arbitrária. Retornar a rascunho remove o marco; nova aprovação inicia nova janela. Históricos só recebem uma data recuperada de evento real de aprovação integral; sem prova, continuam sem data. Não se usa `updated_at`, recebimento do briefing ou criação da tarefa como substituto.

O vencimento é aprovação + 48 horas corridas. Até seis horas restantes: prazo urgente; até 24: curto prazo; acima disso: médio prazo. Vencimento atingido: atraso. Prioridade da tarefa é independente do aviso de tempo. Envio à revisão encerra a etapa de produção; se o histórico comprova envio posterior ao vencimento, o atraso permanece identificado. Sem registro de envio, não se inventa sua data.

O RPC público usa uma função privada com agência ativa, permissão de leitura de tarefas e acesso canônico a cada demanda. Apenas metadados de tempo do calendário/briefing correspondente ao mesmo projeto, cliente e agência são retornados. Chamadas anônimas, revogadas e de outra agência são recusadas. Atualizações do quadro invalidam também o cache do prazo.

## Validação
- 417 testes de regressão aprovados em 114 arquivos.
- PGlite com SQL versionado: marco real, 48 horas exatas, proteção contra alteração artificial da aprovação, reset de rascunho, nova aprovação, acesso negado e metadados de atividade inválidos.
- Banco real autenticado com rollback: Aurora tem briefing recebido em 14/10/2026 01:08:51 UTC, aprovação em 14/10/2026 01:10:59 UTC e vencimento em 16/10/2026 01:10:59 UTC. Datas distintas e intervalo exato de 48 horas.
- Typecheck, lint e 40 testes finais de módulos aprovados após os ajustes de arraste e diálogo.
- 39 cenários de navegador aprovados: gestão, Design, Vídeo e Tráfego, grupos recolhidos, peça individual, segunda peça unida ao destino, grupo da coluna, negação de movimento, filtros, paginação, revogação, criação de copy e datas.
- Mouse em desktop, teclado no projeto mobile e gesto de toque emulado por CDP no celular. O teste de toque é excluído do projeto desktop por definição.
- Capturas de desktop e celular renderizadas e revisadas.
- Build isolado de produção aprovado. Push: `c832850`, branch `codex/master-audit-15-1`.
- Deploy Cloudflare confirmado: `402e1118-34a6-444c-b279-ab24d30278b3`.
- Conferência pública byte a byte do arquivo principal, ProjectsPage, ClientKanbanBoard, DepartmentPage, TaskDetailPanel e DiagnosticsPage concluída.

## Limites de validação
Navegador isolado utiliza respostas controladas e registros fictícios, complementado por leitura autenticada no banco real. Datas são exibidas no fuso da agência. Sem calendário ligado ao projeto ou aprovação comprovada, o SLA não é iniciado a partir de outro horário. Aceite operacional do gestor permanece pendente; esta entrega não declara todas as integrações da plataforma homologadas.
