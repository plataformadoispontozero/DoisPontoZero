# Dois.Zero | Creative Agency OS
# Auditoria de Arquitetura de Software (Architecture Audit)

**Data de Realização:** 10 de Outubro de 2026  
**Versão:** Release 0.2.0-rc1  
**Auditor:** Equipe Integrada de Engenharia (Principal Architect, Staff Full Stack, Security, DevOps)  
**Ambiente:** Staging & Pre-Production Readiness  

---

## 1. Visão Geral da Arquitetura

O **Dois.Zero** é estruturado como uma Single Page Application (SPA) moderna em React 19 + TypeScript, orquestrada via Vite 8 e estilizada com Tailwind CSS v4. A camada de dados e persistência adota uma arquitetura híbrida SaaS Multi-Tenant baseada no Supabase (PostgreSQL 15+, Auth, Storage, Realtime), com fallback determinístico local/demo para testes de interface desacoplados.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (SPA)                           │
│  React 19 + TypeScript 6 + Vite 8 + React Router 7 + Tailwind CSS v4   │
├────────────────────────────────┬───────────────────────────────────────┤
│    Camada de Apresentação      │ AppShell, Navigation, TopBar, Mobile  │
│    Design System Semântico     │ @/components/ui (17+ componentes)     │
│    Módulos de Domínio          │ @/features/* (12 módulos funcionais)  │
│    Camada de Estado / Cache    │ TanStack Query v5 + Context Providers │
│    Segurança & Acessibilidade  │ WCAG 2.2 AA (contrast.ts), ErrorBoundary│
└────────────────────────────────┴───────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND (MULTI-TENANT)                     │
├────────────────────────────────────────────────────────────────────────┤
│  Autenticação & Sessões        │ Supabase Auth (JWT, PKCE, Refresh)    │
│  PostgreSQL 15+ & RLS          │ 65+ tabelas, RLS estrita por agency_id│
│  Funções & RPCs Transacionais  │ 12+ RPCs com sanitização e tokens SHA │
│  Armazenamento de Mídia        │ Supabase Storage (Buckets Privados)   │
│  Comunicação Realtime          │ Supabase Realtime (Canais Postgres CDC│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Inventário de Dependências & Bibliotecas

| Biblioteca | Versão | Propósito | Avaliação de Risco |
|---|---|---|---|
| `react` / `react-dom` | `^19.2.8` | Core UI Framework | Baixo (Suporta concorrência e React Compiler) |
| `react-router-dom` | `^7.18.4` | Roteamento declarativo | Baixo (Suporta rotas aninhadas e outlets) |
| `@supabase/supabase-js`| `^2.117.3` | SDK PostgreSQL/Auth/Storage/Realtime | Baixo (Isolamento via RLS) |
| `@tanstack/react-query`| `^5.104.1` | Gerenciamento de cache e mutações | Baixo (Deduplicação e stale time otimizado) |
| `@dnd-kit/core` / `sortable` | `^6.3.1` | Drag & Drop para Kanban | Baixo (Acessível, performático, touch-first) |
| `@react-pdf/renderer` | `^4.9.0` | Geração de PDFs em tempo real | Médio (Pacote pesado, otimizado via lazy import) |
| `date-fns` | `^4.4.0` | Manipulação e formatação de datas | Baixo (Funções tree-shakable) |
| `lucide-react` | `^1.54.0` | Ícones consistentes | Baixo (Tree-shaking completo) |
| `tailwindcss` | `^4.3.3` | Motor de estilos com Vite plugin | Baixo (Zero runtime CSS) |
| `vitest` | `^4.1.11` | Suíte de testes automatizados | Baixo (Execução ultrarrápida com JSDOM) |
| `@playwright/test` | `^1.64.0` | Automação de testes End-to-End | Baixo (Desktop, Tablet, Mobile em paralelo) |

---

## 3. Mapeamento de Módulos e Responsabilidades (`src/features/`)

1. **`dashboard/`**: Visão executiva consolidada, métricas operacionais reais, atalhos rápidos e status de saúde do workspace.
2. **`clients/`**: CRM de Contas e Clientes, com abas integradas de Projetos, Briefings, Propostas, Apresentações, Drive e Reuniões.
3. **`projects/` & `tasks/`**: Gestão ágil de projetos criativos com Kanban dinâmico (`@dnd-kit`), visões Lista e Calendário, checklists e SLA.
4. **`squads/`**: Equipes multidisciplinares, metas trimestrais, pontuação e gamificação de performance.
5. **`briefing/`**: Construtor visual de formulários de briefing, geração de links públicos tokenizados e exportação para PDF editorial.
6. **`strategy/`**: Planejamento editorial, mapeamento de pilares de conteúdo, banco de ideias e gerador determinístico de pautas.
7. **`proposals/`**: Proposal Studio comercial com catálogo de serviços, motor de precificação em centavos inteiros e links públicos para clientes.
8. **`drive/`**: Conexão e gerenciamento de arquivos do Google Drive vinculados a clientes e projetos.
9. **`presentations/`**: Builder visual de decks e showcases criativos com exportação PDF e visualização web pública em `/showcase/:token`.
10. **`meetings/`**: Agendamento de reuniões, editor de pautas, ata colaborativa estruturada e conversão atômica de Action Items em tarefas.
11. **`chat/`**: Team Chat com canais públicos/privados, DMs, menções, reações e sincronização via Supabase Realtime.
12. **`settings/`**: White Label Studio com 12 submódulos (Branding, Permissões, Membros, Workspace, Documentos, Portais, Segurança, Diagnóstico).

---

## 4. Análise de Riscos Arquiteturais & Recomendações

1. **Tamanho do Bundle com `@react-pdf/renderer`:**
   - *Diagnóstico:* O pacote `@react-pdf/renderer` possui dependências de layout de fontes e yoga-layout que aumentam o tamanho do bundle inicial se importados estaticamente.
   - *Mitigação:* As rotas de exportação e download de PDF (`/presentations/:id/export`, `/proposals/:id`, `/briefings/:id`) utilizam isolamento de rotas e devem manter code-splitting para não penalizar o LCP do Dashboard.

2. **Diferenciação Estrita de Ambientes (Supabase Conectado vs Modo Demo):**
   - *Diagnóstico:* Telas poderiam presumir conexão apenas pela presença de variáveis de ambiente.
   - *Mitigação Implementada:* Criada a função `checkSupabaseHealth()` em `src/lib/supabase/client.ts` que executa ping de latência HTTP/PostgreSQL e expõe estado transparente de conectividade.

3. **Multi-Tenancy e Isolamento Rigoroso:**
   - *Diagnóstico:* Risco de vazamento de dados entre agências em consultas sem filtro explícito.
   - *Mitigação:* RLS (Row Level Security) ativada em 100% das tabelas criadas nas 9 migrations (`20261010000001` a `20261010000009`), com checagem obrigatória por `agency_id = (SELECT agency_id FROM agency_members WHERE user_id = auth.uid())`.
