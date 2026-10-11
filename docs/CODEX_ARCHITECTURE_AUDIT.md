> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# ARCHITECTURE AUDIT

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Arquitetura encontrada

React 19, TypeScript 6, Vite 8, Tailwind 4, React Router 7, TanStack Query 5, Supabase JS 2, dnd-kit, react-pdf, Vitest e Playwright. As versões estão em package.json/package-lock.json. Componentes UI próprios em src/components/ui; não há prova de que todos sejam shadcn/ui.

`src/app/providers/AppProviders.tsx` compõe QueryClientProvider, BrandingProvider e ToastProvider. Cache padrão: staleTime 5 minutos, retry 1, sem refetch ao focar. Não existe AuthProvider nesse encadeamento. `src/app/router/index.tsx` importa páginas estaticamente e coloca módulos internos sob AppLayout sem guarda autenticada. Rotas públicas de tokens ficam fora desse layout.

| Camada | Implementação real | Limite encontrado |
|---|---|---|
| UI | src/components/ui, navigation, shared | Estados vazios descrevem escopo previsto; não comprovam implementação |
| Módulos | src/features/dashboard, clients, projects, tasks, squads, briefing, strategy, proposals, drive, presentations, meetings, chat, settings | Mistura queries remotas, stores demo e ações sem persistência |
| Domínio | src/types e src/lib/supabase/types.ts | Tipos não comprovam schema remoto |
| Dados | TanStack hooks, src/lib/supabase/client.ts | Falta contexto confiável de usuário/agência e segregação de cache validada |
| Banco | supabase/migrations, 9 arquivos | Histórico remoto indisponível; cadeia local incompatível em pontos críticos |
| PDF | @react-pdf/renderer, módulos briefing/proposals/presentations | Renderização existe; branding, permissão e export logs reais não homologados |
| Integrações | hooks Drive/Calendar/Chat | OAuth e persistência não comprovados; alguns writes usam memória |
| CI | .github/workflows/ci.yml | build/unit/typecheck; lint continue-on-error; sem E2E/backend obrigatório |

## Performance e ciclo de vida

Build real em docs/evidence/build-after.txt: chunk principal cerca de 1.08 MB e PDF 1.20 MB, antes de gzip. Há manualChunks em vite.config.ts, mas imports estáticos não equivalem a carregamento PDF somente por demanda. Não alterei o limite de warning (já 1200 kB). Não houve medição Lighthouse/Core Web Vitals; aprovação de desempenho BLOCKED. Priorizar lazy loading das páginas/exportações, consultas paginadas e chaves por agência/usuário após estabilizar autenticação. Chat possui removeChannel no cleanup; entrega e privacidade Realtime continuam sem teste com dois usuários.

## Dependências e regressão

npm ci executado com lockfile, auditoria do npm reportou zero vulnerabilidades no momento. Isso não certifica segurança da aplicação. Não foi adicionada dependência. Novos scripts lint/typecheck reutilizam ferramentas existentes. Não houve reconstrução do design system ou alteração das migrations históricas.
