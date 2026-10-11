# Campanhas mensais e áreas de produção

Status: Ready for release

- [x] Design, Videomaker e Tráfego Pago no menu; filas conectadas a tarefas reais.
- [x] Campanha por cliente, briefing, mês e quantidades editáveis de posts/reels/carrosséis.
- [x] Importação de objetivo/público/tom/posicionamento/restrições do briefing.
- [x] Planejamento por regras, editável antes do envio; não apresenta IA não configurada como funcional.
- [x] Link público com token aleatório, prazo, snapshot e revogação de versões anteriores.
- [x] Aprovação e sugestões de copy/observações separadas do conteúdo original.
- [x] Produção atômica/idempotente após aprovação, com projeto, quadro e tarefas por especialidade.
- [x] Schema e permissões homologados com ciclo remoto em transação revertida.
- [x] Testes finais de interface: 54 casos de agência + 21 casos públicos, desktop/tablet/mobile.
- [x] Release preparado para push/deploy do Worker existente.

Arquivos: src/features/editorial/\*, src/features/production/DepartmentPage.tsx, NavLinks.ts, router/index.tsx, auth/access.ts, migration monthly_editorial_workflow.
Clientes não precisam de login. Compartilhar um link concede acesso somente ao calendário daquela versão, sem dados privados do briefing. Revisão por token não identifica formalmente a pessoa; o destinatário deve manter o link privado.

Validação: 111 testes unitários; typecheck, lint e build aprovados (warnings preexistentes). Ciclo real no Supabase: sugestão de copy, aprovação, produção e idempotência; nenhum registro de teste persistido. SELECT privado negado para anon; token inválido rejeitado. Ordem de locks alinhada para reemissão/feedback concorrentes.

Limites: rascunhos por templates usam objetivo, público e posicionamento; tom/restrições importados ficam visíveis para revisão humana. Filas de especialidade usam prefixos de título documentados na interface; mídia paga é planejamento, sem publicação automática de anúncios.

Migrations: 20261011173520_monthly_editorial_workflow.sql; 20261011174125_editorial_review_lock_order.sql. Testes: monthlyPlanner.test.ts, Navigation.test.tsx, e2e/agency-access.spec.ts.

Uso: Calendário Editorial → cliente/briefing/mês → quantidades → gerar/revisar → salvar → gerar link. O cliente sugere copy/observações ou aprova. A agência aplica sugestões, salva/reemite a versão e, após aprovação, gera as demandas.
