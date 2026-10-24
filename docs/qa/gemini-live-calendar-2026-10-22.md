# Gemini — configuração real e direção mensal — 22/10/2026

## Autorização e conexão

Responsável pediu conexão da conta Google da agência no nível gratuito, teste real com cliente cadastrado e rascunho visível na plataforma. A chave foi digitada e salva pelo próprio responsável. Não foi lida, copiada para logs ou recebida no chat. AI Studio mostrou projeto no Nível gratuito; faturamento não foi alterado.

O nome de projeto Default Gemini Project foi colocado indevidamente no campo Modelo. Campo corrigido para identificador Gemini, helper/pattern/validação local adicionados e exemplo sugerido. Falha local preserva chave digitada; campo é limpo após requisição. A chave cadastrada é preservada ao trocar somente o modelo.

Teste benigno real com Gemini 3.8 Flash passou após reduzir pensamento para LOW e reservar tokens suficientes para pensamento+OK. Geração real de 12 materiais retornou HTTP 503 UNAVAILABLE (log v3, 15:46:00Z), não foi salva. Isso demonstra indisponibilidade externa nessa tentativa, não chave inválida. Em seguida o coordenador selecionou manualmente gemini-3.5-flash-lite, também com cota gratuita documentada; teste benigno real passou. Nenhum fallback automático ou faturamento pago foi habilitado.

## Ajustes técnicos

- Wire REST usa generationConfig.responseFormat.text com mimeType APPLICATION_JSON e schema, conforme documentação atual do Google.
- Diagnósticos retêm somente HTTP status e código canônico permitido; não registram mensagens livres, prompt, chave ou corpo de resposta do provedor.
- UI da geração apresenta o erro seguro retornado pela função.
- Direção, copy e estratégia deste mês passa a ser o primeiro campo, com limite 6000 e mínimo20 para IA; contexto de cadastro/briefing em bloco recolhível.
- Gemini pode gerar temas a partir da direção mensal sem exigir lista manual de temas ou preenchimento repetido de objetivo/público. Planejamento por regras mantém seus próprios requisitos.
- Prompt prioriza a direção mensal sobre temas genéricos sem ignorar fatos, restrições e histórico.

## Evidências

46 testes direcionados em 5 arquivos aprovados, /tmp/dois-gemini-direction-tests.log. Build aprovado, /tmp/dois-gemini-direction-build.log. Função editorial-ai v4 publicada. Teste de geração usa apenas serviços e contexto editorial cadastrado de Ambience; nenhum dado de contato foi enviado.

## Resultado real

Geração real concluída e persistida: campanha 63ffb40c-daf8-44c3-b0cf-32aea1e7eb88, cliente Ambience Consultoria e Engenharia, novembro de 2026. Conferida na UI após recarregar e por consulta SQL somente de leitura: status draft, project_id null, generationProvider gemini, generationModel gemini-3.5-flash-lite, 18 materiais (4 posts, 4 carrosséis, 10 Reels). Nenhuma aprovação, compartilhamento ou liberação de produção foi realizada.

Os quatro carrosséis têm cinco lâminas. Os dez Reels têm três ou quatro cenas, com somas de 30 segundos (cinco), 40 (três) ou 50 (dois). Headlines de 33–53 caracteres e legendas de até 632 caracteres. Uma peça de carrossel foi aberta na UI e seus textos, direções e legenda estavam editáveis. Evidência: /private/tmp/gemini-calendar-saved-18.png.

Limite editorial observado: há aproximação temática entre algumas peças de serviços e concentração em datas sazonais. A presença das datas foi comprovada, mas não é aprovação de aderência semântica de todas as peças ao compromisso específico de cada data. Fatos, promessas e diversidade ainda exigem revisão humana antes de publicar. O sucesso desta geração não homologa o conteúdo de todos os clientes nem garante disponibilidade/cota do provedor.

## Fontes primárias

- https://ai.google.dev/gemini-api/docs/pricing
- https://ai.google.dev/gemini-api/docs/generate-content/structured-output
- https://ai.google.dev/gemini-api/docs/generate-content/thinking

## Estratégia adaptativa e persistência

O fluxo de estratégia foi unificado ao calendário. A direção mensal e as datas sazonais compõem o comando; quantidades explícitas substituem o padrão de 12, com teto técnico de 90. Sem quantidades completas, a ação de planejamento pede ao Gemini a distribuição adequada e apresenta o mix antes de gerar. Não há distribuição fixa obrigatória.

A geração usa lotes sequenciais de até quatro materiais para limitar tempo e tamanho da resposta; somente a campanha completa validada é persistida. Não há repetição automática de chamada nem troca para plano pago. Cada lote consome uma chamada do limite diário.

O adaptador agora produz a ficha editorial canônica exigida pela função de persistência, preservando a identificação do Gemini. Teste com PGlite exercitou a função SQL real e comprovou rejeição de ficha inválida. A função editorial-ai v7 permite datas repetidas, exige quantidade exata por lote e registra somente códigos fixos de validação/término.

Validação dirigida mais recente: 50 testes em cinco arquivos aprovados, /private/tmp/adaptive-final-focused.log. Uma tentativa de 18 materiais em lote inicial de 12 excedeu o limite de tempo do provedor, sem gravação; motivou os lotes de quatro.

Função editorial-ai v8 publicada após uma resposta com título repetido. Prompt reforça ângulos distintos dentro e entre lotes, sem aceitar sufixos artificiais. 32 testes focados e typecheck aprovados. A tentativa seguinte de cinco lotes concluiu a campanha real acima.

## Regressão integrada

714 testes em 180 arquivos aprovados (185,17 s), /private/tmp/platform-final-regression.log. Após essa execução, o atalho redundante para estratégia foi retirado e a mensagem de data inválida foi corrigida; a asserção textual do teste foi alinhada e os 43 casos dos três arquivos afetados foram repetidos. Build integrado com TypeScript aprovado, /private/tmp/platform-integrated-final-build.log.
