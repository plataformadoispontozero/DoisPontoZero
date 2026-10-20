# MeetingWorkspacePage / actions

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Aba `actions` | NÃO VERIFICADO: repositório indisponível | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/meetings/MeetingWorkspacePage.tsx:51-51` | Controle/renderização presente; comportamento operacional NÃO TESTADO nesta execução | MANTER NOVO | Preservar a experiência existente até provar melhoria | Regressão por substituição integral | Validar ação→persistência→histórico e papéis |
| Adoção de alternativa | Sem evidência recuperada | Ver relatório [MeetingWorkspacePage](MeetingWorkspacePage.md) | Comparação bloqueada | INVESTIGAR | Decisão depende de acesso ao legado | Duplicar fonte canônica | Fonte antiga com SHA/linha, ganho mensurável e aprovação |

Os contratos e o rastro de hooks/persistência estão no relatório do módulo. Nenhuma mudança aprovada. Rollback futuro por card isolado; sem migração de dados agora.
