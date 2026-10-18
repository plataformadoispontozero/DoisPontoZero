# TaskDetailPanel / attachments

Componente auxiliar alcançado por clientes/projetos, não uma rota independente.

| Funcionalidade | Legado com evidência | Atual com evidência | Situação atual | Decisão | Motivo | Risco | Critério de aceite |
|---|---|---|---|---|---|---|---|
| Aba `attachments` | NÃO VERIFICADO | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:87-87` | Controle presente, fluxo não exercitado agora | MANTER NOVO | Preservar componente usado pelas rotas atuais | Troca pode perder contexto cliente/tarefa | Refresh, autorização e ação persistida |
| Alternativa antiga | Acesso bloqueado | Contratos atuais abaixo | Comparação bloqueada | INVESTIGAR | Ganho não comprovado | Duplicar estado ou autorização | Fonte legada/SHA e evidência funcional |

## Rastro e contratos

- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:22-22` — `import {DemandProductionFiles} from '@/features/integrations/DemandProductionFiles'`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:84-84` — `const { data: realTask, isLoading, isError } = useTask(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:85-85` — `const { data: subtasks = [] } = useSubtasks(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:86-86` — `const { data: comments = [] } = useTaskComments(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:87-87` — `const { data: attachments = [] } = useTaskAttachments(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:88-88` — `const { data: links = [] } = useTaskLinks(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:89-89` — `const { data: activities = [] } = useTaskActivity(taskId ?? undefined)`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:91-91` — `const updateTask = useUpdateTask()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:92-92` — `const archiveTask = useArchiveTask()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:93-93` — `const toggleChecklistItem = useToggleChecklistItem()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:94-94` — `const createChecklist = useCreateChecklist()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:95-95` — `const addChecklistItem = useAddChecklistItem()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:96-96` — `const addComment = useAddComment()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:97-97` — `const deleteComment = useDeleteComment()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:98-98` — `const addLink = useAddLink()`
- `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/projects/components/TaskDetailPanel.tsx:101-101` — `const [title, setTitle] = useState('')`

São chamadas no componente, não prova de backend executado. Preservar os IDs de cliente/tarefa, permission gates, interfaces e Drive. Nenhuma edição aprovada. Rollback por PR/flag compatível sem excluir dados. Testes propostos: membro autorizado/negado, clienteA/B, erro, mobile, edição/refresh e arquivos privados. Estado: NÃO TESTADO nesta execução.
