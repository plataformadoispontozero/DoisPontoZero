# Produção / Design

Rota real parametrizada `/production/design`: `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/app/router/index.tsx:99-99`; configuração `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/production/productionWorkspace.ts:3-3`.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Área profissional | NÃO VERIFICADO | Configuração e DepartmentPage | Presente em código; teste novo não executado | MANTER NOVO | Reutiliza engine de tasks atual | Duplicar Kanban ou integração | Receber somente demanda/cliente autorizado |
| Captação/Briefados/SLA | Sem fonte antiga | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/production/productionWorkspace.ts:36-36` | Requisitos a comparar com estados existentes | INVESTIGAR | Sem evidência antiga de melhoria | Mapeamento errado altera a operação | Definir gatilhos e validar com gestor antes de código |

Preservar tasks/projects, prefixos já consumidos, filtros e o conector atual. Tráfego usa ClientMetaPanel; Design/Vídeo usam ClientDrivePanel (DepartmentPage linhas331-332). Carteira de cliente não equivale a criação de demanda. Rastro completo no relatório [DepartmentPage](DepartmentPage.md). Nenhuma mudança de estados aprovada; migração de valores, se necessária, é trabalho separado.
