# Escritório Digital — Fase 08 — 18/10/2026

## Escopo e proteção

Controles opcionais de câmera, compartilhamento de tela, dispositivos de áudio/vídeo e volume, usando a conexão LiveKit existente. Nenhum dispositivo é solicitado ao abrir a página. Câmera e microfone começam desligados; compartilhar tela só começa no clique do usuário. A flag `VITE_ENABLE_OFFICE_MEDIA` é independente e fica desligada em produção.

Preferências de dispositivo e volume ficam no armazenamento local deste navegador. Seleção de saída depende de suporte do navegador; se a troca não for suportada, o áudio continua na saída padrão. Câmera e compartilhamento não bloqueiam chamadas de voz.

## Verificação local

- `npm run typecheck` — aprovado.
- `npm run lint` — exit 0; avisos existentes no repositório.
- `npx vitest run src/features/office --maxWorkers=2` — 12 arquivos, 49 testes aprovados.
- `src-tauri/tauri.conf.json` mantém CSP restrita aos serviços necessários, inclui endpoints LiveKit e permite mídia; `src-tauri/Info.plist` declara o motivo para permissões de microfone e câmera no macOS.
- Permissões reais de câmera/microfone, dispositivos removidos durante chamada e captura de tela em navegador/OS não foram acionadas nesta sessão. Os controles seguem disponíveis por gesto do usuário e a publicação de áudio não ocorre ao conectar.

## Homologação visual

Build de homologação publicado no worker `doispontozero-office-homologacao`; versão `ace34794-b6a7-4f70-9dec-b17453e7322a`. A conexão ao canal da sala foi validada no navegador: estado “Conectado”, qualidade “Excelente” e saída limpa da sala. Microfone, câmera e compartilhamento permaneceram desligados; captura real desses dispositivos ainda precisa de validação manual. Sem ativação em produção.

Após o responsável reportar `No room provided`, a revisão confirmou que o conteúdo agora recebe o `RoomContext` do LiveKit. Também foi desativado `singlePeerConnection` para evitar a falha de renegociação WebRTC observada no browser (`Attempted to modify the PeerConnection's configuration in an unsupported way`). A regressão direcionada, typecheck e suíte completa passaram; a conexão foi repetida com sucesso no build de homologação acima.

## Opção de Google Meet

A sala do Escritório pode iniciar e apresentar um link do Google Meet no mesmo fluxo. A interface de áudio/vídeo do Meet abrirá em uma janela/aba do Meet; a API oficial permite criar e gerenciar espaços e retornar o `meetingUri`, mas não fornece um componente para incorporar a chamada completa do Meet dentro da página do Escritório. Criar espaços por API exige autorização OAuth do usuário com o escopo `meetings.space.created`. A integração com add-ons segue o sentido inverso: incorpora o Escritório como add-on dentro do Meet. Portanto, manter a videochamada inteira renderizada na página atual requer LiveKit ou outra solução de vídeo incorporável.

Referências oficiais: [Google Meet REST API](https://developers.google.com/workspace/meet/api/guides/overview), [criar espaço](https://developers.google.com/workspace/meet/api/reference/rest/v2/spaces/create), [Meet Add-ons SDK](https://developers.google.com/workspace/meet/add-ons/guides/overview?hl=en).
