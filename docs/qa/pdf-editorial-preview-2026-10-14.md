# PDF editorial e prévia interna — 14/10/2026

## Referência e implementação
Referência fornecida: /Users/designer/Downloads/briefing-comercial-coutinho.pdf. Duas páginas renderizadas e inspecionadas. Código consultado: /Users/designer/Downloads/doispontozero-main/supabase/functions/generate-briefing-pdf/document.ts e brandMark.ts. Estrutura reutilizada seletivamente: resumo de preenchimento, hierarquia compacta, seções numeradas, respostas curtas lado a lado e símbolo discreto. Os dados do cliente permanecem os atuais; nenhum conteúdo do arquivo foi importado no banco.

A prévia compartilhada usa PDF.js 6.4.299 fixado, worker da mesma origem e canvas com resolução ajustada à tela. Observação de tamanho para redimensionamento e renderização por proximidade de página; cancelamento ao trocar o documento/desmontar. Texto extraído disponível para leitores de tela. Erros de renderização têm mensagem e o download permanece independente. Blob é lido diretamente, sem fetch de URL blob e sem novas permissões de rede/worker.

Briefing agora abre com logotipo/resumo e conteúdo na mesma página; capa separada removida. Cabeçalho e rodapé fixos; margens reservadas. Questões curtas compartilham linha; respostas extensas podem continuar. Versão zero/ausente normalizada para V1. Logo/símbolo da Dois.Zero reutilizados do código/assets autorizados, preparados em JPEG. Outro nome de agência mantém cabeçalho textual e não recebe automaticamente os assets Dois.Zero. PNG foi evitado porque o decoder do renderer tentou criar worker blob bloqueado por CSP; nenhuma permissão extra foi acrescentada para contornar isso.

## Evidências
- Regressão final: 427 testes aprovados em 116 arquivos.
- Teste de transformação: 4 testes aprovados, incluindo fallback de versão.
- 8 cenários controlados de navegador em desktop/celular: canvas efetivamente renderizado, ausência de iframe, download PDF válido, reprodução do bloqueio WebAssembly, paginação de texto longo e última resposta preservada.
- PDF curto e texto longo gerados, renderizados em PNG e revisados; ajustes de marca-d’água e cabeçalho feitos após inspeção.
- Documento extenso preserva FIM DO BRIEFING e não contém undefined, confirmado via extração de texto.
- Dados/API autenticados são fixtures; geração e renderização do PDF são reais. Nenhum registro real do cliente foi alterado pelo teste.

## Publicação
Commit `f346831` enviado para `codex/master-audit-15-1`. Deploy Cloudflare versão `1229c66d-c6e1-44f7-96a2-b40086015f1d`. O domínio público referencia o build novo e 8 assets (index, visualizador, worker, exportadores, diagnósticos e logos) coincidem byte a byte. Worker retorna MIME JavaScript; logos retornam image/jpeg. Recibo: docs/qa/pdf-editorial-public-verification-2026-10-14.json. As pendências operacionais anteriores permanecem nos diagnósticos.

Typecheck e lint aprovados (avisos preexistentes). Revisão das páginas identificou a necessidade de reservar o cabeçalho absolutamente no topo e emparelhar respostas com linhas explícitas; ambas corrigidas.

Rodada final: 6 cenários positivos de briefing/apresentação/texto longo aprovados, além dos 2 negativos de CSP da rodada de 8. O documento extenso final tem 3 páginas (antes do agrupamento explícito eram 4), contém as 16 perguntas e a última resposta. Revisão visual confirmou pares de respostas e ausência de cortes. Build de produção aprovado.
