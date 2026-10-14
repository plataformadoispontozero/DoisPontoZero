# Escritório Digital — Fase 02 — 14/10/2026

## Modelo e reuso
Inspeção do schema remoto confirmou chat_channels com agência, squad, tipo, visibilidade e arquivamento; chat_channel_members, squad_members e chat_preferences existentes. Nenhuma nova tabela de sala, usuário ou membro foi criada. office_enabled complementa chat_channels, inicia false. chat_preferences recebe sala preferida, auto-join false e IDs opacos de dispositivos limitados a 256 caracteres. Não contém tokens, trilhas de mídia ou heartbeat. Sem seed: uma sala existente já atende ao tenant; a habilitação será explícita quando o fluxo de voz estiver pronto. Convites de voz ficam para a fase específica, reutilizando notifications quando possível.

Migration: 20261014184243_office_phase02_tenant_data.sql, criada com supabase migration new, aplicada no projeto pvkhlobsiszrjtblpruu. Backend é compartilhado com a plataforma principal; somente alterações aditivas, dados e policies do Chat preservados. As salas continuam desabilitadas para escritório/voz. O overview da Fase 01 continua listando as salas de mensagens existentes; não representa conexões de voz.

## Segurança
- private.office_room_access valida identidade real, chat.access vigente, tenant, visibilidade privada/membership, squad e habilitação/arquivamento.
- public.office_directory é invoker e retorna somente salas habilitadas autorizadas.
- public.office_configure_room é invoker e delega a uma função privada com search_path vazio, checks de sessão, OWNER/ADMIN/MANAGER e chat.create_channels/chat.access. Membros comuns não configuram salas, mesmo que tenham permissão de criação de canal. Nenhum grant de UPDATE no canal foi adicionado.
- Preferências conservam a RLS própria existente; trigger rejeita sala preferida de outra agência ou restrita. A revogação posterior não bloqueia a edição das notificações; os consumidores futuros devem revalidar a sala antes de usar a preferência.
- realtime.messages recebeu policies de leitura/envio somente para broadcast/presence no namespace office:<agency UUID>:<room UUID>. IDs são resolvidos no banco, tópicos inválidos falham fechados. Fase 03 deverá obrigatoriamente usar config.private=true; nenhum socket ou presença foi iniciado nesta fase.
- Helpers privilegiados privados, sem execute anônimo; wrappers públicos invoker. Não há segredos no frontend.

## Verificação
- npm test -- --maxWorkers=1 src/features/office/office-data.database.test.ts: 5 testes aprovados com PGlite, executando SQL e roles reais do Postgres sobre fixtures isoladas.
- Matriz: duas agências, sala privada, membro de squad e colega fora dele, revogação, gerenciamento, preferência de outro usuário, limite de device ID, sala desabilitada/arquivada, preservação de Chat, namespace inválido e RLS de realtime.messages.
- Banco remoto: operação do OWNER validou habilitação, preferências, diretório e desabilitação dentro de BEGIN/ROLLBACK. Nenhum registro de teste ou alteração de preferência persistiu. Consulta sem identidade retornou [] e tópico inválido retornou false.
- Advisors: nenhum finding novo de escritório. Permanecem avisos anteriores de funções públicas privilegiadas, tabelas privadas sem policies e proteção de senha vazada desativada. Remediações: https://supabase.com/docs/guides/database/database-linter e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.
- Tipos regenerados pelo MCP do schema remoto e recortados em office.generated.ts; tipos legados do cliente preservados para evitar alteração de contratos alheios à fase.

## Homologação
No ambiente de revisão, verificar Chat, salas e históricos existentes, incluindo o acesso a Mensagens. Em Configurações → Diagnósticos: Fase 01 homologada; Fase 02 aguardando homologação; Fase 03 bloqueada. Esta fase prepara dados e segurança, sem novas chamadas ou presença visual. Homologação humana pendente.

Referências consultadas: changelog Supabase em 14/10/2026; https://supabase.com/docs/guides/database/postgres/row-level-security e https://supabase.com/docs/guides/realtime/authorization.

## Resultado final de testes
434 testes em 118 arquivos aprovados; typecheck, lint e build aprovados (avisos anteriores permanecem). Dois cenários de diagnósticos aprovados em Chrome desktop/celular. A primeira tentativa de navegador apontou ausência do binário Playwright; execução corrigida usando o Chrome instalado.

## Publicação
Worker separado doispontozero-office-homologacao atualizado; versão 92cc8999-5c5c-4730-a063-5f2fdad8bd5e. HTML público conferido byte a byte com o build. URL: https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev/settings/diagnostics. Upload teve retry automático da Cloudflare e concluiu com sucesso. Nenhum deploy no frontend principal.

## Aceite do responsável
O usuário confirmou “Homologo a fase 02”. Fase 02 homologada e encerrada. Este aceite substitui a pendência humana indicada acima; Fase 03 liberada, ainda não iniciada.
