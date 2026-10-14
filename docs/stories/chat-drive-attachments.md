# Materiais privados do Drive no chat

Status: Publicado — aceite externo pendente

Selecionar cliente, pasta e arquivo existente no Drive central; publicar mensagem com metadados leves. Download exige acesso atual à conversa e ao cliente, sem OAuth pessoal ou arquivos no banco.

- [x] Picker cliente/pasta/material usando integração existente.
- [x] Mensagem e metadados atômicos após validação Google.
- [x] Autor, agência, chat e cliente verificados no servidor; leitura revalida pasta atual.
- [x] Testes SQL/UI e gates combinados.
- [x] Limite de homologação externa documentado; Google real ainda pendente.

Arquivos: migration 20261014060734_chat_drive_attachments.sql; google-workspace/index.ts; chatDrive.ts; ChatDriveAttachments.tsx; ChatPage.tsx; types/chat.ts; testes correspondentes.

## Validação local
10 testes em quatro suites passaram (SQL real PGlite, validação de metadados Google simulados, picker e regressão do seletor). Typecheck e lint passaram, com avisos existentes. O serviço valida papéis/permissões e agência ativa novamente na persistência. Nenhum upload ou arquivo real Google acessado. O chat compartilha arquivos existentes da produção; upload permanece na área cliente/produção.

## Homologação necessária
Migration e Edge Function devem ser publicados por @devops após gates combinados. Testar com dois membros reais: selecionar material na pasta real do cliente, enviar na sala privada ou DM, baixar com destinatário e negar após perda de acesso. Sem essas evidências não declarar Drive integralmente homologado.

## Fechamento web em 14/10/2026

Implementação e testes revisados no pacote atual. Verificações de banco e limites externos: docs/qa/phase-closure-web-2026-10-14.md. Publicação registrada após o deploy; avisos antigos sobre migrations ainda ausentes são históricos.

Deploy confirmado: `0294b685-da52-43a8-8b97-2c40cd675b51`; commit `62e18ee`. Homologações humanas/externas permanecem explícitas no relatório atual.
