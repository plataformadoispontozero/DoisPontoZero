# Salas de trabalho para a agência

Status: Ready for QA
Responsabilidade: @po → @dev → @qa → @devops.

Pedido: aprimorar chat com experiência de salas de trabalho virtual.

- [x] Entrada com salas reais, objetivos e acesso às conversas existentes.
- [x] Conversas organizadas, participantes e mensagens legíveis; manter privacidade e envio existente.
- [x] Layout responsivo, busca e estados de erro sem presença fictícia.
- [ ] Definir áudio/vídeo conforme resposta do usuário; não simular chamadas funcionais.
- [ ] Testes e publicação verificados.

Arquivos: ChatPage.tsx, WorkRooms.tsx, testes e backend de presença conforme escopo confirmado.

Implementado: presença por heartbeat autenticado, identidade e horário definidos pelo servidor, acesso via chat_target, saída removendo somente a própria presença. Anônimos e agência externa bloqueados. Áudio/vídeo aguardam preferência; escopo entregue é mensagens e presença.

Validação local: 7 testes chat/presença passaram; tsc --noEmit passou.

File list: src/features/chat/ChatPage.tsx; src/features/chat/WorkRooms.tsx; src/features/chat/hooks/useRoomPresence.ts; src/features/chat/chat.selectors.test.tsx; src/features/chat/room-presence.database.test.ts; supabase/migrations/20261013001151_chat_work_room_presence.sql; docs/stories/chat-work-rooms.md.

## QA Results
- PASS: 2 testes dedicados do componente WorkRooms (entrada na sala correta, privacidade, atividade, vazio e criação), além dos 7 testes chat/presença.
- PASS: rollback real no Supabase validou identidade atribuída pelo servidor, sala privada sem vínculo, agência externa e saída da própria presença. Nenhum registro de teste persistido.
- ACL: anon sem EXECUTE; authenticated sem acesso direto à tabela private; RLS deny-all intencional.
- Migration aplicada: `20261013001151_chat_work_room_presence.sql`.
- Gates: lint/typecheck/build aprovados; suite global 335 testes + 2 testes WorkRooms = 337.
- Sem áudio/vídeo nesta entrega; preferência do usuário ainda pendente.

Arquivo adicional: src/features/chat/WorkRooms.test.tsx; e2e/platform-readiness.spec.ts.
