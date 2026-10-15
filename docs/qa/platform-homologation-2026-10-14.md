# Homologação técnica controlada da plataforma

## Solicitação e limites
Usuário autorizou testar todas as fases da plataforma, corrigir falhas, atualizar diagnósticos, fazer push/deploy e concluir a homologação técnica antes de retomar as fases do Escritório Digital. Testes controlados não equivalem ao teste humano de voz, SMTP/OAuth/Meta/Drive reais ou aprovação editorial da equipe. Fase 05 do Escritório Digital continua pendente do teste real com dois membros e aceite; Fase 06 não iniciada.

## Checkpoint de execução
- Branch feat/escritorio-digital; último commit anterior 1e0c32c.
- docs/auditoria-doiszero/ é preexistente e deve permanecer fora do commit.
- Manifestos docs/PHASE_STATUS.json e docs/RELEASE_STATUS.json têm critérios antigos/inconsistentes; reconciliar somente com evidências verificadas.
- Suite reproduzível: playwright.homologation.config.ts; APIs controladas, demo e Escritório Digital desligados, desktop/tablet/mobile.
- Adicionado teste de restauração de snapshot PGlite com dados, grants e isolamento. Não é restauração do banco Supabase real.
- Retomada diária às 03:40 Europe/Paris por heartbeat retomar-homologa-o-dois-zero-s-03-40 somente enquanto tarefa técnica incompleta.
- Próximo passo: executar teste de restore; rodar suite de navegador, corrigir falhas; regressão com maxWorkers=2; verificações remotas delimitadas; atualizar manifestos e UI; publicar produção com office flag OFF e ambiente de homologação com flag ON; conferir publicação.

## Resultados
Em execução; não declarar fases aprovadas antes de terminar os checks.

## Avanço e achados
- Restore PGlite: um teste aprovado; dados, grants e isolamento preservados.
- Banco remoto: sete verificações passaram em transação com rollback (contexto OWNER/permissões, agência estrangeira, cliente fictício, movimento/status, recusa anônima e RPC de credenciais privada).
- Inventário remoto: 30 clientes, 24 briefings, um calendário. Configurações centrais Google e LiveKit existem; nenhuma configuração central Meta registrada. Nove Edge Functions ACTIVE.
- Advisors: 15 informações de RLS sem policy (tabelas privadas), oito funções públicas intencionais de briefing/editorial/showcase/branding, 34 funções autenticadas privilegiadas com guardas e proteção de senhas vazadas desativada. Não abrir tabelas privadas para remover avisos.
- Achado no build compilado: react/jsx-runtime e helpers compartilhados estavam dentro de vendor-pdf, carregando o gerador no login. Corrigido usando codeSplitting oficial do Vite 8, sem inclusão recursiva de dependências. Três testes compilados de rota anônima passaram em desktop/tablet/mobile após correção. SDK de voz agora carregado de forma lazy somente com feature e sessão ativas.
- Suíte completa compilada em execução: session 31318 nesta rodada; /private/tmp/doiszero-platform-browser-final.log, relatório /private/tmp/doiszero-platform-browser.json. Não reconstruir dist durante essa execução.
- UI de diagnósticos preparada para homologação técnica apenas quando o relatório tiver status verified, testes positivos e evidência por fase. Até lá não mostrará fases homologadas.

## Checkpoint em 15/10/2026
- Regressão integral: 466 testes, 127 arquivos aprovados; JSON /private/tmp/doiszero-platform-unit.json.
- Drive UI reintegrada: dez testes de módulos afetados aprovados.
- Deno: oito testes do emissor e dois da configuração LiveKit aprovados; protocolo Google OAuth atualizado à conexão central e readonly, um teste aprovado.
- Google-workspace v12 ACTIVE: correção de narrowing da pasta (duas linhas), oito arquivos publicados conferidos; sete demais dependências iguais à v11.
- HTTP publicados: seis endpoints recusaram sessão ausente com 401, OAuth sem state retornou 303.
- Cron aniversários ativo e última execução succeeded; 30 clientes e Aurora único preservados após rollback.
- Primeira suite compilada completa ainda rodando (session 31318, log browser-final). Falhas antigas identificadas em testes de convites, rótulo da navegação, nome acessível com horário na Agenda, wizard editorial e notificações antigas por polling; cenários atualizados. Também restaurado DriveBriefingsPanel em BriefingPage e ClientBriefingsTab, ligação perdida no redesign.
- Expect.timeout do config controlado ajustado a 15s para a carga de três viewports; nenhuma condição de acesso foi enfraquecida. A execução atual usa ainda 5s, repetir casos falhos depois do término.
- Não reconstruir dist enquanto suite está rodando. Depois: preservar o JSON desse primeiro resultado como baseline, reconstruir build controlado com as correções, repetir falhos/afetados; juntar resultados por arquivo/título/projeto, exigir zero falhas. Não contar repetição como cenário novo.
- Atualizar teste antigo de pilares da estratégia para /editorial/new e etapas; revisar demais falhas no error-context. Fazer regressão afetada após ajustes.
- Só após evidências válidas marcar technical_verified, atualizar PHASE_STATUS/RELEASE_STATUS e UI, fazer push e deploy: produção com office OFF e worker office-homologacao com ON.

Outros ajustes da rodada: painel Drive restaurado em BriefingPage/ClientBriefingsTab; teste antigo de link ao material original atualizado para a ampliação dentro da plataforma, conforme o comportamento atual documentado nos testes de PresentationPreview; teste de logo usa a primeira imagem do loop intencional. Testes antigos de geração/pilares adaptados às quatro etapas, rascunho persistido e lâminas/cenas estruturadas. Testes de notificações agora usam histórico e novos registros persistentes com destinatário/agência e relógio controlado. Nenhum e-mail ou mensagem real enviado nesses cenários.

CSP: o helper de PDF estava preso à porta 4193 e não aplicava a política no runner 4194. Corrigido para ler baseURL do projeto; repetir todos os cenários PDF, não somente os falhos. Não usar os resultados positivos anteriores para afirmar CSP validada. CSV legado: ID e Nicho agora são preservados no profile, teste antigo de colunas ignoradas atualizado. Google central: rótulo do botão atualizado. Prévia de apresentação: mantém ampliação interna e ausência de links Drive, conforme o teste unitário atual.

## Segunda rodada de correções — 15/10/2026
- Baseline: 384 cenários, 300 aprovados, 20 skips intencionais e 64 falhas. Primeira repetição: 47 aprovados dos 64. Relatórios são reconciliados por arquivo, título e viewport, sem somar duplicados.
- Aplicação explícita de contexto revisado do Drive restaurada no wizard; verifica agência, cliente e versão atual, preserva edição humana e registra proveniência. Dezessete testes editoriais unitários e typecheck aprovados.
- Reteste compilado em execução: /private/tmp/doiszero-platform-browser-retest2.json; sessão 55625. Regressão final e lint: sessão 91435.
- Próximo: repetir falhas restantes com seletores acessíveis corrigidos e mock de movimento com status; testar todos os PDFs com CSP real; reconciliar manifestos apenas com resultados sem falha; publicar produção OFF/revisão ON, conferir artefatos, commit/push.

## Resultado técnico final — 15/10/2026
As notas anteriores são o histórico da investigação. Execuções encerradas: 466 testes de regressão em 127 arquivos, sem falhas; 364 cenários de navegador aprovados e 20 skips intencionais, reconciliados sem duplicação. Os nove casos restantes passaram na terceira repetição. Quinze cenários PDF foram repetidos com CSP aplicada; três verificações finais confirmaram os onze selos técnicos e critérios externos nos diagnósticos.

Typecheck aprovado; lint encerrou com código zero e avisos preexistentes, sem erros. Builds isolados de produção (Escritório Digital desligado) e homologação (ligado) aprovados. Seis testes de reconciliação impedem aprovação sem evidência ou testes. Sete checks de banco real usaram rollback; nenhuma mensagem/e-mail real foi enviada.

Fases 01–07 e 09–12: homologação técnica controlada concluída. Fase 08: remoção de Propostas verificada. O detalhamento e a lista dos cenários estão em `docs/PLATFORM_HOMOLOGATION_STATUS.json`; contagens por fase compartilham cenários e não devem ser somadas. As fontes temporárias são referências de execução, não dependências da aplicação.

Permanecem critérios reais: SMTP/cadastro, OAuth/arquivos Drive/Meta, uso operacional com dois membros/clientes, restauração Supabase real e proteção de senhas vazadas. Em 15/10 o usuário confirmou que ainda vai testar a voz: Escritório Digital Fase 05 permanece pendente de teste real e aceite; Fase 06 bloqueada. Não declarar homologação operacional integral.

Publicação: conferência dos artefatos e push em andamento; recibos serão adicionados após confirmação remota.

## Incidente de voz reportado após os testes controlados
Em 15/10 o usuário enviou capturas de conexão seguida de falha. Não homologar a voz. Logs entre 11:35 e 11:45 UTC mostram OPTIONS 204 às 11:38:38 e nenhuma emissão POST concluída nesse intervalo; isso não comprova causa raiz. Requisição real pelo Chrome, sem credencial válida, passou pelo CORS e retornou 401 invalid_session. Não atribuir a falha às chaves sem evidência.

Adicionado diagnóstico seguro no cliente para distinguir sessão, acesso, configuração, limite, servidor/rede/timeout de emissão e conexão após token. Mensagens brutas, JWT e secrets não são exibidos. Dez testes dos módulos de voz afetados e typecheck aprovados. O teste real autenticado continua necessário; essa mudança permite localizar a etapa da falha, não comprova que a chamada de voz foi corrigida.

Consulta agregada posterior ao incidente: private.office_token_limits registra janela de emissão às 11:38:39 UTC. Portanto, autenticação/autorização alcançaram o consumo do contador; a ausência de POST no recorte do log não prova bloqueio CORS. A etapa de entrega do token versus conexão LiveKit permanece a distinguir pela mensagem segura no navegador. Nenhuma credencial foi lida ou descriptografada.

## Publicação confirmada
Commit cd1e753 enviado à branch feat/escritorio-digital. Produção: 981309d8-cf35-4fe7-a870-7300db8be926. Homologação: 9885d3ab-2f95-4813-8678-a5bb6505eb8a. HTML e bundles de entrada/diagnósticos/voz comparados byte a byte por HTTPS usando Chrome, CSP e permissões conferidas. Recibo: docs/qa/platform-publication-2026-10-15.json. Testes controlados gerais concluídos; investigação autenticada de voz aguarda código seguro da próxima tentativa do usuário.
