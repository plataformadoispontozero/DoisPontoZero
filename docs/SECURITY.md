# DOIS.ZERO — POLÍTICA & DIRETRIZES DE SEGURANÇA

## 1. Princípios de Segurança da Arquitetura

O **Dois.Zero Creative Agency OS** opera sobre uma arquitetura multi-tenant onde múltiplas agências compartilham a mesma infraestrutura de banco de dados PostgreSQL com rigoroso isolamento lógico.

---

## 2. Isolamento Multi-Tenancy (Row Level Security)

1. **Associação Obrigatória:** Toda tabela do sistema possui a coluna `agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE`.
2. **Políticas RLS Ativas:** Row Level Security está habilitado em 100% das tabelas do schema público.
3. **Funções Seguras de Verificação:**
   - `public.is_agency_member(agency_id)`: Valida se o usuário autenticado via Supabase Auth pertence à agência consultada.
   - `public.has_agency_permission(agency_id, permission_id)`: Valida granularmente se o usuário possui a permissão requerida no Permission Studio.

---

## 3. Segurança de Links Públicos & Tokens (Briefing Studio)

Em conformidade com os requisitos das Fases 02 e 06:

### 3.1 Geração e Armazenamento Criptográfico
- **Tokens Fortes:** Os links públicos utilizam tokens gerados por fontes criptograficamente seguras (`crypto.getRandomValues(new Uint8Array(24))`), resultando em 48 caracteres hexadecimais aleatórios.
- **Zero Plaintext no Banco:** O token em texto puro é entregue **uma única vez** ao usuário administrativo que o gerou. O banco de dados armazena **exclusivamente o hash SHA-256** (`token_hash`), impedindo a recuperação de tokens a partir de dumps de banco de dados.

### 3.2 Validação & Rate Limiting
- **Expiração:** Cada link pode possuir data de expiração (`expires_at`).
- **Revogação Imediata:** Links comprometidos podem ser revogados instantaneamente (`revoked_at = now()`).
- **Limite de Submissões:** A coluna `max_submissions` garante que o link seja desativado após o número estipulado de envios (`submission_count >= max_submissions`).

### 3.3 Acesso Público Restrito (RPCs com Security Definer)
- Não existem políticas RLS permissivas concedendo `SELECT` público sobre tabelas internas (`briefings`, `briefing_answers`, etc.).
- O acesso do cliente externo ocorre exclusivamente pelas procedures:
  - `public.get_public_briefing(p_token_hash)`: Retorna apenas o título, descrição, dados de branding da agência e as perguntas do questionário. Nenhuma resposta anterior ou dado de outro cliente é exposto.
  - `public.submit_public_briefing(p_token_hash, p_answers)`: Grava as respostas atomicamente, cria um snapshot de versão imutável e marca o link como utilizado.

---

## 4. Proteção de Dados & LGPD

- **Sanitização de Entradas:** Textos e valores são tipados e tratados como dados JSONB seguros, prevenindo injeções de código arbitrário.
- **Notas Internas Confidenciais:** Anotações da equipe criativa registradas em `briefing_activity` ou no modal interno **nunca são incluídas no modelo do PDF** exportado para clientes.
- **Storage Privado:** Anexos e arquivos enviados são direcionados a buckets privados do Supabase Storage, com URLs assinadas temporárias para download.

---

## 5. Segurança do Meeting Hub (Fase 10)

### 5.1 Isolamento de Reuniões
- Todas as tabelas `meetings`, `meeting_participants`, `meeting_agenda_items`, `meeting_minutes`, `meeting_decisions`, `meeting_action_items` e `meeting_activity` possuem RLS ativo com validação `agency_id` via `is_agency_member()`.
- Atas finalizadas (`status = 'finalized'`) são imutáveis; edições subsequentes geram nova versão.
- A conversão de Action Item em tarefa operacional ocorre pela RPC `convert_action_item_to_task()` com `SECURITY DEFINER` e `search_path = public`, garantindo atomicidade transacional.

### 5.2 Google Calendar
- Tokens OAuth sensíveis (refresh tokens) são armazenados exclusivamente no backend seguro, nunca expostos ao navegador.
- A tabela `calendar_connections` registra apenas `token_reference` (referência opaca), não o token em texto puro.
- Escopos solicitados são limitados ao mínimo necessário para leitura/escrita de eventos.

---

## 6. Segurança do Team Chat (Fase 10)

### 6.1 Isolamento de Canais e Conversas
- `chat_channels`, `chat_channel_members`, `chat_conversations`, `chat_conversation_members` possuem RLS estrito por `agency_id`.
- Canais privados exigem participação ativa (`chat_channel_members`) para SELECT e INSERT de mensagens.
- Conversas diretas (DMs) validam que ambos participantes pertencem à mesma agência.

### 6.2 Mensagens e Anexos
- `chat_messages` possui constraint `CHECK` garantindo que uma mensagem pertence a exatamente um canal OU uma conversa, nunca ambos.
- Unicidade por `(sender_id, channel_id/conversation_id, client_message_id)` impede duplicação por retry.
- Anexos (`chat_attachments`) são armazenados em buckets privados do Supabase Storage com URLs temporárias assinadas.
- Menções (`chat_mentions`) validam que o usuário mencionado tem acesso ao canal/conversa destino.

### 6.3 Notificações
- `notifications` possui RLS garantindo que apenas o `recipient_id` autenticado pode ler suas próprias notificações.
- Conteúdo de canais privados não é exposto em notificações visíveis a usuários sem acesso.

### 6.4 Supabase Realtime
- Subscriptions são criadas apenas para canais/conversas autorizados do usuário autenticado.
- Cleanup de subscriptions é executado ao desmontar componentes ou trocar de conversa.
- Nomes de canais Realtime não são usados como mecanismo de segurança; a autorização é validada pelo RLS no PostgreSQL.

