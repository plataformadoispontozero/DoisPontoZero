# Recuperação operacional do chat

Status: Ready for Review. Escopo delegado pelo coordenador com base no pedido do usuário.

- [x] Mensagens diretas transacionais entre dois membros ativos da mesma agência.
- [x] Canais privados limitados aos participantes; isolamento por agência e identidade.
- [x] Contadores de leitura, atualização em tempo real e preferências persistidas.
- [x] Erros visíveis sem apagar mensagem não enviada.
- [x] Testes de banco com usuários fictícios; nenhuma mensagem real enviada.

Arquivos: src/features/chat/hooks/useChat.ts, ChatPage.tsx, ChatSettingsPage.tsx; supabase/migrations/20261012130838_chat_operational_recovery.sql; testes no módulo chat.

Limites: upload de anexos do chat requer Storage privado; homologação com duas sessões reais permanece necessária.

Verificação: 7 testes chat passaram (incluindo RLS e transações PGlite), typecheck passou, lint sem erros com avisos legados. Migration 20261012130838 aplicada em produção; nenhuma mensagem real enviada. Anexos privados, menções digitadas e homologação com dois membros reais permanecem pendentes.

Gates finais: 184 testes em 48 arquivos; lint sem erros (avisos existentes), typecheck e build aprovados. CodeRabbit indisponível, nenhum passe presumido.
