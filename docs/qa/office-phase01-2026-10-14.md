# Escritório Digital — Fase 01 — 14/10/2026

## Resultado
Flag explícita VITE_ENABLE_DIGITAL_OFFICE=true permite navegação para /office e /office/lobby e substitui o item Chat por Escritório Digital, com ícone de prédio. Flag ausente/false preserva menu Chat e redireciona /office a /chat. A rota e todas as subrotas recebem chat.access no guard existente. Links antigos de canal/conversa continuam funcionando e Mensagens acessa /chat.

Reutiliza ChatPage, WorkRooms, chat_directory, perfil, permissões e componentes de navegação. O overview conta somente salas retornadas como autorizadas pelo backend. Pessoas online e convites de voz mostram indisponibilidade nesta fase. Membros cadastrados de uma sala não são rotulados como online. Não há chamada a getUserMedia ou instalação de SDK de chamadas, alteração SQL/Tauri ou implementação de presença global.

## Validação
- npm test -- --maxWorkers=1: 429 testes em 117 arquivos aprovados.
- npm run typecheck e npm run lint: aprovados; avisos antigos do projeto permanecem.
- OFFICE_PHASE01=true playwright: 6 cenários desktop/mobile aprovados. Navegação, histórico de canal/DM, retorno a Mensagens, contagem vazia real, falha sem contagem fictícia, falta de chat.access, responsividade e zero solicitações de mídia.
- Diagnósticos da revisão: 2 cenários desktop/mobile aprovados; homologação pendente e Fase 02 bloqueada. Total: 10 cenários de navegador.
- OFFICE_PHASE01=off playwright: 2 cenários desktop/mobile aprovados. Menu Chat preservado e /office redireciona a /chat.
- Os testes usam API autenticada controlada e registros identificados TESTE; não escrevem no banco real. Primeiras tentativas no celular usaram seletores de menu fechado/controle externo ao painel; corrigidos para abrir o menu e fechar pelo botão acessível do Sheet.
- Screenshots revisados: /private/tmp/office-phase01-desktop.png e /private/tmp/office-phase01-mobile.png.

## Homologação manual
No ambiente separado de revisão, entrar com usuário com chat.access e verificar:
1. Menu Escritório Digital abre /office; confira o título e suas salas existentes.
2. Abra uma sala, leia o histórico e uma conversa privada existente.
3. Use Mensagens para retornar ao chat atual; confira os links antigos.
4. Confira o menu no celular e a ausência de números inventados de pessoas online.
5. Confira Configurações → Diagnósticos: Fase 01 aguarda homologação e Fase 02 está bloqueada.

Revisão usa a autenticação e os dados da agência atual; dados não são uma cópia isolada. A criação/envio pelos botões existentes, se usados pelo responsável, terá a persistência normal. Os testes automatizados não alteraram esses dados.

## Gate
Parte técnica concluída. Homologação humana pendente. Fase 02 não iniciada. Flag permanece desligada no ambiente principal; habilitação somente no ambiente separado de revisão. Publicação principal exige aceite e autorização do responsável.

## Publicação de revisão
- URL: https://doispontozero-office-homologacao.marketingrenatodesigner.workers.dev/office
- Worker separado: doispontozero-office-homologacao. Versão a7b61d01-19c1-45a3-a872-f8eeb728ad4f.
- Build aprovado e HTML público comparado byte a byte. Plataforma principal não recebeu deploy nesta fase.
- Login com conta existente da agência é necessário na origem de revisão.

## Aceite do responsável
O usuário homologou explicitamente a Fase 01 com a mensagem “homologar fase 1”. Fase 01 encerrada; Fase 02 liberada e ainda não iniciada. O registro de aceite substitui a pendência humana acima.
