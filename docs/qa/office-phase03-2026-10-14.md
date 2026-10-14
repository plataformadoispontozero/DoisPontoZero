# Escritório Digital — Fase 03 — 14/10/2026

## Implementação
OfficePresenceProvider fica dentro do QueryScope existente e acima das páginas/guards. Identidade ou agência novas encerram o escopo anterior. useRoomPresence passa a ser adaptador deste estado quando o escritório está ligado: não escreve no antigo heartbeat Postgres, não faz leave no unmount da página ou em visibility hidden. Com a flag desligada, o hook legado permanece disponível. Nenhuma mudança de mídia, SDK de voz ou Tauri.

O cliente Supabase existente mantém um socket compartilhado. Cada membro autorizado tem um tópico privado office-user:<agency>:<user>. Todos podem observar colegas autorizados da mesma agência, mas somente auth.uid() pode publicar no próprio tópico. Essa escolha evita confiar no user_id/key arbitrário de um payload de Presence. Identidade, nome e avatar vêm do diretório backend; payload contém apenas estado autorreportado, referência à sala de mensagens e timestamp. Essas informações não autorizam operações. Sala privada não tem nome nem conteúdo exposto no painel global; o backend do Chat continua protegendo seu acesso.

Uma pequena inscrição por membro usa o socket existente; há publicação apenas no tópico próprio. Abas do mesmo usuário são agregadas em um único item. Disponível/ocupado/ausente podem ser escolhidos; após cinco minutos sem interação, disponível torna-se ausente e volta ao interagir. Abrir sala de mensagens marca em sala, mantendo o contexto ao navegar. Áudio e câmera continuam indisponíveis; estar online não significa capturar dispositivos.

O controller trata SUBSCRIBED/track, erros, heartbeat, offline/online e limpeza. Uma perda detectada limpa imediatamente os peers; falha inicial mostra erro. O SDK gerencia rejoin/backoff; o painel permite reconectar. Cleanup é serializado antes de um novo escopo para evitar reutilizar canais antigos. Uma aba oculta não provoca untrack; ao voltar, uma conexão perdida pode ser reconstruída. Reload cria presença disponível novamente; fechar/suspender navegador depende da detecção do servidor, sem promessa de manter presença após fechamento.

## Dados e segurança
Migration aditiva 20261014192432_office_phase03_private_presence.sql aplicada no projeto pvkhlobsiszrjtblpruu. Não adiciona tabelas, mídia ou heartbeat. Cria autorização dos tópicos pessoais e diretório de membros, com helpers privados, search_path vazio, wrapper público invoker e execute anônimo revogado. Identidade e tenant não vêm do frontend. Policies limitadas à extensão presence, sem autorização para broadcast nesses tópicos. Tópicos de salas da Fase 02 permanecem separados.

Os checks usam chat.access atual, vínculo e agência ativos do backend. A autorização Realtime é avaliada na conexão/reautorização: mudanças de acesso devem ser confirmadas após reautenticação/reconexão; o diretório refaz sua leitura ao retornar ao foco. Não foi adicionada promessa de expulsão instantânea de uma conexão já autorizada quando um papel é alterado. A homologação deverá conferir o comportamento da agência. Não se alterou a configuração global de canais públicos para preservar integrações existentes; todas as inscrições de escritório usam explicitamente private=true.

## Verificação
- 445 testes de regressão em 121 arquivos aprovados.
- 11 novos testes: controlador 5, provider 4, SQL/RLS 2. Após extração do contexto, os 9 testes de controller/provider passaram novamente.
- Controller: própria publicação, observadores sem track, deduplicação de abas, payload com identidade forjada ignorado, sync/leave, perda de rede, falha de track e callbacks após encerramento.
- Provider: navegação entre consumidores, contexto de sala preservado, aba oculta sem leave, offline com contador zero, online reconstruindo uma sessão, perda de permissão e saída. getUserMedia nunca chamado.
- RLS: duas agências, leitura do colega permitida, publicação no tópico do colega negada, tenant externo negado, namespace inválido, revogação/inatividade e ausência de grant anônimo.
- SQL remoto em BEGIN/ROLLBACK: diretório retornou dois membros autorizados; publicação própria true; tenant externo false. Não foram criadas contas ou registros de teste.
- WebSocket real sem sessão: private topic retornou CHANNEL_ERROR, verificação aprovada. Usa apenas chave pública já publicada; nenhum segredo incluído nos arquivos.
- Navegador: 8 casos com flag ligada (desktop/celular), histórico/links antigos, guard, estados vazios/erro, responsividade, diagnóstico e zero pedidos de mídia. Mais 2 casos com flag desligada aprovados.
- Typecheck, lint e build aprovados; avisos antigos permanecem. Extração de contexto corrigiu aviso novo de Fast Refresh; importação de tipo corrigida após a extração e build refeito.
- Advisors: nenhum finding novo de escritório. Avisos anteriores de funções públicas, tabelas privadas e proteção de senhas permanecem. Referências de remediação: https://supabase.com/docs/guides/database/database-linter e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Homologação real pendente
Os testes de interação acima usam transporte controlado. Não há ainda teste ponta a ponta de duas contas autenticadas no serviço Realtime real. Responsável deverá usar duas contas reais existentes, em navegadores separados, no ambiente de revisão:
1. Abrir /office com os dois usuários da agência e conferir nomes e indicadores.
2. Abrir outra aba com uma das contas: deve continuar um item por pessoa.
3. Abrir sala de mensagens e navegar para Dashboard/Tarefas; retornar ao escritório e conferir contexto.
4. Ocultar aba e retornar: nenhuma saída deliberada; observar reconexão se houve suspensão.
5. Alternar disponível/ocupado/ausente; conferir no colega.
6. Desconectar rede, reconectar e atualizar a página: indicador deve refletir o transporte, sem online indefinido.
7. Sair do escritório e fazer logout: conferir remoção da presença na outra conta.
8. Conferir o acesso com outra agência e papel sem chat.access; não deve compartilhar presença.
9. Confirmar que nenhum pedido de microfone/câmera aparece.

Revisão usa os dados/autenticação reais da agência, sem cópia isolada. Frontend principal continua com a flag desligada. Fase 03 implementada e verificada por testes automáticos; homologação humana e multiusuário real pendentes. Fase 04 não iniciada.

Documentação consultada: https://supabase.com/docs/guides/realtime/presence, https://supabase.com/docs/guides/realtime/authorization e https://supabase.com/docs/guides/troubleshooting/realtime-handling-silent-disconnections-in-backgrounded-applications-592794.
