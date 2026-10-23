# Aprovação editorial por material — 23/10/2026

Perfis Agency Agents Frontend/UI Designer e Backend Architect aplicados.

## Entrega

Post em proporção 4:5 com headline e apoio; legenda abaixo. Carrossel com lâminas 4:5, snap horizontal, setas e teclado. Reels como sequência de cenas 9:16, com texto, duração e narração disponíveis; legenda separada. São prévias de conteúdo, não artes nem vídeos finalizados.

Cada item oferece Aprovar ou Solicitar ajuste. O comentário aparece ao solicitar ajuste. Status persistido vem do backend, não de confirmação local presumida. A social media vê avaliação por card e seção de retornos no calendário, com atualização a cada 15 segundos em primeiro plano. Rascunhos editados localmente são identificados como alterações não salvas.

Migração 20261023110457_editorial_item_client_decisions.sql aplicada: projeção pública por allowlist, feedback append-only, bloqueio por link revogado/expirado e hash da versão, agregação final somente quando todos os itens atuais forem aprovados. Campanha já aprovada ou em produção não recebe novas decisões; reabertura exige novo link. Decisões internas permanecem visíveis após expiração do link, desde que correspondam à versão atual não revogada. Nenhuma demanda é criada automaticamente.

## Verificação e limites

Build/TypeScript aprovados. Consulta somente de leitura confirmou 18 materiais do link existente, status pending, zero decisões e apenas campos editoriais públicos permitidos. Grants conferidos: anon não executa RPC interno nem helper privado; authenticated executa RPC interno sujeito à permissão strategy.view da agência.

Conferência em produção: Post exibido com legenda abaixo; seta do primeiro carrossel avançou para 2/5; seta do primeiro Reels avançou para 2/3. Não foi enviada aprovação nem solicitação de ajuste em nome do cliente. Gravação real de decisão e seu retorno operacional continuam sujeitos ao aceite do responsável/cliente; esta entrega não declara homologação real desse ato.

Não foram adicionados/executados testes automatizados nesta solicitação. Advisor de segurança consultado antes/depois; grupos existentes de avisos permanecem. O novo RPC interno SECURITY DEFINER exige autorização explícita e não é executável por anon. Não se alterou a configuração de proteção contra senhas vazadas apontada pelo advisor.

Publicação final Worker f061720b-ebfc-493c-8631-224ff990e49e. Build final /private/tmp/editorial-review-final-build.log aprovado. Enquadramento de Reels reduzido para melhorar leitura em desktop mantendo proporção 9:16. Formulário Solicitar ajuste abriu com Enviar desabilitado enquanto comentário vazio, depois foi cancelado sem envio. Área interna exibiu Aguardando avaliação do cliente por material, sem erro do RPC. Evidências /private/tmp/editorial-approval-carousel-production.png e /private/tmp/editorial-approval-actions-production.png.
