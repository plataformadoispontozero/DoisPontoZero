# Kanban por cliente e copy de produção — 14/10/2026

## Entrega técnica
Cada cliente tem um card em quatro colunas. A posição do card corresponde à primeira etapa ainda pendente; as peças mostram seus próprios status. Mover uma peça preserva as demais. A seleção de várias peças move apenas a seleção; arrastar o cliente inteiro move todas as demandas do card. Design e Vídeo compartilham o componente, mantendo o escopo de cada setor. A busca identifica o cliente e preserva suas outras demandas no grupo. O quadro geral continua exclusivo da gestão.

O novo RPC `move_task_group` executa a movimentação em uma transação, revalida agência, leitura, movimentação e acesso a cada projeto, usa a coluna real de cada quadro e chama a operação canônica `move_task`. Seleção inválida, item indisponível ou coluna ausente cancela toda a operação. Não aceita chamadas anônimas. O quadro geral permite mover peças já carregadas e exige carregar todas as páginas antes de mover um grupo completo. Seleções acima de 1.000 peças são recusadas, permitindo trabalhar em lotes menores.

O formulário de criação distingue demanda geral, post, carrossel e vídeo. Conteúdo criativo requer título, apoio, CTA, legenda, hashtags, direção e ângulo. Carrossel e vídeo também requerem lâminas/cenas. Hashtags são normalizadas, e os detalhes exibem blocos legíveis sem truncamento. A conversão de calendário para produção usa um formatador no banco, preservando copy, apoio, CTA, direção, lâminas, câmera e áudio. Não reescreve demandas históricas. O motor editorial sugere hashtags a partir do tema e enquadramento para o post; permanecem editáveis antes da aprovação.

## Evidências
- 411 testes de regressão em 112 arquivos aprovados.
- Testes PGlite com SQL versionado: movimentação de uma peça preserva duas outras, movimento de todas, rollback de seleção parcialmente indisponível, revogação e coluna ausente.
- Banco real autenticado, com rollback: uma peça Aurora alterada e quatro preservadas; cinco concluídas com timestamps ao mover o grupo; falha parcial reverte a mudança da peça anterior.
- Formatador real preservou CTA, hashtags, câmera, duração, visual e áudio em uma descrição de roteiro.
- Typecheck e lint aprovados, com avisos de lint registrados.
- 33 cenários de navegador aprovados: gestão, filtros, paginação, revogação, popup, peça, seleção, grupo e criação de post/carrossel/vídeo. Um teste de arraste por mouse é excluído do projeto mobile; o arraste passa em desktop e seletores passam em ambos.
- Build isolado de produção aprovado; recibo de publicação será registrado após o deploy.

## Limites
Navegador usa API controlada em ambiente isolado; não representa uma sessão humana em produção. Arraste por mouse é verificado em desktop; no celular os fluxos são verificados pelos seletores acessíveis. Testes SQL de movimentação foram desfeitos por rollback e preservaram os cinco registros Aurora. Aceite operacional do gestor permanece pendente no diagnóstico. As demais integrações e fases não são declaradas concluídas por esta entrega.
