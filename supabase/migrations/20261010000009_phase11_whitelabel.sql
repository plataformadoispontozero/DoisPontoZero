-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- MIGRATION: 20261010000009_phase11_whitelabel.sql
-- FASE 11: WHITE LABEL STUDIO + ADVANCED SETTINGS
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABELA: agency_branding (Identidade Visual White Label)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Dois.Zero',
  legal_name TEXT DEFAULT 'Dois.Zero Sistemas Criativos Ltda.',
  tagline TEXT DEFAULT 'Sua agência. Tudo conectado.',
  logo_light_path TEXT,
  logo_dark_path TEXT,
  symbol_path TEXT,
  favicon_path TEXT,
  primary_color TEXT NOT NULL DEFAULT '#7952FF',
  secondary_color TEXT NOT NULL DEFAULT '#A1A1B0',
  accent_color TEXT NOT NULL DEFAULT '#B8FF65',
  background_color TEXT NOT NULL DEFAULT '#101014',
  surface_color TEXT NOT NULL DEFAULT '#1C1C24',
  text_color TEXT NOT NULL DEFAULT '#F8F9FC',
  heading_font TEXT NOT NULL DEFAULT 'Space Grotesk',
  body_font TEXT NOT NULL DEFAULT 'Inter',
  theme_mode TEXT NOT NULL DEFAULT 'dark' CHECK (theme_mode IN ('dark', 'light', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agency_branding_updated_at ON public.agency_branding;
CREATE TRIGGER trg_agency_branding_updated_at
  BEFORE UPDATE ON public.agency_branding
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 2. TABELA: agency_preferences (Preferências Operacionais do Workspace)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'pt-BR',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  date_format TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
  time_format TEXT NOT NULL DEFAULT '24h',
  currency TEXT NOT NULL DEFAULT 'BRL',
  week_starts_on INTEGER NOT NULL DEFAULT 1 CHECK (week_starts_on IN (0, 1, 6)),
  default_project_view TEXT NOT NULL DEFAULT 'kanban' CHECK (default_project_view IN ('kanban', 'list', 'grid')),
  default_task_view TEXT NOT NULL DEFAULT 'board' CHECK (default_task_view IN ('board', 'list', 'calendar')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agency_preferences_updated_at ON public.agency_preferences;
CREATE TRIGGER trg_agency_preferences_updated_at
  BEFORE UPDATE ON public.agency_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 3. TABELA: agency_document_settings (Identidade de Documentos PDF)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_document_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  header_style TEXT NOT NULL DEFAULT 'centered_logo' CHECK (header_style IN ('centered_logo', 'left_logo', 'minimal')),
  footer_text TEXT DEFAULT 'Documento confidencial gerado via Creative Agency OS',
  show_logo BOOLEAN NOT NULL DEFAULT true,
  show_watermark BOOLEAN NOT NULL DEFAULT true,
  watermark_opacity NUMERIC(3,2) NOT NULL DEFAULT 0.05 CHECK (watermark_opacity >= 0.01 AND watermark_opacity <= 0.20),
  page_format TEXT NOT NULL DEFAULT 'A4' CHECK (page_format IN ('A4', 'Letter')),
  document_font TEXT NOT NULL DEFAULT 'Helvetica',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agency_document_settings_updated_at ON public.agency_document_settings;
CREATE TRIGGER trg_agency_document_settings_updated_at
  BEFORE UPDATE ON public.agency_document_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 4. TABELA: agency_portal_settings (Experiência dos Portais Públicos)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_portal_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  portal_title TEXT NOT NULL DEFAULT 'Portal de Entregas & Briefings',
  welcome_message TEXT DEFAULT 'Bem-vindo ao portal de colaboração da nossa agência.',
  show_agency_logo BOOLEAN NOT NULL DEFAULT true,
  show_client_logo BOOLEAN NOT NULL DEFAULT true,
  footer_text TEXT DEFAULT 'Powered by Creative Agency OS',
  contact_email TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agency_portal_settings_updated_at ON public.agency_portal_settings;
CREATE TRIGGER trg_agency_portal_settings_updated_at
  BEFORE UPDATE ON public.agency_portal_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 5. TABELA: agency_settings_history (Histórico de Alterações de Configuração)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  setting_group TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  previous_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 6. PERMISSÕES OFICIAIS DO MÓDULO WHITE LABEL E SETTINGS
-- ------------------------------------------------------------
INSERT INTO public.permissions (permission_key, module, description)
VALUES
  ('branding.view', 'settings', 'Visualizar configurações de marca e White Label'),
  ('branding.edit', 'settings', 'Editar identidade visual, cores e tipografia da agência'),
  ('settings.view', 'settings', 'Visualizar parâmetros do workspace e agência'),
  ('settings.edit', 'settings', 'Editar dados cadastrais e preferências operacionais'),
  ('permissions.view', 'settings', 'Visualizar matriz de papéis e permissões no Permission Studio'),
  ('permissions.manage', 'settings', 'Gerenciar papéis e salvar matriz de permissões'),
  ('team.view', 'team', 'Visualizar membros e convites da agência'),
  ('team.invite', 'team', 'Convidar novos membros para a agência'),
  ('team.manage', 'team', 'Gerenciar cargos e status de membros da agência'),
  ('integrations.view', 'settings', 'Visualizar conexões e integrações ativas'),
  ('integrations.manage', 'settings', 'Configurar integrações do workspace'),
  ('security.view', 'settings', 'Visualizar centro de segurança e logs autorizados'),
  ('activity.view', 'dashboard', 'Visualizar feed operacional de atividades reais'),
  ('diagnostics.view', 'settings', 'Acessar painel técnico de diagnósticos do sistema')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description, module = EXCLUDED.module;

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------
ALTER TABLE public.agency_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_document_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_portal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_settings_history ENABLE ROW LEVEL SECURITY;

-- Branding
CREATE POLICY "agency_branding_select"
  ON public.agency_branding FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_branding_update"
  ON public.agency_branding FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_branding_insert"
  ON public.agency_branding FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

-- Preferences
CREATE POLICY "agency_preferences_select"
  ON public.agency_preferences FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_preferences_update"
  ON public.agency_preferences FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'settings.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'settings.edit')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_preferences_insert"
  ON public.agency_preferences FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'settings.edit')
    OR public.is_agency_owner(agency_id)
  );

-- Document Settings
CREATE POLICY "agency_document_settings_select"
  ON public.agency_document_settings FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_document_settings_update"
  ON public.agency_document_settings FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_document_settings_insert"
  ON public.agency_document_settings FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

-- Portal Settings
CREATE POLICY "agency_portal_settings_select"
  ON public.agency_portal_settings FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_portal_settings_update"
  ON public.agency_portal_settings FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_portal_settings_insert"
  ON public.agency_portal_settings FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'branding.edit')
    OR public.is_agency_owner(agency_id)
  );

-- Settings History
CREATE POLICY "agency_settings_history_select"
  ON public.agency_settings_history FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_settings_history_insert"
  ON public.agency_settings_history FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

-- ------------------------------------------------------------
-- 8. RPC: RESOLVER PÚBLICO DE BRANDING PARA PORTAIS COMPARTILHADOS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_agency_branding(p_agency_id UUID)
RETURNS TABLE (
  display_name TEXT,
  tagline TEXT,
  logo_light_path TEXT,
  logo_dark_path TEXT,
  symbol_path TEXT,
  favicon_path TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  background_color TEXT,
  surface_color TEXT,
  text_color TEXT,
  heading_font TEXT,
  body_font TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    b.display_name,
    b.tagline,
    b.logo_light_path,
    b.logo_dark_path,
    b.symbol_path,
    b.favicon_path,
    b.primary_color,
    b.secondary_color,
    b.accent_color,
    b.background_color,
    b.surface_color,
    b.text_color,
    b.heading_font,
    b.body_font
  FROM public.agency_branding b
  WHERE b.agency_id = p_agency_id;
$$;
