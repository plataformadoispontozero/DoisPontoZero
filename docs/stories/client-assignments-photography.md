# Atribuições por cliente e direção fotográfica

## Requisitos
- Aba Atribuições na ficha do cliente para Social Media, Design, Videomaker/Fotografia e Tráfego Pago.
- Vários membros por setor; profissionais escolhidos para o cliente recebem as novas demandas do setor.
- Fotografia ligada à copy: assunto, plano/ângulo, luz, fundo, regra dos terços e espaço negativo para texto.
- Orientação editável e persistente em demandas manuais e no calendário editorial.

## Checklist
- [x] Aba com escolha múltipla, cancelamento, consulta e tratamento de falha.
- [x] Gravação transacional e validação de cliente, agência, permissão e membros ativos.
- [x] Novas demandas herdam responsáveis; demandas existentes não são reatribuídas.
- [x] Direção fotográfica em post, carrossel e roteiro; opção de desativar para peças ilustradas.
- [x] Regra dos terços, assunto no lado oposto e área limpa configurável em quatro posições.
- [x] Testes de banco, geração e serialização; 427 testes de regressão.
- [x] SQL autenticado real com rollback: demanda recebe o responsável; teste não permanece.
- [x] Typecheck e lint sem erros (avisos preexistentes).
- [x] 12 cenários de navegador e build de produção.
- [ ] Publicação confirmada no domínio.
- [ ] Aceite operacional da equipe real.

## Arquivos
- src/features/clients/components/ClientAssignmentsTab.tsx
- src/features/clients/components/ClientHubModal.tsx
- src/features/clients/clientAssignments.database.test.ts
- supabase/migrations/20261014143610_client_department_assignments.sql
- src/features/production/photographicDirection.ts
- src/features/production/PhotographyDirectionFields.tsx
- src/features/production/photographicDirection.test.ts
- src/features/projects/components/CreateTaskDialog.tsx
- src/features/projects/components/creativeDemand.ts
- src/features/projects/components/parseDemandContent.ts
- src/features/editorial/EditorialPieceEditor.tsx
- src/features/editorial/campaignEngine.ts
- src/features/editorial/monthlyPlanner.ts
- e2e/aurora-workflow.spec.ts
- docs/RELEASE_STATUS.json
- docs/qa/client-assignments-photography-2026-10-14.md
- docs/stories/client-assignments-photography.md
