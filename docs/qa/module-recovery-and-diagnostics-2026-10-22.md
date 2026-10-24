# Recuperação de módulos e fechamento do diagnóstico — 22/10/2026

## Falha observada e correção

A URL de asset antigo `/assets/MyProfilePage-Bit3_bIW.js` respondeu HTTP200, Content-Type text/html e Cache-Control public/max-age31536000/immutable. Confirmado por HEAD antes da correção. Isso permite servir/cachear o fallback SPA como se fosse um módulo JS.

Correção em camadas:

- Worker seletivo para /assets/* consulta o binding ASSETS e converte HTML ou ausência em404 text/plain/no-store; arquivos existentes e fallback das páginas preservados.
- HTML index e service worker com revalidação; assets com hash mantêm cache longo. O service worker permanece sem cache/fetch handler de dados privados.
- Evento Vite preloadError + fallback do React Router oferecem uma recuperação limitada por aba/90s, sem apagar sessão, sem limpar cache de dados, sem loop offline. Se persistir, tela segura com recarregar/painel, sem stack técnico.

## Testes e publicação

- Primeira suíte completou com554 aprovados/1 falha por expectativa obsoleta do título Presentation Studio. Expectativa atualizada para o h1 da landing page.
- Nova suíte integral:556 testes/151 arquivos aprovados,134,93s. Recibo local /tmp/dois-full-regression-20261022.log.
- Três testes adicionais do Worker aprovados; onze testes direcionados de Worker/recuperação/fallback/diagnóstico aprovados no conjunto.
- Build/typecheck produção e homologação e dry-run Wrangler aprovados.
- Worker homologação inicial0e1af1a8-9b95-4825-a0b8-9f750b9889f0; produção90f91ba8-1c79-4d8c-9fd0-84ec6d6b5240.
- HEAD após deploy: asset antigo404/no-store em ambos os ambientes.
- CUA: bloqueio controlado do módulo público em aba temporária confirmou tela “Vamos atualizar esta página”; bloqueio/CDP removidos e recarga manual abriu novamente a apresentação. Simulação somente nessa aba, sem alteração persistente no navegador.
- Smoke de21 áreas confirmou headings/conteúdo sem tela técnica; registro diagnostics-sector-smoke-2026-10-22.json. Não equivale a escrita, isolamento ou aceite de dados reais em cada módulo.
- Diagnóstico agora distingue revisão atual de registros históricos; remove referência ausente office-phase10-2026-10-18.md e informa regressão atual delimitada.

## Teste real de voz em andamento

Responsável confirmou duas contas em navegadores/perfis separados. A entrada derruba outra sessão; após instrumentação o erro foi VOICE_DUPLICATE_IDENTITY. O catálogo/handler remoto v3 usa auth user_id como identidade e valida o contexto. Contagem agregada no rate ledger confirmou duas identidades autenticadas com emissão recente (sem exportar IDs/tokens).

A aba técnica de voz foi fechada para eliminar concorrência artificial. Runtime passou a reportar DisconnectReason seguro e não emitir conectado após desconexão terminal de um handshake pendente;15 testes direcionados aprovados. Publicado no Worker de homologação c87f97af-da4f-4756-8447-b571ded650e5. Produção e homologação compartilhavam room_name, conflito possível com sessão antiga prod/app; isolamento do namespace de homologação em preparação. Não há homologação real de voz/vídeo/tela até repetição bem-sucedida.

## Fontes primárias consultadas

- https://vite.dev/guide/build.html#load-error-handling
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/static-assets/headers/

## Confirmação do responsável e promoção

- office-room-token v4 publicada: namespace da homologação isolado da produção; sete testes de ambiente aprovados.
- Responsável confirmou duas contas conectadas simultaneamente, áudio bidirecional e continuidade ao navegar. Fase 06 homologada nesse cenário. Vídeo, tela e fluxo completo de convite ainda pendentes.
- Última regressão ampliada: 562 aprovados e um timeout de 5s no teste de banco strategy-delete; resultado integral não aprovado. Reexecução direcionada registrada na promoção.
- Usuário solicitou promover homologação para produção com push e deploy.
