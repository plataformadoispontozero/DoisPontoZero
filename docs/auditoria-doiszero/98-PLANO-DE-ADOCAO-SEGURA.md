# Plano de adoção segura

## Antes do piloto
1. Recuperar fonte legada read-only e fixar SHA.
2. Estabilizar o trabalho anterior na nova base; aprovar o SHA do piloto.
3. Completar matriz por aba com testes/prova dos dois lados.
4. Aprovar um card individual em nova solicitação.

## Ordem candidata
- ADOC-001: revisão interna/Backlog. Menor superfície candidata, mas pode exigir estado/perm obrigatório; estimativa final após comparação.
- ADOC-002: conferência/captação. Depende das regras de liberação e responsabilidades definidas.
- ADOC-003: consistência de versão. Preservar snapshots/locks já presentes; não duplicar calendário/tarefas.

## Método após aprovação
Branch isolada baseada no SHA aprovado; baseline antes; uma melhoria por PR; contratos canônicos e design atual; feature flag se impacto transversal; teste antes/depois e demonstração; revisão humana antes de merge/deploy. Rollback por flag/PR e preservação de dados. Migrações somente em projeto separado com autorização explícita.

## Níveis de evidência
- **COMPROVADO:** Git HEAD/remoto atual, fontes/rotas e shell publicado consultados; auditoria bloqueou acesso legado.
- **HISTÓRICO:** resultados QA registrados na release13/10, não reexecutados agora.
- **SOLICITADO:** fluxo Backlog→conferência→captação condicional→Briefados→QA, roles e SLA.
- **INFERIDO:** possível ganho desses pilotos; métricas e comportamento antigo ainda não medidos.

Nenhum card é aprovação de implementação. Não prometer piloto cirúrgico para regra que, depois de analisada, exigir impacto transversal: replanejar e obter aprovação correspondente.


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
