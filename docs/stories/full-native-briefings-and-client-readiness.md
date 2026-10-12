# Briefings completos e prontidão dos clientes

Status: In Progress

## Escopo autorizado
Migrar os 23 briefings e 554 versões históricas, completando os dados disponíveis dos 29 clientes. A origem permanece somente leitura. Vínculos utilizam IDs e mapeamento previamente confirmado, sem correspondência aproximada. A migração remove a exigência de revisão manual do dado importado, sem conceder aprovação do cliente ou ativar links públicos.

## Critérios de aceitação
- [ ] Importação idempotente dos 23 briefings, respostas e 554 históricos com igualdade JSON/datas e proveniência.
- [ ] Dados disponíveis de negócio, público, posicionamento, direção editorial e links preservados nos 29 clientes; ausências explicitadas.
- [ ] Calendário usa os dados atuais do cliente e permite geração/revisão sem dados fictícios em produção.
- [ ] Auditoria das rotas e contratos registra correções, testes com mocks e limitações de validação real.
- [ ] Gates de qualidade, migrações, ACL/advisors e publicação verificados.

## Plano de QA
Comparar contagens e snapshots na origem/destino; repetir importação para provar idempotência; conferir ACL anônima e tenant. Executar testes unitários/SQL e E2E desktop/tablet/mobile para briefing→calendário→editor de peça. Auditar seletores de clientes e refresh das rotas. Não executar uploads Google ou disparos de mensagens reais sem cenário legítimo.

## Achados iniciais
NewProposalPage e NewMeetingPage consultavam clientes com agency_id demo-agency em ambiente real; corrigidos para a agência autenticada. Validação automatizada pendente.

## Arquivos
- docs/stories/full-native-briefings-and-client-readiness.md
- src/features/proposals/NewProposalPage.tsx
- src/features/meetings/NewMeetingPage.tsx
