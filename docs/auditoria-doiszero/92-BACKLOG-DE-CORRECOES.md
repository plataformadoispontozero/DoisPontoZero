# Backlog de propostas — SEM IMPLEMENTAÇÃO

Preflight obrigatório: acesso ao legado e baseline sobre branch estabilizada, antes de aprovar adoção.

### ADOC-001 | Revisão interna antes do cliente
- Aba/setor: 20-social-media.
- Comportamento positivo comprovado no legado: **NÃO VERIFICADO**; requisito solicitado, não solução antiga comprovada.
- Estado comprovado no novo: `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/editorial/MonthlyEditorialPage.tsx:51-51`; rastro detalhado no fluxo end-to-end.
- Ganho de negócio proposto: Revisão interna/Backlog separado de Briefados. Medir retrabalho, liberações incompletas e inconsistência; baseline de métricas ainda não coletado.
- Decisão: **INVESTIGAR** agora; candidata a PORTAR REGRA/ADAPTAR RECURSO somente após comparação.
- Arquivos estimados: `src/features/editorial/MonthlyEditorialPage.tsx` e os hooks/contratos correspondentes; lista final depende de prova.
- Intocáveis: Auth, conector Google, clients IDs, engine tasks, identidade visual e funcionalidades já entregues.
- Dependências/risco: revisão de dados canônicos, estado atual, worktree pendente e permissões.
- Plano mínimo: piloto isolado de uma capacidade, sem migrar módulos inteiros; flag se regra transversal.
- Testes: papéis distintos, A/B, aprovação sem produção antecipada, mesma copy/versão, erro e refresh.
- Rollback: reverter PR/flag mantendo registros e IDs; migration compatível somente com aprovação específica.
- Prioridade: P1 depois do preflight P0.
- Aprovação necessária: **SIM**, em nova solicitação e somente depois de fechar evidências faltantes.

### ADOC-002 | Conferência e captação condicional antes da produção
- Aba/setor: 40-producao.
- Comportamento positivo comprovado no legado: **NÃO VERIFICADO**; requisito solicitado, não solução antiga comprovada.
- Estado comprovado no novo: `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:104-104`; rastro detalhado no fluxo end-to-end.
- Ganho de negócio proposto: Conferir responsável, prazo, material e necessidade de captação. Medir retrabalho, liberações incompletas e inconsistência; baseline de métricas ainda não coletado.
- Decisão: **INVESTIGAR** agora; candidata a PORTAR REGRA/ADAPTAR RECURSO somente após comparação.
- Arquivos estimados: `supabase/migrations/20261011173520_monthly_editorial_workflow.sql` e os hooks/contratos correspondentes; lista final depende de prova.
- Intocáveis: Auth, conector Google, clients IDs, engine tasks, identidade visual e funcionalidades já entregues.
- Dependências/risco: revisão de dados canônicos, estado atual, worktree pendente e permissões.
- Plano mínimo: piloto isolado de uma capacidade, sem migrar módulos inteiros; flag se regra transversal.
- Testes: papéis distintos, A/B, aprovação sem produção antecipada, mesma copy/versão, erro e refresh.
- Rollback: reverter PR/flag mantendo registros e IDs; migration compatível somente com aprovação específica.
- Prioridade: P1 depois do preflight P0.
- Aprovação necessária: **SIM**, em nova solicitação e somente depois de fechar evidências faltantes.

### ADOC-003 | Consistência de copy e versão nos setores
- Aba/setor: 20-social-media.
- Comportamento positivo comprovado no legado: **NÃO VERIFICADO**; requisito solicitado, não solução antiga comprovada.
- Estado comprovado no novo: `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011174125_editorial_review_lock_order.sql:12-12`; rastro detalhado no fluxo end-to-end.
- Ganho de negócio proposto: Garantir mesma versão revisada entre campanha, aprovação e demanda. Medir retrabalho, liberações incompletas e inconsistência; baseline de métricas ainda não coletado.
- Decisão: **INVESTIGAR** agora; candidata a PORTAR REGRA/ADAPTAR RECURSO somente após comparação.
- Arquivos estimados: `supabase/migrations/20261011174125_editorial_review_lock_order.sql` e os hooks/contratos correspondentes; lista final depende de prova.
- Intocáveis: Auth, conector Google, clients IDs, engine tasks, identidade visual e funcionalidades já entregues.
- Dependências/risco: revisão de dados canônicos, estado atual, worktree pendente e permissões.
- Plano mínimo: piloto isolado de uma capacidade, sem migrar módulos inteiros; flag se regra transversal.
- Testes: papéis distintos, A/B, aprovação sem produção antecipada, mesma copy/versão, erro e refresh.
- Rollback: reverter PR/flag mantendo registros e IDs; migration compatível somente com aprovação específica.
- Prioridade: P1 depois do preflight P0.
- Aprovação necessária: **SIM**, em nova solicitação e somente depois de fechar evidências faltantes.



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
