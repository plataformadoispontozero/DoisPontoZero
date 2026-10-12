# Jornada única, importação, Google e app da equipe

Status: Ready for Review. Usuário autorizou posteriormente push e deploy em 12/10/2026. Migrations e função Google implantadas; publicação frontend em andamento. Credenciais OAuth, jornadas avançadas e distribuição assinada permanecem pendentes. Nenhum cliente real foi importado.

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
