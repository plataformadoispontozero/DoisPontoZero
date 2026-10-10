# Dois.Zero | Creative Agency OS
# Auditoria de Integridade e Modelagem de Banco de Dados (Database Audit)

**Data de Auditoria:** 10 de Outubro de 2026  
**Banco de Dados:** PostgreSQL 15+ (Supabase)  
**Projeto:** `pvkhlobsiszrjtblpruu` (`https://pvkhlobsiszrjtblpruu.supabase.co`)  
**Total de Migrações Versionadas:** 9 migrations (`20261010000001` a `20261010000009`)  

---

## 1. Inventário de Migrações Auditadas

| Ordem | Arquivo de Migração | Escopo de Domínio | Tabelas Criadas | RPCs / Funções | Políticas RLS |
|---|---|---|---|---|---|
| 01 | `20261010000001_phase02_schema_and_rls.sql` | Auth, Agências, Membros, Roles | 6 tabelas | 3 funções | 12 policies |
| 02 | `20261010000002_phase04_projects_tasks.sql` | Clientes, Projetos, Kanban, Tarefas | 14 tabelas | 4 funções / RPCs | 28 policies |
| 03 | `20261010000003_phase05_squads.sql` | Squads, Metas, Performance | 5 tabelas | 2 RPCs | 10 policies |
| 04 | `20261010000004_phase06_briefings.sql` | Templates, Briefings, Respostas | 10 tabelas | 2 RPCs públicas | 20 policies |
| 05 | `20261010000005_phase07_strategy.sql` | Estratégia, Pilares, Calendário | 6 tabelas | 2 RPCs | 12 policies |
| 06 | `20261010000006_phase08_proposals.sql` | Propostas, Serviços, Itens, Preços | 11 tabelas | 2 RPCs públicas | 22 policies |
| 07 | `20261010000007_phase09_drive_presentations.sql`| Google Drive, Decks, Showcases | 11 tabelas | 1 RPC pública | 22 policies |
| 08 | `20261010000008_phase10_meetings_chat.sql` | Reuniões, Pautas, Atas, Chat, DMs | 18 tabelas | 2 RPCs | 36 policies |
| 09 | `20261010000009_phase11_whitelabel.sql` | White Label, Branding, Auditoria | 5 tabelas | 1 RPC pública | 10 policies |

---

## 2. Análise de Integridade Referencial & Chaves Estrangeiras

1. **Isolamento de Tenant Obrigatório (`agency_id`):**
   - Todas as entidades privadas (`projects`, `clients`, `squads`, `briefings`, `proposals`, `meetings`, `chat_channels`, `agency_branding`) contêm obrigatoriamente a coluna `agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE`.
   - Evita criação de registros desvinculados ou órfãos sem tenant responsável.

2. **Integridade de Deleção em Cascata:**
   - Tarefas (`tasks`) referenciam colunas e projetos com `ON DELETE CASCADE`.
   - Itens de checklist e comentários vinculam-se à tarefa com integridade restrita.
   - Respostas de briefing e seções de apresentação dependem estritamente do registro pai.

3. **Restrições de Unicidade (Unique Constraints):**
   - `agency_members(agency_id, user_id)`: Um usuário não pode ser duplicado na mesma agência.
   - `chat_conversation_members(conversation_id, user_id)`: Previne duplicação de membros em conversas diretas.
   - `briefing_public_tokens(token_hash)`: Garante que tokens públicos de briefing sejam globalmente únicos.
   - `proposal_public_links(token_hash)`: Garante links comerciais únicos e criptograficamente protegidos.

4. **Índices de Performance Criados:**
   - Índices em `(agency_id, created_at DESC)` em todas as tabelas de listagem para otimização de paginação.
   - Índices em `(project_id, column_id, position)` para movimentação veloz no Kanban.
   - Índices em `(channel_id, created_at ASC)` para renderização sequencial de mensagens no Chat.

---

## 3. Auditoria de Funções SECURITY DEFINER & search_path

- **Boas Práticas Validadas:**
  - Todas as funções transacionais e triggers (`get_public_briefing`, `convert_action_item_to_task`, `get_public_agency_branding`) possuem definição estrita de `SET search_path = public` para mitigar ataques de search_path hijacking.
  - As RPCs públicas não recebem identificadores confidenciais diretamente, mas realizam lookup por hash SHA-256 (`token_hash`), sanitizando os dados retornados para remover metadados internos de agência.

---

## 4. Recomendações Pré-Deploy

- **Migrations Idempotentes:** Todas as migrações utilizam declarações seguras `CREATE TABLE IF NOT EXISTS` e `CREATE INDEX IF NOT EXISTS`.
- **Nenhuma Migração Destrutiva:** O schema não contém comandos `DROP TABLE`, `DROP COLUMN` ou `TRUNCATE` em migrations subsequentes, assegurando migrações forward-only sem perda de dados.
