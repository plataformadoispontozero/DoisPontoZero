# DOIS.ZERO — FASE 04: Projects + Kanban + Task Management

## 1. Visão Geral

A Fase 04 do **Dois.Zero Creative Agency OS** implementa a infraestrutura completa de gestão de projetos criativos e fluxo de produção de entregáveis (Key Visual, Motion, Social Media, Copywriting, Design e Audiovisual).

A plataforma conta com:
- **Workspace de Projeto (`/projects/:projectId`)**: visualização multi-modo com abas sincronizadas (**Quadro Kanban**, **Lista**, **Calendário de Prazos**).
- **Quadro Kanban Interativo**: colunas com categorias de fluxo (`backlog`, `in_progress`, `review`, `done`), limites WIP opcionais, drag-and-drop persistente e otimista via `@dnd-kit`.
- **Painel de Detalhes da Tarefa (`TaskDetailPanel`)**: drawer lateral via `Sheet` com edição inline de título, descrição, prioridade, prazos com detecção de atraso (`overdue`), responsáveis, subtarefas e grupos de checklists com barra de progresso.
- **Tabs de Produção Colaborativa**:
  - **Chat & Comentários**: feed com autor, timestamp e exclusão.
  - **Links Externos**: categorização e detecção automática de ferramentas criativas (Figma, Google Drive, Canva, Frame.io, Loom, YouTube, Notion).
  - **Arquivos & Anexos**: visualização de arquivos criativos e tamanhos.
  - **Histórico & Auditoria**: trilha de atividade cronológica de alterações na tarefa.
- **Página Unificada de Tarefas (`/tasks`)**: visão geral de todas as tarefas da agência com métricas de produção, busca e filtros rápidos.
- **Criação de Projetos (`/projects/new`)**: fluxo com validação, definição de prioridade e cálculo de progresso.

---

## 2. Estrutura do Banco de Dados (Supabase PostgreSQL)

Migration: `supabase/migrations/20261010000002_phase04_projects_tasks.sql`

### Tabelas Criadas:
1. `clients` — Clientes da agência vinculados aos projetos.
2. `projects` — Entidade principal com status, prioridade, datas e proprietário.
3. `project_members` — Participação da equipe no projeto com papéis (`lead`, `member`, `reviewer`, `viewer`).
4. `project_boards` — Quadros vinculados ao projeto (suporta quadro padrão e futuros quadros secundários).
5. `board_columns` — Colunas do Kanban com categorias padronizadas e cores do design system.
6. `tasks` — Tarefas criativas com posicionamento numérico ordenável, prioridade e status.
7. `task_assignees` — Atribuição múltipla de responsáveis da equipe por tarefa.
8. `task_checklists` — Grupos de critérios de aceite e etapas de produção.
9. `task_checklist_items` — Itens acionáveis com status de conclusão e timestamp.
10. `task_comments` — Comunicação contextual por tarefa.
11. `task_attachments` — Referência a arquivos e assets criativos.
12. `task_links` — Links externos categorizados.
13. `task_activity` — Log de auditoria e linha do tempo de cada alteração.
14. `task_reviews` — Fluxo de revisão de qualidade criativa.

### Funções e Procedures (RPCs):
- `create_project_with_board`: Criação transacional de projeto com seu quadro e colunas padrão iniciais.
- `move_task`: Atualização atômica de coluna e posição no Kanban com registro automático em `task_activity`.
- `get_project_progress`: Cálculo consolidado em tempo real de percentual de conclusão e métricas por status.

### Segurança e RLS:
- Políticas de Row Level Security (RLS) habilitadas em todas as tabelas.
- Funções auxiliares `can_access_project()` e `can_access_task()` garantem isolamento multi-inquilino estrito entre agências.
- Novas chaves de permissão integradas à matriz de permissões da agência:
  - `tasks.comment`
  - `tasks.manage_checklists`
  - `tasks.move`
  - `tasks.review`
  - `projects.manage_boards`

---

## 3. Frontend & Componentes Criados

### Componentes de UI:
- `KanbanBoard` (`src/features/projects/components/KanbanBoard.tsx`): DndContext com PointerSensor e KeyboardSensor, drag otimista com rollback em caso de falha.
- `KanbanColumn` (`src/features/projects/components/KanbanColumn.tsx`): Zona droppable com cabeçalho, indicador de categoria e lista ordenável.
- `TaskCard` (`src/features/projects/components/TaskCard.tsx`): Card de tarefa interativo com prioridade, avatar stack, progresso de checklist e contadores.
- `TaskDetailPanel` (`src/features/projects/components/TaskDetailPanel.tsx`): Drawer lateral com edição rica, checklists, abas de chat, links, anexos e histórico.
- `TaskListView` (`src/features/projects/components/TaskListView.tsx`): Tabela responsiva com busca e filtros, adaptada para cartões empilhados no mobile.
- `TaskCalendarView` (`src/features/projects/components/TaskCalendarView.tsx`): Calendário mensal com navegação e mapeamento de entregas por dia.
- `CreateTaskDialog` (`src/features/projects/components/CreateTaskDialog.tsx`): Modal de criação rápida de tarefas.
- `Toast` (`src/components/ui/Toast.tsx`): Sistema de feedback visual montado no `AppProviders`.

### Páginas:
- `ProjectsPage` (`src/features/projects/ProjectsPage.tsx`): Lista e grid de projetos com filtros de status e busca.
- `NewProjectPage` (`src/features/projects/NewProjectPage.tsx`): Formulário de criação de projeto.
- `ProjectWorkspacePage` (`src/features/projects/ProjectWorkspacePage.tsx`): Workspace central com abas de Quadro, Lista e Calendário.
- `TasksPage` (`src/features/tasks/TasksPage.tsx`): Painel operacional de tarefas de toda a agência.

---

## 4. Testes e Qualidade

- **Build de Produção**: `npm run build` executado com **código de saída 0** (`tsc -b && vite build` concluído com sucesso).
- **Testes Unitários & Integração**: Vitest executado com **100% de aprovação (39 testes em 6 arquivos de teste)**.
- **Responsividade**: Layout otimizado para desktop (1440px), tablet (768px) e mobile (390px) com rolagem horizontal controlada e cartões empilhados.
