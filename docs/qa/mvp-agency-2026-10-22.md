# MVP para operação real da agência — 22/10/2026

## Escopo desta entrega

Execução coordenada com os perfis instalados do Agency Agents: UI Designer/UX Architect, Frontend Developer e Backend Architect. Não há declaração de 100% de homologação: os aceites externos têm evidências próprias.

## Correções de uso diário

- CRM: removidos clientes demo e sucesso falso em memória sem backend; falhas têm mensagem e retry.
- Projetos: seleção do cliente real ou projeto interno, falha de carga bloqueia criação, arquivamento filtra agência.
- Configurações: aparência aguarda dados reais, troca de agência e retry; foco visível, teclado e alvos de navegação; identidade visual acessível pelo menu.
- Opções de tema/idioma sem implementação não prometem efeito; preferências antigas de idioma preservadas até escolha explícita.
- Galeria pública Aurora fictícia removida dos arquivos publicados nesta versão.

## Conferência de navegação

Navegador autenticado, 15 destinos de configurações observados a partir dos links reais em /settings. Conteúdo além de “Preparando seu espaço de trabalho” confirmado. Isto não equivale a testar gravação de todos os formulários, SMTP ou serviços externos.

/settings, public-site, agency, appearance, notifications, team, permissions, workspace, documents, client-experience, integrations, apps, security, activity, diagnostics.

## Limpeza de dados

Cenário provado pelo relatório original: Aurora Café — TESTE FICTÍCIO, cliente d80253af-69ea-4d74-9224-24f39d8b2d61, agência a0f00e64-e8ba-44e5-b0cf-2ad7adb44211. Inventário: dois projetos provados, 16 demandas, um briefing, uma reunião, sem apresentações atuais vinculadas. Plano inclui dependências e recusa vínculos de outra agência/cliente/projeto.

Dry-run de inventário por contagens aprovado em rollback. Corrigida ambiguidade do alias de notificações no SQL de preparação. Backup completo foi bloqueado por revisão automática até autorização específica de destino local. Nenhuma linha remota excluída até essa autorização e conferência do backup. Arquivos do Drive, usuários reais e logs de auditoria preservados.

## Aceites de operação ainda necessários

- Convite/cadastro/aprovação/recuperação com SMTP real.
- Seleção, upload e preview de um arquivo real no Drive com as permissões da agência.
- Jornada real briefing → editorial → produção → aprovação → retorno de ajuste.
- Chat/notificações entre membros; mídia e tray exigem dispositivos reais.
- Voz bidirecional e continuidade em duas contas já confirmadas pelo responsável; não substituem os itens acima.

## Evidência

Relatórios mvp-ui-settings-2026-10-22.md, mvp-workflows-2026-10-22.md e aurora-cleanup-plan-2026-10-22.md. Suíte integral e publicação são registradas após sua conclusão.

## Regressão

- Suíte integral com um worker: 592 testes em 159 arquivos aprovados, 155,73s. Log local /tmp/dois-mvp-regression.log.
- TaskDetailPanel sem configuração tinha fixture; produção com backend configurado já era protegida. Limpeza defensiva com estados de erro/retry/ausente, sem alegar que era falha ativa em produção.

- Quatro testes adicionais direcionados de TaskDetailPanel aprovados. Não somados à contagem integral para evitar duplicação.
- Build de produção/typecheck aprovados. Deploy das correções autorizado pelo responsável; exclusão remota dos testes segue aguardando autorização de backup local.
