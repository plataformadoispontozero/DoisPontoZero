-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- MIGRATION: 20261010000002_phase04_projects_tasks.sql
-- FASE 04: PROJECT MANAGEMENT + KANBAN + TASK SYSTEM
-- ============================================================

-- ------------------------------------------------------------
-- EXTENSÕES ADICIONAIS
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- NOVAS PERMISSÕES DA FASE 04
-- ------------------------------------------------------------
INSERT INTO public.permissions (permission_key, module, description)
VALUES
  ('tasks.comment',          'tasks',    'Adicionar e editar comentários em tarefas'),
  ('tasks.manage_checklists','tasks',    'Criar e gerenciar checklists de tarefas'),
  ('tasks.move',             'tasks',    'Mover tarefas entre colunas do Kanban'),
  ('tasks.review',           'tasks',    'Executar revisão interna de tarefas'),
  ('projects.manage_boards', 'projects', 'Criar e configurar quadros e colunas de projetos')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description, module = EXCLUDED.module;

-- Adicionar novas permissões a papéis existentes
-- OWNER e ADMIN recebem todas as novas permissões automaticamente
-- via bootstrap_agency (já recebem todas as permissions)
-- Para papéis criados antes desta migration, inserimos aqui:

-- Adiciona novas permissões para ADMIN e MANAGER e MEMBER em agências já existentes
DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT r.id AS role_id, r.name AS role_name
    FROM public.roles r
    WHERE r.is_system = true
      AND r.name IN ('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  LOOP
    INSERT INTO public.role_permissions (role_id, permission_id, allowed)
    SELECT rec.role_id, p.id, true
    FROM public.permissions p
    WHERE p.permission_key IN (
      'tasks.comment', 'tasks.manage_checklists', 'tasks.move',
      'tasks.review', 'projects.manage_boards'
    )
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END;
$$;

-- ------------------------------------------------------------
-- TABELA: clients (Fase 03 — se não existir ainda)
-- Referenciada por projects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  logo_url    TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_client_slug_per_agency UNIQUE (agency_id, slug)
);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;
CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON public.clients (agency_id);

-- RLS para clients (se a tabela foi criada agora)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_select'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "clients_select"
        ON public.clients FOR SELECT
        USING (public.is_agency_member(agency_id))
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_insert'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "clients_insert"
        ON public.clients FOR INSERT
        WITH CHECK (
          public.has_agency_permission(agency_id, 'clients.create')
          OR public.is_agency_owner(agency_id)
        )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_update'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "clients_update"
        ON public.clients FOR UPDATE
        USING (
          public.has_agency_permission(agency_id, 'clients.edit')
          OR public.is_agency_owner(agency_id)
        )
        WITH CHECK (
          public.has_agency_permission(agency_id, 'clients.edit')
          OR public.is_agency_owner(agency_id)
        )
    $pol$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'clients' AND policyname = 'clients_delete'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "clients_delete"
        ON public.clients FOR DELETE
        USING (
          public.has_agency_permission(agency_id, 'clients.delete')
          OR public.is_agency_owner(agency_id)
        )
    $pol$;
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- TABELA: projects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id    UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'planning'
                 CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
  priority     TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  start_date   DATE,
  due_date     DATE,
  owner_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at  TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_projects_agency_id  ON public.projects (agency_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_id  ON public.projects (client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status     ON public.projects (status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date   ON public.projects (due_date);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id   ON public.projects (owner_id);

-- ------------------------------------------------------------
-- TABELA: project_members
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id    ON public.project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_agency_id  ON public.project_members (agency_id);

-- ------------------------------------------------------------
-- TABELA: project_boards
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Quadro Principal',
  is_default  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_project_boards_updated_at ON public.project_boards;
CREATE TRIGGER trg_project_boards_updated_at
  BEFORE UPDATE ON public.project_boards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_project_boards_project_id ON public.project_boards (project_id);

-- ------------------------------------------------------------
-- TABELA: board_columns
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.board_columns (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  board_id    UUID NOT NULL REFERENCES public.project_boards(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  color       TEXT NOT NULL DEFAULT '#30303B',
  category    TEXT NOT NULL DEFAULT 'backlog'
                CHECK (category IN ('backlog', 'in_progress', 'review', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_board_columns_updated_at ON public.board_columns;
CREATE TRIGGER trg_board_columns_updated_at
  BEFORE UPDATE ON public.board_columns
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_board_columns_board_id   ON public.board_columns (board_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_agency_id  ON public.board_columns (agency_id);

-- ------------------------------------------------------------
-- TABELA: tasks
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  project_id      UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  board_id        UUID NOT NULL REFERENCES public.project_boards(id) ON DELETE CASCADE,
  column_id       UUID NOT NULL REFERENCES public.board_columns(id) ON DELETE RESTRICT,
  parent_task_id  UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT NOT NULL DEFAULT 'normal'
                    CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_progress', 'review', 'done', 'archived')),
  position        DOUBLE PRECISION NOT NULL DEFAULT 0,
  start_date      DATE,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at     TIMESTAMPTZ,

  -- Garante que subtarefa não é circular: parent não pode ter parent
  -- (limitado a 1 nível por constraint funcional na aplicação)
  CONSTRAINT task_no_self_parent CHECK (id != parent_task_id)
);

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_tasks_agency_id       ON public.tasks (agency_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id      ON public.tasks (project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id       ON public.tasks (column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board_id        ON public.tasks (board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON public.tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status          ON public.tasks (status);
CREATE INDEX IF NOT EXISTS idx_tasks_position        ON public.tasks (column_id, position);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id  ON public.tasks (parent_task_id);

-- ------------------------------------------------------------
-- TABELA: task_assignees
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_assignees (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id      UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_task_assignee UNIQUE (task_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees (task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees (user_id);

-- ------------------------------------------------------------
-- TABELA: task_checklists
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_checklists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'Checklist',
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_checklists_task_id ON public.task_checklists (task_id);

-- ------------------------------------------------------------
-- TABELA: task_checklist_items
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_checklist_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id      UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  checklist_id   UUID NOT NULL REFERENCES public.task_checklists(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  is_completed   BOOLEAN NOT NULL DEFAULT false,
  completed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at   TIMESTAMPTZ,
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_task_checklist_items_updated_at ON public.task_checklist_items;
CREATE TRIGGER trg_task_checklist_items_updated_at
  BEFORE UPDATE ON public.task_checklist_items
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_task_checklist_items_checklist_id ON public.task_checklist_items (checklist_id);

-- ------------------------------------------------------------
-- TABELA: task_comments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ  -- Exclusão lógica
);

DROP TRIGGER IF EXISTS trg_task_comments_updated_at ON public.task_comments;
CREATE TRIGGER trg_task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON public.task_comments (task_id);

-- ------------------------------------------------------------
-- TABELA: task_attachments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id       UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  storage_path  TEXT NOT NULL,
  mime_type     TEXT,
  file_size     BIGINT,
  uploaded_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON public.task_attachments (task_id);

-- ------------------------------------------------------------
-- TABELA: task_links
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_links_task_id ON public.task_links (task_id);

-- ------------------------------------------------------------
-- TABELA: task_activity (Histórico imutável)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_activity (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id       UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id         UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  actor_user_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,  -- 'created', 'updated', 'moved', 'assigned', 'priority_changed', 'completed', etc.
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_activity_task_id    ON public.task_activity (task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_agency_id  ON public.task_activity (agency_id);

-- ------------------------------------------------------------
-- TABELA: task_reviews (Revisões e aprovações internas)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.task_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id    UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  task_id      UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'changes_requested')),
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_task_reviews_updated_at ON public.task_reviews;
CREATE TRIGGER trg_task_reviews_updated_at
  BEFORE UPDATE ON public.task_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_task_reviews_task_id ON public.task_reviews (task_id);

-- ============================================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA — PROJETOS E TAREFAS
-- ============================================================

-- Verifica se auth.uid() tem acesso ao projeto
-- OWNER/ADMIN: acesso a todos os projetos da agência
-- Outros: apenas projetos dos quais é membro
CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  SELECT agency_id INTO v_agency_id
  FROM public.projects
  WHERE id = p_project_id;

  IF v_agency_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- OWNER e ADMIN enxergam todos os projetos
  IF public.is_agency_owner(v_agency_id) THEN
    RETURN TRUE;
  END IF;

  -- Verifica se é membro do projeto
  RETURN EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = p_project_id
      AND pm.user_id = auth.uid()
  ) OR EXISTS (
    -- Criador do projeto também tem acesso
    SELECT 1 FROM public.projects p
    WHERE p.id = p_project_id AND p.created_by = auth.uid()
  ) OR EXISTS (
    -- ADMIN da agência também tem acesso
    SELECT 1 FROM public.agency_members m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.agency_id = v_agency_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND r.name = 'ADMIN'
  );
END;
$$;

-- Verifica se auth.uid() pode acessar uma tarefa
CREATE OR REPLACE FUNCTION public.can_access_task(p_task_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT project_id INTO v_project_id
  FROM public.tasks
  WHERE id = p_task_id;

  IF v_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_access_project(v_project_id);
END;
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- A. PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  USING (public.can_access_project(id));

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  WITH CHECK (
    public.is_agency_member(agency_id)
    AND (
      public.has_agency_permission(agency_id, 'projects.create')
      OR public.is_agency_owner(agency_id)
    )
    -- Garante que o client_id pertence à mesma agência
    AND (
      client_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.clients c
        WHERE c.id = client_id AND c.agency_id = projects.agency_id
      )
    )
  );

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  USING (
    can_access_project(id)
    AND (
      has_agency_permission(agency_id, 'projects.edit')
      OR is_agency_owner(agency_id)
      OR owner_id = auth.uid()
    )
  )
  WITH CHECK (
    can_access_project(id)
    AND (
      has_agency_permission(agency_id, 'projects.edit')
      OR is_agency_owner(agency_id)
      OR owner_id = auth.uid()
    )
  );

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  USING (
    has_agency_permission(agency_id, 'projects.delete')
    OR is_agency_owner(agency_id)
  );

-- B. PROJECT_MEMBERS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_members_select"
  ON public.project_members FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "project_members_insert"
  ON public.project_members FOR INSERT
  WITH CHECK (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'projects.manage_members')
      OR is_agency_owner(agency_id)
    )
    -- Garante que o usuário adicionado é membro da mesma agência
    AND EXISTS (
      SELECT 1 FROM public.agency_members am
      WHERE am.agency_id = project_members.agency_id
        AND am.user_id = project_members.user_id
        AND am.status = 'active'
    )
  );

CREATE POLICY "project_members_delete"
  ON public.project_members FOR DELETE
  USING (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'projects.manage_members')
      OR is_agency_owner(agency_id)
    )
  );

-- C. PROJECT_BOARDS
ALTER TABLE public.project_boards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_boards_select"
  ON public.project_boards FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "project_boards_insert"
  ON public.project_boards FOR INSERT
  WITH CHECK (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "project_boards_update"
  ON public.project_boards FOR UPDATE
  USING (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  )
  WITH CHECK (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  );

-- D. BOARD_COLUMNS
ALTER TABLE public.board_columns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_columns_select"
  ON public.board_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.project_boards pb
      WHERE pb.id = board_id
        AND can_access_project(pb.project_id)
    )
  );

CREATE POLICY "board_columns_insert"
  ON public.board_columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_boards pb
      WHERE pb.id = board_id
        AND can_access_project(pb.project_id)
    )
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "board_columns_update"
  ON public.board_columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_boards pb
      WHERE pb.id = board_id
        AND can_access_project(pb.project_id)
    )
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_boards pb
      WHERE pb.id = board_id
        AND can_access_project(pb.project_id)
    )
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "board_columns_delete"
  ON public.board_columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.project_boards pb
      WHERE pb.id = board_id
        AND can_access_project(pb.project_id)
    )
    AND (
      has_agency_permission(agency_id, 'projects.manage_boards')
      OR is_agency_owner(agency_id)
    )
    -- Impede deletar coluna com tarefas (deve mover antes)
    AND NOT EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.column_id = board_columns.id
        AND t.archived_at IS NULL
    )
  );

-- E. TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  USING (can_access_project(project_id));

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  WITH CHECK (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'tasks.create')
      OR is_agency_owner(agency_id)
    )
    -- Garante que coluna pertence ao board do projeto
    AND EXISTS (
      SELECT 1 FROM public.board_columns bc
      JOIN public.project_boards pb ON pb.id = bc.board_id
      WHERE bc.id = tasks.column_id
        AND pb.project_id = tasks.project_id
    )
    -- Subtarefa deve estar no mesmo projeto
    AND (
      parent_task_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.tasks pt
        WHERE pt.id = parent_task_id
          AND pt.project_id = tasks.project_id
          AND pt.parent_task_id IS NULL  -- Apenas 1 nível
      )
    )
  );

CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  USING (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'tasks.edit')
      OR is_agency_owner(agency_id)
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = tasks.id AND ta.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'tasks.edit')
      OR is_agency_owner(agency_id)
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = tasks.id AND ta.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  USING (
    can_access_project(project_id)
    AND (
      has_agency_permission(agency_id, 'tasks.delete')
      OR is_agency_owner(agency_id)
    )
  );

-- F. TASK_ASSIGNEES
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_assignees_select"
  ON public.task_assignees FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_assignees_insert"
  ON public.task_assignees FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND (
      has_agency_permission(agency_id, 'tasks.assign')
      OR is_agency_owner(agency_id)
    )
    -- Usuário atribuído deve ser membro do projeto
    AND EXISTS (
      SELECT 1 FROM public.project_members pm
      JOIN public.tasks t ON t.project_id = pm.project_id
      WHERE t.id = task_assignees.task_id
        AND pm.user_id = task_assignees.user_id
    )
  );

CREATE POLICY "task_assignees_delete"
  ON public.task_assignees FOR DELETE
  USING (
    can_access_task(task_id)
    AND (
      has_agency_permission(agency_id, 'tasks.assign')
      OR is_agency_owner(agency_id)
    )
  );

-- G. TASK_CHECKLISTS
ALTER TABLE public.task_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_checklists_select"
  ON public.task_checklists FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_checklists_insert"
  ON public.task_checklists FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND (
      has_agency_permission(agency_id, 'tasks.manage_checklists')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "task_checklists_update"
  ON public.task_checklists FOR UPDATE
  USING (can_access_task(task_id))
  WITH CHECK (can_access_task(task_id));

CREATE POLICY "task_checklists_delete"
  ON public.task_checklists FOR DELETE
  USING (
    can_access_task(task_id)
    AND (
      has_agency_permission(agency_id, 'tasks.manage_checklists')
      OR is_agency_owner(agency_id)
    )
  );

-- H. TASK_CHECKLIST_ITEMS
ALTER TABLE public.task_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_checklist_items_select"
  ON public.task_checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.task_checklists tc
      WHERE tc.id = checklist_id AND can_access_task(tc.task_id)
    )
  );

CREATE POLICY "task_checklist_items_all"
  ON public.task_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.task_checklists tc
      WHERE tc.id = checklist_id AND can_access_task(tc.task_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.task_checklists tc
      WHERE tc.id = checklist_id AND can_access_task(tc.task_id)
    )
  );

-- I. TASK_COMMENTS
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_comments_select"
  ON public.task_comments FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_comments_insert"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND author_id = auth.uid()
    AND (
      has_agency_permission(agency_id, 'tasks.comment')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "task_comments_update"
  ON public.task_comments FOR UPDATE
  USING (
    can_access_task(task_id)
    AND author_id = auth.uid()  -- Somente próprio autor pode editar
  )
  WITH CHECK (
    can_access_task(task_id)
    AND author_id = auth.uid()
  );

CREATE POLICY "task_comments_delete"
  ON public.task_comments FOR DELETE
  USING (
    can_access_task(task_id)
    AND (
      author_id = auth.uid()
      OR is_agency_owner(agency_id)
      OR has_agency_permission(agency_id, 'tasks.delete')
    )
  );

-- J. TASK_ATTACHMENTS
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_attachments_select"
  ON public.task_attachments FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_attachments_insert"
  ON public.task_attachments FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND uploaded_by = auth.uid()
    AND (
      has_agency_permission(agency_id, 'tasks.edit')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "task_attachments_delete"
  ON public.task_attachments FOR DELETE
  USING (
    can_access_task(task_id)
    AND (
      uploaded_by = auth.uid()
      OR is_agency_owner(agency_id)
    )
  );

-- K. TASK_LINKS
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_links_select"
  ON public.task_links FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_links_insert"
  ON public.task_links FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND created_by = auth.uid()
    AND (
      has_agency_permission(agency_id, 'tasks.edit')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "task_links_delete"
  ON public.task_links FOR DELETE
  USING (
    can_access_task(task_id)
    AND (
      created_by = auth.uid()
      OR is_agency_owner(agency_id)
    )
  );

-- L. TASK_ACTIVITY (Histórico imutável)
ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_activity_select"
  ON public.task_activity FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_activity_insert"
  ON public.task_activity FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND is_agency_member(agency_id)
  );

-- M. TASK_REVIEWS
ALTER TABLE public.task_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_reviews_select"
  ON public.task_reviews FOR SELECT
  USING (can_access_task(task_id));

CREATE POLICY "task_reviews_insert"
  ON public.task_reviews FOR INSERT
  WITH CHECK (
    can_access_task(task_id)
    AND reviewer_id = auth.uid()
    AND (
      has_agency_permission(agency_id, 'tasks.review')
      OR is_agency_owner(agency_id)
    )
  );

CREATE POLICY "task_reviews_update"
  ON public.task_reviews FOR UPDATE
  USING (
    can_access_task(task_id)
    AND reviewer_id = auth.uid()
  )
  WITH CHECK (
    can_access_task(task_id)
    AND reviewer_id = auth.uid()
  );

-- ============================================================
-- RPC: CRIAÇÃO TRANSACIONAL DE PROJETO COM BOARD E COLUNAS
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_project_with_board(
  p_agency_id    UUID,
  p_client_id    UUID,
  p_name         TEXT,
  p_description  TEXT,
  p_priority     TEXT,
  p_status       TEXT,
  p_start_date   DATE,
  p_due_date     DATE,
  p_owner_id     UUID,
  p_member_ids   UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id  UUID;
  v_board_id    UUID;
  v_col_pos     INTEGER := 0;
  v_member_id   UUID;
BEGIN
  -- 1. Valida permissão
  IF NOT (
    public.has_agency_permission(p_agency_id, 'projects.create')
    OR public.is_agency_owner(p_agency_id)
  ) THEN
    RAISE EXCEPTION 'Permissão negada: projects.create';
  END IF;

  -- 2. Cria o projeto
  INSERT INTO public.projects (
    agency_id, client_id, name, description, priority,
    status, start_date, due_date, owner_id, created_by
  ) VALUES (
    p_agency_id, p_client_id, p_name, p_description, COALESCE(p_priority, 'normal'),
    COALESCE(p_status, 'planning'), p_start_date, p_due_date,
    p_owner_id, auth.uid()
  ) RETURNING id INTO v_project_id;

  -- 3. Cria o quadro padrão
  INSERT INTO public.project_boards (agency_id, project_id, name, is_default)
  VALUES (p_agency_id, v_project_id, 'Quadro Principal', true)
  RETURNING id INTO v_board_id;

  -- 4. Cria as colunas padrão
  INSERT INTO public.board_columns (agency_id, board_id, name, position, color, category)
  VALUES
    (p_agency_id, v_board_id, 'Backlog',              0, '#30303B', 'backlog'),
    (p_agency_id, v_board_id, 'Planejamento',         1, '#4A4A5A', 'backlog'),
    (p_agency_id, v_board_id, 'Em produção',          2, '#7952FF', 'in_progress'),
    (p_agency_id, v_board_id, 'Revisão interna',      3, '#FBBF24', 'review'),
    (p_agency_id, v_board_id, 'Aguardando aprovação', 4, '#FB923C', 'review'),
    (p_agency_id, v_board_id, 'Concluído',            5, '#34D399', 'done');

  -- 5. Adiciona o criador como membro
  INSERT INTO public.project_members (agency_id, project_id, user_id)
  VALUES (p_agency_id, v_project_id, auth.uid())
  ON CONFLICT (project_id, user_id) DO NOTHING;

  -- 6. Adiciona o owner como membro (se diferente)
  IF p_owner_id IS NOT NULL AND p_owner_id != auth.uid() THEN
    INSERT INTO public.project_members (agency_id, project_id, user_id)
    VALUES (p_agency_id, v_project_id, p_owner_id)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;

  -- 7. Adiciona os demais membros
  IF p_member_ids IS NOT NULL THEN
    FOREACH v_member_id IN ARRAY p_member_ids LOOP
      INSERT INTO public.project_members (agency_id, project_id, user_id)
      VALUES (p_agency_id, v_project_id, v_member_id)
      ON CONFLICT (project_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  -- 8. Registra atividade
  INSERT INTO public.audit_logs (agency_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    p_agency_id, auth.uid(), 'create_project', 'project',
    v_project_id::text,
    jsonb_build_object('project_name', p_name, 'status', COALESCE(p_status, 'planning'))
  );

  RETURN v_project_id;
END;
$$;

-- ============================================================
-- RPC: MOVER TAREFA ENTRE COLUNAS (com controle de posição)
-- ============================================================
CREATE OR REPLACE FUNCTION public.move_task(
  p_task_id      UUID,
  p_column_id    UUID,
  p_position     DOUBLE PRECISION
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task        RECORD;
  v_old_col_name TEXT;
  v_new_col_name TEXT;
BEGIN
  SELECT t.*, bc.name AS col_name
  INTO v_task
  FROM public.tasks t
  JOIN public.board_columns bc ON bc.id = t.column_id
  WHERE t.id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tarefa não encontrada';
  END IF;

  -- Verifica permissão de movimentação
  IF NOT (
    public.can_access_project(v_task.project_id)
    AND (
      public.has_agency_permission(v_task.agency_id, 'tasks.move')
      OR public.is_agency_owner(v_task.agency_id)
      OR v_task.created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.task_assignees ta
        WHERE ta.task_id = p_task_id AND ta.user_id = auth.uid()
      )
    )
  ) THEN
    RAISE EXCEPTION 'Permissão negada para mover esta tarefa';
  END IF;

  -- Verifica que a nova coluna pertence ao mesmo board
  IF NOT EXISTS (
    SELECT 1 FROM public.board_columns bc
    WHERE bc.id = p_column_id AND bc.board_id = v_task.board_id
  ) THEN
    RAISE EXCEPTION 'Coluna de destino não pertence ao mesmo quadro';
  END IF;

  -- Obtém nome das colunas para o log
  SELECT name INTO v_old_col_name FROM public.board_columns WHERE id = v_task.column_id;
  SELECT name INTO v_new_col_name FROM public.board_columns WHERE id = p_column_id;

  -- Atualiza a tarefa
  UPDATE public.tasks
  SET
    column_id    = p_column_id,
    position     = p_position,
    updated_at   = now(),
    -- Atualiza completed_at se chegou em coluna done
    completed_at = CASE
      WHEN (
        SELECT category FROM public.board_columns WHERE id = p_column_id
      ) = 'done' AND completed_at IS NULL THEN now()
      WHEN (
        SELECT category FROM public.board_columns WHERE id = p_column_id
      ) != 'done' THEN NULL
      ELSE completed_at
    END
  WHERE id = p_task_id;

  -- Registra atividade
  INSERT INTO public.task_activity (agency_id, task_id, actor_user_id, action, metadata)
  VALUES (
    v_task.agency_id, p_task_id, auth.uid(), 'moved',
    jsonb_build_object(
      'from_column', v_old_col_name,
      'to_column', v_new_col_name,
      'from_column_id', v_task.column_id,
      'to_column_id', p_column_id
    )
  );
END;
$$;

-- ============================================================
-- RPC: CALCULAR PROGRESSO DO PROJETO
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_project_progress(p_project_id UUID)
RETURNS TABLE(
  total_tasks     INTEGER,
  done_tasks      INTEGER,
  progress_pct    NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*)::INTEGER AS total_tasks,
    COUNT(*) FILTER (
      WHERE bc.category = 'done' AND t.archived_at IS NULL
    )::INTEGER AS done_tasks,
    CASE
      WHEN COUNT(*) FILTER (WHERE t.archived_at IS NULL) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE bc.category = 'done' AND t.archived_at IS NULL)::NUMERIC
        / COUNT(*) FILTER (WHERE t.archived_at IS NULL)::NUMERIC * 100,
        1
      )
    END AS progress_pct
  FROM public.tasks t
  JOIN public.board_columns bc ON bc.id = t.column_id
  WHERE t.project_id = p_project_id
    AND t.parent_task_id IS NULL  -- Somente tarefas raiz
    AND t.archived_at IS NULL;
$$;
