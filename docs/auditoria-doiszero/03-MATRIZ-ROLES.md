# Papéis e autorização

Fontes: `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/access.ts:30-65`, `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/ProtectedWorkspace.tsx:1-1`, `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:1-1`, `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:1-11`.

| Ator solicitado | Comprovação atual | Limite de evidência |
|---|---|---|
| Gestor/administrador | Autorizações de negócio por permissions; OWNER especial no helper editorial | Não equiparar rótulo a todas as permissões |
| Social | Papéis/permissions configuráveis; editorial usa strategy.* | Especialidade profissional não equivale a role de acesso |
| Designer/Vídeo/Tráfego | Entradas de produção e tarefas | Precisa testar acesso ao próprio cliente/demanda e transições |
| Cliente | Rotas públicas de tokens para aprovação/brief/proposta/showcase | Não criar login paralelo de cliente; token não abre catálogo inteiro |

Matriz real do legado e concessões atuais por usuário: **NÃO VERIFICADAS** nesta auditoria. Não ler segredos nem inventar que Designer já está impedido de operar Backlog.

Preflight P0: estabilizar trabalho de segurança pendente e comprovar negativas A/B. No HEAD há funções SECURITY DEFINER históricas que merecem conferência remota, por exemplo `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261010000003_phase05_squads.sql:233-258`. Existência do SQL antigo não prova o ACL remoto hoje. Nenhum RLS ou grant alterado.
