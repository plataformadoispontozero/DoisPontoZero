-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- FASE 06: BRIEFING STUDIO + PROFESSIONAL PDF
-- Migration: 20261010000004_phase06_briefings.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. PERMISSÕES DO MÓDULO DE BRIEFINGS
-- ------------------------------------------------------------
INSERT INTO public.permissions (id, module, description)
VALUES
  ('briefings.view', 'briefings', 'Visualizar briefings e formulários da agência'),
  ('briefings.create', 'briefings', 'Criar novos briefings e questionários'),
  ('briefings.edit', 'briefings', 'Editar perguntas, campos e dados de briefings'),
  ('briefings.delete', 'briefings', 'Excluir briefings e formulários'),
  ('briefings.export', 'briefings', 'Exportar briefings em PDF profissional'),
  ('briefings.manage_templates', 'briefings', 'Criar e editar templates de briefing no Form Builder'),
  ('briefings.publish_templates', 'briefings', 'Publicar versões oficiais de templates'),
  ('briefings.review', 'briefings', 'Aprovar ou solicitar ajustes em respostas de briefings'),
  ('briefings.manage_public_links', 'briefings', 'Gerar, configurar e revogar links públicos de preenchimento')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. TABELA: briefing_templates
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  category     TEXT NOT NULL DEFAULT 'general' CHECK (
    category IN ('branding', 'social_media', 'motion', 'audiovisual', 'paid_media', 'campaign', 'general', 'custom')
  ),
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'published', 'archived')
  ),
  version      INT NOT NULL DEFAULT 1,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_briefing_templates_agency ON public.briefing_templates (agency_id);
CREATE INDEX IF NOT EXISTS idx_briefing_templates_category ON public.briefing_templates (agency_id, category);

DROP TRIGGER IF EXISTS trg_briefing_templates_updated_at ON public.briefing_templates;
CREATE TRIGGER trg_briefing_templates_updated_at
  BEFORE UPDATE ON public.briefing_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 3. TABELA: briefing_sections
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_sections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  template_id  UUID NOT NULL REFERENCES public.briefing_templates(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  position     INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_sections_template ON public.briefing_sections (template_id, position);

DROP TRIGGER IF EXISTS trg_briefing_sections_updated_at ON public.briefing_sections;
CREATE TRIGGER trg_briefing_sections_updated_at
  BEFORE UPDATE ON public.briefing_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 4. TABELA: briefing_questions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_questions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  template_id       UUID NOT NULL REFERENCES public.briefing_templates(id) ON DELETE CASCADE,
  section_id        UUID NOT NULL REFERENCES public.briefing_sections(id) ON DELETE CASCADE,
  question_key      TEXT NOT NULL,
  label             TEXT NOT NULL,
  description       TEXT,
  question_type     TEXT NOT NULL CHECK (
    question_type IN ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'date', 'number', 'url', 'email', 'file_upload')
  ),
  is_required       BOOLEAN NOT NULL DEFAULT false,
  position          INT NOT NULL DEFAULT 0,
  options           JSONB NOT NULL DEFAULT '[]'::jsonb,
  validation_rules  JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_question_key_per_template UNIQUE (template_id, question_key)
);

CREATE INDEX IF NOT EXISTS idx_briefing_questions_section ON public.briefing_questions (section_id, position);
CREATE INDEX IF NOT EXISTS idx_briefing_questions_template ON public.briefing_questions (template_id);

DROP TRIGGER IF EXISTS trg_briefing_questions_updated_at ON public.briefing_questions;
CREATE TRIGGER trg_briefing_questions_updated_at
  BEFORE UPDATE ON public.briefing_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 5. TABELA: briefings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id         UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  template_id       UUID NOT NULL REFERENCES public.briefing_templates(id) ON DELETE RESTRICT,
  template_version  INT NOT NULL DEFAULT 1,
  title             TEXT NOT NULL,
  description       TEXT,
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'sent', 'in_progress', 'submitted', 'under_review', 'approved', 'changes_requested', 'archived')
  ),
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at      TIMESTAMPTZ,
  approved_at       TIMESTAMPTZ,
  archived_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_briefings_agency ON public.briefings (agency_id);
CREATE INDEX IF NOT EXISTS idx_briefings_client ON public.briefings (client_id);
CREATE INDEX IF NOT EXISTS idx_briefings_status ON public.briefings (agency_id, status);

DROP TRIGGER IF EXISTS trg_briefings_updated_at ON public.briefings;
CREATE TRIGGER trg_briefings_updated_at
  BEFORE UPDATE ON public.briefings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 6. TABELA: briefing_answers
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id   UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES public.briefing_questions(id) ON DELETE CASCADE,
  answer_value  JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_briefing_question_answer UNIQUE (briefing_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_briefing_answers_briefing ON public.briefing_answers (briefing_id);

DROP TRIGGER IF EXISTS trg_briefing_answers_updated_at ON public.briefing_answers;
CREATE TRIGGER trg_briefing_answers_updated_at
  BEFORE UPDATE ON public.briefing_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 7. TABELA: briefing_public_links
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_public_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id         UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id       UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  token_hash        TEXT NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ,
  max_submissions   INT NOT NULL DEFAULT 1,
  submission_count  INT NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_links_token ON public.briefing_public_links (token_hash);
CREATE INDEX IF NOT EXISTS idx_briefing_links_briefing ON public.briefing_public_links (briefing_id);

-- ------------------------------------------------------------
-- 8. TABELA: briefing_attachments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id   UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  question_id   UUID REFERENCES public.briefing_questions(id) ON DELETE SET NULL,
  storage_path  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  mime_type     TEXT,
  file_size     BIGINT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_attachments_briefing ON public.briefing_attachments (briefing_id);

-- ------------------------------------------------------------
-- 9. TABELA: briefing_versions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id     UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  version_number  INT NOT NULL DEFAULT 1,
  snapshot        JSONB NOT NULL,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_versions_briefing ON public.briefing_versions (briefing_id, version_number);

-- ------------------------------------------------------------
-- 10. TABELA: briefing_exports
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_exports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id          UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id        UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  version_id         UUID REFERENCES public.briefing_versions(id) ON DELETE SET NULL,
  file_path          TEXT NOT NULL,
  export_format      TEXT NOT NULL DEFAULT 'pdf',
  branding_snapshot  JSONB,
  generated_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_exports_briefing ON public.briefing_exports (briefing_id);

-- ------------------------------------------------------------
-- 11. TABELA: briefing_activity
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.briefing_activity (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  briefing_id    UUID NOT NULL REFERENCES public.briefings(id) ON DELETE CASCADE,
  actor_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action         TEXT NOT NULL,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_briefing_activity_briefing ON public.briefing_activity (briefing_id, created_at DESC);

-- ------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.briefing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.briefing_activity ENABLE ROW LEVEL SECURITY;

-- Políticas de Templates
CREATE POLICY "templates_select" ON public.briefing_templates
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "templates_insert" ON public.briefing_templates
  FOR INSERT WITH CHECK (public.has_agency_permission(agency_id, 'briefings.manage_templates'));

CREATE POLICY "templates_update" ON public.briefing_templates
  FOR UPDATE USING (public.has_agency_permission(agency_id, 'briefings.manage_templates'));

CREATE POLICY "templates_delete" ON public.briefing_templates
  FOR DELETE USING (public.has_agency_permission(agency_id, 'briefings.delete'));

-- Políticas de Seções e Perguntas
CREATE POLICY "sections_select" ON public.briefing_sections
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "sections_modify" ON public.briefing_sections
  FOR ALL USING (public.has_agency_permission(agency_id, 'briefings.manage_templates'));

CREATE POLICY "questions_select" ON public.briefing_questions
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "questions_modify" ON public.briefing_questions
  FOR ALL USING (public.has_agency_permission(agency_id, 'briefings.manage_templates'));

-- Políticas de Briefings
CREATE POLICY "briefings_select" ON public.briefings
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "briefings_insert" ON public.briefings
  FOR INSERT WITH CHECK (public.has_agency_permission(agency_id, 'briefings.create'));

CREATE POLICY "briefings_update" ON public.briefings
  FOR UPDATE USING (public.has_agency_permission(agency_id, 'briefings.edit'));

CREATE POLICY "briefings_delete" ON public.briefings
  FOR DELETE USING (public.has_agency_permission(agency_id, 'briefings.delete'));

-- Políticas de Respostas
CREATE POLICY "answers_select" ON public.briefing_answers
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "answers_modify" ON public.briefing_answers
  FOR ALL USING (public.has_agency_permission(agency_id, 'briefings.edit'));

-- Políticas de Links Públicos
CREATE POLICY "links_select" ON public.briefing_public_links
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "links_modify" ON public.briefing_public_links
  FOR ALL USING (public.has_agency_permission(agency_id, 'briefings.manage_public_links'));

-- Políticas de Anexos, Versões, Exportações e Atividade
CREATE POLICY "attachments_select" ON public.briefing_attachments
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "attachments_modify" ON public.briefing_attachments
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY "versions_select" ON public.briefing_versions
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "versions_insert" ON public.briefing_versions
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "exports_select" ON public.briefing_exports
  FOR SELECT USING (public.has_agency_permission(agency_id, 'briefings.export'));
CREATE POLICY "exports_insert" ON public.briefing_exports
  FOR INSERT WITH CHECK (public.has_agency_permission(agency_id, 'briefings.export'));

CREATE POLICY "activity_select" ON public.briefing_activity
  FOR SELECT USING (public.is_agency_member(agency_id));
CREATE POLICY "activity_insert" ON public.briefing_activity
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

-- ------------------------------------------------------------
-- 13. FUNÇÕES E PROCEDIMENTOS TRANSACIONAIS SEGUROS (RPC)
-- ------------------------------------------------------------

-- RPC: Obter briefing público por token hash (Security Definer com sanitização)
CREATE OR REPLACE FUNCTION public.get_public_briefing(p_token_hash TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link RECORD;
  v_briefing RECORD;
  v_agency RECORD;
  v_sections JSONB;
  v_questions JSONB;
BEGIN
  -- 1. Validar link público
  SELECT * INTO v_link
  FROM public.briefing_public_links
  WHERE token_hash = p_token_hash;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'TOKEN_NOT_FOUND', 'message', 'Link de briefing inválido ou inexistente.');
  END IF;

  IF v_link.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('error', 'TOKEN_REVOKED', 'message', 'Este link de preenchimento foi revogado.');
  END IF;

  IF v_link.expires_at IS NOT NULL AND v_link.expires_at < now() THEN
    RETURN jsonb_build_object('error', 'TOKEN_EXPIRED', 'message', 'Este link de preenchimento expirou.');
  END IF;

  IF v_link.submission_count >= v_link.max_submissions THEN
    RETURN jsonb_build_object('error', 'LIMIT_REACHED', 'message', 'O limite de envios para este link foi atingido.');
  END IF;

  -- 2. Buscar briefing
  SELECT b.id, b.title, b.description, b.status, b.agency_id, b.template_id, b.template_version
  INTO v_briefing
  FROM public.briefings b
  WHERE b.id = v_link.briefing_id;

  -- 3. Buscar dados de branding da agência
  SELECT a.name, a.branding
  INTO v_agency
  FROM public.agencies a
  WHERE a.id = v_briefing.agency_id;

  -- 4. Buscar seções do template
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'description', s.description,
      'position', s.position
    ) ORDER BY s.position ASC
  ), '[]'::jsonb) INTO v_sections
  FROM public.briefing_sections s
  WHERE s.template_id = v_briefing.template_id;

  -- 5. Buscar perguntas do template
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', q.id,
      'section_id', q.section_id,
      'question_key', q.question_key,
      'label', q.label,
      'description', q.description,
      'question_type', q.question_type,
      'is_required', q.is_required,
      'position', q.position,
      'options', q.options,
      'validation_rules', q.validation_rules
    ) ORDER BY q.position ASC
  ), '[]'::jsonb) INTO v_questions
  FROM public.briefing_questions q
  WHERE q.template_id = v_briefing.template_id;

  RETURN jsonb_build_object(
    'success', true,
    'briefing', jsonb_build_object(
      'id', v_briefing.id,
      'title', v_briefing.title,
      'description', v_briefing.description,
      'status', v_briefing.status
    ),
    'agency', jsonb_build_object(
      'name', v_agency.name,
      'branding', v_agency.branding
    ),
    'sections', v_sections,
    'questions', v_questions
  );
END;
$$;

-- RPC: Submeter respostas públicas (Transacional)
CREATE OR REPLACE FUNCTION public.submit_public_briefing(
  p_token_hash TEXT,
  p_answers JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link RECORD;
  v_briefing RECORD;
  v_answer RECORD;
  v_question_id UUID;
  v_answer_val JSONB;
  v_new_version INT := 1;
  v_snapshot JSONB;
BEGIN
  -- 1. Validar link
  SELECT * INTO v_link
  FROM public.briefing_public_links
  WHERE token_hash = p_token_hash;

  IF NOT FOUND OR v_link.revoked_at IS NOT NULL OR (v_link.expires_at IS NOT NULL AND v_link.expires_at < now()) OR v_link.submission_count >= v_link.max_submissions THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_TOKEN');
  END IF;

  SELECT * INTO v_briefing FROM public.briefings WHERE id = v_link.briefing_id;

  -- 2. Persistir respostas
  FOR v_question_id, v_answer_val IN
    SELECT key::uuid, value FROM jsonb_each(p_answers)
  LOOP
    INSERT INTO public.briefing_answers (agency_id, briefing_id, question_id, answer_value)
    VALUES (v_briefing.agency_id, v_briefing.id, v_question_id, v_answer_val)
    ON CONFLICT (briefing_id, question_id)
    DO UPDATE SET answer_value = EXCLUDED.answer_value, updated_at = now();
  END LOOP;

  -- 3. Incrementar contagem no link
  UPDATE public.briefing_public_links
  SET submission_count = submission_count + 1
  WHERE id = v_link.id;

  -- 4. Criar snapshot e versão imutável
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_new_version
  FROM public.briefing_versions
  WHERE briefing_id = v_briefing.id;

  v_snapshot := jsonb_build_object(
    'submitted_at', now(),
    'answers', p_answers,
    'template_id', v_briefing.template_id,
    'template_version', v_briefing.template_version
  );

  INSERT INTO public.briefing_versions (agency_id, briefing_id, version_number, snapshot)
  VALUES (v_briefing.agency_id, v_briefing.id, v_new_version, v_snapshot);

  -- 5. Atualizar status do briefing
  UPDATE public.briefings
  SET status = 'submitted', submitted_at = now(), updated_at = now()
  WHERE id = v_briefing.id;

  -- 6. Registrar atividade
  INSERT INTO public.briefing_activity (agency_id, briefing_id, action, metadata)
  VALUES (
    v_briefing.agency_id,
    v_briefing.id,
    'submitted_via_public_link',
    jsonb_build_object('link_id', v_link.id, 'version', v_new_version)
  );

  RETURN jsonb_build_object('success', true, 'briefing_id', v_briefing.id, 'version', v_new_version);
END;
$$;
