# Fontes canônicas e contratos

| Domínio | Fonte atual | Evidência | Regra de preservação |
|---|---|---|---|
| Identidade e acesso | Supabase Auth, profiles, agency_members, roles, permissions | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/auth/AuthProvider.tsx:1-1` | Não transplantar login/roles legados |
| Clientes | clients / perfil atual; legado armazenado com identificação de origem | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/clients/clientProfile.ts:1-1` | IDs atuais são canônicos; nunca vincular só por nome ambíguo |
| Briefings | briefings / respostas / templates / versões | `atual@991ccac18b0d1f6de604745034508481d503fa6c:src/features/briefing/hooks/useBriefings.ts:1-1` | Preservar vínculo cliente e estrutura, não duplicar formularios |
| Planejamento mensal | monthly_editorial_campaigns.items/context + shares.snapshot + feedback | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:13-43` | Não criar segundo calendário; versionar somente via mecanismo compatível |
| Produção | projects/project_boards/tasks/assignees | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/migrations/20261011173520_monthly_editorial_workflow.sql:105-124` | Mesma engine e IDs de tarefas |
| Drive | google-workspace + arquivos originais Google e metadados locais | `atual@991ccac18b0d1f6de604745034508481d503fa6c:supabase/functions/google-workspace/index.ts:1-1` | Sem segundo OAuth ou binários no banco |

A plataforma também tem entidades editoriais de Strategy Studio e histórico legado. Antes de qualquer adoção, distinguir planejamento estratégico de campanha mensal, evitando um novo caminho paralelo. A comparação dos dados legados depende de acesso.
