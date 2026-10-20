# Hero centralizada da apresentação — 20/10/2026

## Briefing e composição

Público: clientes que recebem a apresentação para conhecer e aprovar entregas. Objetivo: identificar cliente/período e conduzir aos materiais. Manter títulos, dados, decisões e navegação existentes. Direção pedida: texto centralizado, identidade do cliente e linhas de fundo com movimento muito suave.

- Hero centralizada compartilhada entre editor e showcase público.
- Logo do cliente acima do título quando cadastrada; nome como fallback quando ausente ou imagem inválida. Confirmado por consulta somente leitura: a Ambience está sem `logo_url` cadastrada. Nenhuma logo foi inventada nem extraída das artes.
- Removida a arte que ocupava a coluna lateral da abertura. Os materiais permanecem nas suas seções e deixam de ser dependência do carregamento da hero.
- Fundo SVG com 22 curvas de baixo contraste; transformações CSS lentas de 24/32 segundos, sem nova dependência ou JavaScript por frame.
- Controle de pausar/retomar e versão estática em `prefers-reduced-motion`. Texto e CTAs não são animados nem bloqueados.
- Tipografia e espaçamento responsivos ao contêiner da prévia.

## Verificação

- Build TypeScript/Vite aprovado em produção e homologação.
- 12 testes focados passaram em 3 arquivos: identidade/logo/fallback, controle de pausa, prévia compartilhada e carregamento autorizado das imagens.
- `git diff --check` aprovado.
- Inspeção visual no showcase publicado: composição centralizada, curvas visíveis sem competir com o título e botões de navegação preservados.
- Prévia móvel de 390 px conferida no editor: título e CTAs centralizados, botões empilhados e sem transbordamento do conteúdo da hero.
- Pausar e retomar verificados na interface real, sem enviar avaliações.
- Evidência: `/tmp/dois-hero-centralizada-20261020.png`.

## Publicação

- Produção: Worker `doispontozero`, versão `0832526a-351d-46c5-bdf5-bbacec0cc11d`.
- Flags de produção anteriores preservadas: escritório/controles true; chamadas/mídia do escritório false.
- Homologação publicada na versão `22479d63-0a07-4382-9da2-ff435cbc2f2c`, com suas flags anteriores de escritório/controles/chamadas/mídia true.
- Nenhuma alteração de banco ou Edge Function nesta entrega; a consulta da logo foi somente leitura.

## Ajuste solicitado: grade animada em loop, full hero

- Substituídas as curvas SVG por grade CSS com quadrículas de 48 px e linhas principais de 192 px. Translação linear de 192 px em 48 segundos: o fim coincide com a repetição do padrão, sem salto.
- Fundo cobre toda a largura da hero; altura mínima ocupa a viewport descontando o cabeçalho. Conteúdo das seções mantém sua largura de leitura.
- Pausa e movimento reduzido preservados; animação apenas por transform, sem JavaScript por frame ou novas dependências.
- Build aprovado; 12 testes focados passaram. Inspeção visual no showcase publicado confirmou a grade de ponta a ponta e a composição centralizada.
- Produção atualizada: `fffac84e-d839-4e4a-bc89-0b6a4bef030d`.
- Evidência: `/tmp/dois-hero-grade-loop-20261020.png`.
