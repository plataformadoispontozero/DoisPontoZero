> Fotografia histórica da auditoria 15.1. Correções posteriores de Auth/tenant/permissões e testes atuais estão em [RECOVERY_02_REPORT.md](RECOVERY_02_REPORT.md). Backend/RLS continuam bloqueados.

# ROUTE AUDIT

Data: 2026-10-11T04:27:41.438201+00:00. Base local: `1120f9088a159705e550097fd42c58683babc7dd`; branch `codex/master-audit-15-1`. Escopo: auditoria e correções locais. Nenhum push, merge, deploy, DNS ou escrita no Supabase remoto.

## Método e limites

Extração programática do AST de createBrowserRouter: **77 registros** (inclui layouts, index, aliases e fallback, não 77 funcionalidades independentes). Fonte e linhas estão em [route-inventory.json](evidence/route-inventory.json).

Quinze entradas principais tiveram renderização, reload, ausência de pageerror e overflow horizontal do documento testados em 1440x900, 768x1024 e 390x844. Isso não certifica modais, teclado, formulários internos, CRUD ou Kanban com dados reais. Rotas dinâmicas e portais públicos sem registros/tokens reais permanecem não executados. Nenhuma rota interna pode ser classificada WORKING de ponta a ponta enquanto autenticação, permissões e persistência não forem homologadas.

| Família esperada | Situação | Classificação |
|---|---|---|
| /dashboard, /calendar e módulos principais | renderização local testada; dados reais pendentes | PARTIAL |
| /agenda | alias recuperado para /calendar, testado | EQUIVALENT |
| /login, /forgot-password, /reset-password | ausentes; nenhum AuthProvider/guard real | MISSING |
| /clients/new, /clients/:clientId, /clients/:clientId/edit | há modal/Client Hub em /clients; não há URLs completas equivalentes | PARTIAL / MISSING navegação profunda |
| /squads/new, /squads/:squadId, /squads/ranking | criação modal e ranking em abas; não duplicar rotas sem necessidade | EQUIVALENT UI; backend BLOCKED |
| /strategy/:strategyId/calendar | calendário dentro do workspace | EQUIVALENT UI |
| /settings/branding | rota registrada com WhiteLabelStudioPage | PARTIAL |
| /drive/connections | rota registrada; OAuth real ausente | PARTIAL |
| /b/:publicToken, /p/:publicToken, /showcase/:publicToken | páginas existentes; sanitização/expiração/acesso não executados com tokens reais | BLOCKED aceite |
| fallback * | não comprova família ausente apenas por retornar HTML 200 | PARTIAL |

Acesso pela Sidebar não foi usado como inventário exclusivo. Botões que apenas mostram toast ou alteram memória estão na auditoria de gaps. O teste antigo selecionava uma sidebar oculta no mobile: seletor corrigido, sem mudar a interface. Não há quebra de renderização comprovada nas quinze entradas testadas. Isso não significa zero bugs funcionais.

## Inventário completo

| Rota | Linha no router | Classificação | Renderização |
|---|---:|---|---|
| `/b/:publicToken` | 59 | PARTIAL | NOT_RUN |
| `/p/:publicToken` | 63 | PARTIAL | NOT_RUN |
| `/showcase/:publicToken` | 67 | PARTIAL | NOT_RUN |
| `/` | 71 | PARTIAL | NOT_RUN |
| `/` | 75 | EQUIVALENT | NOT_RUN |
| `/dashboard` | 79 | PARTIAL | PASS rendering only; 3 viewports |
| `/agenda` | 83 | EQUIVALENT | NOT_RUN |
| `/calendar` | 87 | PARTIAL | PASS rendering only; 3 viewports |
| `/clients` | 91 | PARTIAL | PASS rendering only; 3 viewports |
| `/projects` | 95 | PARTIAL | PASS rendering only; 3 viewports |
| `/projects/new` | 99 | PARTIAL | NOT_RUN |
| `/projects/:projectId` | 103 | PARTIAL | NOT_RUN |
| `/projects/:projectId/settings` | 107 | PARTIAL | NOT_RUN |
| `/tasks` | 111 | PARTIAL | PASS rendering only; 3 viewports |
| `/tasks/:taskId` | 115 | PARTIAL | NOT_RUN |
| `/squads` | 119 | PARTIAL | PASS rendering only; 3 viewports |
| `/drive` | 123 | PARTIAL | PASS rendering only; 3 viewports |
| `/drive/connections` | 127 | PARTIAL | NOT_RUN |
| `/drive/clients/:clientId` | 131 | PARTIAL | NOT_RUN |
| `/briefings` | 135 | PARTIAL | PASS rendering only; 3 viewports |
| `/briefings/templates` | 139 | PARTIAL | NOT_RUN |
| `/briefings/templates/new` | 143 | PARTIAL | NOT_RUN |
| `/briefings/templates/:templateId/edit` | 147 | PARTIAL | NOT_RUN |
| `/briefings/new` | 151 | PARTIAL | NOT_RUN |
| `/briefings/:briefingId` | 155 | PARTIAL | NOT_RUN |
| `/briefings/:briefingId/responses` | 159 | PARTIAL | NOT_RUN |
| `/briefings/:briefingId/export` | 163 | PARTIAL | NOT_RUN |
| `/briefing` | 167 | EQUIVALENT | NOT_RUN |
| `/strategy` | 171 | PARTIAL | PASS rendering only; 3 viewports |
| `/strategy/new` | 175 | PARTIAL | NOT_RUN |
| `/strategy/:strategyId` | 179 | PARTIAL | NOT_RUN |
| `/proposals` | 183 | PARTIAL | PASS rendering only; 3 viewports |
| `/proposals/new` | 187 | PARTIAL | NOT_RUN |
| `/proposals/templates` | 191 | PARTIAL | NOT_RUN |
| `/proposals/templates/new` | 195 | PARTIAL | NOT_RUN |
| `/proposals/templates/:templateId/edit` | 199 | PARTIAL | NOT_RUN |
| `/proposals/services` | 203 | PARTIAL | NOT_RUN |
| `/proposals/:proposalId` | 207 | PARTIAL | NOT_RUN |
| `/proposals/:proposalId/edit` | 211 | PARTIAL | NOT_RUN |
| `/proposals/:proposalId/preview` | 215 | PARTIAL | NOT_RUN |
| `/proposals/:proposalId/versions` | 219 | PARTIAL | NOT_RUN |
| `/proposals/:proposalId/export` | 223 | PARTIAL | NOT_RUN |
| `/meetings` | 227 | PARTIAL | PASS rendering only; 3 viewports |
| `/meetings/new` | 231 | PARTIAL | NOT_RUN |
| `/meetings/:meetingId` | 235 | PARTIAL | NOT_RUN |
| `/meetings/:meetingId/edit` | 239 | PARTIAL | NOT_RUN |
| `/meetings/:meetingId/agenda` | 243 | PARTIAL | NOT_RUN |
| `/meetings/:meetingId/minutes` | 247 | PARTIAL | NOT_RUN |
| `/meetings/:meetingId/actions` | 251 | PARTIAL | NOT_RUN |
| `/chat` | 255 | PARTIAL | PASS rendering only; 3 viewports |
| `/chat/channels/:channelId` | 259 | PARTIAL | NOT_RUN |
| `/chat/direct/:conversationId` | 263 | PARTIAL | NOT_RUN |
| `/chat/settings` | 267 | PARTIAL | NOT_RUN |
| `/notifications` | 271 | PARTIAL | PASS rendering only; 3 viewports |
| `/settings/integrations/calendar` | 275 | PARTIAL | NOT_RUN |
| `/presentations` | 279 | PARTIAL | PASS rendering only; 3 viewports |
| `/presentations/new` | 283 | PARTIAL | NOT_RUN |
| `/presentations/:presentationId` | 287 | PARTIAL | NOT_RUN |
| `/presentations/:presentationId/edit` | 291 | PARTIAL | NOT_RUN |
| `/presentations/:presentationId/preview` | 295 | PARTIAL | NOT_RUN |
| `/presentations/:presentationId/versions` | 299 | PARTIAL | NOT_RUN |
| `/presentations/:presentationId/export` | 303 | PARTIAL | NOT_RUN |
| `/settings` | 307 | PARTIAL | PASS rendering only; 3 viewports |
| `/settings` | 311 | PARTIAL | PASS rendering only; 3 viewports |
| `/settings/agency` | 315 | PARTIAL | NOT_RUN |
| `/settings/branding` | 319 | PARTIAL | NOT_RUN |
| `/settings/appearance` | 323 | PARTIAL | NOT_RUN |
| `/settings/team` | 327 | PARTIAL | NOT_RUN |
| `/settings/permissions` | 331 | PARTIAL | NOT_RUN |
| `/settings/workspace` | 335 | PARTIAL | NOT_RUN |
| `/settings/documents` | 339 | PARTIAL | NOT_RUN |
| `/settings/client-experience` | 343 | PARTIAL | NOT_RUN |
| `/settings/integrations` | 347 | PARTIAL | NOT_RUN |
| `/settings/security` | 351 | PARTIAL | NOT_RUN |
| `/settings/activity` | 355 | PARTIAL | NOT_RUN |
| `/settings/diagnostics` | 359 | PARTIAL | NOT_RUN |
| `/*` | 365 | EQUIVALENT | NOT_RUN |
