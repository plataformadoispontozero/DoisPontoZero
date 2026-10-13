# Operação de Social Media
Status: Ready for Review
Pedido: criar a operação na nova plataforma usando os dados existentes.
- [x] Entrada no menu protegida por strategy.view.
- [x] Cliente/mês, contexto real e pipeline dos calendários.
- [x] Acesso ao briefing, estratégia, calendário e demandas.
- [x] Erros, estados vazios e responsividade.
- [x] Testes, lint, typecheck e build.
Sem importação Lovable, novas tabelas ou duplicação de calendários.

File list: src/features/social-media/SocialMediaPage.tsx, operations.ts, SocialMediaPage.test.tsx; src/app/router/index.tsx; src/features/auth/access.ts; src/components/navigation/NavLinks.ts; navigationConfig.ts; e2e/platform-readiness.spec.ts; esta story.
Verificação: 3 testes de operação, navegação/permissões existentes e 6 E2E controlados desktop/tablet/mobile passaram. Consulta real confirmada sem campanhas/demandas vinculadas; nenhum dado fictício gravado. Release pendente gate final.

## QA Results
Gates finais aprovados: lint, typecheck, build, 345 testes únicos e 9 E2E dos fluxos novos. Detalhes de revalidação e limites em `docs/qa/social-media-and-presentation-reviews-2026-10-13.md`. SQL remoto com rollback validado; nenhum dado de teste persistido.
