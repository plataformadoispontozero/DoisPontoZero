# IA editorial — configuração frontend — 22/10/2026

Perfil aplicado: Agency Agents / Frontend Developer (`.codex/agents/engineering-frontend-developer.toml`). Ownership limitado à nova tela e seu teste; rotas, cards e motor mensal pertencem à coordenação.

## Entrega

- `EditorialAiSettingsPage.tsx`: consulta `editorial-ai` por agência autenticada; somente OWNER/ADMIN com `settings.edit` acessa a configuração.
- Estado inicial inativo. Gemini prioritário e Ollama apenas como conexão local preparada, sem alegação de rede funcional.
- Chave em campo password, ausente do status/cache/localStorage; campo vazio preserva a chave existente e é limpo após gravação.
- Modelo informado pelo administrador, sem fixar modelo preview potencialmente descontinuado.
- Consentimento explícito para envio de dados aprovados ao Google; aviso de cota, tratamento de conteúdo e ausência de garantia de gratuidade se o projeto tem faturamento.
- Teste envia somente `{action:'test',agencyId}` ao backend, sem reenviar credenciais ou informações do cliente. Exige salvar mudanças antes.
- Trava síncrona contra requisição duplicada; carregamento/erro/retry; troca de agência/usuário remonta o formulário e descarta resultados tardios.
- Acessível com labels, controles nativos e mensagens de estado/erro. Responsivo em largura limitada.

## Contrato acordado com backend

- status: `{provider,model,apiKeyConfigured,ollamaUrl,secureStorageAvailable,generationAvailable,allowApprovedData,requiresReview:true}`.
- save: `{agencyId,action:'save',provider,model,apiKey?,ollamaUrl,allowApprovedData}`; segredo vazio omitido.
- test: `{agencyId,action:'test'}`; retorno `verified:true` ou erro seguro.

## Evidência

`npm test -- src/features/settings/EditorialAiSettingsPage.test.tsx --maxWorkers=1`: seis testes aprovados. Cobrem acesso, segredo mascarado/limpo e não reenviado, chave anterior, alteração pendente, retry, Ollama preparado e troca de agência.

## Limites

Sem full suite, build, deploy ou commit nesta frente. Sem chave real, sem chamada ao Gemini e sem teste da ponte Ollama. Não há homologação de custo zero nem medição de desempenho/tecnologia assistiva real. A integração depende do endpoint e da configuração segura entregues na frente backend.
