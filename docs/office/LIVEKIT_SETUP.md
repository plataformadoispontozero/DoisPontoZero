# Escritório Digital — configuração de tokens LiveKit

A Fase 04 fornece apenas o backend; nenhuma conexão de mídia é iniciada no frontend.

Configure no Supabase → Edge Functions → Secrets:
- LIVEKIT_URL: URL wss:// do projeto LiveKit, sem usuário/senha, query ou fragmento.
- LIVEKIT_API_KEY: chave do projeto; uso exclusivo do servidor.
- LIVEKIT_API_SECRET: segredo do projeto com pelo menos 32 caracteres; uso exclusivo do servidor.

Não use prefixo VITE_ para essas credenciais. Não envie os valores no chat, nos logs, no Git ou em screenshots. .env.example contém apenas campos vazios.

Endpoint POST /functions/v1/office-room-token:
- Authorization: Bearer de uma sessão Supabase real, validada por auth.getUser.
- Content-Type: application/json.
- Body: {"roomId":"UUID da sala"}. Não aceita userId, agencyId, identity, roomName ou grants do frontend.
- Retorna token, serverUrl (URL não secreta) e expiresIn=120 somente após resolver identidade/agência/sala/squad e habilitação no banco.
- Origens web permitidas: domínio principal e worker de homologação. Não há wildcard.
- 401 sessão ausente/inválida; 400 payload; 403 sala negada (inclui sala ausente/desabilitada); 429 limite; 503 livekit_not_configured/backend_unavailable.

A sala precisa estar habilitada pela gestão via office_configure_room, e o usuário precisa de chat.access e das permissões da sala/squad. A configuração permanece desligada por padrão. Os testes do agente habilitaram uma sala apenas dentro de uma transação SQL com rollback; nenhuma sala real ficou habilitada para voz.

O token permite entrar/escutar na sala exata e publicar somente microfone; não permite publicar dados, administrar/criar/listar/gravar salas ou publicar câmera/tela. Ter um grant de microfone não ativa dispositivo: a Fase 05 exigirá ação explícita do usuário, entrando com microfone/câmera OFF. A Fase 08 deverá rever as permissões de mídia para câmera/tela.

A expiração de 120 segundos limita a entrada inicial. Ela não encerra automaticamente uma conexão LiveKit já estabelecida. Revogação de participantes conectados exige controles futuros; não há conexão de voz nesta fase.

Antes de homologar com configuração real: configurar os três secrets, usar uma sessão autenticada autorizada e sala habilitada para teste, solicitar token, verificar assinatura/claims/expiração usando o SDK oficial no servidor e desabilitar a sala ao encerrar o teste. Não registrar o token completo ou segredos na evidência. A configuração do provedor e o teste autenticado real permanecem pendentes na entrega atual.

Referências: https://docs.livekit.io/frontends/reference/tokens-grants/ e https://supabase.com/docs/guides/functions/auth.
