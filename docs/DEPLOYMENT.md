# Dois.Zero | Creative Agency OS
# Guia de Arquitetura e Procedimento de Deploy (Deployment Guide)

**Data de Elaboração:** 10 de Outubro de 2026  
**Versão Alvo:** Release 0.2.0-rc1  
**Plataforma Frontend Recomendada:** Vercel (Edge Network com SPA Routing)  
**Backend:** Supabase Managed Cloud (`pvkhlobsiszrjtblpruu`)  

---

## 1. Arquitetura de Hospedagem Recomendada

Como o **Dois.Zero** é construído com Vite + React 19 como uma Single Page Application, a melhor arquitetura de publicação combina:

1. **Frontend na Vercel (ou Cloudflare Pages / Netlify):**
   - Distribuição global via CDN Edge.
   - Suporte a compressão Brotli e Gzip.
   - Headers de segurança nativos configurados via `vercel.json`.
   - Roteamento SPA reescrito para `/index.html` em todas as rotas profundas (`/projects/:id`, `/briefings/:id`, etc.).

2. **Backend no Supabase:**
   - PostgreSQL hospedado com RLS ativado.
   - Auth com provedores de email/senha e OAuth.
   - Storage com buckets privados para mídias de agência.
   - Realtime para webhooks e mensageria no Team Chat.

---

## 2. Passo a Passo para Deploy em Produção (Quando Autorizado)

> [!IMPORTANT]
> **DEPLOY GATE:**
> O deploy para produção **NÃO** deve ser executado sem a aprovação explícita do usuário. As instruções abaixo descrevem a rotina para execução no momento autorizado.

### Passo 1: Preparação do Repositório Git
1. Verificar status da branch:
   ```bash
   git status
   git branch --show-current
   ```
2. Garantir que a branch `release/production-readiness` está com todas as alterações commitadas e testadas.

### Passo 2: Configuração das Variáveis no Provedor (Vercel)
Configurar as variáveis de ambiente na interface do provedor de hospedagem:
- `VITE_SUPABASE_URL`: `https://pvkhlobsiszrjtblpruu.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `[CHAVE_ANON_DO_PROJETO_SUPABASE]`
- `VITE_WORKSPACE_NAME`: `"Matriz Criativa"`
- `VITE_APP_ENV`: `"production"`
- `VITE_APP_URL`: `"https://app.doiszero.com.br"`

### Passo 3: Execução do Build e Publicação
1. Executar verificação local:
   ```bash
   npm run build
   ```
2. Conectar o repositório GitHub ao projeto da Vercel ou utilizar Vercel CLI com autorização explícita:
   ```bash
   npx vercel --prod
   ```

### Passo 4: Validação Pós-Deploy (Smoke Tests)
1. Acessar a URL de produção publicada via HTTPS.
2. Testar carregamento do Dashboard `/dashboard`.
3. Testar navegação entre módulos (`/projects`, `/briefings`, `/settings`).
4. Validar indicador de conectividade em "Status do Workspace".
