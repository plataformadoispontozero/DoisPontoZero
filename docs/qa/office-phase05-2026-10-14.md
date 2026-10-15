# Fase 05 — integração cliente das salas de voz

## Escopo e implementação
COMMAND 05 autorizado pelo responsável após homologação da Fase 04. SDKs oficiais livekit-client 2.22.4, @livekit/components-react 2.9.24 e tslib 2.8.1 fixados no lockfile; compatíveis com React 19.

OfficeVoiceProvider vive no escopo autenticado acima das páginas; um OfficeVoiceSession serializa entradas/saídas e um único RoomAudioRenderer oficial reproduz áudio remoto. Room.connect apenas assina faixas; entrada não solicita captura nem publica dispositivos. Microfone depende de clique explícito; câmera/tela continuam fora desta fase. Token solicitado via Supabase Functions com sessão atual, abortável e timeout de 15 segundos, sem localStorage ou query cache. Backend e permissões da Fase 04 reutilizados, sem alterações.

OfficeVoicePanel mostra salas autorizadas, participantes reais, nome pelo diretório autorizado, microfone, fala, qualidade, reconexão, desbloqueio de autoplay e saída. Habilitar voz reutiliza office_configure_room da Fase 02, guardado por JWT/role/permissões no servidor. Não foi habilitada automaticamente a sala da agência, atualmente office_enabled=false; o responsável pode habilitar pelo botão no escritório.

Permissions-Policy permite microfone somente no próprio site, câmera continua bloqueada. connect-src acrescenta HTTPS/WSS somente para *.livekit.cloud; instalações próprias com host fora desse domínio necessitam CSP específica. Mensagens e registros antigos do Chat preservados. Sem novos sockets Supabase para voz.

## Verificação técnica
- 461 testes / 126 arquivos aprovados com npm test -- --maxWorkers=2.
- Nove testes novos de ciclo de vida/provider: ausência de captura na entrada, chamada duplicada, cancelamento pendente, troca serializada, microfone negado com escuta preservada, retry/mute, fala/qualidade/reconexão/autoplay, token recusado, saída, áudio único entre rotas, logout e perda de permissão. Reexecutados após ajuste de abort/timeout: nove aprovados.
- Typecheck e lint aprovados; avisos anteriores do projeto permanecem, nenhum novo aviso nas implementações de voz. Build de revisão aprovado.
- Oito cenários Playwright desktop/celular: mensagens preservadas sem captura, estado vazio/falha, diagnósticos e entrada explícita com recusa de token recuperável/sem captura. Capturas revisadas e viewport sem overflow.
- Execução inicial simultânea com build/navegador sofreu timeouts (97 falhas, inclusive testes antigos de banco). Regressão completa repetida com concorrência limitada: todas as 461 passaram. Cenários de navegador repetidos após o build: todos os oito passaram.

Os testes automatizados usam transportes controlados; não equivalem a escuta/voz real entre dois dispositivos. Usuário confirmou disponibilidade de dois membros para esse aceite.

## Teste real e critério de homologação
1. Atualizar /office no ambiente separado de homologação. OWNER/ADMIN/MANAGER autorizado abre Habilitar voz em uma sala existente e habilita a sala escolhida.
2. Dois membros ativos com contas próprias entram na mesma sala, em computadores/navegadores distintos. Cada um deve enxergar dois participantes e começar com microfone desligado, sem solicitação automática de mídia.
3. Primeiro membro liga microfone explicitamente e permite acesso; segundo confirma escuta. Se solicitado, usar Ativar áudio. Conferir Falando, depois desligar e confirmar silêncio. Inverter os papéis. Usar fones para evitar retorno.
4. Negar acesso ao microfone em um navegador e conferir que a escuta permanece disponível e a mensagem orienta liberar o acesso.
5. Navegar para outra página e retornar ao /office: mesma conexão e áudio sem duplicação. Controles globais da Fase 06 ainda não implementados. Conferir saída de um membro na lista do outro e encerramento após logout.
6. Interromper e restaurar a rede, conferir estado de reconexão; caso a conexão termine, entrar novamente para obter token novo.

Homologação da Fase 05 pendente do resultado real e aceite explícito. Fase 06 não iniciada. A expiração de 120 segundos limita entrada inicial, não encerra conexão já estabelecida; revogação server-side de participantes ativos continua fora desta fase.

Referências oficiais consultadas: https://docs.livekit.io/reference/components/react/concepts/rendering-audio/, https://docs.livekit.io/reference/client-sdk-js/classes/Room.html; versões e peerDependencies verificadas pelo npm registry.

## Publicação
Worker separado de homologação: 150e3b7c-8de2-43fd-9692-ce73c5202bf8. HTML e bundle de diagnósticos comparados byte a byte ao build; headers públicos confirmam microphone=(self), camera=() e LiveKit Cloud no connect-src. URL: https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev/office. Frontend principal não recebeu deploy.

## Confirmação real — 15/10/2026
Após o deploy, o responsável confirmou: “Sim, presença e reconexão funcionaram”, em resposta ao teste com dois membros no Safari e Chrome, contagem online e saída/reconexão. A validação real da correção está concluída por relato do responsável. A Fase 05 permanece em homologação, aguardando aceite final explícito; Fase 06 não iniciada.

## Aceite final — 15/10/2026

O responsável declarou: “FASE 5 ACEITA , VAMOS PARA A FASE 6”. Fase 05 homologada; Fase 06 autorizada. Registros anteriores descrevem o estado histórico antes desse aceite.
