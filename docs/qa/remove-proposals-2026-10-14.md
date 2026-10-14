# Retirada de Propostas — 14/10/2026

Escopo: retirar a área comercial do frontend e reparar caminhos antigos. Não apaga registros comerciais, tabelas, migrations nem histórico de auditoria no banco. Não inclui as melhorias anteriores ainda pendentes de agenda, Meta, Kanban de gestão ou PDF de apresentações.

## Comportamento

- Removidos páginas, catálogo, modelos, hooks, preço, PDF, visualização pública e tipos exclusivos do módulo.
- Removidos menu, cartão do portal do cliente e permissões oferecidas na interface.
- /proposals, /proposals/new, /proposals/templates/new, /proposals/services e /proposals/:id com sufixos edit, export, preview, versions voltam ao dashboard; a autenticação do workspace continua exigida.
- /p/* exibe aviso público de descontinuação sem consulta de token, proposta ou autorização comercial.
- Dashboard usa monthly_editorial_campaigns.status=pending para aprovações; nenhuma consulta a proposals.
- Fase 08 retirada da lista ativa de diagnóstico; manifesto histórico preservado.

## Validação

- Typecheck aprovado; lint aprovado com avisos existentes.
- Build de produção aprovado; nenhum chunk ativo de Propostas emitido.
- Navegador Chrome isolado, APIs controladas: 16 casos aprovados em desktop 1440×900 e mobile 390×844. Inclui links antigos internos e públicos, ausência de leituras comerciais, operação Social Media/Design/Vídeo/Tráfego, carrossel completo, edição sem truncamento e roteiro.
- Suíte final de regressão: 349 testes aprovados em 89 arquivos.
- Dados persistentes Aurora preservados; nenhuma escrita no Supabase nesta entrega.
- 42/44 arquivos de trabalho anterior permanecem idênticos. Em Diagnostics e PermissionStudio foram modificadas apenas as linhas de retirada do módulo; seus demais ajustes continuam fora da publicação.
- Commit funcional f7bebb9 enviado para origin/codex/master-audit-15-1. Deploy Cloudflare 1a7772bb-d692-4d91-a23d-f8a5fc3a4375.
- Conferência remota: bundle /assets/index-Db3xUSbG.js corresponde byte a byte ao build validado. Aviso público verificado no domínio real em 1440px e 390px, sem consultas Supabase e sem overflow. Rota privada antiga preserva autenticação para visitante anônimo.
