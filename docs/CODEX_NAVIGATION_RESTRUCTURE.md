# Dois.Zero — reestruturação da navegação

Data da revisão: 12/10/2026. Validação inicial local; push e deploy concluídos após nova autorização explícita. Sem merge.

## Inspeção e estrutura

Inspecionados: AppLayout, Sidebar, MobileNav, NavLinks, TopBar, router/index, guards/RBAC existentes, BrandingProvider, BrandLogo e Tooltip. A estrutura anterior distribuía os links em Menu Principal, Ferramentas e Sistema; desktop e mobile repetiam a composição.

A configuração compartilhada agora organiza os mesmos 18 módulos:

| Grupo | Entradas |
| --- | --- |
| PAINEL | Visão Geral; Minha Agenda |
| CLIENTES & COMERCIAL | Clientes; Briefings; Propostas |
| PROJETOS & ENTREGAS | Projetos; Tarefas |
| PESSOAS & EQUIPES | Equipe & Profissionais; Squads |
| PRODUÇÃO CRIATIVA | Design; Vídeo & Motion; Tráfego Pago |
| ESTRATÉGIA & CONTEÚDO | Estratégia; Calendário Editorial |
| COMUNICAÇÃO | Reuniões; Chat; Apresentações |
| SISTEMA | Configurações |

Vídeo & Motion mantém `/production/video`. Todas as demais URLs dos módulos permanecem iguais. A seleção deriva de `matchPath`, com contexto determinístico para subrotas. Nenhuma permissão foi concedida; filtros existentes e guards de rota foram preservados.

## Componentes e comportamento

- `navigationConfig.ts` e `NavigationGroups.tsx`: grupos compartilhados, expansão persistida por usuário/agência, abertura do grupo ativo ao navegar, controles com aria-expanded/aria-controls e foco visível.
- `Sidebar.tsx`: topo fixo, centro com scroll independente, Configurações e perfil no rodapé uma única vez. Modos expandido e compacto; símbolo oficial e ícones centralizados.
- `MobileNav.tsx`: drawer existente com os mesmos grupos e seletor; fecha após navegar. A barra inferior existente permanece.
- `WorkspaceSelector.tsx`: mantém a alternância real de agência e as regras de acesso.
- `TopBar.tsx`: título acompanha o contexto do roteador.
- `BrandLogo.tsx` e `Tooltip.tsx`: símbolo oficial; dicas por foco/hover em portal, sem recorte pelo scroll.

Cores vêm dos tokens da identidade ativa. Não foram adicionadas bibliotecas. Movimento reduzido é respeitado. Em 1440×900 e 768×1024, sidebar expandida/compacta; em 390×844, drawer e barra móvel. O centro pode rolar sem encobrir os controles fixos.

## Ajustes anteriores concluídos nesta revisão

Convites: `TeamManagementPage.tsx`, `TeamDirectoryPage.tsx`, `useAgencySettings.ts`, `AcceptInvitationPage.tsx` e router. Administrador escolhe e-mail/papel, gera e copia um link para compartilhar manualmente. Não há confirmação falsa de envio de e-mail. Novo usuário define sua senha; conta existente entra com sua própria senha. O serviço valida e-mail confirmado, expiração de uma hora, revogação e papel da agência; OWNER permanece protegido.

O serviço `team-invite` e a migration `20261011195102_secure_team_invitations.sql` foram ativados antes do Prompt 18. Nenhuma alteração remota foi feita para a reestruturação do menu. O frontend recebeu nova autorização explícita de publicação em 2026-10-12. Homologação real com contas temporárias passou para criação, reemissão, aceite como Gestor, usuário existente, rejeição por e-mail diferente/revogação e proteção de OWNER. As fixtures foram removidas.

Os avisos do advisor sobre RPCs SECURITY DEFINER executáveis por authenticated foram revisados: são necessários para operações protegidas, com search_path vazio, escopo de agência e validação de identidade/permissões. Não significam ausência de avisos no projeto. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Configurações: removidas referências visíveis a White Label Studio e a versão do cabeçalho. Versão somente na visão geral; rota antiga de identidade preservada.

Notificações: `notificationSounds.ts`, `useSoundPreference.ts`, `NotificationSoundControls.tsx`, `NotificationSoundController.tsx` e `useNotifications.ts`. Cinco sons distintos: aprovação, produção, novo cliente, mensagem e reunião. Preferência individual, volume, teste e silêncio. Ativação depende de interação no navegador. Eventos reais são observados enquanto a plataforma está aberta, a cada 15 segundos; o histórico inicial não toca. Não são notificações push em segundo plano. Eventos simultâneos podem ser agrupados, tocando apenas o mais recente.

## Validação e evidências

- Typecheck aprovado.
- Lint aprovado; avisos preexistentes, sem novos avisos nos componentes de grupos/sons.
- Vitest: 113 testes aprovados em 27 arquivos.
- Playwright da agência: 66 testes aprovados em três viewports; permissões, deep links, reload, grupos, centralização, workspace, convites e sons. Testes de áudio verificam as frequências efetivamente emitidas pelo Web Audio para novos eventos de aprovação, produção e cliente.
- Playwright do site público: 21 testes aprovados.
- Build de produção aprovado; `git diff --check` sem erros.
- Capturas usam dados controlados de teste; não representam clientes reais.

Capturas locais:

- `test-results/navigation-1440.png`
- `test-results/navigation-768.png`
- `test-results/navigation-390.png`
- `test-results/navigation-compact-1440.png`
- `test-results/navigation-compact-768.png`

Testes alterados: `e2e/agency-access.spec.ts`, `team-security.test.tsx`, `settings.test.tsx` e `notificationSounds.test.ts`. A renderização do menu não certifica o funcionamento de todos os backends dos módulos; as verificações cobrem os fluxos descritos acima. Nenhuma colisão de rota ou concessão indevida de acesso foi observada nesses testes.

## Pendências

O usuário autorizou explicitamente push e deploy em 2026-10-12, substituindo a restrição anterior do Prompt 18 para essas duas ações. Merge continua fora do escopo. O administrador compartilha o convite; envio automático por SMTP não faz parte deste fluxo. Esta revisão não reimplementa os demais módulos nem altera seu banco.


## Publicação autorizada — 2026-10-12
Código revisado para envio à branch `codex/master-audit-15-1` e build de produção com `VITE_PUBLIC_SITE_PREVIEW=false`. Publicação direcionada ao Worker existente `doispontozero`, preservando domínio, DNS e banco. As migrations e o serviço de convite já estavam ativos; não são reaplicados nesta etapa.


Publicação concluída: commit de código `056a0876a2ab373ccc077a65833627ea26c99c9e`, branch `codex/master-audit-15-1`; Worker versão `3a9779fb-2a7f-4b4e-8bc7-71abba120730`. Build de produção `index-d19BTmzT.js` confirmado no domínio https://doispontozero.renatodesigner.com.br. Verificação de navegador em 1440×900 e 390×844: `/login` HTTP 200; `/settings/team` HTTP 200 e redireciona visitantes sem sessão ao login; `/accept-invitation` HTTP 200 e apresenta a página de convite. Nenhuma tela apresentou overflow horizontal. Esta checagem não executou aceite de convite real nem sessão administrativa em produção. Backend e DNS preservados.
