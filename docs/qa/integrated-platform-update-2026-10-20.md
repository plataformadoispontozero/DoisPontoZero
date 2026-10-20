# Atualização integrada — 20/10/2026

## Problema

A branch `feat/escritorio-digital` continha as melhorias de voz, mas não incorporava as alterações de permissões, tarefas e previews de `origin/codex/master-audit-15-1` (até `ec1ec3a`). Os deploys feitos pela branch do Escritório não entregavam essas melhorias da outra linha de desenvolvimento.

## Integração

Merge das duas linhas sem conflitos manuais. Inclui gestão de acessos por setor e nomes compreensíveis, criação de tarefas com seleção do projeto, previews dos cards, importação de imagens existentes no Drive e navegação dos carrosséis. Mantém o Escritório e suas correções LiveKit.

Flags públicas do candidato: `VITE_APP_ENV=production`, `VITE_ENABLE_DIGITAL_OFFICE=true`, `VITE_ENABLE_OFFICE_CONTROLS=true`, `VITE_ENABLE_OFFICE_CALLS=false`, `VITE_ENABLE_OFFICE_MEDIA=false`. Convites privados e captura de mídia seguem no ambiente de homologação.

A Edge Function `google-workspace` foi consultada sem alterações: ACTIVE, versão 17, com suporte a `task-drive-import-file`. As migrations de capas, criação atômica e galeria já constam no histórico remoto consultado nesta sessão. Nenhuma migration foi reaplicada.

O levantamento de 17 tarefas é um retrato dos dados, não uma instrução para concluir checklists. Esta atualização não marca itens como revisados, não modifica papéis de membros e não altera as tarefas de teste.

## Validação

Build de produção com as flags acima: aprovado. Lint: exit 0. A execução simultânea inicial de build e suíte sofreu timeouts; foi interrompida e substituída por execução sequencial. A suíte sequencial executou 510 testes: 509 passaram e um teste de protocolo de upload usava a simulação antiga de blocos de 8 MB, incompatível com os blocos atuais de 2 MB. Corrigida apenas a simulação, os cinco testes do arquivo `driveProduction.test.ts` passaram na repetição. Não houve repetição integral após essa alteração de teste.
