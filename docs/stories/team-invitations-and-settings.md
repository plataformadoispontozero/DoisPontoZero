# Convites operacionais e configurações da agência

Status: Done — push e publicação concluídos em 2026-10-12 após autorização explícita

- [x] Administrador gera convite por e-mail/papel e copia link para compartilhar.
- [x] Novo profissional confirma convite e define a própria senha; conta existente exige login próprio.
- [x] Aceite vincula somente o e-mail confirmado à agência, com prazo, revogação e proteção de OWNER.
- [x] Alteração administrativa de papel via operação validada; sem escrita direta de vínculos.
- [x] White Label removido da navegação; versão somente na visão geral de configurações.
- [x] Testes e homologação.
- [x] Push e publicação do frontend concluídos em 2026-10-12; versão e checagem do domínio registradas no relatório de navegação.

Envio é manual pelo administrador; não há afirmação de e-mail enviado nem dependência de SMTP. Token Auth só aparece no fragmento do link retornado ao administrador autorizado; não é armazenado em logs ou tabelas públicas.

Arquivos: migrations secure_team_invitations, supabase/functions/team-invite, useAgencySettings.ts, TeamManagementPage.tsx, TeamDirectoryPage.tsx, AcceptInvitationPage.tsx, router/index.tsx, páginas de configurações e testes.

- [x] Menu com oito grupos, persistência, foco ativo e centro rolável, mantendo Configurações no rodapé.
- [x] Sidebar compacta com símbolo oficial e ícones centralizados; drawer móvel compartilhado.
- [x] Cinco sons, volume, ativação e silêncio; observação somente leitura de eventos enquanto a plataforma estiver aberta.

Convite homologado com contas temporárias: novo usuário, reemissão, senha, aceite MANAGER; usuário existente não recebe token de login, e-mail diferente/revogação recusados e OWNER protegido. Todas as fixtures foram removidas. Serviço ativado antes do prompt de navegação que proíbe publicação. Navegação não altera banco ou rotas.

Validação: 113 testes unitários; 66 testes Playwright da agência em três viewports; typecheck e lint aprovados (avisos preexistentes). Evidências e lista de arquivos em `docs/CODEX_NAVIGATION_RESTRUCTURE.md`.

Regressão do site público: 21 testes aprovados. Build final aprovado e diff sem erros de whitespace.

## Central de notificações em Configurações — 2026-10-12

Status: Ready for Review. Solicitação do usuário: preferências acessíveis em Configurações e relatório de notificações.

- [x] Central disponível em /settings/notifications, com histórico do próprio destinatário na agência ativa.
- [x] Filtros por leitura e tipo, contagens calculadas somente dos registros recebidos.
- [x] Erros de consulta e de atualização visíveis; preferências de som existentes mantidas.
- [x] Solicitações de cadastro encaminham o administrador à gestão de equipe.

Arquivos: src/features/notifications/NotificationsPage.tsx; src/features/notifications/notificationHistory.ts; src/features/notifications/notificationHistory.test.ts; src/features/settings/components/SettingsLayout.tsx.

Validação da central: typecheck aprovado; 3 testes direcionados aprovados; lint sem erros, com avisos preexistentes. Rota final e verificação global ficam na integração da story.

## Cadastro da equipe com aprovação — 2026-10-12
- [x] Formulário público solicita nome, e-mail, senha e profissão; não concede vínculo ativo.
- [x] Administrador/gestor confere identidade e atribui papel protegido antes de ativar.
- [x] Solicitação gera notificação privada aos revisores autorizados.
- [x] Testes de isolamento, permissões, validação e implantação concluídos.
Files: src/features/team/TeamRegistrationPage.tsx; src/features/team/RegistrationRequestsPanel.tsx; src/features/auth/AuthPage.tsx; src/app/router/index.tsx; src/features/settings/TeamManagementPage.tsx; backend team-registration e migration associada.

Migration aplicada: 20261012084523_team_registration_review.sql. RLS confirmado, APIs privilegiadas service_role somente, confirmação global preservada. Arquivos adicionais: supabase/config.toml; src/types/notifications.ts; src/features/team/teamProfessions.ts; src/features/team/TeamRegistrationPage.test.tsx; src/features/team/RegistrationRequestsPanel.test.tsx; src/features/team/team-registration.database.test.ts.

Permissão dedicada de revisão implantada: migration 20261012085000_team_registration_reviewer_permission.sql. Gestor aprova Colaborador; atribuição Administrador exclusiva do proprietário. 5 testes DB aprovados; members.edit preservada.

Validação final isolada: lint sem erros, typecheck, 168 testes em 42 arquivos e build passaram. Cadastro em desktop/tablet/mobile homologado com backend simulado sem criar contas reais. CodeRabbit indisponível; nenhum passe declarado. Publicação concluída: commits 8473325 e 1751443; função team-registration ACTIVE v1; Cloudflare ea9b606f-8e14-47bc-8554-09bce55d48f2; bundle index-KG9bh9MZ.js. Aprovação anônima recusada 401; preflight 204. Nenhum cadastro real criado na homologação.
