-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- MIGRATION: 20261010000003_phase05_squads.sql
-- FASE 05: SQUADS + METAS + GAMIFICAÇÃO
-- ============================================================

-- ------------------------------------------------------------
-- ENUMS
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE squad_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE squad_member_role AS ENUM ('leader', 'member');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_period AS ENUM ('monthly', 'quarterly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_metric AS ENUM (
    'tasks_completed',
    'on_time_rate',
    'quality_score',
    'collaboration_score',
    'projects_delivered',
    'revenue_generated',
    'custom'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('draft', 'active', 'achieved', 'missed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- TABELA: squads
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  avatar_color    TEXT NOT NULL DEFAULT '#7952FF',
  avatar_emoji    TEXT NOT NULL DEFAULT '⚡',
  specialty       TEXT,                       -- 'motion', 'social', 'performance', 'branding', 'design', etc.
  capacity        INTEGER DEFAULT 0,          -- max tasks / sprint
  status          squad_status NOT NULL DEFAULT 'active',
  created_by      UUID REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squads_agency_id ON public.squads(agency_id);
CREATE INDEX IF NOT EXISTS idx_squads_status ON public.squads(status);

-- ------------------------------------------------------------
-- TABELA: squad_members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id    UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        squad_member_role NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_members_squad_id ON public.squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);

-- ------------------------------------------------------------
-- TABELA: squad_goals
-- Metas atribuídas a squads com métricas e valores alvo
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_goals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id     UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  metric       goal_metric NOT NULL DEFAULT 'tasks_completed',
  metric_label TEXT,                          -- rótulo customizado para 'custom'
  target_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  current_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  period       goal_period NOT NULL DEFAULT 'monthly',
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       goal_status NOT NULL DEFAULT 'draft',
  weight       INTEGER NOT NULL DEFAULT 1,    -- peso no ranking (1-5)
  created_by   UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_period CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_squad_goals_squad_id ON public.squad_goals(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_goals_agency_id ON public.squad_goals(agency_id);
CREATE INDEX IF NOT EXISTS idx_squad_goals_period ON public.squad_goals(period_start, period_end);

-- ------------------------------------------------------------
-- TABELA: squad_performance_snapshots
-- Registros mensais de métricas reais de performance
-- Preenchido por triggers ou manualmente pelo sistema
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_performance_snapshots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id            UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  agency_id           UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  period_year         INTEGER NOT NULL,
  period_month        INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  tasks_completed     INTEGER NOT NULL DEFAULT 0,
  tasks_total         INTEGER NOT NULL DEFAULT 0,
  tasks_on_time       INTEGER NOT NULL DEFAULT 0,
  -- Scores de 0 a 100 inseridos manualmente ou via avaliação
  quality_score       NUMERIC(5, 2) DEFAULT NULL CHECK (quality_score IS NULL OR quality_score BETWEEN 0 AND 100),
  collaboration_score NUMERIC(5, 2) DEFAULT NULL CHECK (collaboration_score IS NULL OR collaboration_score BETWEEN 0 AND 100),
  -- Campo calculado: (tasks_on_time / tasks_total) * 100
  on_time_rate        NUMERIC(5, 2) GENERATED ALWAYS AS (
    CASE WHEN tasks_total > 0 THEN ROUND((tasks_on_time::NUMERIC / tasks_total) * 100, 2) ELSE 0 END
  ) STORED,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_squad_perf_squad_id ON public.squad_performance_snapshots(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_perf_period ON public.squad_performance_snapshots(period_year, period_month);

-- ------------------------------------------------------------
-- TABELA: squad_projects  (many-to-many: squads <-> projects)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.squad_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id    UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(squad_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_squad_projects_squad_id ON public.squad_projects(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_projects_project_id ON public.squad_projects(project_id);

-- ------------------------------------------------------------
-- FUNÇÃO: compute_squad_ranking
-- Calcula ranking de squads para um período (year/month)
-- Retorna: squad_id, score, rank, detalhes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.compute_squad_ranking(
  p_agency_id UUID,
  p_year      INTEGER,
  p_month     INTEGER
)
RETURNS TABLE (
  squad_id            UUID,
  squad_name          TEXT,
  squad_emoji         TEXT,
  squad_color         TEXT,
  specialty           TEXT,
  member_count        BIGINT,
  tasks_completed     INTEGER,
  tasks_total         INTEGER,
  on_time_rate        NUMERIC,
  quality_score       NUMERIC,
  collaboration_score NUMERIC,
  overall_score       NUMERIC,
  rank                BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s.id AS squad_id,
    s.name AS squad_name,
    s.avatar_emoji AS squad_emoji,
    s.avatar_color AS squad_color,
    s.specialty,
    COUNT(sm.id) AS member_count,
    COALESCE(sp.tasks_completed, 0) AS tasks_completed,
    COALESCE(sp.tasks_total, 0) AS tasks_total,
    COALESCE(sp.on_time_rate, 0) AS on_time_rate,
    COALESCE(sp.quality_score, 0) AS quality_score,
    COALESCE(sp.collaboration_score, 0) AS collaboration_score,
    -- Overall score: weighted average of available metrics (0-100)
    ROUND(
      (
        COALESCE(sp.on_time_rate, 0)        * 0.40 +
        COALESCE(sp.quality_score, 0)       * 0.35 +
        COALESCE(sp.collaboration_score, 0) * 0.25
      )::NUMERIC,
      1
    ) AS overall_score,
    RANK() OVER (
      ORDER BY
        ROUND(
          (
            COALESCE(sp.on_time_rate, 0)        * 0.40 +
            COALESCE(sp.quality_score, 0)       * 0.35 +
            COALESCE(sp.collaboration_score, 0) * 0.25
          )::NUMERIC,
          1
        ) DESC,
        COALESCE(sp.tasks_completed, 0) DESC
    ) AS rank
  FROM public.squads s
  LEFT JOIN public.squad_members sm ON sm.squad_id = s.id
  LEFT JOIN public.squad_performance_snapshots sp
    ON sp.squad_id = s.id
    AND sp.period_year = p_year
    AND sp.period_month = p_month
  WHERE
    s.agency_id = p_agency_id
    AND s.status = 'active'
  GROUP BY
    s.id, s.name, s.avatar_emoji, s.avatar_color, s.specialty,
    sp.tasks_completed, sp.tasks_total, sp.on_time_rate,
    sp.quality_score, sp.collaboration_score
$$;

-- ------------------------------------------------------------
-- FUNÇÃO: upsert_performance_snapshot
-- Insere ou atualiza snapshot de performance de um squad
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_performance_snapshot(
  p_squad_id            UUID,
  p_year                INTEGER,
  p_month               INTEGER,
  p_tasks_completed     INTEGER DEFAULT NULL,
  p_tasks_total         INTEGER DEFAULT NULL,
  p_tasks_on_time       INTEGER DEFAULT NULL,
  p_quality_score       NUMERIC DEFAULT NULL,
  p_collaboration_score NUMERIC DEFAULT NULL,
  p_notes               TEXT DEFAULT NULL
)
RETURNS public.squad_performance_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agency_id UUID;
  v_result    public.squad_performance_snapshots;
BEGIN
  SELECT agency_id INTO v_agency_id
  FROM public.squads WHERE id = p_squad_id;

  IF v_agency_id IS NULL THEN
    RAISE EXCEPTION 'Squad não encontrado';
  END IF;

  INSERT INTO public.squad_performance_snapshots (
    squad_id, agency_id, period_year, period_month,
    tasks_completed, tasks_total, tasks_on_time,
    quality_score, collaboration_score, notes
  )
  VALUES (
    p_squad_id, v_agency_id, p_year, p_month,
    COALESCE(p_tasks_completed, 0),
    COALESCE(p_tasks_total, 0),
    COALESCE(p_tasks_on_time, 0),
    p_quality_score,
    p_collaboration_score,
    p_notes
  )
  ON CONFLICT (squad_id, period_year, period_month) DO UPDATE SET
    tasks_completed     = COALESCE(EXCLUDED.tasks_completed, squad_performance_snapshots.tasks_completed),
    tasks_total         = COALESCE(EXCLUDED.tasks_total, squad_performance_snapshots.tasks_total),
    tasks_on_time       = COALESCE(EXCLUDED.tasks_on_time, squad_performance_snapshots.tasks_on_time),
    quality_score       = COALESCE(p_quality_score, squad_performance_snapshots.quality_score),
    collaboration_score = COALESCE(p_collaboration_score, squad_performance_snapshots.collaboration_score),
    notes               = COALESCE(EXCLUDED.notes, squad_performance_snapshots.notes),
    updated_at          = now()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

-- ------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  CREATE TRIGGER trg_squads_updated_at
    BEFORE UPDATE ON public.squads
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_squad_goals_updated_at
    BEFORE UPDATE ON public.squad_goals
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_squad_perf_updated_at
    BEFORE UPDATE ON public.squad_performance_snapshots
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.squads                       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_goals                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_performance_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_projects               ENABLE ROW LEVEL SECURITY;

-- Helper: verifica membership de agência
CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
      AND status = 'active'
  )
$$;

-- Helper: verifica se é admin/owner de agência
CREATE OR REPLACE FUNCTION public.is_agency_admin(p_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members am
    JOIN public.roles r ON r.id = am.role_id
    WHERE am.agency_id = p_agency_id
      AND am.user_id = auth.uid()
      AND am.status = 'active'
      AND r.name IN ('OWNER', 'ADMIN')
  )
$$;

-- ---- SQUADS policies ----
DROP POLICY IF EXISTS "squads_select" ON public.squads;
CREATE POLICY "squads_select" ON public.squads
  FOR SELECT USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "squads_insert" ON public.squads;
CREATE POLICY "squads_insert" ON public.squads
  FOR INSERT WITH CHECK (public.is_agency_admin(agency_id));

DROP POLICY IF EXISTS "squads_update" ON public.squads;
CREATE POLICY "squads_update" ON public.squads
  FOR UPDATE USING (public.is_agency_admin(agency_id));

DROP POLICY IF EXISTS "squads_delete" ON public.squads;
CREATE POLICY "squads_delete" ON public.squads
  FOR DELETE USING (public.is_agency_admin(agency_id));

-- ---- SQUAD MEMBERS policies ----
DROP POLICY IF EXISTS "squad_members_select" ON public.squad_members;
CREATE POLICY "squad_members_select" ON public.squad_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_member(s.agency_id)
    )
  );

DROP POLICY IF EXISTS "squad_members_insert" ON public.squad_members;
CREATE POLICY "squad_members_insert" ON public.squad_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_admin(s.agency_id)
    )
  );

DROP POLICY IF EXISTS "squad_members_delete" ON public.squad_members;
CREATE POLICY "squad_members_delete" ON public.squad_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_admin(s.agency_id)
    )
  );

-- ---- SQUAD GOALS policies ----
DROP POLICY IF EXISTS "squad_goals_select" ON public.squad_goals;
CREATE POLICY "squad_goals_select" ON public.squad_goals
  FOR SELECT USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "squad_goals_insert" ON public.squad_goals;
CREATE POLICY "squad_goals_insert" ON public.squad_goals
  FOR INSERT WITH CHECK (public.is_agency_admin(agency_id));

DROP POLICY IF EXISTS "squad_goals_update" ON public.squad_goals;
CREATE POLICY "squad_goals_update" ON public.squad_goals
  FOR UPDATE USING (public.is_agency_admin(agency_id));

DROP POLICY IF EXISTS "squad_goals_delete" ON public.squad_goals;
CREATE POLICY "squad_goals_delete" ON public.squad_goals
  FOR DELETE USING (public.is_agency_admin(agency_id));

-- ---- SQUAD PERFORMANCE SNAPSHOTS policies ----
DROP POLICY IF EXISTS "squad_perf_select" ON public.squad_performance_snapshots;
CREATE POLICY "squad_perf_select" ON public.squad_performance_snapshots
  FOR SELECT USING (public.is_agency_member(agency_id));

DROP POLICY IF EXISTS "squad_perf_insert" ON public.squad_performance_snapshots;
CREATE POLICY "squad_perf_insert" ON public.squad_performance_snapshots
  FOR INSERT WITH CHECK (public.is_agency_admin(agency_id));

DROP POLICY IF EXISTS "squad_perf_update" ON public.squad_performance_snapshots;
CREATE POLICY "squad_perf_update" ON public.squad_performance_snapshots
  FOR UPDATE USING (public.is_agency_admin(agency_id));

-- ---- SQUAD PROJECTS policies ----
DROP POLICY IF EXISTS "squad_projects_select" ON public.squad_projects;
CREATE POLICY "squad_projects_select" ON public.squad_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_member(s.agency_id)
    )
  );

DROP POLICY IF EXISTS "squad_projects_insert" ON public.squad_projects;
CREATE POLICY "squad_projects_insert" ON public.squad_projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_admin(s.agency_id)
    )
  );

DROP POLICY IF EXISTS "squad_projects_delete" ON public.squad_projects;
CREATE POLICY "squad_projects_delete" ON public.squad_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.squads s
      WHERE s.id = squad_id AND public.is_agency_admin(s.agency_id)
    )
  );

-- ------------------------------------------------------------
-- NOVAS PERMISSÕES DA FASE 05
-- ------------------------------------------------------------
INSERT INTO public.permissions (permission_key, module, description)
VALUES
  ('squads.view',           'squads', 'Visualizar squads e membros'),
  ('squads.manage',         'squads', 'Criar, editar e arquivar squads'),
  ('squads.manage_members', 'squads', 'Adicionar e remover membros de squads'),
  ('squads.view_goals',     'squads', 'Visualizar metas de squads'),
  ('squads.manage_goals',   'squads', 'Criar e gerenciar metas de squads'),
  ('squads.view_ranking',   'squads', 'Visualizar ranking de performance'),
  ('squads.manage_perf',    'squads', 'Registrar e editar métricas de performance')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description, module = EXCLUDED.module;

-- Atribuir permissões para papéis do sistema existentes
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT id AS role_id, name AS role_name
    FROM public.roles
    WHERE is_system = true
      AND name IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  LOOP
    IF rec.role_name IN ('OWNER', 'ADMIN') THEN
      INSERT INTO public.role_permissions (role_id, permission_id, allowed)
      SELECT rec.role_id, p.id, true
      FROM public.permissions p
      WHERE p.permission_key IN (
        'squads.view', 'squads.manage', 'squads.manage_members',
        'squads.view_goals', 'squads.manage_goals',
        'squads.view_ranking', 'squads.manage_perf'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    ELSIF rec.role_name = 'MANAGER' THEN
      INSERT INTO public.role_permissions (role_id, permission_id, allowed)
      SELECT rec.role_id, p.id, true
      FROM public.permissions p
      WHERE p.permission_key IN (
        'squads.view', 'squads.manage_members',
        'squads.view_goals', 'squads.manage_goals',
        'squads.view_ranking'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    ELSIF rec.role_name = 'MEMBER' THEN
      INSERT INTO public.role_permissions (role_id, permission_id, allowed)
      SELECT rec.role_id, p.id, true
      FROM public.permissions p
      WHERE p.permission_key IN (
        'squads.view', 'squads.view_goals', 'squads.view_ranking'
      )
      ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;
