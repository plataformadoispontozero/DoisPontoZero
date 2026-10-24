# Prévia de PDFs nas configurações — 22/10/2026

## Causa reproduzida

O build publicado separava todos os pacotes `@react-pdf/*` no grupo `vendor-pdf`, mas deixava suas dependências transitivas fora do grupo. O resultado tinha um ciclo: `vendor-pdf` importava dependências do chunk `BriefingPdfHeader`, enquanto esse chunk importava `StyleSheet` do `vendor-pdf`. Ao importar o gerador em Chrome isolado com o build de produção, falhava antes da geração: `TypeError: Cannot read properties of undefined (reading 'create')`.

Além disso, a execução do grafo em desenvolvimento mostrava `Buffer is not defined` ao carregar as imagens JPEG. O PDF era gerado sem o logotipo, pois o renderer tratava o erro de imagem como aviso.

## Correções

- Removida a divisão manual exclusiva dos pacotes PDF. Rolldown resolve o grafo de dependências; React continua separado e os geradores permanecem sob demanda.
- Polyfill browser `buffer@6.0.3`, carregado antes do renderer nos geradores de briefings e apresentações. Preserva implementação existente se `Buffer` já estiver disponível.
- Regressão real em `scripts/qa/pdf-branding-runtime.mjs`, sem sessão autenticada, clientes ou alterações no backend.

## Evidências locais

Build de produção e TypeScript aprovados em `/private/tmp/pdf-runtime-build.log`.

Chrome isolado, importando o chunk gerado de produção: três PDFs gerados com Helvetica/A4, Times-Roman/Letter e Courier/A4. Tamanhos de 24.496 a 24.603 bytes, assinatura `%PDF-`, duas imagens incorporadas em cada documento (logo e marca d'água), sem os avisos anteriores. Log `/private/tmp/pdf-runtime-regression.log`.

A regressão testa execução real e incorporação das imagens. A verificação visual na página publicada após deploy continua necessária; esta evidência não certifica todos os documentos e cenários da plataforma.

Testes focados das configurações e registro de exportação: 4 aprovados em 2 arquivos (`/private/tmp/pdf-preview-focused.log`). Não foram executados testes completos ou auditoria de dependências nesta correção. O instalador informou duas vulnerabilidades moderadas preexistentes/pendentes de análise; não foi aplicado `npm audit fix` automaticamente.

## Verificação em produção pelo integrador

Worker 4a2459ba-2a64-4484-9ed3-050cefd78408 publicado. A falha foi reproduzida antes do deploy. Após recarregar /settings/documents e clicar Atualizar prévia PDF, o documento foi renderizado na página com logo oficial e texto acessível da página. Não foi necessário salvar configurações nem cadastrar briefing. Evidência visual: /private/tmp/pdf-preview-production-fixed.png.
