# Correção de prévia e download PDF sob CSP

## Problema
O gerador @react-pdf/renderer usa WebAssembly. A política HTTP publicada não permitia essa compilação, causando abort tanto na prévia quanto no download. O iframe da prévia também usa URL blob, não prevista em frame-src.

## Checklist
- [x] Permissão específica wasm-unsafe-eval, preservando bloqueio de eval JavaScript geral.
- [x] frame-src permite self e blob para o PDF gerado localmente.
- [x] Reprodução do bloqueio anterior em desktop e celular.
- [x] Prévia e download de briefings e apresentações com CSP aplicada: 6 cenários aprovados.
- [x] Assinatura %PDF- do download do briefing confirmada.
- [x] 427 testes de regressão, typecheck e lint.
- [x] Build de produção.
- [x] Push, deploy e cabeçalho público confirmado nas rotas do briefing e diagnósticos.

## Arquivos
- public/_headers
- e2e/aurora-workflow.spec.ts
- docs/RELEASE_STATUS.json
- docs/stories/pdf-csp-fix.md
- docs/qa/pdf-csp-fix-2026-10-14.md
- docs/qa/pdf-csp-public-verification-2026-10-14.json
