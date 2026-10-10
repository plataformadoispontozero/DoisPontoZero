-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- FASE 09: GOOGLE DRIVE INTEGRATION + PRESENTATION STUDIO
-- Schema Migration, RLS Policies & Public RPC Functions
-- ============================================================

-- 1. NOVAS PERMISSÕES DOS MÓDULOS DRIVE E PRESENTATIONS
INSERT INTO public.permissions (id, name, description, module) VALUES
  ('drive.view', 'Visualizar Google Drive', 'Permite navegar pelos arquivos e pastas do Google Drive', 'drive'),
  ('drive.connect', 'Conectar Google Drive', 'Permite vincular a conta do Google Drive da agência', 'drive'),
  ('drive.disconnect', 'Desconectar Google Drive', 'Permite revogar a conexão com o Google Drive', 'drive'),
  ('drive.manage_folders', 'Gerenciar Pastas de Clientes', 'Permite vincular e desvincular pastas do Drive aos clientes', 'drive'),
  ('drive.link_files', 'Vincular Arquivos a Projetos', 'Permite associar arquivos do Drive a projetos e tarefas', 'drive'),
  ('presentations.view', 'Visualizar Apresentações', 'Permite consultar apresentações e showcases da agência', 'presentations'),
  ('presentations.create', 'Criar Apresentações', 'Permite criar novas apresentações comerciais de entregas', 'presentations'),
  ('presentations.edit', 'Editar Apresentações', 'Permite editar seções, materiais e descrições criativas', 'presentations'),
  ('presentations.delete', 'Excluir Apresentações', 'Permite remover apresentações da agência', 'presentations'),
  ('presentations.publish', 'Publicar Apresentações', 'Permite publicar showcases para clientes com link público', 'presentations'),
  ('presentations.export', 'Exportar Apresentações em PDF', 'Permite gerar e baixar PDFs das apresentações', 'presentations'),
  ('presentations.manage_public_links', 'Gerenciar Links de Showcase', 'Permite gerar e revogar links públicos de apresentações', 'presentations')
ON CONFLICT (id) DO NOTHING;

-- Atribuir permissões aos papéis admin, owner e manager
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'owner', 'manager')
  AND p.module IN ('drive', 'presentations')
ON CONFLICT DO NOTHING;

-- 2. TABELA: google_connections (Conexão OAuth 2.0 da Agência)
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  google_account_id TEXT,
  google_email TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'expired', 'revoked', 'error')),
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  token_reference TEXT,
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: client_drive_folders (Pastas do Drive Vinculadas ao Cliente)
CREATE TABLE IF NOT EXISTS public.client_drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.google_connections(id) ON DELETE SET NULL,
  google_folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA: drive_file_references (Metadados dos Arquivos Autorizados)
CREATE TABLE IF NOT EXISTS public.drive_file_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES public.google_connections(id) ON DELETE CASCADE,
  google_file_id TEXT NOT NULL,
  name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  web_view_link TEXT,
  thumbnail_reference TEXT,
  parent_folder_id TEXT,
  modified_time TIMESTAMPTZ,
  size_bytes BIGINT,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  availability_status TEXT NOT NULL DEFAULT 'available' CHECK (availability_status IN ('available', 'access_denied', 'deleted')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA: project_drive_files (Associação de Arquivos do Drive a Projetos)
CREATE TABLE IF NOT EXISTS public.project_drive_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_reference_id UUID NOT NULL REFERENCES public.drive_file_references(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: presentations (Apresentações de Entregas Criativas)
CREATE TABLE IF NOT EXISTS public.presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2020),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'internal_review', 'approved', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- 7. TABELA: presentation_sections (Seções da Apresentação)
CREATE TABLE IF NOT EXISTS public.presentation_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'cover', 'overview', 'objectives', 'deliverables', 'gallery', 'video', 'results', 'insights', 'next_steps', 'closing', 'custom'
  )),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TABELA: presentation_assets (Mídias e Materiais Vinculados da Apresentação)
CREATE TABLE IF NOT EXISTS public.presentation_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.presentation_sections(id) ON DELETE SET NULL,
  file_reference_id UUID REFERENCES public.drive_file_references(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: presentation_versions (Snapshots de Apresentação)
CREATE TABLE IF NOT EXISTS public.presentation_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: presentation_public_links (Links de Compartilhamento Showcase)
CREATE TABLE IF NOT EXISTS public.presentation_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.presentation_versions(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA: presentation_exports (Registro de PDFs das Apresentações)
CREATE TABLE IF NOT EXISTS public.presentation_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.presentation_versions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  branding_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA: presentation_activity (Auditoria do Presentation Studio)
CREATE TABLE IF NOT EXISTS public.presentation_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_google_connections_agency ON public.google_connections(agency_id);
CREATE INDEX IF NOT EXISTS idx_client_drive_folders_client ON public.client_drive_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_refs_gfile ON public.drive_file_references(google_file_id);
CREATE INDEX IF NOT EXISTS idx_presentations_agency_client ON public.presentations(agency_id, client_id);
CREATE INDEX IF NOT EXISTS idx_presentation_sections_pos ON public.presentation_sections(presentation_id, position);
CREATE INDEX IF NOT EXISTS idx_presentation_public_links_hash ON public.presentation_public_links(token_hash);

-- 14. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_file_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_drive_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presentation_activity ENABLE ROW LEVEL SECURITY;

-- Regras de isolamento por agência
CREATE POLICY google_connections_member_access ON public.google_connections FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY client_drive_folders_member_access ON public.client_drive_folders FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY drive_file_references_member_access ON public.drive_file_references FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY project_drive_files_member_access ON public.project_drive_files FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentations_member_access ON public.presentations FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_sections_member_access ON public.presentation_sections FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_assets_member_access ON public.presentation_assets FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_versions_member_access ON public.presentation_versions FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_public_links_member_access ON public.presentation_public_links FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_exports_member_access ON public.presentation_exports FOR ALL USING (public.is_agency_member(agency_id));
CREATE POLICY presentation_activity_member_access ON public.presentation_activity FOR ALL USING (public.is_agency_member(agency_id));

-- 15. RPC FUNÇÃO PÚBLICA SEGURA PARA SHOWCASE DO CLIENTE (/showcase/:publicToken)
CREATE OR REPLACE FUNCTION public.get_public_showcase(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash text;
  v_link public.presentation_public_links%ROWTYPE;
  v_pres public.presentations%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_agency public.agencies%ROWTYPE;
  v_sections jsonb;
  v_assets jsonb;
BEGIN
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_link
  FROM public.presentation_public_links
  WHERE token_hash = v_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Link de apresentação inválido, revogado ou expirado.');
  END IF;

  SELECT * INTO v_pres FROM public.presentations WHERE id = v_link.presentation_id;
  IF v_pres.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Apresentação não encontrada.');
  END IF;

  SELECT * INTO v_client FROM public.clients WHERE id = v_pres.client_id;
  SELECT * INTO v_agency FROM public.agencies WHERE id = v_pres.agency_id;

  SELECT jsonb_agg(to_jsonb(s) ORDER BY position ASC) INTO v_sections
  FROM public.presentation_sections s
  WHERE s.presentation_id = v_pres.id;

  SELECT jsonb_agg(to_jsonb(a) ORDER BY position ASC) INTO v_assets
  FROM public.presentation_assets a
  WHERE a.presentation_id = v_pres.id;

  INSERT INTO public.presentation_activity (agency_id, presentation_id, action, metadata)
  VALUES (v_pres.agency_id, v_pres.id, 'showcase_viewed', jsonb_build_object('viewed_at', NOW()));

  RETURN jsonb_build_object(
    'presentation', to_jsonb(v_pres),
    'client', jsonb_build_object('name', v_client.name, 'company_name', v_client.name, 'logo_url', v_client.logo_url),
    'agency', jsonb_build_object('name', v_agency.name, 'logo_url', v_agency.logo_url),
    'sections', COALESCE(v_sections, '[]'::jsonb),
    'assets', COALESCE(v_assets, '[]'::jsonb)
  );
END;
$$;
