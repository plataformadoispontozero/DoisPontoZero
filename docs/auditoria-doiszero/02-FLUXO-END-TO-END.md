# Fluxo editorial: atual, legado e alvo

| Etapa | Atual comprovado em fonte | Legado | Alvo solicitado |
|---|---|---|---|
| Briefing→contexto | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:2-2` | NÃO VERIFICADO | Respostas estruturadas e vínculo por cliente |
| Geração | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/campaignEngine.ts:7-7`; motor determinístico, não prova de IA | NÃO VERIFICADO | Quantidade de peças/slides/cenas ajustável |
| Revisão interna/Backlog | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:18-18`; estados declarados draft/pending/changes_requested/approved/production | NÃO VERIFICADO | Revisão interna exclusiva antes do cliente, diferente de Briefados |
| Cliente | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011174125_editorial_review_lock_order.sql:1-18`; token, locks, feedback e status | NÃO VERIFICADO | Alterações revisadas e rastreáveis |
| Produção | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:105-124`; ação explícita após approved, projeto idempotente | NÃO VERIFICADO | Conferência de responsável, prazo e materiais antes da liberação |
| Captação/Briefados/QA | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/production/productionWorkspace.ts:36-41`; nomes gerais A fazer/Em produção/Em revisão/Concluído | NÃO VERIFICADO | Captação condicional, Briefados explícito e QA |
| Tráfego | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:122-124`; inclusão por booleano | NÃO VERIFICADO | Demanda somente com atribuição real; carteira de cliente é outra regra |
| Drive | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/integrations/DemandProductionFiles.tsx:2-2`; conector atual a preservar | NÃO VERIFICADO | Destino escolhido, original no Drive, metadata no banco |

Estados ausentes no enum desta entidade não provam que todo o sistema carece de uma funcionalidade equivalente; precisa validar o conjunto de tarefas/projetos e o worktree pendente. **Nenhum mapeamento de estados foi implementado.**

Preservar: aprovação não dispara produção automaticamente; guard por aprovação, vínculo briefing/cliente, snapshots e ordem de locks já existem. Não regredir para criação automática de demanda ao cliente clicar Aprovar.

## Distinção essencial de Backlog

`atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:115-115` cria **A produzir**, categoria `backlog`, no projeto depois da aprovação. Isto é diferente do Backlog de revisão interna anterior ao envio ao cliente solicitado na missão. Não resolver a distinção apenas renomeando uma coluna: primeiro mapear permissões, transições e completude.


## Complemento 14/10/2026 — fonte local recuperada

O bloqueio anterior de acesso ao GitHub permanece registrado como histórico. A pasta fornecida permite agora auditoria estática; branch/commit e equivalência com o deploy legado permanecem NÃO VERIFICADOS. Identificação e fichas: [fonte local](96A-FONTE-LEGADA-LOCAL.md). 39 declarações de rota encontradas em App.tsx, incluindo wildcard; 39 fichas de páginas geradas. Dependências transitivas e testes operacionais ainda pendentes: isto não encerra a auditoria integral.

| Capacidade | Evidência legada | Evidência atual | Decisão e limite |
|---|---|---|---|
| Briefing → estratégia → geração por cliente/mês | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/pages/ClienteFluxoCalendario.tsx:42-78` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:1-120` | ADAPTAR RECURSO candidato: navegação progressiva; nenhum ganho operacional medido |
| Envio audiovisual explícito, herança de responsável | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/components/videomaker/SendToVideoProduction.tsx:138-193` | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:105-124` | PORTAR REGRA candidata; reaproveitar tasks atuais, não criar video_productions paralelo |
| Arquivo no Drive e metadados da demanda | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/components/producao/DemandProductionFiles.tsx:220-280` | integração atual preservada; equivalência detalhada NÃO VERIFICADA | MANTER NOVO; aproveitar requisitos de UX, não credenciais/connector legado |
| SLA por etapa centralizado | `legado-local@sha256:b6e0e0767f2b44d903bb2df8edb5e1e8d8c42126b9b572fe0fe391f8dcf518e0:src/config/production-sla.ts:1-23` | regra temporal atual NÃO VERIFICADA neste complemento | INVESTIGAR; definir gatilho, fuso e horas úteis antes de adotar 24/48 |

**Alertas verificáveis no código:** o envio audiovisual legado cria `status: backlog`, não comprova Backlog exclusivo de revisão interna nem recepção em Briefados. O upload usa XMLHttpRequest para o arquivo inteiro (DemandProductionFiles linhas73–89 e232); criar sessão resumível não comprova envio em chunks ou retomada. Falha no registro de metadados depois do upload mantém arquivo no Drive e exige reconciliação; não repetir upload cegamente. Não copiar autenticação por conta de serviço para substituir o OAuth atual.

**Pilotos candidatos:** ADOC-001 organizar a preparação editorial em etapas sem motor novo; ADOC-002 conferência e liberação explícita usando tarefas atuais e responsável validado; ADOC-003 consistência da copy/versão preservando snapshots e locks atuais. Os cards originais seguem históricos; esta comparação não comprova vantagens operacionais nem autoriza implementação. Backlog interno continua requisito solicitado que não foi comprovado no legado.

**Testes essenciais — NÃO TESTADO:** papéis/RLS; isolamento A/B; revisão interna sem tarefa prematura; captação condicional; aprovação e copy idêntica nos setores; envio repetido idempotente; upload e reconciliação de metadados; refresh/erro/mobile. Scripts dos projetos não foram executados para evitar conexões e efeitos remotos durante leitura do legado.

Preservar Auth, OAuth/Drive, IDs, tasks/projetos canônicos, snapshots de aprovação e design atual. Não trazer tabelas duplicadas, rotas/auth legadas ou semântica backlog ambígua. Ganho antes/depois e fluxo transativo completo ainda precisam de evidência antes da aprovação final de adoção.
