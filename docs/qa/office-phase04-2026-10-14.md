# Escritório Digital — Fase 04 — 14/10/2026

## Backend e segurança
Edge Function office-room-token, versão 1, publicada no projeto pvkhlobsiszrjtblpruu. Runtime reutiliza Supabase SDK 2.117.3; SDK oficial livekit-server-sdk 2.19.1 e dependências com lock Deno. verify_jwt=false no gateway suporta as chaves atuais; cada POST usa obrigatoriamente auth.getUser server-side antes do acesso ao banco. Não há caminho anônimo de emissão nem uso de user_metadata como autorização.

Cliente envia somente roomId. public.office_voice_context é invoker com helper privado, auth.uid(), lookup de agência pelo próprio canal e office_room_access existente (chat.access vigente, sala habilitada/não arquivada, visibilidade/membro e squad). Não aceita identidade/agência/namespace/grants do cliente. Revalida imediatamente antes de assinar e limita a dez pedidos por usuário/agência em 60 segundos, por upsert atômico. private.office_token_limits é bounded a uma linha por usuário/agência, RLS ligada e sem grants diretos; não armazena heartbeat, áudio, tokens ou secrets.

AccessToken usa identidade opaca do usuário, namespace office_<agency UUID>_<room UUID> e TTL=120. Permite join/subscribe e somente publicação de microfone, sem grants de criar/listar/administrar/gravar sala, dados ou atualização de metadados. Nenhum dispositivo é ativado pela emissão; frontend de voz não implementado. Origins limitadas ao domínio principal e revisão; no-store, payload de até 2048 bytes, erros genéricos e logs com código não sensível. Falta de configuração retorna 503 livekit_not_configured, sem token fictício.

## Testes executados antes da homologação
- Deno test: oito casos aprovados, com o mesmo issuer e SDK usados no endpoint: 401, 403, 400, 429, 503, origem/método, revogação antes da assinatura e resposta 200 autorizada de laboratório.
- JWT de laboratório: assinatura verificada por TokenVerifier oficial, chave incorreta rejeitada, sub/room/grants/exp conferidos, segredo ausente da resposta e erro. Chaves de fixture TEST_ONLY nunca configuradas no servidor real.
- SQL/PGlite: quatro casos novos aprovados com duas agências, sala privada e squad restrito, sala inexistente/desabilitada/arquivada, revogação, contador privado, dez emissões/recusa da décima primeira e renovação de janela. Cinco testes anteriores da Fase 02 também passaram após extrair a fixture compartilhada.
- Deno check do index.ts aprovado.
- Migration 20261014195239_office_phase04_voice_token.sql aplicada; teste remoto BEGIN/ROLLBACK validou o contexto real do OWNER, namespace, limite e recusa de sala desabilitada. Sala voltou ao estado anterior e contador de teste não persistiu.
- Cinco testes HTTP reais no endpoint publicado aprovados: ausência de sessão 401; JWT inválido 401; GET 405; origin não permitida 403; OPTIONS permitido 204.
- Inspeção de nomes de secrets (sem valores) confirmou nenhum LIVEKIT_* configurado no projeto.
- Advisors: nenhum novo finding de função pública privilegiada. Informação de RLS sem policy em private.office_token_limits é intencional: nenhum grant direto, acesso exclusivamente por helper privado autorizado. Avisos anteriores permanecem. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy.

## Limites e pendência real
O cenário 200 foi executado com assinatura real do SDK e credenciais exclusivamente de laboratório, sem conexão com servidor LiveKit. Os testes HTTP reais não utilizaram uma sessão válida para emitir um token real. LIVEKIT_URL/API_KEY/API_SECRET ainda precisam ser configurados pelo responsável; a confirmação de emissão autenticada com configuração real permanece pendente. Não declarar essa integração homologada nem avançar para a Fase 05 antes do teste restante e aceite. Instruções: docs/office/LIVEKIT_SETUP.md.

Nenhuma chamada de frontend ou mídia adicionada; histórico e presença anteriores preservados. O backend é do projeto compartilhado; frontend de revisão separado. Nenhuma sala real ficou habilitada para voz pelos testes.

Referências consultadas: https://docs.livekit.io/frontends/reference/tokens-grants/, https://github.com/livekit/node-sdks/tree/main/packages/livekit-server-sdk e https://supabase.com/docs/guides/functions/auth; changelog Supabase em 14/10/2026.

## Verificação final
449 testes em 122 arquivos aprovados; mais oito testes Deno do backend. Typecheck, lint e build aprovados, com avisos anteriores do projeto. Dois cenários de diagnósticos desktop/celular aprovados. Effect do hook de presença teve suas dependências explicitadas para remover aviso de lint, sem mudar o comportamento.
