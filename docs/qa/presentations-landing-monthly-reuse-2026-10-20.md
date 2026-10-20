# Apresentações: landing page e próximo ciclo

## Escopo

Pedido do responsável: transformar lista interna e apresentação do cliente em páginas com estrutura de landing page; oferecer apagar e reaproveitar no mês seguinte.

Briefing adotado: agência Dois.Zero, público interno para organizar as entregas e cliente que recebe link para revisar materiais. Conteúdo e prova vêm das seções e arquivos cadastrados. Fluxo principal do cliente: abertura, contexto, materiais, avaliação individual. Sem criação de depoimentos, resultados ou provas fictícias.

## Entrega

- Lista com abertura editorial, fluxo de trabalho, totais reais, busca, status, grade/lista e cards com preview quando disponível.
- Preview compartilhado entre editor e página pública com capa em duas colunas, destaque de material, links para seções, narrativa editorial, galerias existentes e convite final à revisão.
- Apagar move a apresentação para `archived` após confirmação; filtro Arquivada permite restaurar como `draft`. Arquivos originais do Drive permanecem intactos. A leitura pública existente exige `published`.
- Reaproveitar preenche o próximo mês, inclusive dezembro/janeiro, permite ajustar título e período e cria outro rascunho para o mesmo cliente. Copia tipos de seção, títulos, descrições e conteúdo textual. Não copia IDs, imagens, arquivos, avaliações ou links públicos.
- As ações usam a persistência existente; nenhuma migration ou nova permissão foi criada. Visibilidade dos botões respeita permissões existentes de criar, editar, excluir e exportar. Arquivamento exige editar e excluir; restauração exige editar.

## Validação

- 6 arquivos / 18 testes direcionados aprovados: preview, falha de avaliação, página pública, editor, reaproveitamento e confirmação de arquivamento.
- TypeScript e build de produção aprovados. Lint aprovado com avisos existentes fora desta entrega.
- Revisão autenticada no Worker de homologação: nova lista, diálogo de reaproveitamento e preview em 390 px pelo controle de viewport do editor. Navegação/diálogos foram abertos sem criar, arquivar ou aprovar registros reais.
- Não foram ativadas capturas de mídia do Escritório nesta entrega.

## Limites

Os testes das mutações são controlados; não foi arquivada nem duplicada uma apresentação real do cliente durante QA. O reaproveitamento usa o fluxo existente de criação de apresentação e inserção de seções, com tentativa de remoção do rascunho se a inserção das seções falhar; não é uma nova transação SQL única.

Preview de imagem depende da conexão e das permissões do Drive. Mídia indisponível apresenta estado explícito e não é substituída por conteúdo fictício.
