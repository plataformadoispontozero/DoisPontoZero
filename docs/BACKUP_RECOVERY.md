# Dois.Zero | Creative Agency OS
# Plano de Backup, Recuperação de Desastres e Integridade (Backup & Recovery)

**Data de Validação:** 10 de Outubro de 2026  
**Ambiente:** Supabase PostgreSQL (`pvkhlobsiszrjtblpruu`)  
**Responsável:** DevOps & Database Administrator (DBA)  

---

## 1. Estratégia de Backup por Camada

### 1.1 Banco de Dados Relacional (PostgreSQL)
1. **Backups Diários Automatizados (Supabase Managed):**
   - Retenção nativa conforme plano do projeto Supabase.
   - Snapshots automáticos executados na janela de menor tráfego (03:00 UTC).
2. **Backups Lógicos de Segurança (pg_dump):**
   - Rotina recomendada de exportação periódica de schema e dados em arquivo comprimido (`.dump` ou `.sql.gz`).
   - Armazenamento em bucket de backup criptografado fora da região primária do banco.

### 1.2 Arquivos e Mídia (Supabase Storage)
- Os arquivos armazenados em buckets privados (anexos do chat, avatares, logotipos de agência) devem possuir replicação ou snapshot periódico de storage.

---

## 2. Procedimento de Restauração (Disaster Recovery Plan)

> [!CAUTION]
> **REGRA CRÍTICA DE SEGURANÇA:**
> NUNCA execute testes de restauração diretamente sobre a instância de produção ativa. Testes devem ser conduzidos em banco de staging ou instância temporária isolada.

### Etapas de Restauração em Caso de Desastre:
1. **Declaração de Incidente:** Equipe SRE ativa o plano de contingência e coloca o frontend em modo de manutenção se necessário.
2. **Provisionamento do Ambiente de Recuperação:** Criação de instância de recuperação (Staging ou Réplica).
3. **Restauração do Snapshot mais Recente:**
   - Restauração a partir do último backup válido.
   - Aplicação sequencial de migrações pendentes (`20261010000001` a `20261010000009`).
4. **Verificação de Integridade (Smoke Test de Banco):**
   - Execução de queries de contagem (`SELECT COUNT(*) FROM agencies;`).
   - Validação de constraints de chave estrangeira.
   - Teste de login com conta de teste.
5. **Apontamento de Tráfego:** Troca das variáveis `VITE_SUPABASE_URL` no provedor de hosting (Vercel) e reinicialização.

---

## 3. RPO e RTO Alvos

- **RPO (Recovery Point Objective):** $\le$ 24 horas (ou menor com PITR habilitado).
- **RTO (Recovery Time Objective):** $\le$ 2 horas para restauração completa de ambiente.
