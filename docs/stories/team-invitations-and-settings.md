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
