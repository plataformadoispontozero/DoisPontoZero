# Motor editorial Gemini — 22/10/2026

## Entrega e contrato

Endpoint `editorial-ai`, POST JSON, JWT do usuário em Authorization. Verificação de usuário implementada na função; publicar com `verify_jwt=false` para permitir a validação explícita de JWT pelo Supabase Auth (a função não aceita chamadas anônimas).

Ações: `status`, `save`, `test`, `generate`; todas recebem `agencyId` UUID.

- Status: membros ativos com `strategy.edit` ou gestores OWNER/ADMIN com `settings.edit`. Retorna provider, model, apiKeyConfigured, ollamaUrl, allowApprovedData, secureStorageAvailable, generationAvailable, requiresReview. Nunca chave.
- Save: OWNER/ADMIN + `settings.edit`. Campos provider (`none`, `gemini`, `ollama`), model, apiKey opcional, ollamaUrl opcional, allowApprovedData boolean. Chave em branco preserva a anterior. Ollama só aceita endereço loopback HTTP e permanece preparado/inativo; o backend nunca o acessa.
- Test: mesma permissão de Save. Envia exclusivamente `Respond only OK.` ao Gemini. Não envia briefing ou dados de cliente. Não grava selo de homologação real.
- Generate: membro ativo + `strategy.edit`, cliente acessível pela RLS do próprio usuário e agência correspondente. Campos clientId, month YYYY-MM, direction 20–6000 caracteres, context aprovado, count 1–12 e formatCounts opcional com soma exata. Sem contagem explícita, 12 materiais são 5 posts, 4 carrosséis, 3 Reels. Retorna items, provider, model e requiresReview=true, sem gravar campanha, demanda ou publicação.

Context admite objective, audience, tone, positioning, restrictions, visualGuidance; listas approvedFacts, forbiddenTerms, avoidedTopics e topics. O servidor busca até seis meses do histórico do mesmo cliente e envia apenas títulos/temas. O perfil é filtrado para campos editoriais, sem dados de contato/links.

Itens: date, format (`post`, `carousel`, `reels`), title, headline, support, caption, visual. Carrossel: slides 5–8 com headline/text/visual. Reels: duration 30/40/50 e 3–5 scenes com seconds/text/visual; soma exata da duração, narration/onScreen opcionais. Datas válidas, diferentes e dentro do mês; contagem de formatos exata. Saída inválida falha sem salvar.

## Proteção e limites

Migração adiciona tabelas em schema private com RLS e sem acesso anon/authenticated. RPC wrapper público e implementação privada são executáveis apenas por service_role. Chave/configuração cifrada AES-GCM usando INTEGRATION_CONFIG_KEY existente. Metadados updated_by/updated_at, sem chave ou conteúdo no log. Não altera credenciais existentes do Drive, Meta ou LiveKit.

Limite atômico compartilhado de 30 chamadas de teste/geração por agência/dia UTC, contado antes da chamada. Falhas também consomem chamada. Histórico de uso mínimo sem conteúdo. Corpo 32 KiB; chamadas de banco/Auth 10 segundos cada; uma chamada Gemini, timeout 60 segundos, resposta 400 KiB e máximo 16384 tokens. Sem retry, fallback de modelo ou troca para outro provedor. Endereço Gemini fixo e sem redirecionamentos, chave apenas no cabeçalho.

O backend não determina se a chave Google pertence ao plano gratuito ou a um projeto com faturamento: isso deve ser configurado na conta Google. Não existe garantia de custo zero em projeto que tenha faturamento habilitado. Erro de cota interrompe a operação.

`generationAvailable` significa configuração presente e consentimento salvo, não prova de disponibilidade ou homologação do provedor. O teste benigno é opcional e não condiciona esse indicador.

## Evidências locais

`npx vitest run src/features/editorial/aiBackend.test.ts src/features/editorial/aiBackendSql.test.ts`

15 casos aprovados em dois arquivos: contrato, chave preservada/oculta, loopback, mix, datas, duração, autorização, RLS do cliente no seam, cota, erros seguros, destino Gemini fixo e teste benigno mockado. PGlite aplicou a migração isolada, validou RPC privada, limite diário e negação a authenticated. Nenhuma chamada real ao Google foi feita.

## Pendências reais

Migração não aplicada remotamente; função não publicada nesta entrega. Antes de disponibilizar, aplicar migração, publicar função incluindo `_shared/providerConfig.ts`, cadastrar chave própria no AI Studio, testar credencial, gerar rascunho de cliente autorizado com consentimento e revisar conteúdo. Não declarar homologação da geração real antes desse aceite. Nenhum segredo do Lovable foi copiado.
