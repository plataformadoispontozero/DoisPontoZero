# Recuperação operacional — estado atual

11/10/2026. Branch codex/master-audit-15-1. Trabalho solicitado: fazer funcionar todas as áreas existentes. Estado geral: IN PROGRESS; não declarar plataforma integralmente funcional.

| Área | Evidência atual | Trabalho restante |
|---|---|---|
| Auth/agência | Login real OWNER e agência confirmados pelo usuário; guardas e troca de tenant testados localmente | Sessão/revogação/RLS negativa A/B integrada |
| Dashboard | Consultas reais e erro de destinatário de notificação corrigido e publicado | Progresso, definição final de métricas e aceite com dados reais |
| Agenda | Placeholder removido; reuniões pessoais e prazos atribuídos; dia/semana/mês, links e atualização | Teste integrado com reuniões/tarefas reais; OAuth separado |
| Clientes | Formulário, deep links e persistência via API testados em respostas controladas | CRM satélite, arquivos privados e CRUD integrado |
| Projetos/tarefas | Hooks reais, board e contexto recuperados | Reconciliar RPCs/constraints e testar criar/editar/atribuir/mover/recarregar |
| Squads | Consultas/mutations existentes | Metas, score/eventos e regras administrativas integradas |
| Briefings | Formulário/token/renderer existentes | Publicação real, expiração/revogação, snapshots e PDF privado |
| Estratégia | Editor e geração determinística existentes | Aprovação/exportação/transações do contrato remoto |
| Propostas | Draft real básico; itens e publicação bloqueados por contrato | Cálculo autoritativo, seções, aprovações e aceite público seguro |
| Reuniões | Leitura real; criação chama RPC pendente | RPC transacional, pauta/ata/decisões/actions persistentes |
| Chat | Texto/reação real implementados; canal público | Membership privado, anexos/Storage, Realtime integrado com duas contas |
| Apresentações | Leitura real; mutations ainda divergentes de UUID e store | Criação/edição composta, versões e token real |
| Configurações | Roles reais; leitura e upserts em hooks | Defaults da nova agência, convite seguro, RPC Permission Studio e teste administrativo |
| Drive/Calendar externo | Conexão explicitamente bloqueada em modo real | Backend OAuth, consentimento e credenciais Google, sincronização e revogação |

## Bloqueios concretos

Não há ferramenta de controle do navegador autenticado ou conexão administrativa Supabase nesta sessão. Não utilizar chave anon para operações administrativas. OpenAPI com chave pública retornou 401 e não permitiu inventário completo. Nove migrations locais não provam schema remoto: policies da migration 08 referenciam profiles.agency_id ausente no contrato inicial; aprovação/Storage/RPCs precisam ser revisados antes de migrations.

Consulta somente de metadados preparada em supabase/diagnostics/schema_operacional.sql. Deve ser executada por administrador no SQL Editor e ter seu resultado compartilhado para reconciliar colunas, constraints, funções/EXECUTE e policies (sem registros de clientes/usuários). A escolha de staging ou preparação manual do SQL no projeto atual foi solicitada ao usuário; não aplicar alterações automaticamente no banco existente.

## Primeiras correções

Agenda operacional implementada sem criar eventos fictícios nem esconder erros. Botão Novo Compromisso navega para o fluxo de reunião existente; esse fluxo ainda depende da RPC no backend, portanto não certifica agendamento real. Alertas globais identificam a área da consulta ativa que falhou e permitem tentar novamente; falhas antigas de consultas desmontadas não permanecem no alerta da página atual.

Testes controlados são separados de homologação Supabase. OAuth requer configuração externa e não pode ser certificado pelo build. Permissões/RLS nunca devem ser desativadas para fazer a interface funcionar.
