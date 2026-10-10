# Dois.Zero | Creative Agency OS
# Procedimento e Plano de Rollback (Rollback Plan)

**Data de Validação:** 10 de Outubro de 2026  
**Versão Alvo:** Release 0.2.0-rc1  
**Responsável:** Release Manager & Site Reliability Engineer (SRE)  

---

## 1. Princípios de Reversão Segura

O plano de rollback do Dois.Zero foi projetado para restaurar a integridade operacional com risco zero de corrupção ou perda de dados de clientes.

### Diretriz Primária: Correções Forward-Only vs Rollback de Banco
- **Frontend / Hosting:** Rollback instantâneo via provedor de CDN (Vercel permite reativar o deployment anterior em 1 clique).
- **Banco de Dados (PostgreSQL):** O rollback de migrations que já receberam dados de produção oferece alto risco de perda de integridade referencial. O padrão adotado é **Forward-Only**, aplicando migrations incrementais corretivas (`hotfix`) em vez de executar `DROP TABLE` destrutivo.

---

## 2. Matriz de Versões e Pontos de Restauração

| Componente | Versão Atual (Release) | Ponto de Restauração Anterior | Mecanismo de Rollback |
|---|---|---|---|
| **Frontend Code** | Branch `release/production-readiness` | Commit `b6095ba` na branch `principal` | Reversão de commit / Re-deploy Vercel |
| **Vite Bundle** | Build com 12 módulos ativos | Build anterior (Fase 10) | Re-apontamento de domínio de produção |
| **Supabase Migrations**| Migrations 01 a 09 | Migrations 01 a 08 (Fase 10) | Migration forward-only de compatibilidade |
| **Variáveis de Ambiente**| `.env` atualizado com health check | Snapshot de configuração prévio | Reversão de variáveis no painel Vercel |

---

## 3. Roteiro Passo a Passo de Rollback de Emergência

### Cenário A: Falha Crítica no Frontend Após Publicação (P0)
1. **Ação Imediata no Provedor:** Acessar o dashboard da Vercel > Projeto `dois-zero` > *Deployments*.
2. **Ativação da Versão Anterior:** Localizar a última release estável aprovada e clicar em *Promote to Production*.
3. **Tempo Estimado de Propagação:** $\le$ 30 segundos em toda a rede CDN.
4. **Comunicação:** Atualizar o canal de status de engenharia e emitir alerta para os administradores de agência.

### Cenário B: Inconsistência de Schema ou RLS no Supabase
1. **Preservação de Dados:** Executar `pg_dump` imediato da base de dados antes de qualquer alteração de schema.
2. **Aplicação de Hotfix:** Gerar nova migration com prefixo temporal (ex: `20261010000010_hotfix_rls.sql`) corrigindo a policy específica sem remover colunas ou tabelas.
3. **Execução Controlada:** Aplicar via Supabase CLI em ambiente de staging antes de promover para a instância principal.
