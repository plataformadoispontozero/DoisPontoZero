# Integração das páginas, briefing e carregamento — 24/10/2026

## Escopo

- Novo briefing como entrada de cliente novo, com dados de contato ou seleção de solicitação de orçamento do site.
- Cadastro de cliente e briefing na mesma transação, com chave de repetição para evitar duplicação em retries. Solicitação original preservada no contexto; objetivo preenche apenas perguntas de texto semanticamente correspondentes. Não inventa respostas às demais perguntas.
- Contexto inicial visível na tela de respostas para orientar a reunião.
- Hero com sequência de artes sem espaçamento entre os elementos, preservando proporção natural; repetição visual para continuidade. Portfólio com moldura 4:5 e imagem inteira.
- Clientes: paginação no servidor (12/24/48), busca por nome/slug, filtros e contagens sem baixar perfis completos. Hub continua carregando o detalhe individual.
- PDF das configurações só carrega renderer ao pedir a prévia; visualização de apresentação só carrega na aba correspondente.
- Miniaturas de apresentação só solicitam prévia ao chegar perto da área visível (IntersectionObserver), com cache existente e lazy loading.
- Card da demanda: links, anexos e atividade consultados apenas na aba aberta; card fechado não solicita esses dados. Histórico com cursor e lotes de 50 atividades; atividades antigas continuam acessíveis.
- Retorno de apresentação exige responsável ativo, grava remetente e observação no histórico restrito. Leitura e prévia protegidas no servidor para remetente e responsáveis atuais; sem exceção genérica para gestores.

## Banco e Edge

Aplicadas as migrations scoped_presentation_task_returns e new_client_briefing_intake. Consultas de catálogo confirmaram os RPCs de histórico e cadastro. A ação task-review-return-media já estava publicada na Edge google-workspace v21 e passou a ter o RPC correspondente disponível.

Prévia de histórico usa referência Drive e data de modificação, não cópia binária independente. Se o arquivo mudar, sair da pasta, for removido ou perder autorização, a imagem fica indisponível. Registro textual permanece após exclusão da apresentação de origem.

Advisor após DDL: 22 INFO RLS enabled no policy (acréscimo da tabela privada de intake, sem acesso direto), 10 WARN definer anon (inalterado), 50 WARN definer authenticated (4 APIs novas, com validação de membro/permissão), 1 WARN proteção contra senha vazada (Pro). Nenhuma policy liberada indiscriminadamente.

## Verificação e limites

Typecheck e build de produção passaram; diff-check sem erro. Avisos de chunk grande e import dinâmico ineficaz do importador já existentes permanecem. Não foram criados clientes fictícios nem enviados ajustes reais para validar escrita; não declarar homologação operacional desses fluxos sem aceite real. Não foram adicionados ou executados testes.

As imagens do site ainda usam o conteúdo salvo atual. A pasta do Drive para novas imagens será escolhida pelo responsável; essa escolha continua pendente.

## Publicação e conferência visual

Worker publicado no domínio atual com versão `c8cc662f-4711-4966-9e20-fb0c2f04127d`. Cloudflare repetiu parte do upload após uma falha temporária e confirmou sucesso.

No navegador autenticado em produção:
- Novo Briefing exibiu Entrada do novo cliente e campos de contato, sem lista de clientes existentes.
- Solicitação de orçamento do site consultou o novo RPC e apresentou “Nenhuma solicitação pendente”, sem erro.
- Clientes exibiu 1–24 de 29 na página 1 e 25–29 de 29 na página 2, com controles coerentes.
- Captura do briefing: /private/tmp/2zero-novo-briefing-publicado.png.

A conferência foi somente de leitura; cadastro transacional, envio de ajuste e prévia privada continuam aguardando operação real e aceite do responsável.
