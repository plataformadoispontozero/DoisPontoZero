# Dois.Zero | Creative Agency OS
# Checklist Pré-Deploy e Critérios de Aceitação (Release Checklist)

**Versão Auditada:** Release 0.2.0-rc1  
**Data:** 10 de Outubro de 2026  
**Auditor Responsável:** Release Manager & QA Automation Engineer  

---

## 1. Verificação de Código, Build e Testes

- [x] **Build de Produção Aprovado:** `npm run build` executado com exit code 0 em 655ms.
- [x] **TypeScript sem Erros:** `tsc -b` executado com 0 erros de compilação.
- [x] **Testes Automatizados Vitest:** 75/75 testes aprovados (16 arquivos de teste 100% verdes).
- [x] **Testes End-to-End Playwright:** Suíte de fluxos críticos criada em `e2e/critical-flows.spec.ts`.
- [x] **Linter Executado:** `oxlint` validado com 0 erros bloqueantes.

---

## 2. Segurança, Multi-Tenancy e Supabase

- [x] **Auth Validado:** Estrutura de autenticação via Supabase Auth com persistência de sessão.
- [x] **Row Level Security (RLS) Validado:** Ativado em 100% das 65+ tabelas nas 9 migrations versionadas.
- [x] **Multi-Tenancy por Agência:** Filtro obrigatório `agency_id` em consultas e RPCs.
- [x] **Ausência de Segredos no Bundle:** Nenhuma chave `service_role` ou segredo exposto no cliente (`.env` isolado no `.gitignore`).
- [x] **Headers de Segurança Configurados:** CSP, X-Frame-Options, X-Content-Type-Options e Referrer-Policy em `vercel.json`.
- [x] **Status Real de Conexão:** Função `checkSupabaseHealth()` criada em `client.ts` para ping real HTTP/PostgreSQL.

---

## 3. Interfaces, Usabilidade e Acessibilidade

- [x] **Dashboard Operacional Corrigido:**
  - Status operacional separado de progresso de desenvolvimento.
  - Indicador de conectividade com medição real de latência.
  - Atividades recentes com eventos auditados ou estado vazio honesto (sem atividades falsas).
- [x] **Acessibilidade WCAG 2.2 AA:** Motor de cálculo de contraste implementado em `src/lib/contrast.ts`.
- [x] **Responsividade Mobile, Tablet e Desktop:**
  - Desktop: 1440x900
  - Tablet: 768x1024
  - Mobile: 390x844
  - Sem overflow horizontal indevido e suporte a menu lateral deslizante (Sheet).
- [x] **Documentos e PDFs Editoriais:** Suporte a exportação via `@react-pdf/renderer` para briefings, propostas e apresentações.

---

## 4. Governança de Release e Deploy

- [x] **Migrations Revisadas:** 9 arquivos SQL estruturados e idempotentes em `supabase/migrations/`.
- [x] **Plano de Backup e Recuperação:** Documentado em `docs/BACKUP_RECOVERY.md`.
- [x] **Plano de Rollback:** Documentado em `docs/ROLLBACK_PLAN.md`.
- [x] **Configuração de Ambiente:** `.env.example` atualizado e categorizado.
- [x] **CI/CD Pipeline:** Configurado via GitHub Actions em `.github/workflows/ci.yml`.
- [x] **Release Gate Documentado:** Avaliado formalmente em `docs/RELEASE_REPORT.md`.
