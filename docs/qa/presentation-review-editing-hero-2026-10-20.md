# Retorno editável do cliente e refinamento da hero — 20/10/2026

## Escopo confirmado

O cliente edita seu pedido de ajuste/comentário no card, não o arquivo da arte. O fluxo mantém o modelo existente de autorização pelo link de aprovação; não adiciona identificação individual de cada pessoa que compartilha o link.

## Implementação

- Ações Aprovar, Reprovar e Solicitar ajuste. Ajuste/reprovação exigem observação.
- Estado e comentário mais recentes aparecem imediatamente após a gravação bem-sucedida.
- Editar retorno abre a decisão e comentário atuais, permite alterá-los e salva pela RPC existente `submit_showcase_material_review`.
- A gravação continua acrescentando um registro ao histórico. Não há UPDATE/DELETE das avaliações anteriores. O card usa o retorno mais recente.
- Corrigida a nota antiga que continuava aparecendo depois de uma nova aprovação sem comentário.
- Erro de gravação mantém o comentário salvo e o rascunho da edição; não mostra sucesso falso.
- Cards da grade se estendem à altura da linha. Bloco de comentário destacado, estados com cores distintas e texto explícito, botões organizados em duas colunas.
- Hero mantém grade animada full hero. Remove repetição do cliente na etiqueta de período; relatórios com título no padrão automático mostram o título curto na abertura, preservando o título completo no dado original, nome acessível e tooltip. Títulos personalizados continuam íntegros. Tipografia maior para títulos curtos, período em destaque e orientação de uso.
- Nenhuma migração ou mudança de Edge Function necessária; autorização e persistência existentes foram preservadas.

## Validação

- 59 testes de apresentações em 19 arquivos passaram.
- Novos casos: solicitar ajuste e exibir nota sem recarga; editar com texto preenchido; trocar por novo comentário; aprovar limpando nota anterior no card; erro preservando rascunho e retorno salvo; simplificação somente do título automático.
- Build TypeScript/Vite aprovado; `git diff --check` aprovado.
- Nenhum retorno real de cliente foi enviado ou alterado nos testes automatizados.

## Publicação e conferência visual

- Produção: `fb58cf3b-1089-4557-940b-be4c26aa15ee`.
- Homologação: `fa6c8182-6e3a-4650-97c8-6469fd730a35`.
- Flags anteriores de cada ambiente preservadas.
- Showcase real conferido: comentário destacado, estado correto, três ações e Editar retorno nos materiais já avaliados. Modal aberto com decisão e comentário existentes preenchidos; fechado sem salvar. Nenhuma avaliação real foi modificada durante a inspeção.
- Hero conferida no showcase: nome do cliente, período separado e título Relatório Mensal sem a repetição automática da identificação. Grade e controle de pausa preservados.
- Evidências: `/tmp/dois-retorno-editavel-cards-20261020.png` e `/tmp/dois-hero-refinada-20261020.png`.
