# ADOC-001 — Preparação editorial por etapas

Aprovação: usuário confirmou “Vamos fazer” para o primeiro piloto. A tela já possuía quatro etapas; esta entrega melhora progressão, validação e conferência, preservando motor, RPCs e identidade.

- [x] Validar cliente/mês, direção e volumes antes de avançar ou gerar.
- [x] Mostrar briefing, público, tom, posicionamento e temas na conferência.
- [x] Explicar que geração salva rascunho; não publica nem produz automaticamente.
- [x] Preservar edições ao voltar e limpar briefing ao iniciar outra campanha.
- [x] Testes da tela (5) e validação de etapas (5).
- [x] Typecheck e lint: concluídos; lint com avisos existentes.
- [ ] Suíte geral: iniciada, apresentou falhas em testes de banco de vários módulos e foi interrompida; não homologada.

Arquivos: MonthlyEditorialPage.tsx, editorialWizard.ts, editorialWizard.test.ts e esta story.

Sem mudança de schema, Auth, integração Google ou RPC. Não introduz aprovação interna como novo estado de banco. Rollback: reverter apenas os arquivos deste piloto; nenhum dado precisa ser removido.

Validação 14/10/2026: diff --check passou. Testes da tela cobrem troca de cliente, preservação de edições tardias, conferência de quantidades e bloqueio de salto sem direção. Logs gerais em /private/tmp/adoc-001-tests.log. Sem push/deploy neste piloto; homologação em navegador real pendente.
