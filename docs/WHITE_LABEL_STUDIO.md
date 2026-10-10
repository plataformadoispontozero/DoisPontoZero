# White Label Studio & Advanced Settings

## Visão Geral

A **Fase 11** implementa o módulo de personalização completa da plataforma, permitindo que cada agência customize 100% da identidade visual, tipografia, cores, branding de documentos e experiência dos portais públicos.

## Arquitetura

### Migration PostgreSQL

**Arquivo:** `supabase/migrations/20261010000009_phase11_whitelabel.sql`

| Tabela | Descrição |
|--------|-----------|
| `agency_branding` | Cores, logotipos, tipografia, nome customizado |
| `agency_preferences` | Timezone, idioma, moeda, formato de data |
| `agency_document_settings` | Templates de documentos (PDFs, propostas) |
| `agency_portal_settings` | Configurações de portais públicos (briefings, propostas, showcases) |
| `agency_settings_history` | Auditoria de todas as alterações com snapshot JSON |

### Row Level Security (RLS)

- Todas as 5 tabelas possuem políticas RLS com isolamento por `agency_id`
- RPC `get_public_agency_branding(p_agency_id UUID)` para acesso seguro em portais públicos
- Coluna `changed_by` em `agency_settings_history` para rastreabilidade

### Tipagem de Domínio

**Arquivo:** `src/types/whitelabel.ts`

```typescript
interface AgencyBrandingData {
  agency_name: string
  logo_url: string
  logo_dark_url: string
  favicon_url: string
  primary_color: string      // HEX
  secondary_color: string
  accent_color: string
  background_color: string
  surface_color: string
  text_color: string
  heading_font: string       // Google Fonts
  body_font: string
  border_radius: 'sm' | 'md' | 'lg' | 'xl'
}
```

## Acessibilidade (WCAG 2.2 AA)

**Arquivo:** `src/lib/contrast.ts`

- Cálculo de razão de contraste conforme WCAG 2.2
- Validação automática para texto normal (≥ 4.5:1) e texto grande (≥ 3:1)
- Integração em tempo real no White Label Studio
- Alertas visuais quando o contraste não atende aos critérios AA

## Componentes do Frontend

### Settings Overview (`/settings`)
Painel central com 12 módulos de configuração em cards navegáveis:

1. **White Label Studio** — Identidade visual completa
2. **Dados da Agência** — Informações legais e fiscais
3. **Aparência** — Tema claro/escuro e atalhos
4. **Gestão de Equipe** — Membros, convites, cargos
5. **Permission Studio** — Matriz de controle de acesso
6. **Workspace** — Preferências de workspace
7. **Documentos** — Branding de PDFs e propostas
8. **Experiência do Cliente** — Portais públicos
9. **Integrações** — Google Drive, Calendar, APIs
10. **Segurança** — 2FA, sessões, auditoria
11. **Atividade** — Log de alterações
12. **Diagnóstico** — Status técnico e manifesto

### White Label Studio (`/settings/white-label`)
- Editor de cores com validação de contraste em tempo real
- Seletor de fontes Google Fonts (Inter, Outfit, Poppins, etc.)
- Upload de logotipos (claro e escuro)
- Preview em tempo real via `BrandPreview` component
- Preview mobile via Sheet lateral

### Team Management (`/settings/team`)
- Lista de membros ativos com avatares e badges de cargo
- Seletor de cargo com proteção de OWNER
- Modal de convite com hash seguro de 7 dias
- Seção de convites pendentes com revogação

### Permission Studio (`/settings/permissions`)
- Matriz visual de permissões (Roles × Módulos)
- 5 roles padrão: OWNER, ADMIN, MANAGER, MEMBER, VIEWER
- Toggle interativo por permissão com proteção de OWNER
- 15+ módulos do sistema mapeados

### Diagnostics (`/settings/diagnostics`)
- Manifesto técnico auditado Fases 01-11
- Status operacional de cada fase com badges visuais
- Métricas de saúde do sistema

## Hooks e Persistência

**Arquivo:** `src/features/settings/hooks/useAgencySettings.ts`

- `useAgencyBranding()` — Query + mutation para branding
- `useAgencyPreferences()` — Query + mutation para preferências
- `useAgencyTeam()` — Members, invitations, invite/revoke/updateRole
- Fallback determinístico para modo demo (sem Supabase ativo)
- TanStack Query com `initialData` para SSR-like experience

## Testes

**Arquivo:** `src/features/settings/settings.test.tsx`

| Teste | Status |
|-------|--------|
| WCAG 2.2 AA contrast ratio calculation | ✅ |
| SettingsOverviewPage renders 12 module cards | ✅ |
| WhiteLabelStudioPage color editor and brand preview | ✅ |
| PermissionStudioPage matrix with roles and modules | ✅ |
| TeamManagementPage with active members and invite | ✅ |
| DiagnosticsPage with Phase 01-11 manifesto | ✅ |

**Total:** 6/6 passando

## Rotas

| Rota | Componente |
|------|-----------|
| `/settings` | `SettingsOverviewPage` |
| `/settings/white-label` | `WhiteLabelStudioPage` |
| `/settings/agency` | `AgencySettingsPage` |
| `/settings/appearance` | `AppearanceSettingsPage` |
| `/settings/team` | `TeamManagementPage` |
| `/settings/permissions` | `PermissionStudioPage` |
| `/settings/workspace` | `WorkspacePreferencesPage` |
| `/settings/documents` | `DocumentBrandingPage` |
| `/settings/client-experience` | `ClientExperiencePage` |
| `/settings/integrations` | `IntegrationsCenterPage` |
| `/settings/security` | `SecurityCenterPage` |
| `/settings/activity` | `ActivityCenterPage` |
| `/settings/diagnostics` | `DiagnosticsPage` |
