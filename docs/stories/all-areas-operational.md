# Recuperação operacional de todas as áreas

Status: In Progress. Pedido do usuário em 11/10/2026. Preservar autenticação e isolamento; sem fixtures para mascarar falhas. Autorização anterior de push/publicação mantida. Correções de migrations/dados existentes exigem ambiente e autorização específicos.

- [x] Inventário inicial: agenda placeholder; persistência composta de reuniões/propostas bloqueada; integração Drive/Calendar OAuth sem backend; Permission Studio sem RPC homologada; apresentações ainda com mutations demonstrativas.
- [x] Agenda substituída por consulta de reuniões do usuário e tarefas atribuídas, filtros dia/semana/mês e links operacionais.
- [x] Regressões e publicação da primeira correção.
- [ ] Reconciliar schema e políticas remotas com staging autorizado.
- [ ] Homologar CRM/projetos/tarefas/squads/briefing/estratégia/propostas/reuniões/chat/apresentações/configurações.
- [ ] OAuth, Storage privado e fluxos públicos verificados com credenciais de integração apropriadas.

Arquivos: src/app/layouts/AppLayout.tsx, src/features/calendar/CalendarPage.tsx, src/features/calendar/useAgenda.ts, src/features/calendar/calendar.test.ts, e2e/agency-access.spec.ts, docs/stories/all-areas-operational.md e docs/ALL_AREAS_OPERATIONAL_STATUS.md.

Limites: sem conexão administrativa Supabase e sem controle do navegador autenticado. OpenAPI remoto retornou 401 com chave pública; inventário de funções/constraints/policies depende de exportação administrativa somente leitura. Dados reais do usuário não foram lidos nos testes controlados. Não declarar todos os módulos funcionais antes do aceite integrado.

Verificação inicial: build/typecheck/lint PASS (lint com avisos), 84 testes unitários PASS; 6 E2E de agenda/erro PASS em desktop/tablet/mobile. Não equivale à homologação integrada das demais áreas.

Primeira correção publicada: commit 9837aa8; Cloudflare versão 69c67d85-ed1f-45b4-a9d4-b22e6d972327; domínio /calendar HTTP 200 e bundle atualizado. Contratos de agenda verificados com limit=0: meetings e tasks, incluindo relações utilizadas, HTTP 200. Nenhum registro lido. Diagnóstico persistido em supabase/diagnostics/schema_operacional.sql, fora de migrations.
