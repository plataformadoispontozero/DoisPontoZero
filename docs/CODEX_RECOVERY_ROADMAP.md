> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# RECOVERY ROADMAP

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Ordem técnica

1. AuthProvider, login/logout Supabase, perfil e membership multiagência; modo demo explicitamente isolado do ambiente público; guards por sessão e permissão; limpar/segregar cache por tenant. Não iniciar outros módulos antes dessa base.
2. Obter acesso administrativo somente de leitura ao histórico e catálogo remoto, com canal seguro de credenciais. Registrar migration list, schema/RLS/grants/RPC/Storage/Realtime; comparar o remoto com os nove arquivos e hashes. Não usar migration repair para mascarar divergência.
3. Criar projeto Supabase separado de staging, sem dados de clientes. A documentação oficial permite ambientes separados: [Managing Environments](https://supabase.com/docs/guides/deployment/managing-environments). Configurar Auth redirect URLs locais/staging, buckets privados, Realtime e segredos server-side próprios. Sua criação/aplicação remota ainda depende de autorização.
4. Corrigir a cadeia em banco local descartável com Auth/Storage schemas disponíveis. Se versões históricas foram aplicadas, preservar seu conteúdo e produzir migrations incrementais com precondições; se não foram aplicadas, decidir baseline apenas após comparação documentada. Especificar rollback/backup e transações. Não editar cegamente histórico já aplicado. Testar bootstrap limpo e upgrade de snapshot sem dados reais. Nenhuma migration corretiva foi criada agora porque contrato remoto/histórico permanecem desconhecidos.
5. Após revisão e autorização para staging, aplicar migrations somente nesse projeto. Rodar testes reais multiagência/RLS e fluxos A–J. Corrigir CRM/projetos e conversões; depois briefing/strategy/proposals; depois Drive/Calendar/chat/meetings; por fim White Label persistente.
6. Resolver lazy loading PDF/páginas, paginação e performance medida; tornar lint/E2E e testes de backend gates reais. Corrigir manifesto a partir de evidência e não existência de arquivos.
7. Somente depois do aceite operacional preparar publicação Cloudflare no projeto existente, conferir branch/commit e variáveis; apresentar diff e pedir autorização final para push/merge/deploy separadamente. Nenhuma publicação automática.

## Plano seguro de migrations

Inventário read-only atual: 89 relações retornam 200 via PostgREST (limit=0). Isso contradiz a antiga conclusão de que todas as tabelas estavam ausentes. Não revela supabase_migrations.schema_migrations nem DDL completo. Antes de qualquer db push: backup verificado de schema/dados/Storage; comparar versões e hashes; catalogar drift; identificar pre/post condições, tenant, grants e contratos RPC; testar staging isolado; preparar rollback forward-only de alterações compatíveis; revisão humana da lista exata de scripts e destino. Não executar db reset, DROP, TRUNCATE ou apagar dados para resolver drift.

[Supabase migration list](https://supabase.com/docs/reference/cli/supabase-migration-list) lista histórico do projeto vinculado; usar somente após confirmar destino e acesso autorizado. CLI/admin indisponíveis neste ciclo. Não confundir REST público com acesso ao histórico.

## Critérios para retirar os bloqueadores

Login/logout real; rotas negadas sem sessão; dados privados negados entre A/B; tabela/RPC coerente e migrations comparadas; CRUD e reload persistente; tokens e arquivos protegidos; chat entregue entre duas sessões sem duplicação; integração OAuth revogável; PDFs verificados visualmente; build/unit/lint/E2E/backend aprovados em staging. O local continua utilizável para inspeção, sem certificação de produção.
