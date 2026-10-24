# Checklist executável do Diagnóstico Técnico — 22/10/2026

## Parecer e escopo

**NEEDS WORK.** Este documento inventaria os critérios pendentes e a evidência necessária para fechá-los. É revisão estática do código e dos manifestos, não execução de homologação. Nenhum teste pesado, navegador, dispositivo, cadastro, e-mail ou dado remoto foi acionado nesta frente; nenhuma marcação de concluído foi aplicada.

A lista da tela é calculada por `src/features/settings/DiagnosticsPage.tsx` e `releaseEvidence.ts`: fases ativas de `PHASE_STATUS.json` + pendências de `RELEASE_STATUS.json`, com selo técnico condicionado ao relatório controlado `PLATFORM_HOMOLOGATION_STATUS.json`. O selo **Técnica homologada** não elimina critérios de operação real. O filtro exclui a Fase08 da plataforma (Propostas removidas); **Fase08 do Escritório é outra numeração e continua no escopo de mídia**.

### Regra para fechar cada item

Registrar data, SHA, ambiente/URL, versão do Worker/Edge quando aplicável, flags, perfil usado, passos, resultado esperado/observado, screenshot ou recibo e responsável pelo aceite. Identificadores de QA devem ser distinguíveis e reversíveis; não usar credenciais, tokens ou dados privados nas evidências. Falha conserva o item aberto com reprodução. Um teste com fixture comprova apenas o contrato controlado; não comprova serviço externo ou uso humano.

## Ordem de execução

Legenda: **A** = pode ser automatizado com dados controlados; **R** = sessão real/serviço externo; **H** = decisão ou aceite humano. Todos os itens abaixo permanecem abertos nesta revisão.

| Ordem | Tipo | Tarefa e fonte | Procedimento de fechamento e evidência mínima |
|---|---|---|---|
| 01 | A/R | Recuperação de arquivo dinâmico após deploy. Relato de erro `/profile`; correção em andamento pelo coordenador. | Abrir aba em versão anterior, promover candidato, navegar para página lazy; observar uma recuperação limitada, sem loop, sem apagar sessão; repetir offline/falha persistente e conferir mensagem recuperável. Perfil e diagnóstico devem abrir por URL direta e refresh. |
| 02 | A | Regressão estável no SHA candidato. `agency-agents-readiness-2026-10-22.md`. | Executar suíte integral sem processos concorrentes e guardar resumo final/exit code; resolver paralisação PGlite em vez de reaproveitar contagens antigas. Testes direcionados já registrados não substituem a integral. Typecheck, lint e build do mesmo candidato; avisos são dívida explícita. |
| 03 | A/R | Reconciliar inventário de migrations e contratos remotos. Auditoria Cloudflare + entrega Agency Agents. | Comparar arquivos/checksums, catálogo de funções e grants; validar contratos usados pelo frontend por fixtures com rollback. A RPC de tarefas foi reconciliada nesta rodada segundo relatório do coordenador; outros objetos ainda precisam inventário. Não executar `db push` amplo para acertar só nomes/timestamps. |
| 04 | A/R | Segurança do cadastro e autenticação. Auditoria Cloudflare. | Corrigir o gargalo global `public-registration`, validar desafio no servidor e origem confiável; testar abuso limitado em backend isolado. Worker de homologação usa banco compartilhado e não constitui isolamento. Sem enumeração de contas. |
| 05 | A/R/H | Auth/SMTP/convites, dois membros e Permission Studio. Fase02; entregas `permission-matrix`, `access-hardening`. | Em duas contas reais, convite recebido → aceite → cadastro/aprovação → login; recuperação recebida → senha redefinida pelo titular → login. Validar SMTP e remetente. Alterar uma permissão não crítica de usuário de QA e revalidar acesso permitido/negado, reload e revogação; OWNER protegido. Confirmar suporte e ativação de senhas vazadas no Auth com responsável, sem afirmar que todos os avisos de advisor são exploração. |
| 06 | R/H | Dashboard e CRM. Fases01/03. | Conferir dashboard autenticado contra dados operacionais; criar/editar cliente de QA, sair/voltar e refresh; responsável confere campos legados e vínculos ausentes. Guardar antes/depois e aceite da completude sem inventar autores/campos. |
| 07 | A/R/H | Equipe, perfil, squad e atribuição por cliente/setor. Fase05; `client-department-assignments`. | Upload de avatar de QA e reload; adicionar/remover membro em squad com papéis autorizados; verificar vínculo ativo/isolamento. Equipe real escolhida por cliente/setor precisa aceite do gestor. Conferir aniversários no fuso real e deduplicação; aviso offline é limite de produto, não implementação provada. |
| 08 | R/H | Briefing público, edição, PDF e legado. Fase06. | Criar briefing para cliente de QA, enviar link ao participante autorizado, preencher e confirmar recebimento, revisar/editar no fluxo permitido, exportar PDF e conferir conteúdo/branding/paginação; reaproveitar contexto no cliente. Autores legados sem identidade confiável exigem conferência humana. |
| 09 | A/R/H | Estratégia/editorial/campanha/copy/direção. Fase07; `editorial-groups`, `creative-demand-copy`, `photographic-direction`. | Cliente + briefing real → campanha do mês → sugestões revisadas → copy/slides/roteiro/direção → aprovação. Social media confere fatos e qualidade; designer/videomaker aceita orientação de captação. Não rotular motor determinístico como geração IA. |
| 10 | A/R/H | Produção, gestão, SLA e dependências. Fase04; `manager-kanban`, `production-client-cards`, `production-sla`. | Calendário aprovado → demanda → responsável → entrega com dois papéis reais; gestor usa quadro por cliente, move peça e grupo sem mover outras peças indevidamente; verifica prazos/fuso/SLA, subtarefas/dependências e acesso entre perfis. Registre antes/depois e aceite do gestor para uso diário. |
| 11 | A/R | Google OAuth, Picker, pasta, upload e preview privado. Fases09/11; `drive-write-flow`, `task-covers-gallery`, `presentation-pdf`. | Autorização da conta real já escolhida; selecionar pasta permitida, criar subpasta e enviar arquivo descartável; validar existência no Drive, vínculo à demanda, capa e preview após refresh. Testar recusa fora da pasta/cliente/agência. Verificar mensagem de timeout sem duplicar upload. Não reenviar cegamente após erro. |
| 12 | A/R/H | Apresentação e aprovação do cliente. Fase09. | Post/Reels/Carrossel → importar pasta permitida → publicação/link persistente → abrir como cliente → aprovar/ajustar/reprovar → editar comentário → refletir no painel → reenviar ajuste à produção → nova aprovação. Conferir ordem numérica, setas/arraste, PDF/imagens/fontes reais e carregamento após deploy. Reels requer arquivo real: loop mudo e áudio após gesto. Navegação dentro da imagem ampliada ainda não foi implementada, segundo entrega22/10. |
| 13 | A/R | Chat, arquivo privado e notificações. Fase10; `chat-materials`, `operational-events`. | Dois membros simultâneos: mensagens nos dois sentidos, reconexão/refresh, envio e download de arquivo privado do Drive, notificações persistentes e permissões do navegador/dispositivo. Terceiro usuário não autorizado não recebe conteúdo. Testar sem depender só de mocks/estado online. |
| 14 | A/R/H | Reunião → ata → ação → tarefa. Fase10; `meeting-operations`. | Dois membros criam reunião e pauta, registram ata/decisão/ação, convertem ação uma vez, repetem pedido e conferem mesma tarefa/responsável; reload preserva tudo. Equipe aceita rotina e fuso na agenda. SQL idempotente já registrado não comprova rotina humana completa. |
| 15 | R/H | Escritório06 — voz persistente entre rotas. `office-phase06-2026-10-15.md`. | Dois membros em Safari/Chrome, sem captura na entrada; ligar microfone explicitamente e conversar; navegar por dez páginas/voltar/avançar com barra, sem eco/duplicação; mute/saída fora do Escritório; reload volta lobby; perda de rede/permissão e logout encerram/recuperam corretamente. Aceite do responsável existe, mas áudio contínuo observado ainda precisa recibo. |
| 16 | A/R/H | Escritório07 — convites privados reais. `office-phase07-2026-10-18.md`. | Dois membros: chamar/aceitar/recusar/cancelar/expirar, ocupado/Não perturbe, retorno à sala anterior e conversa audível. Envio/cancelamento já observados historicamente; aceite e áudio reais não. Conferir flags antes de afirmar disponibilidade em produção. |
| 17 | R/H | Escritório08 — mídia e dispositivos reais. `office-phase08-2026-10-18.md`. | No ambiente com mídia habilitada, testar permissão negada/concedida de microfone/câmera, publicação/recepção entre duas contas, tela escolhida pelo usuário, troca/remoção de dispositivo e volume. Nenhum dispositivo deve iniciar sem gesto. Saída de áudio só onde navegador suporta. Preservar escuta se captura falhar. |
| 18 | R/H | Escritório09 — aplicativo desktop e tray. `office-phase09-2026-10-18.md`. | Executável macOS empacotado: login → sala → opt-in tray → minimizar/fechar janela → mostrar/restaurar → mute/sair/encerrar, conferindo áudio/presença e limpeza. Validar DMG/assinatura/distribuição se forem parte da entrega; app compilado não prova menu interativo. Autostart era opcional e não solicitado. |
| 19 | A/R | Google/Meta reais. Fase11; entrega `meta-campaigns`. | OAuth e revogação corretos por agência; Meta com `ads_read` ativa e conta real do cliente, períodos7/30/90 dias conferidos com a fonte; testar expiração/negação sem dados inventados. Google Calendar e envio/upload real têm recibos próprios. |
| 20 | A/R | Segurança, acesso cruzado e sessão. Fase12; `access-hardening`. | Papéis reais e duas agências: URLs diretas e RPCs não autorizadas negadas, vínculo revogado não recupera acesso, logout limpa contexto. Rever advisors/grants/corpos/expiração de tokens individualmente; não revogar APIs públicas intencionais em massa. Conferir dados privados fora de logs/cache. |
| 21 | A/R/H | Backup/restauração, observabilidade e desempenho. Fase12. | Backup real + restauração em destino isolado, comparar dados/Storage/grants e tempo de recuperação; gerar erro controlado com logs mascarados/alerta; medir carregamento e fluxos desktop/mobile sob rede real e definir limites de aceitação. PGlite restore não certifica backup de produção. |
| 22 | A/R/H | CI, release, rollback e aceite global. Fase12; `diagnostics`. | Workflow hospedado verde no SHA, Actions variables públicas corretas, flags registradas, artefato versus bundle servido, headers/HTML/assets/deep links e rollback conhecido. Consolidar recibos acima por fase; atualizar manifestos somente para critérios comprovados, data e escopo. Responsável aceita plataforma e integrações após a jornada completa. |

## Reconciliação documental antes de mudar selos

- `OfficePhaseStatus.tsx` referencia `docs/qa/office-phase10-2026-10-18.md`, **arquivo ausente no repositório inspecionado**, e afirma “regressão integral aprovada”. Recuperar evidência canônica ou substituir essa afirmação por estado histórico delimitado; a rodada integral22/10 foi inconclusiva.
- `PLATFORM_HOMOLOGATION_STATUS.json.office_phase_05` conserva `real_two_member_voice_test_and_acceptance_pending`; `office-phase05-2026-10-14.md` ao final e `office-phase06-2026-10-15.md` registram aceite explícito da Fase05. Reconciliar aceite histórico sem marcar06–09 como testadas por herança.
- `RELEASE_STATUS.json`, entrega `office-phase06-controls`, ainda diz “Fase07 não iniciada”, contradizendo o relatório07 publicado. Atualizar o texto de pendência, mantendo conversa real não observada.
- `PHASE_STATUS.json.verification.external_or_operational_pending` tem textos antigos “Permission Studio requer conclusão” e “Áudio/vídeo de salas não implementados”, embora entregas/relatórios posteriores registrem implementação e validação controlada. Distinguir implementação existente, rollout por flags e teste real ainda pendente.
- `docs/PHASE_STATUS.md` termina dizendo Fase05 pendente e06 não iniciada; é snapshot de14–15/10. Não usar como estado corrente sem reconciliação.
- `releaseEvidence.ts` usa a data global antiga `release.verified_at` para fases conciliadas. Testes contados em15/10 não podem ser apresentados como executados no candidato22/10. Os relatórios22/10 registram escopo direcionado e regressão integral inconclusiva.
- `.codex/agents` fornece perfis; comandos obrigatórios de captura do perfil não foram executados porque esta frente foi explicitamente limitada à revisão documental, sem UI/testes pesados. Nenhuma certificação visual decorre desta análise.

## Inventário integral dos critérios encontrados

Abaixo, critérios literais por fonte. Formulações equivalentes aparecem mais de uma vez para rastreabilidade e **não representam tarefas independentes somáveis**. Os campos `external_or_operational_pending` também contêm limites históricos que precisam reconciliação, conforme a seção acima. Propostas da plataforma/Fase08 removida foi excluída do fechamento ativo.

### phase-01 — Fase 01 - Design System, Shell e Dashboard

- [ ] Aceite do dashboard com sessão real e dados operacionais da agência
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.

### phase-02 — Fase 02 - Supabase, Auth e Permission Studio

- [ ] Recebimento real de convite/recuperação depende de SMTP
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Aceite cadastro→aprovação→login com dois membros reais
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Permission Studio: persistência de alterações ainda requer implementação/verificação
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Aceite operacional do gestor após usar o quadro publicado em /projects.
  - Fonte: `RELEASE_STATUS.deliveries[manager-kanban].pending` (Kanban geral exclusivo da gestão).
- [ ] Validar convite e recuperação por e-mail com SMTP real e cadastro/aprovação de dois membros.
  - Fonte: `RELEASE_STATUS.deliveries[permission-matrix].pending` (Permission Studio com gravação segura).
- [ ] Ativar a proteção de senhas vazadas nas configurações de Auth do Supabase.
  - Fonte: `RELEASE_STATUS.deliveries[access-hardening].pending` (Acesso e funções antigas protegidos).

### phase-03 — Fase 03 - CRM e Client Hub

- [ ] Conferir com a equipe a completude dos campos legados ausentes e vínculos de arquivo
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Exercitar edição e refresh do cliente em sessão real
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Selecionar a equipe real de cada cliente e validar o fluxo diário da agência.
  - Fonte: `RELEASE_STATUS.deliveries[client-department-assignments].pending` (Atribuições por cliente e setor).

### phase-04 — Fase 04 - Projetos, Kanban e Gestão de Tarefas

- [ ] Aceite da esteira real calendário aprovado→demanda→responsável→entrega
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Exercitar Kanban/SLA e dependências com dois papéis reais
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Aceite operacional do gestor após usar o quadro publicado em /projects.
  - Fonte: `RELEASE_STATUS.deliveries[manager-kanban].pending` (Kanban geral exclusivo da gestão).
- [ ] Aceite operacional do gestor após conferir esta implementação publicada.
  - Fonte: `RELEASE_STATUS.deliveries[production-client-cards].pending` (Design e Videomaker: cliente, peça e grupo).
- [ ] Aceite operacional do gestor após conferir esta implementação publicada.
  - Fonte: `RELEASE_STATUS.deliveries[creative-demand-copy].pending` (Copy completa e direção criativa).
- [ ] Aceite operacional do gestor no quadro publicado.
  - Fonte: `RELEASE_STATUS.deliveries[production-sla].pending` (Prazo de produção após aprovação editorial).
- [ ] Selecionar a equipe real de cada cliente e validar o fluxo diário da agência.
  - Fonte: `RELEASE_STATUS.deliveries[client-department-assignments].pending` (Atribuições por cliente e setor).
- [ ] Aceite da orientação de captação pelo designer e videomaker/fotógrafo.
  - Fonte: `RELEASE_STATUS.deliveries[photographic-direction].pending` (Direção fotográfica e espaço negativo).
- [ ] Conferir o fluxo diário de upload e seleção de capa com um arquivo real da equipe.
  - Fonte: `RELEASE_STATUS.deliveries[task-covers-gallery].pending` (Capas nos cards e navegação da apresentação).

### phase-05 — Fase 05 - Squads e Gestão de Equipe

- [ ] Upload real de avatar e gestão de squad com membros reais
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Aniversários dependem de sincronização na plataforma; aviso offline não implementado
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Selecionar a equipe real de cada cliente e validar o fluxo diário da agência.
  - Fonte: `RELEASE_STATUS.deliveries[client-department-assignments].pending` (Atribuições por cliente e setor).

### phase-06 — Fase 06 - Briefing Studio e Professional PDF

- [ ] Homologar envio público, edição, PDF e uso do briefing por cliente real
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Conferir autores legados cuja identidade não foi validada
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.

### phase-07 — Fase 07 - Strategy Studio e Editorial Generator

- [ ] Aceite editorial completo com fatos do cliente e demanda real
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Revisar qualidade de copy/slides/roteiro com social media; motor determinístico não equivale a geração IA
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Homologação do conteúdo editorial gerado para uma campanha real.
  - Fonte: `RELEASE_STATUS.deliveries[editorial-groups].pending` (Calendários organizados por cliente).
- [ ] Ativar a proteção de senhas vazadas nas configurações de Auth do Supabase.
  - Fonte: `RELEASE_STATUS.deliveries[access-hardening].pending` (Acesso e funções antigas protegidos).
- [ ] Aceite operacional do gestor após conferir esta implementação publicada.
  - Fonte: `RELEASE_STATUS.deliveries[creative-demand-copy].pending` (Copy completa e direção criativa).
- [ ] Aceite operacional do gestor no quadro publicado.
  - Fonte: `RELEASE_STATUS.deliveries[production-sla].pending` (Prazo de produção após aprovação editorial).
- [ ] Aceite da orientação de captação pelo designer e videomaker/fotógrafo.
  - Fonte: `RELEASE_STATUS.deliveries[photographic-direction].pending` (Direção fotográfica e espaço negativo).

### phase-09 — Fase 09 - Google Drive e Presentation Studio

- [ ] Leitura e upload de arquivo real no Drive e pasta autorizada
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Avaliação real por cliente e preview de fontes Google; qualidade depende da imagem original
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Validar a leitura com autorização ads_read ativa e uma conta de anúncios real vinculada ao cliente.
  - Fonte: `RELEASE_STATUS.deliveries[meta-campaigns].pending` (Tráfego: métricas Meta por campanha).
- [ ] Validar thumbnails de materiais privados do Drive com a conexão real da agência.
  - Fonte: `RELEASE_STATUS.deliveries[presentation-pdf].pending` (PDF e preview de apresentações).
- [ ] Testar envio e download de um arquivo privado real do Drive entre dois membros.
  - Fonte: `RELEASE_STATUS.deliveries[chat-materials].pending` (Salas, presença, reuniões e materiais).
- [ ] Conferir o fluxo diário de upload e seleção de capa com um arquivo real da equipe.
  - Fonte: `RELEASE_STATUS.deliveries[task-covers-gallery].pending` (Capas nos cards e navegação da apresentação).
- [ ] Confirmar autorização no Google Picker e criação/upload na pasta real com a sessão do responsável.
  - Fonte: `RELEASE_STATUS.deliveries[drive-write-flow].pending` (Criar pasta e enviar arquivos na demanda).

### phase-10 — Fase 10 - Meeting Hub + Team Chat

- [ ] Chat simultâneo de dois membros reais e notificações em navegador/dispositivo
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Aceite da equipe na rotina reunião→ata→ação→tarefa; persistência e idempotência já verificadas no banco
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Homologar reunião→ata→ação→tarefa
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Áudio/vídeo de salas não implementados
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Aceite da equipe no uso diário com dois membros autenticados.
  - Fonte: `RELEASE_STATUS.deliveries[meeting-operations].pending` (Reunião, ata, ação e tarefa).
- [ ] Testar envio e download de um arquivo privado real do Drive entre dois membros.
  - Fonte: `RELEASE_STATUS.deliveries[chat-materials].pending` (Salas, presença, reuniões e materiais).
- [ ] Conferir recebimento e permissões do navegador com dois membros reais.
  - Fonte: `RELEASE_STATUS.deliveries[operational-events].pending` (Notificações operacionais persistentes).
- [ ] Validar áudio contínuo durante navegação com dois membros e aceitar a Fase 06. Fase 07 não iniciada.
  - Fonte: `RELEASE_STATUS.deliveries[office-phase06-controls].pending` (Escritório Digital · Fase 06 em homologação).

### phase-11 — Fase 11 - White Label Studio & Advanced Settings

- [ ] OAuth e uploads reais Google/Meta devem ser homologados
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Instaladores nativos assinados/distribuição e push offline dependem de contas e configuração
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Permission Studio requer conclusão e verificação antes de aceite
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Validar convite e recuperação por e-mail com SMTP real e cadastro/aprovação de dois membros.
  - Fonte: `RELEASE_STATUS.deliveries[permission-matrix].pending` (Permission Studio com gravação segura).

### phase-12 — Fase 12 - Production Readiness, Final Audit, Security & Deployment Preparation

- [ ] Proteção de senhas vazadas do Auth desativada; funções privilegiadas e tabelas privadas com acesso intencional documentados
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Teste operacional com membros/clientes reais e serviços externos
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Validar backup/restauração, observabilidade e desempenho em condições reais
  - Fonte: `PHASE_STATUS.pending_requirements; PHASE_STATUS.verification.pending; PHASE_STATUS.verification.external_or_operational_pending; PLATFORM_HOMOLOGATION_STATUS.external_or_operational_pending`.
- [ ] Auditoria de segurança global e avisos antigos de advisors ainda precisam resolução
  - Fonte: `PHASE_STATUS.verification.external_or_operational_pending`.
- [ ] Aceite operacional das integrações externas e da plataforma como um todo.
  - Fonte: `RELEASE_STATUS.deliveries[diagnostics].pending` (Diagnóstico Técnico atualizado).
- [ ] Ativar a proteção de senhas vazadas nas configurações de Auth do Supabase.
  - Fonte: `RELEASE_STATUS.deliveries[access-hardening].pending` (Acesso e funções antigas protegidos).

## Fontes consultadas

- `src/features/settings/DiagnosticsPage.tsx`, `releaseEvidence.ts`, `ReleaseDiagnostics.tsx`.
- `src/features/office/OfficePhaseStatus.tsx`.
- `docs/PHASE_STATUS.json`, `PHASE_STATUS.md`, `RELEASE_STATUS.json`, `PLATFORM_HOMOLOGATION_STATUS.json`.
- `docs/qa/office-phase05-2026-10-14.md`, `office-phase06-2026-10-15.md`, `office-phase07-2026-10-18.md`, `office-phase08-2026-10-18.md`, `office-phase09-2026-10-18.md`.
- `docs/qa/cloudflare-security-readiness-2026-10-20.md`, `agency-agents-readiness-2026-10-22.md`, `agency-agents-delivery-2026-10-22.md`.

Somente este checklist foi criado pela frente Reality Checker. Nenhum manifesto, selo, implementação ou dado remoto foi alterado.
