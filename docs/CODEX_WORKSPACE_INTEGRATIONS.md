# Jornada da equipe, CSV e Google

12/10/2026. A preparação original foi local, conforme documento CSV. Em mensagem posterior o usuário autorizou explicitamente push e deploy. As duas migrations e a função Google foram implantadas no projeto existente, sem importar clientes reais. Publicação frontend registrada abaixo.

## Onde revisar

- `/settings/integrations`: importação e acesso à conexão Google.
- `/settings/integrations/import-clients`: upload → validação → mapeamento → seleção → revisão → confirmação → resultado por linha.
- `/settings/integrations/google`: Google Agenda e Drive, com estado real do backend.
- `/settings/apps`: instalação web e preferências de avisos; detalhes em CODEX_APPS_INSTALLATION.md.
- `/clients/:clientId/workspace`: jornada com registros originais filtrados por agência e cliente. Atalho no painel de briefings do cliente.

## CSV

Campos reais aceitos: `name` (obrigatório, até 200 caracteres), `slug` (obrigatório, até 100, minúsculas/números/hífens), `logo_url` (opcional HTTP/HTTPS), `status` (active/inactive/archived, padrão active). Não cria usuários, projetos, briefs ou contatos. O schema atual de clients não contém contato/email; esses campos não são inventados na importação.

UTF-8, BOM, vírgula ou ponto e vírgula, acentos, aspas escapadas e quebras dentro de aspas. Limites: 2 MB, 500 registros e 30 colunas. Conteúdo é analisado, não somente MIME/extensão. CSV permanece na memória do navegador; texto é renderizado por React, sem HTML ou upload externo.

Identidade: índice existente `(agency_id, slug)`. Slug já existente é ignorado, sem atualizar dados. Nomes iguais apenas alertam para revisão. Slugs repetidos no arquivo são bloqueados. A operação usa ON CONFLICT para proteger reenvios e a restrição única para concorrência. A seleção e os valores finais precisam de confirmação.

RPC `import_clients_csv`: JWT da sessão, permissão existente clients.create via private.can_editorial, agência vinculada no servidor, allowlist de campos e validação repetida no banco. Revogado para anon/public. Nenhuma service_role no frontend. Erros por linha permitem importação parcial; erro de permissão invalida todo o lote. Auditoria usa audit_logs existente e registra nome do arquivo/totais/ator/hora, sem conteúdo CSV. Migration aplicada: `20261012043032_import_clients_csv.sql`.

Testes usam PostgreSQL WASM PGlite isolado com fixtures sintéticas. Validam o SQL e os limites da RPC, sem afirmar homologação completa de RLS/produção. Testes do navegador usam respostas controladas; nenhum cliente real é importado.

## Google Cloud — preparação necessária

1. No projeto Google Cloud existente, habilitar Google Calendar API e Google Drive API.
2. Configurar tela de consentimento OAuth, domínio autorizado, política de privacidade e contas de teste enquanto o app estiver em teste.
3. Criar credencial OAuth do tipo Aplicativo da Web. Retorno exato: `https://pvkhlobsiszrjtblpruu.supabase.co/functions/v1/google-workspace`.
4. Configurar no servidor, fora do frontend e do chat: GOOGLE_WORKSPACE_CLIENT_ID, GOOGLE_WORKSPACE_CLIENT_SECRET, GOOGLE_WORKSPACE_REDIRECT_URI (URL acima), GOOGLE_WORKSPACE_TOKEN_KEY (chave aleatória AES de 32 bytes em base64), GOOGLE_WORKSPACE_APP_ORIGIN (origem HTTPS oficial).
5. Migration `20261012043036_google_workspace_oauth.sql` aplicada e Edge Function google-workspace v1 implantada. Faltam as credenciais OAuth configuradas com segurança, não solicitadas pelo chat.
6. Autorizar uma conta de teste pelo painel. Conferir listar arquivos e próximos eventos, revogação, expiração e renovação antes de ativar para a equipe.

OAuth com state aleatório, hash armazenado, TTL de 10 minutos, consumo único, PKCE S256 e retorno fixo. Permissão settings.edit e sessão verificadas no servidor; callback revalida vínculo e papel antes de salvar. Credentials/refresh token criptografados AES-GCM em tabelas private com RLS e sem grants a clientes. RPC de armazenamento somente service_role. Refresh e revogação acontecem no servidor, sem logs de segredos e sem tokens nas URLs do app.

Escopos: openid/email, drive.file e calendar.events.readonly. drive.file mostra **somente arquivos autorizados para esse aplicativo**, não todo o Drive. A primeira conexão pode mostrar lista vazia; seleção via Google Picker e integração do navegador legado de arquivos são próximos passos. A Agenda lista eventos da conta nos próximos 30 dias. Não há sincronização bidirecional ou alteração automática de reuniões implementada aqui.

A integração nova é acessada pelo painel de configurações; as rotas legadas de conexão Drive/Agenda também apontam ao painel OAuth, mas os navegadores legados de arquivos/reuniões não foram convertidos em sincronizadores. Sem backend/configuração, a UI apresenta indisponibilidade/configuração necessária e desabilita conectar. Não simula conexão. Apps nativos usam a página oficial no navegador para conectar, pois Google não permite OAuth em WebViews. Teste de provedor real ainda depende da configuração segura e implantação autorizada.

## Jornada e limites

Painel usa briefs, content_strategies, monthly_editorial_campaigns e projects existentes. Consultas têm cliente/agência e respeitam permissões. Erros não são substituídos por dados fictícios. Calendário recebe clientId/campaignId por link. Projetos são a entrada para produção/tarefas/entregas existentes. O painel lista os 100 registros recentes por etapa.

“Rascunho / revisão interna” descreve draft; aprovação interna separada, responsáveis e capacidade consolidados, histórico unificado e validação completa de todas as transições permanecem evolução pendente. Estratégia active não é apresentada como aprovação formal. O motor editorial existente e aprovação do cliente permanecem originais.

Senha agora tem controle mostrar/ocultar sem submeter formulário. Recuperação no app nativo aponta para HTTPS oficial. Notificações/instalação e limitações de push com app fechado estão no relatório de apps.

## Evidências de verificação

- 152 testes unitários/integração local em 37 arquivos passaram.
- SQL das duas migrations testado em PGlite isolado: permissão/tenant CSV, duplicados/reenvio, falha parcial, auditoria sem conteúdos, OAuth single-use/expiração/permissão revogada e credenciais inacessíveis a anon/authenticated.
- Deno check da Edge Function passou. Teste de protocolo OAuth com fetch controlado passou: JWT/permissão, state, PKCE, token criptografado, retorno fixo e bloqueio de replay. Não foi teste real contra Google.
- 84 cenários E2E da suíte da agência passaram antes da revisão final de escopo do CSV; depois os 12 cenários afetados/novos passaram em desktop/tablet/mobile (senha/CSV com confirmação, configuração Google ausente, jornada do cliente e descarte de confirmação ao trocar agência).
- Typecheck e build passaram. Lint geral terminou sem erros, com avisos já existentes; lint dos novos módulos ficou sem avisos.
- Preview CSV revisado visualmente com fixture fictícia, sem dados reais.

## Publicação autorizada — 12/10/2026

- Projeto Supabase: pvkhlobsiszrjtblpruu, o projeto existente solicitado pelo usuário.
- import_clients_csv: versão remota 20261012043032. google_workspace_oauth: versão remota 20261012043036. Os nomes locais foram alinhados ao histórico que apply_migration realmente gerou; não foi feito migration repair nem alterado o histórico remoto. Conteúdo SQL preservado integralmente.
- google-workspace: ACTIVE, versão 1, autenticação customizada no corpo (POST auth.getUser + permissão; GET state único/PKCE/expiração). verify_jwt=false é necessário ao callback público Google e não libera acesso aos dados.
- Pós-migration: CSV executável somente por authenticated; segredo RPC somente service_role; tabelas private sem SELECT authenticated e com RLS. Contagem clients permanece zero.
- Advisor: RLS sem policies nas duas tabelas private é deny-by-default intencional; RPCs authenticated SECURITY DEFINER são intencionais e verificam sessão/permissão. Avisos legados sobre funções/auth anteriores à rodada continuam registrados no projeto; não foram alterados por este deploy.
- Push confirmado: commit funcional `817df66`, branch `codex/master-audit-15-1`. Deploy Cloudflare concluído no Worker existente: versão `ac980a52-4a16-43cc-a20d-64ac31ac3fcc`; bundle `index-DJNuYfI4.js` confirmado no domínio oficial.
- Smoke Edge: POST sem sessão retornou HTTP 401; GET callback retornou HTTP 303 para o domínio oficial com `google=configuration_required`, conforme verificação do backend.
- Navegador real em 1440×900 e 390×844: início e login HTTP 200; editorial protegido redireciona visitante sem sessão ao login; bundle correto e sem overflow. Verificação não executou OAuth Google nem importou clientes.
- Gates de publicação: 152 testes unitários em 37 arquivos, typecheck, lint sem erros (avisos preexistentes) e build de produção aprovados. Nenhum instalador binário ou target nativo foi incluído no commit.
- OAuth Google, Google Picker/sincronização, apps assinados Windows/mobile e push com app fechado continuam pendentes conforme limites acima e relatório de apps.

## Correção da importação e diagnóstico Google — 12/10/2026

O arquivo fornecido contém 29 registros UTF-8/BOM, delimitador ponto e vírgula e campos multilinha entre aspas. Nome do cliente agora é reconhecido; quando slug não existe, é gerado a partir do nome. Status ativo/inativo/arquivado é convertido para active/inactive/archived. Prévia, colisões, tenant e confirmação continuam obrigatórios; nenhum registro existente é atualizado. Os outros campos do arquivo são mostrados como não importados, porque a API atual de clientes suporta somente name/slug/status/logo_url. Todos os 29 registros ficaram válidos na leitura em memória, sem importar dados reais nos testes.

Google mostra erros de sessão/serviço separadamente de falta de configuração e oferece nova tentativa. A página tem passos para criar um cliente OAuth Web no projeto firm-pentameter-474412-h7 e cadastrar os segredos somente no Supabase. Conta de serviço é diferente de autorização individual OAuth: https://developers.google.com/identity/protocols/oauth2/web-server.

A Edge Function foi atualizada para versão 2 com cabeçalhos CORS canônicos do SDK, mantendo a lista de origens, permissões e autenticação. Não há prova de que CORS era a causa do erro observado; logs mostraram 404 antes do deploy original e OPTIONS 204 depois dele. Um teste de navegador no domínio oficial obteve HTTP 401 sem sessão (comunicação chegou ao backend). Após versão 2: preflight 204/headers SDK, POST não autenticado 401, callback 303 configuration_required. A autorização real do Google continua aguardando CLIENT_ID/CLIENT_SECRET/REDIRECT_URI/TOKEN_KEY.

Verificações: 154 testes/37 arquivos; lint sem erros (avisos existentes), typecheck e build. Dez cenários E2E afetados passaram em desktop/mobile. Bundle produzido index-DEGoNDhl.js. Frontend: publicação da correção em andamento.
