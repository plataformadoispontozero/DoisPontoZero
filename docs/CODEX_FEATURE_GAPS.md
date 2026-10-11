> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# FEATURE GAPS

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Classificação por evidência

Matriz de 104 requisitos numerados extraídos dos 19 prompts fornecidos em [requirement-matrix.csv](evidence/requirement-matrix.csv). O mapeamento por módulo não certifica cada requisito: status conservador PARTIAL, com testes operacionais não executados. Requisitos individuais completamente ausentes ou bloqueados estão detalhados abaixo. Os prompts 00–04 foram reconstruídos no kit; rastreabilidade ao texto literal original é limitada. Não é necessário reenviar todos os prompts.

Há 409 candidatos de demo/placeholder em [placeholder-inventory.json](evidence/placeholder-inventory.json), com arquivo, linha e texto. Essa contagem inclui atributos de formulário legítimos; não corresponde a 409 bugs. Fixtures de testes não foram removidas.

## PROMPTS QUE PRECISAM SER RETOMADOS

| Prompt | Módulo/requisito específico | Rota e arquivo real | Problema e correção necessária | Dependência | Prioridade | Reenviar? |
|---|---|---|---|---|---|---|
| 02 | Auth, usuário, associação multiagência e guardas | /login ausente; src/app/providers/AppProviders.tsx; src/app/router/index.tsx; src/components/navigation/Sidebar.tsx | Não há sessão Supabase real/guardas; identidade administrativa fixa; implementar login/logout e contexto real antes de exposição pública | usuários A/B de staging + schema membership | P0 | NÃO |
| 02/11 | Permission Studio e administração OWNER | /settings/permissions; src/features/settings/PermissionStudioPage.tsx | salvamento era toast de sucesso; agora desabilitado. Falta mutation autorizada, carregar matriz real e negar ação sem permissão | Auth + RPC/RLS + política OWNER | P0/P1 | NÃO |
| 01 | Dashboard operacional | /dashboard; src/features/dashboard/data/useDashboardData.ts; DashboardPage.tsx | campos remotos não alimentam todas as listas, filtros de KPI inadequados e erros ignorados; card ainda contém alegações históricas de módulos/RLS | queries autenticadas, definição de KPIs já no prompt | P1 | NÃO |
| 03 | CRM, contatos, links, branding, assets e histórico | /clients; src/features/clients/ClientsPage.tsx (Client Hub em Sheet) | UI parcial; tabelas satélite não declaradas na cadeia local; navegação profunda incompleta | contratos/schema staging + Storage | P1/P2 | NÃO |
| 04/10 | Action Item → tarefa válida | /meetings/:meetingId; src/features/meetings/hooks/useMeetings.ts; migration 08 | task-conv-* é memória; RPC SQL referencia campos/status incompatíveis; created_by/board obrigatórios | schema de tasks reconciliado + RPC transacional | P1 | NÃO |
| 05 | ranking, score events e gamificação | /squads; src/features/squads/hooks/useSquads.ts; migration 03 | fórmula 40/35/25 diverge do prompt 35/30/25/10; faltam eventos, achievements e progresso; zero usado sem informação | schema/eventos + regra disponível no prompt | P2 | NÃO |
| 06 | token público, snapshot e PDF privado | /b/:publicToken; src/features/briefing; migration 04 | componentes e renderer presentes, mas fluxo real não homologado; seed de permissions incompatível UUID | Auth/RLS + tokens de staging + teste PDF | P1 | NÃO |
| 07 | aprovações, geração auditável e exportações | /strategy/:strategyId; src/features/strategy/hooks/useStrategy.ts; migration 05 | tabelas/fluxos de approvals/generation runs/exports faltam na cadeia; seed e coluna references incompatíveis | migration incremental + testes de conversão | P2 | NÃO |
| 08 | cálculo/aceite comercial autorizado | /proposals; src/features/proposals; migration 06 | cálculo em centavos no cliente existe; cálculo autoritativo e aceite público com auditoria não comprovados | RPC, transação, tokens e dados staging | P1 | NÃO |
| 09 | OAuth Google Drive e export log | /drive; src/features/drive/hooks/useDrive.ts; src/features/presentations | toggle de conexão é demo/upsert, não OAuth; sem Edge Function correspondente; log com agency demo | consentimento OAuth + backend secreto fora de VITE + Storage | P1 | NÃO |
| 10 | persistência Chat e atualização Reunião | /chat; src/features/chat/hooks/useChat.ts:240; src/features/meetings/hooks/useMeetings.ts | envio modifica demoMessagesStore, updates de reunião usam memória; remitters fixos; não comprova entrega | insert/update autorizado + realtime duas sessões | P1 | NÃO |
| 10 | calendário bidirecional | /settings/integrations/calendar; src/features/calendar/hooks/useCalendarIntegration.ts | store demo, sem OAuth/sync real | backend OAuth e revogação | P2 | NÃO |
| 11 | White Label salvar/recarregar por agência | /settings/branding; src/features/settings/hooks/useAgencySettings.ts | defaults agency-001/roles fixas e fallback demo; isolamento e persistência não provados | Auth + chave cache tenant + RLS + usuário A/B | P1 | NÃO |
| 12–14.1 | release gate/schema/Cloudflare | public/_redirects; supabase/migrations; .github/workflows/ci.yml | routing local corrigido; produção/histórico/schema ainda bloqueados | staging homologado e autorização posterior | P1 | NÃO |

O motor editorial determinístico é previsto no prompt 07; ausência de chamada IA não é defeito por si só. Não foi ampliado o produto para outro escopo.

## Inventário dos treze módulos

Dashboard PARTIAL; Auth MISSING; CRM PARTIAL; Projetos PARTIAL; Squads PARTIAL; Briefings PARTIAL; Estratégias PARTIAL; Propostas PARTIAL; Drive PLACEHOLDER na conexão OAuth; Apresentações PARTIAL; Reuniões PARTIAL; Chat PLACEHOLDER no envio persistente; White Label PARTIAL. Aceite real de banco/segurança BLOCKED em todos. Nenhum módulo declarado IMPLEMENTED_AND_TESTED de ponta a ponta. Pure functions cobertas por Vitest não elevam automaticamente o status do módulo.
