# Áreas operacionais de produção

Status: Done — push e deploy concluídos após autorização explícita em 2026-10-12.

Pedido: melhorar Design, Vídeo & Motion e Tráfego Pago além dos atalhos de calendário/tarefas.

- [x] Quadro por etapa e lista com dados reais, filtros e indicadores.
- [x] Detalhes e criação de demanda no próprio painel, preservando permissões e vínculos de projeto.
- [x] Orientações específicas por especialidade, sem inventar métricas ou integração de anúncios.
- [x] Typecheck, lint, testes e build.

Arquivos: src/features/production/{DepartmentPage.tsx,productionWorkspace.ts,productionWorkspace.test.ts}; src/features/projects/components/{CreateTaskDialog.tsx,TaskDetailPanel.tsx}; src/features/tasks/hooks/useTasks.ts; e2e/agency-access.spec.ts; docs/stories/production-workspaces.md.


O quadro compartilha as tarefas reais dos projetos; não há novo banco, dados demonstrativos em caso de falha, upload próprio ou métricas fictícias de mídia. A especialidade continua identificada pelo prefixo existente, aplicado automaticamente na criação e preservado nas edições por este painel. Vídeo mantém o identificador legado [Videomaker], com rótulo visual Vídeo & Motion.

A criação exige tasks.create e um projeto com quadro/etapas; edição exige tasks.edit. Consulta tem diálogo sem controles de alteração. Erros de API são mostrados como falha, não como fila vazia. As mutations existentes atualizam o cache do quadro e listas; a troca de coluna sincroniza status e data de conclusão. Não há drag-and-drop nesta entrega: a etapa é alterada nos detalhes da demanda.

Arquivo adicional: TaskDetailPanel.tsx. Evidências: test-results/production-1440.png, production-768.png, production-390.png. Testes de navegador usam API controlada; não são homologação de RLS nem criação em produção. Nenhuma migration ou dado remoto alterado nesta rodada. Publicação deste painel autorizada em 2026-10-12 e executada nesta revisão.

Resultado final: 115 testes Vitest em 28 arquivos e seis testes Playwright de produção em 1440×900, 768×1024 e 390×844 aprovados. Typecheck, lint (avisos preexistentes), build de produção e git diff --check aprovados. Cenários: filas por especialidade, filtro, criação vinculada ao projeto/agência, prefixo e status iniciais, troca para revisão, consulta sem criação e erro de backend sem demonstração. Capturas revisadas visualmente.

Observação do usuário: o escopo inclui Vídeo & Motion e Tráfego Pago. Tráfego ganha seção de Resultados dos clientes com estado explícito de integração Meta pendente. Código atual não possui OAuth, contas ou insights Meta; nenhuma métrica simulada ou alegação de conexão operacional. Os futuros dados precisam de sincronização e vínculo cliente/conta de anúncios, conforme CODEX_META_INTEGRATION.md e CODEX_PAID_TRAFFIC.md.


Publicação: código `675fcc9`, branch `codex/master-audit-15-1`; Worker `3f8c1741-7f21-468a-9f80-b4e8554a92c0`. Domínio https://doispontozero.renatodesigner.com.br confirmado com bundle `index-N-zwDQRS.js`. Em 1440×900 e 390×844, `/production/design`, `/production/video` e `/production/traffic` retornaram HTTP 200 e redirecionaram visitantes sem sessão ao login, sem overflow horizontal. Essa checagem não executou criação ou edição com usuário real em produção. Nenhuma migration, backend, DNS ou merge alterado nesta publicação.
