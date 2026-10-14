# PDF editorial com prévia interna

## Pedido
Usar a base do PDF legado e mostrar apenas as páginas do PDF na plataforma, sem a interface nativa de impressão do Chrome.

## Checklist
- [x] Referência briefing-comercial-coutinho.pdf e código do legado examinados em somente leitura.
- [x] Prévia própria PDF.js com worker local e páginas em canvas; sem iframe.
- [x] Briefings e apresentações utilizam o visualizador compartilhado.
- [x] Resumo compacto no topo e seções numeradas; capa separada retirada do briefing.
- [x] Logotipo, símbolo discreto, respostas curtas em colunas, cabeçalho e rodapé fixos.
- [x] Respostas longas podem continuar na página seguinte; versão inválida usa V1.
- [x] PDF.js fixado em 6.4.299; lockfile atualizado.
- [x] 427 testes de regressão, 8 cenários PDF, revisão visual, typecheck, lint e build.
- [x] Push/deploy e domínio verificado: 8 assets idênticos ao build, MIME de worker e imagens corretos.

## Arquivos
- package.json
- package-lock.json
- src/components/pdf/PdfPreview.tsx
- src/features/briefing/BriefingExportPage.tsx
- src/features/briefing/pdf/BriefingPdfDocument.tsx
- src/features/briefing/pdf/BriefingPdfHeader.tsx
- src/features/briefing/pdf/BriefingPdfFooter.tsx
- src/features/briefing/pdf/BriefingPdfQuestion.tsx
- src/features/briefing/pdf/BriefingPdfSection.tsx
- src/features/briefing/pdf/BriefingPdfWatermark.tsx
- src/features/briefing/pdf/transformBriefingToPdfModel.ts
- src/features/briefing/briefing.test.tsx
- src/features/presentations/PresentationExportPage.tsx
- public/pdf-brand/wordmark.jpg
- public/pdf-brand/symbol.jpg
- e2e/aurora-workflow.spec.ts
- docs/RELEASE_STATUS.json
- docs/qa/pdf-editorial-preview-2026-10-14.md
- docs/stories/pdf-editorial-preview.md
- docs/qa/pdf-editorial-public-verification-2026-10-14.json
