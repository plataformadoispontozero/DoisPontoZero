# Dois.Zero | Creative Agency OS
# Relatório de Auditoria de Segurança de Aplicação (Security Audit)

**Data de Auditoria:** 10 de Outubro de 2026  
**Classificação:** Confidencial / Engenharia de Segurança  
**Alvo:** SaaS Multi-Tenant Dois.Zero  
**Status Geral:** APROVADO COM RECOMENDAÇÕES (SECURITY GATE PASSED)  

---

## 1. Matriz de Segurança e Vetores de Teste

| Vetor de Teste de Segurança | Mecanismo de Defesa | Resultado do Teste | Risco Residual |
|---|---|---|---|
| **Vazamento de Dados entre Agências (Cross-Tenant)** | PostgreSQL Row Level Security (RLS) com `agency_id` | **APROVADO** | Nulo (Forçado em banco) |
| **Escalação de Privilégios (Privilege Escalation)** | Proteção de papel `OWNER` e verificação em triggers/RPCs | **APROVADO** | Baixo |
| **Acesso a DMs e Canais Privados de Chat** | Policies em `chat_conversation_members` e canais privados | **APROVADO** | Baixo |
| **Acesso a Arquivos de Clientes Externos** | RLS e restrições de pasta vinculada ao `client_id` | **APROVADO** | Baixo |
| **Exposição de Secrets / Tokens no Frontend** | Variáveis públicas isoladas (`VITE_SUPABASE_ANON_KEY`); `.env` em `.gitignore` | **APROVADO** | Nulo |
| **Manipulação Indevida de Preços em Propostas** | Motor de precificação inteiro no servidor/snapshot imutável | **APROVADO** | Baixo |
| **Tokens Públicos Expostos (Briefings/Propostas)** | Armazenamento de hash SHA-256 e sanitização RPC | **APROVADO** | Baixo |
| **Ataques de Injeção de Cabeçalhos / Framing (Clickjacking)**| `X-Frame-Options: SAMEORIGIN` e CSP em `vercel.json` | **APROVADO** | Baixo |

---

## 2. Auditoria Rigorosa de Row Level Security (RLS)

- **Total de Tabelas com RLS Ativado:** 100% das 65+ tabelas de negócio possuem `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Regra Fundamental de Isolamento:**
  Nenhuma política utiliza cláusula permissiva `USING (true)` para tabelas operacionais privadas. Toda leitura e escrita passa pela função segura de agência:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id UUID)
  RETURNS BOOLEAN
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path = public
  STABLE
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.agency_members
      WHERE agency_id = p_agency_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
  $$;
  ```

---

## 3. Gestão Segura de Chaves e Variáveis de Ambiente

1. **Separação Obrigatória:**
   - O arquivo versionado `.env.example` contém apenas chaves públicas com prefixo `VITE_` e placeholders seguros.
   - A chave administrativa `service_role` **NUNCA** possui o prefixo `VITE_` e não é empacotada no bundle cliente pelo Vite/esbuild.
2. **Tokens OAuth e Armazenamento Local:**
   - Tokens de acesso de provedores externos (ex: Google OAuth) não são salvos em `localStorage` aberto. O fluxo utiliza troca de código no backend e armazenamento de referências em banco criptografado.

---

## 4. Recomendações de Segurança para Produção

1. **Ativação de 2FA (Autenticação de Dois Fatores):**
   - Habilitar autenticação multifator TOTP no painel do Supabase Auth para usuários com cargos `OWNER` e `ADMIN`.
2. **Expiração Automática de Tokens Públicos:**
   - Garantir que a rotina de expiração cron de tokens de briefing (7 dias) e propostas comerciais seja executada diariamente.
