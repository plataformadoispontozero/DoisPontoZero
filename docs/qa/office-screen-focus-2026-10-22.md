# Escritório — compartilhamento em destaque — 22/10/2026

## Pedido e evidência de origem

O responsável confirmou áudio e vídeo funcionando entre membros. Relatou que a tela compartilhada e as câmeras tinham o mesmo tamanho, prejudicando a leitura do conteúdo. Esse aceite de dispositivos foi informado pelo responsável; não foi repetido nesta frente.

## Correção

- Componente `OfficeVideoTracks` separado do painel de controles, mantendo o mesmo `RoomContext` e a assinatura `useTracks` existente.
- Tela compartilhada é fixada automaticamente na área principal e renderizada com `object-contain`, sem cortar seu conteúdo. Altura responsiva de 62vh, limitada entre 18rem e 52rem.
- Câmeras em faixa lateral de 13rem no desktop e faixa horizontal abaixo da tela no celular. Participantes sem câmera têm cartão de presença sem iniciar captura.
- Se mais de uma pessoa compartilha, botões permitem escolher a tela em destaque. Quando a escolhida termina, a próxima ativa ocupa o palco.
- Sem compartilhamento, a grade de câmeras permanece. Sem vídeo publicado, não há área vazia.
- Durante uma chamada, o Overview recolhe indicadores do lobby e mantém presença/convites acessíveis em um bloco expansível, liberando espaço para a apresentação.
- Controles, captura explícita, conexão, permissões, áudio e reconexão permanecem sob os providers existentes. Nenhum dispositivo é ligado por montagem ou troca do layout.

## Verificação

- `npm test -- src/features/office/OfficeVideoTracks.test.tsx src/features/office/OfficeVoiceProvider.test.tsx --maxWorkers=1`: 9 testes em 2 arquivos aprovados.
- Quatro cenários novos cobrem palco/tarjas responsivas, múltiplos compartilhamentos, término da tela escolhida, grade sem tela e presença sem câmera.
- Cinco cenários existentes do provider cobrem permanência da sala/contexto e de um único renderer de áudio, navegação, captura explícita e saída/revogação.
- `npx tsc -b --pretty false`: aprovado.
- `git diff --check`: aprovado.

## Limites

Entrega integrada pelo coordenador: build de produção aprovado e Worker publicado em 22/10/2026, versão a22cf069-6a26-4aa2-adba-c0249cb55489. Teste real do novo layout de compartilhamento ainda pendente. Não há evidência de renderização física em Safari/Chrome/celular ou medição de desempenho. A validação real final exige duas contas e tela escolhida pelo responsável. A ampliação do AppLayout está sob responsabilidade do coordenador; o coordenador também recolheu a navegação interna do ChatPage durante a chamada, com botão para reabri-la. Teste adicional verifica recolher/reabrir e restaurar ao sair.

## Refinamento de nomes e coluna lateral

O painel passa o diretório já carregado e o identificador local ao componente de vídeo. Participantes sem câmera recebem o nome desse diretório; o identificador local tem fallback “Você”, sem expor UUID. Nomes publicados pelo participante continuam prioritários. Quando o snapshot ainda não possui participantes, a apresentação usa a largura completa sem reservar uma coluna vazia.

Asserções existentes foram ajustadas para os nomes e ausência de coluna vazia. Não foram executadas novamente neste refinamento, por coordenação com a regressão completa em andamento no agente principal. `git diff --check` passou após as alterações.
