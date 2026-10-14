# PDF: CSP de geração e prévia — 14/10/2026

## Diagnóstico e correção
A política HTTP não autorizava WebAssembly, necessário ao renderer do PDF. Foi adicionada apenas a fonte wasm-unsafe-eval a script-src. Não foi adicionada unsafe-eval geral. frame-src passa a autorizar self e blob para o iframe local do PDF; object-src permanece none. Os demais domínios e restrições foram preservados.

Referência técnica: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution

## Testes
Chrome isolado em desktop e celular, com CSP extraída de public/_headers e aplicada à resposta HTTP do documento. Backend autenticado usa respostas controladas; a geração do PDF é real, sem mock do renderer.
- 2 cenários reproduzem RuntimeError/WebAssembly ao remover wasm-unsafe-eval da política.
- 2 cenários de apresentações mostram prévia e baixam PDF, incluindo arte de teste servida pela própria origem.
- 2 cenários de briefings mostram iframe blob, baixam o PDF, conferem assinatura %PDF- e ausência de violações script/frame/object detectadas.
- A primeira execução do teste de briefing tentou ler a URL blob via fetch, ação bloqueada por connect-src. O teste foi corrigido para examinar o arquivo baixado diretamente; nenhuma permissão extra de rede foi adicionada para satisfazer o teste.

- Regressão completa: 427 testes aprovados em 116 arquivos. Typecheck e lint aprovados (avisos preexistentes).

## Publicação
Checks finais e confirmação do cabeçalho público serão registrados após publicação. Esta correção não encerra os critérios de integrações e aceite operacional já pendentes nos diagnósticos.
