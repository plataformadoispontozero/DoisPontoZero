# Presença global — correção de reconexão

Fase 05 permanece em homologação, Fase 06 não iniciada. Usuário informou teste de voz com dois membros no Safari e Chrome; captura confirma dois participantes. A presença global, separada da voz, continuava conectando.

## Causa reproduzida
OfficePresenceSession.stop iniciava untrack e removeChannel em paralelo. O SDK pode destruir os callbacks do canal antes da confirmação do untrack, deixando a Promise de limpeza sem conclusão. OfficePresenceProvider aguarda essa limpeza antes de iniciar a próxima sessão, reproduzindo o “Conectando presença…” indefinido. Um cenário com duas sessões usando o SDK real e respostas WebSocket Phoenix controladas reproduziu a falha na reconexão antes da correção e passou depois.

## Correção
Aguardar untrack antes de remover os canais; limitar a confirmação a 1,6 segundo e não enfileirar untrack em canal que nunca foi inscrito. A saída cancela imediatamente callbacks da sessão antiga. Nenhuma regra RLS, chave, política de segurança ou configuração de voz alterada.

## Evidências
- Diretório real retornou os dois membros; autorização de publicação própria true em transação encerrada com rollback.
- 12 testes unitários de sessão/provider passaram, incluindo ordenação, confirmação ausente e canal nunca inscrito.
- Teste de navegador com duas sessões, SDK real e servidor controlado passou após a correção; não equivale ao teste autenticado de presença pela equipe.
- Publicação e verificações finais serão registradas abaixo após execução.

## Verificação final
- 36 testes do módulo Escritório Digital em 10 arquivos aprovados (maxWorkers=1). A primeira execução paralela teve quatro timeouts de inicialização PGlite; sem mudança de assertions, a execução serial passou.
- Typecheck aprovado; lint terminou sem erros, com avisos existentes.
- Build compilado com Escritório Digital habilitado e API controlada aprovado.
- Teste com duas sessões do SDK passou: dois usuários online, atualização de disponibilidade para o colega, navegação SPA sem perder a presença e saída/reconexão explícita. WebSocket simulado segue o protocolo Phoenix; não usa credenciais ou contas reais.
- A Fase 05 continua em homologação; teste real de presença e aceite permanecem pendentes. Fase 06 bloqueada.
