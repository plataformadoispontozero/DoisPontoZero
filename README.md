# Dois.Zero | Creative Agency OS
> **Sua agência. Tudo conectado.**

Sistema operacional **White Label** para agências de marketing, design, social media, motion design, audiovisual e publicidade.

---

## ⚡ Stack Tecnológica

- **Frontend:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler:** [Vite 8.3](https://vite.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Design System:** Design System customizado B2B SaaS (17 componentes modulares e consistentes)
- **Roteamento:** [React Router DOM v7](https://reactrouter.com/)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Camada de Dados:** Camada desacoplada `useDashboardData` + [TanStack Query v5](https://tanstack.com/query)
- **Testes Unitários & Integração:** [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)
- **Testes E2E:** [Playwright](https://playwright.dev/)

---

## 🎨 Identidade Visual (Fase 01 - Creative Tech Premium)

- **Background:** `#101014`
- **Surface:** `#1C1C24`
- **Surface Elevated:** `#252530`
- **Border:** `#30303B`
- **Primary:** `#7952FF`
- **Accent:** `#B8FF65`
- **Text Primary:** `#F8F9FC`
- **Text Secondary:** `#A1A1B0`
- **Success:** `#34D399` | **Warning:** `#FBBF24` | **Error:** `#FB7185`
- **Tipografia:** Space Grotesk (Títulos) & Inter (Interface e Textos)

> 💡 **White Label Ready:** Todos os componentes consom a configuração central em `src/config/branding.ts` através do provider `BrandingProvider` e do hook `useBranding()`. O nome da marca, cores e logotipos não estão fixados diretamente no layout.

---

## 🧩 Componentes do Design System (`src/components/ui/`)

1. **Button** (com loading state e variantes de cor)
2. **IconButton** (com `aria-label` obrigatório)
3. **Card** (Header, Title, Description, Content, Footer)
4. **Badge** (variantes semânticas)
5. **Avatar** (com iniciais e indicador de status)
6. **Input** (com slots para ícones à esquerda/direita)
7. **Textarea** (com redimensionamento e foco)
8. **Select** (nativo estilizado com chevron)
9. **Dropdown** (menu flutuante acessível)
10. **Tooltip** (posicionamento inteligente)
11. **Tabs** (Tabs, TabsList, TabsTrigger, TabsContent)
12. **Dialog** (modal acessível com backdrop blur)
13. **Sheet** (drawer lateral para mobile e slide-overs)
14. **Skeleton** (loaders estruturados)
15. **EmptyState** (estados vazios honestos e elegantes)
16. **PageHeader** (cabeçalho de página com breadcrumb e ações)
17. **SectionHeader** (cabeçalhos de seção compactos)
18. **StatusIndicator** (indicadores com status e ping opcional)
19. **FeedbackStates** (LoadingState, ErrorState, SuccessState)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js >= 20
- npm >= 10

### Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 5173 na rede local)
npm run dev -- --host 0.0.0.0

# Executar suíte de testes (Vitest)
npm test

# Executar build de produção
npm run build

# Visualizar bundle de produção
npm run preview
```

---

## 📋 Módulos Ativos (13 Rotas Funcionais)

| Rota | Módulo | Descrição |
| :--- | :--- | :--- |
| `/dashboard` | **Visão Geral** | Painel operacional com indicadores, prioridades e timeline |
| `/calendar` | **Minha Agenda** | Cronograma pessoal, reuniões e deadlines do dia |
| `/clients` | **Clientes** | Gestão de marcas, contatos e contas ativas |
| `/projects` | **Projetos** | Workflows criativos, kanban e entregas |
| `/tasks` | **Tarefas** | Fila de produção criativa e checklists técnicos |
| `/squads` | **Squads** | Equipes multidisciplinares e capacidade de horas |
| `/briefings` | **Briefing Studio** | Biblioteca de modelos, Form Builder visual e PDF Studio editorial |
| `/briefings/templates` | **Modelos de Briefing** | Templates oficiais versionados para branding, social, motion, etc. |
| `/b/:publicToken` | **Formulário Público** | Preenchimento seguro mobile-first para clientes sem login |
| `/strategy` | **Estratégia** | Strategy Studio, diagnósticos, pilares e gerador editorial |
| `/proposals` | **Propostas** | Proposal Studio, motor de precificação e aprovações públicas |
| `/drive` | **Google Drive** | Navegador de arquivos sincronizados e autorizados |
| `/drive/connections` | **Conexões Drive** | Gerenciador OAuth 2.0 de contas e escopos autorizados |
| `/presentations` | **Apresentações** | Presentation Studio, decks de defesa criativa, showcases e PDFs |
| `/showcase/:publicToken` | **Showcase Público** | Visualização pública responsiva e tokenizada para clientes |
| `/meetings` | **Meeting Hub** | Dashboard de reuniões, agendamento, pautas, atas versionadas, decisões e ações |
| `/meetings/new` | **Nova Reunião** | Formulário de agendamento com participantes, local e link de conferência |
| `/meetings/:meetingId` | **Workspace da Reunião** | 5 abas: Visão Geral, Pauta, Ata, Decisões, Ações (com conversão Kanban) |
| `/chat` | **Team Chat** | Canais (geral, squad, projeto, custom), DMs e Realtime |
| `/chat/settings` | **Configurações do Chat** | Gerenciamento de canais, membros e preferências de notificação |
| `/notifications` | **Central de Notificações** | Todas as notificações com leitura individual e em lote |
| `/settings/integrations/calendar` | **Google Calendar** | Conexão OAuth para sincronização de reuniões |
| `/settings` | **Configurações** | Parâmetros de sistema e White Label da agência |

---

## 📄 Documentação Técnica
- [Status Geral de Implementação (`docs/IMPLEMENTATION_STATUS.md`)](docs/IMPLEMENTATION_STATUS.md)
- [Briefing Studio Architecture (`docs/BRIEFING_STUDIO.md`)](docs/BRIEFING_STUDIO.md)
- [PDF Studio & Editorial Generation (`docs/PDF_GENERATION.md`)](docs/PDF_GENERATION.md)
- [Google Drive API & OAuth Setup (`docs/GOOGLE_DRIVE_SETUP.md`)](docs/GOOGLE_DRIVE_SETUP.md)
- [Google Drive Integration Architecture (`docs/GOOGLE_DRIVE_INTEGRATION.md`)](docs/GOOGLE_DRIVE_INTEGRATION.md)
- [Presentation Studio & Decks (`docs/PRESENTATION_STUDIO.md`)](docs/PRESENTATION_STUDIO.md)
- [Presentation Security & Public Links (`docs/PRESENTATION_SECURITY.md`)](docs/PRESENTATION_SECURITY.md)
- [Meeting Hub (`docs/MEETING_HUB.md`)](docs/MEETING_HUB.md)
- [Team Chat (`docs/TEAM_CHAT.md`)](docs/TEAM_CHAT.md)
- [Realtime Architecture (`docs/REALTIME_ARCHITECTURE.md`)](docs/REALTIME_ARCHITECTURE.md)
- [Calendar Integration (`docs/CALENDAR_INTEGRATION.md`)](docs/CALENDAR_INTEGRATION.md)
- [Diretrizes de Segurança & RLS (`docs/SECURITY.md`)](docs/SECURITY.md)
- [Schema de Banco de Dados PostgreSQL (`docs/DATABASE.md`)](docs/DATABASE.md)
- [Phase Status (`docs/PHASE_STATUS.json`)](docs/PHASE_STATUS.json)

