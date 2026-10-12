# Remover busca de briefings no Drive

Status: Ready for Review

Pedido: priorizar briefings nativos já importados, removendo a área de busca no Drive.

- [x] Remover painel de busca nas páginas de briefings, ficha e jornada do cliente.
- [x] Remover contexto do Drive na criação de calendário; manter briefing nativo e dados do cliente.
- [x] Preservar arquivos, metadados e integração de produção do Drive.
- [x] Validar lint, typecheck e testes.

Arquivos: BriefingPage.tsx, ClientWorkspacePage.tsx, ClientBriefingsTab.tsx, MonthlyEditorialPage.tsx.

Typecheck passou; ausência dos painéis confirmada nas quatro rotas. Gates completos ficam no relatório da auditoria desta entrega.

## Gates da retomada

- Suite completa: 73 arquivos, 302 testes passaram com um worker.
- Typecheck, lint e build passaram; avisos preexistentes de lint e tamanho de chunk permanecem.
- Testes SQL públicos adicionais e validação remota registrados em docs/AUDIT_RESUME_2026-10-13.md.
