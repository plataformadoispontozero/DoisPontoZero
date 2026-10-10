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
