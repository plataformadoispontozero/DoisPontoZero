# Jornada única, importação, Google e app da equipe

Status: Done para o escopo validado. Usuário autorizou posteriormente push e deploy em 12/10/2026. Migrations, função Google e frontend publicados; evidências registradas em CODEX_WORKSPACE_INTEGRATIONS.md. Credenciais OAuth, jornadas avançadas e distribuição assinada permanecem pendentes. Nenhum cliente real foi importado.

Fontes: solicitações de 12/10/2026 e anexos febde614 (jornada) e 7d63ab83 (CSV). Escopo preserva motor editorial e fluxos atuais. Google confirmado: Agenda e Drive; usuário possui Google Cloud, sem contas de distribuição de apps informadas.

- [x] Mostrar/ocultar senha com controle acessível, sem alterar autenticação.
- [x] Painel inicial da jornada cliente→briefing→estratégia→calendário→aprovação→produção, com vínculos reais e estados honestos. Histórico unificado e revisão interna separada permanecem pendentes.
- [x] Configurações: importação CSV por arquivo, parse/validação/mapeamento/seleção/prévia/confirmação/resultado, sem sincronização externa.
- [x] Backend CSV com permissão existente, agência, validação, índice único de slug e resultados por linha; migrations aplicadas após autorização posterior, grants verificados e testes isolados.
- [x] Preparar OAuth real para Agenda e Drive, escopos explícitos, estado/PKCE, segredos no backend, sem conexões simuladas.
- [x] Instalação do app e notificações com símbolo/mensagem; distinguir instalação web, pacote nativo e push fechado dependentes da configuração real.
- [x] Testes, typecheck/lint/build e documentação de implantação/configuração/limitações; deploy autorizado posteriormente e evidências registradas no relatório.

## File list

- src/components/ui/PasswordInput.tsx e PasswordInput.test.tsx; src/features/auth/AuthPage.tsx.
- src/features/clients/ClientWorkspacePage.tsx, ClientsPage.tsx, hooks/useClients.ts; src/features/editorial/MonthlyEditorialPage.tsx.
- src/features/settings/import-clients/*; GoogleWorkspacePage.tsx; google-oauth-database.test.ts; IntegrationsCenterPage.tsx; CalendarIntegrationPage.tsx; components/SettingsLayout.tsx; src/features/drive/DriveConnectionsPage.tsx e drive.test.tsx.
- src/app/router/index.tsx; src/app/layouts/AppLayout.tsx; src/main.tsx; index.html.
- src/features/app-install/*; public/manifest.webmanifest; public/service-worker.js; public/app-icons/*.
- src-tauri/{Cargo.toml,Cargo.lock,build.rs,tauri.conf.json,src/*,capabilities/default.json,.gitignore}; .github/workflows/native-development-build.yml; scripts/native/package-macos-development.sh.
- supabase/migrations/20261012043032_import_clients_csv.sql e 20261012043036_google_workspace_oauth.sql; supabase/functions/google-workspace/{index.ts,index_test.ts}; supabase/config.toml.
- package.json; package-lock.json; e2e/agency-access.spec.ts.
- docs/CODEX_WORKSPACE_INTEGRATIONS.md; docs/CODEX_APPS_INSTALLATION.md; esta story.

## Correção pós-publicação — CSV e Google (12/10/2026)

Status: Ready for Review. Fonte: CSV fornecido pelo usuário (29 linhas) e falha Google em configurações.

- [x] Reconhecer Nome do cliente e status português; gerar slug quando o arquivo não possui essa coluna, com prévia e confirmação.
- [x] Validar arquivo real em memória e regressões sem importar dados reais durante testes.
- [x] Diagnosticar chamada Google no navegador, preservar auth e informar configuração OAuth pendente com instruções.
- [ ] Testar, publicar correções autorizadas e registrar evidências.

Validação da correção: 154 testes em 37 arquivos, lint sem erros (avisos legados), typecheck/build passaram. Dez cenários E2E afetados passaram em desktop/mobile (8 na rodada inicial; os 2 de recuperação de rede passaram após ajustar a fixture para manter a falha até o clique, pois o SDK já tenta novamente sozinho). CSV real lido somente em memória: 29/29 válidos, sem gravação em produção. Nome e status são importados; outros 16 campos são explicitamente listados como não importados. Slug gerado está sujeito à mesma checagem de duplicados/validação e confirmação.

Google: logs mostraram 404 anteriores ao deploy original e OPTIONS 204 após deploy; não foi comprovada a causa da falha da sessão do usuário. Consulta real feita no navegador Chrome no domínio oficial respondeu 401 sem sessão, confirmando comunicação CORS sem liberar acesso. Edge versão 2 publicada usando corsHeaders do SDK, preservando origem restrita e autenticação customizada. Preflight 204 incluindo traceparent/x-retry-count, POST sem sessão 401 e callback 303 configuration_required confirmados. O cliente OAuth ainda não existe/configurou-se; conta de serviço não é substituto desse fluxo. Projeto informado pelo usuário: firm-pentameter-474412-h7. Nenhum segredo recebido ou publicado.

Arquivo adicional de evidências: docs/CODEX_WORKSPACE_INTEGRATIONS.md. File list da correção: csv.ts, csv.test.ts, ImportClientsPage.tsx, GoogleWorkspacePage.tsx, google-workspace/index.ts, e2e/agency-access.spec.ts e os dois documentos.

Hotfix CSV/Google publicado em 12/10/2026: código `d843200`, Worker `ad2451af-feae-4ee5-bdb9-afb05fb1aed4`; domínio e bundle conferidos em desktop/mobile.

## Botão de seleção CSV — 12/10/2026

Status: Done — botão publicado. Solicitação: entrada de arquivo aparecia como texto nativo sem botão visível.

- [x] Botão explícito Selecionar arquivo CSV/Trocar arquivo CSV, com foco por teclado e estado ocupado.
- [x] Nome do arquivo selecionado e orientação sobre prévia, revisão e confirmação.
- [x] Gates: 154 testes, lint sem erros (avisos legados), typecheck/build e 2 E2E desktop/mobile passando com clique real no botão e filechooser. Bundle index-CpZtEP9W.js. Publicado: código `1c6476f`, Worker `3f56a177-1fe2-4569-b112-95560c1f84a6`; domínio confirmado em 1440×900 e 390×844, início/login HTTP 200 e editorial protegido, sem overflow. Nenhum dado real importado.

File list: ImportClientsPage.tsx, e2e/agency-access.spec.ts e esta story.

## Ficha completa do cliente e importação ampliada — 12/10/2026

Status: Em andamento. Referência visual fornecida pelo usuário: ficha antiga com negócio, audiência, posicionamento e direção editorial. Requisitos: modal amplo responsivo; links Drive/logo/Maps; calendário/briefing/jornada; dados persistentes editáveis. Importação original deve preservar 18 campos conhecidos e permitir completar cadastro existente após revisão sem sobrescrever dados. Fonte Lovable 88ee1363-3966-494f-a78d-ad375651555f acessada somente para diagnóstico read-only.

- [ ] Persistência de perfil com validação, permissões e migração segura.
- [ ] Mapeamento CSV completo e preenchimento explícito de campos ausentes em duplicados.
- [ ] Modal amplo, editor de perfil, dados e links reais com estados vazios honestos.
- [ ] Gates, verificação banco e publicação.


### Correção de entrega de convites — 2026-10-12
- [x] Diagnóstico: generateLink não envia e-mail.
- [x] Envio Auth para novos membros, com erros de SMTP/limite visíveis.
- [x] ID do convite preservado no redirecionamento de confirmação e criação de senha.
- [x] Verificação e implantação: a4949a1, 156 testes; Edge Function team-invite v2; Cloudflare 453317cd-2ea8-4b9f-83cb-c5c6d77caf82. SMTP e recebimento real ainda pendentes.
Arquivos: supabase/functions/team-invite/index.ts; src/features/team/AcceptInvitationPage.tsx; src/features/settings/TeamManagementPage.tsx; src/features/settings/hooks/useAgencySettings.ts.

## Recuperação dos dados dos clientes — 12/10/2026
- [x] Perfil validado, preenchimento CSV apenas de dados ausentes, modal amplo e links reais.
- [x] Migration aplicada e 29 clientes enriquecidos a partir do mapeamento por IDs revisado, sem sobrescrever campos existentes.
- [x] Histórico imutável por cliente disponível com RLS e estados de aprovação originais.
- [x] Objetivo, público, tom e posicionamento do cadastro sugeridos ao iniciar calendário, com revisão pela social media.
- [x] Documentos históricos disponíveis; 566 importados, 27 registros de 13 clientes ausentes ficam separados para revisão, sem vínculo inventado.
Arquivos adicionais: src/features/clients/clientProfile.ts, profileFields.ts, components/ClientHubModal.tsx, ClientLegacyPanel.tsx; testes clientProfile/clientLegacy; migrations client_profiles_and_csv_enrichment e client_legacy_records.

Reconciliação final do histórico: 23 briefings, 43 estratégias, 103 calendários, 326 demandas e 71 registros de vídeo = 566. Verificação do agente de migração: nenhum duplicado, mapeamento inválido ou credencial nos registros importados. Esses documentos preservam estados antigos e não criam novas aprovações.

Ficha e histórico publicados: 3f96a87 / Cloudflare ae4dcac2-8e57-473d-b3e9-5d231a2a4185. Banco verificado: 29 perfis vinculados; 21 com audiência e 26 com pasta Drive; 566 documentos históricos sem binários/base64 ou credenciais. Uso de briefing histórico no calendário exige revisão dos campos pela social media e mantém referência da origem.
