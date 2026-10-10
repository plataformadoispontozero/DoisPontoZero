-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- MIGRATION: 20261010000001_phase02_schema_and_rls.sql
-- FASE 02: MULTI-AGENCY ARCHITECTURE, ROLES, PERMISSIONS & RLS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. TABELA: profiles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger para manter updated_at atualizado
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 2. TABELA: agencies (Multiagência)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  symbol_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agencies_updated_at ON public.agencies;
CREATE TRIGGER trg_agencies_updated_at
  BEFORE UPDATE ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 3. TABELA: roles (Papéis pertencentes à agência)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_agency_role_name UNIQUE (agency_id, name)
);

-- ------------------------------------------------------------
-- 4. TABELA: agency_members (Associação usuário <-> agência)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_agency_user UNIQUE (agency_id, user_id)
);

-- ------------------------------------------------------------
-- 5. TABELA: permissions (Catálogo global de permissões)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_key TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT NOT NULL
);

-- ------------------------------------------------------------
-- 6. TABELA: role_permissions (Vínculo Papel <-> Permissões)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  allowed BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

-- ------------------------------------------------------------
-- 7. TABELA: agency_invitations (Convites seguros com hash)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 8. TABELA: agency_settings (Configurações flexíveis JSONB)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_agency_settings_updated_at ON public.agency_settings;
CREATE TRIGGER trg_agency_settings_updated_at
  BEFORE UPDATE ON public.agency_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- ------------------------------------------------------------
-- 9. TABELA: audit_logs (Trilha de auditoria imutável)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 10. SEED: CATÁLOGO DE PERMISSÕES OFICIAL
-- ------------------------------------------------------------
INSERT INTO public.permissions (permission_key, module, description)
VALUES
  -- Dashboard
  ('dashboard.view', 'dashboard', 'Visualizar o painel de controle operacional e métricas'),

  -- Clientes
  ('clients.view', 'clients', 'Visualizar carteira de clientes e marcas'),
  ('clients.create', 'clients', 'Cadastrar novas contas e clientes'),
  ('clients.edit', 'clients', 'Editar informações cadastrais e dados de clientes'),
  ('clients.delete', 'clients', 'Excluir registros de clientes'),

  -- Projetos
  ('projects.view', 'projects', 'Visualizar workflows e listas de projetos criativos'),
  ('projects.create', 'projects', 'Criar novos projetos e cronogramas'),
  ('projects.edit', 'projects', 'Editar parâmetros, status e prazos de projetos'),
  ('projects.delete', 'projects', 'Remover projetos da agência'),
  ('projects.manage_members', 'projects', 'Alocar membros e squads em projetos'),

  -- Tarefas
  ('tasks.view', 'tasks', 'Visualizar fila de tarefas e entregáveis'),
  ('tasks.create', 'tasks', 'Criar novas tarefas de produção criativa'),
  ('tasks.edit', 'tasks', 'Editar tarefas, status e checklists'),
  ('tasks.delete', 'tasks', 'Excluir tarefas de produção'),
  ('tasks.assign', 'tasks', 'Atribuir tarefas para membros da equipe'),

  -- Squads
  ('squads.view', 'squads', 'Visualizar times e capacidade dos squads'),
  ('squads.create', 'squads', 'Estruturar novos squads multidisciplinares'),
  ('squads.edit', 'squads', 'Alterar líderes e membros de squads'),
  ('squads.delete', 'squads', 'Remover squads da organização'),
  ('squads.manage_members', 'squads', 'Gerenciar alocações internas de squads'),

  -- Briefings
  ('briefings.view', 'briefings', 'Visualizar briefings recebidos e modelos'),
  ('briefings.create', 'briefings', 'Criar modelos e preencher novos briefings'),
  ('briefings.edit', 'briefings', 'Alterar dados de briefings e formulários'),
  ('briefings.delete', 'briefings', 'Excluir formulários e briefings arquivados'),
  ('briefings.export', 'briefings', 'Exportar briefings para PDF ou clientes'),

  -- Estratégia
  ('strategy.view', 'strategy', 'Visualizar diagnósticos, personas e planejamento'),
  ('strategy.create', 'strategy', 'Criar planos estratégicos e mapas conceituais'),
  ('strategy.edit', 'strategy', 'Atualizar dados estratégicos e direcionais'),
  ('strategy.approve', 'strategy', 'Aprovar diagnósticos e direcionais de marca'),

  -- Propostas
  ('proposals.view', 'proposals', 'Visualizar propostas comerciais e orçamentos'),
  ('proposals.create', 'proposals', 'Gerar novas propostas comerciais'),
  ('proposals.edit', 'proposals', 'Editar escopo, valores e itens orçamentários'),
  ('proposals.approve', 'proposals', 'Aprovar propostas internamente antes do envio'),
  ('proposals.export', 'proposals', 'Gerar links interativos e exportação de proposta'),

  -- Reuniões
  ('meetings.view', 'meetings', 'Visualizar calendário de alinhamentos e reuniões'),
  ('meetings.create', 'meetings', 'Agendar reuniões e gerar links de chamada'),
  ('meetings.edit', 'meetings', 'Editar pautas e atas de decisão'),
  ('meetings.delete', 'meetings', 'Cancelar ou excluir reuniões agendadas'),

  -- Chat
  ('chat.access', 'chat', 'Acessar canais de comunicação da agência'),
  ('chat.create_channels', 'chat', 'Criar novos canais por projeto ou squad'),
  ('chat.manage_channels', 'chat', 'Gerenciar e arquivar canais de discussão'),

  -- Apresentações
  ('presentations.view', 'presentations', 'Visualizar decks e pitches executivos'),
  ('presentations.create', 'presentations', 'Criar novas apresentações de defesa criativa'),
  ('presentations.edit', 'presentations', 'Editar slides, assets e roteiros'),
  ('presentations.publish', 'presentations', 'Publicar decks com link seguro para o cliente'),

  -- Equipe
  ('members.view', 'team', 'Visualizar colaboradores e convites da agência'),
  ('members.invite', 'team', 'Convidar novos membros para a equipe'),
  ('members.edit', 'team', 'Alterar papéis e permissões de membros da agência'),
  ('members.remove', 'team', 'Remover acesso de membros da agência'),

  -- Configurações
  ('settings.view', 'settings', 'Visualizar configurações do workspace'),
  ('settings.edit', 'settings', 'Editar preferências gerais e dados da agência'),
  ('branding.manage', 'settings', 'Customizar marca, logotipos e White Label'),
  ('permissions.manage', 'settings', 'Acessar e salvar matriz no Permission Studio'),

  -- Financeiro Futuro
  ('finance.view', 'finance', 'Visualizar relatórios financeiros da agência'),
  ('finance.manage', 'finance', 'Gerenciar contas, honorários e margens')
ON CONFLICT (permission_key) DO UPDATE
SET description = EXCLUDED.description, module = EXCLUDED.module;

-- ------------------------------------------------------------
-- 11. FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
-- ------------------------------------------------------------

-- Verifica se auth.uid() é membro ativo da agência
CREATE OR REPLACE FUNCTION public.is_agency_member(p_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members
    WHERE agency_id = p_agency_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
$$;

-- Verifica se auth.uid() é o OWNER da agência
CREATE OR REPLACE FUNCTION public.is_agency_owner(p_agency_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members m
    JOIN public.roles r ON r.id = m.role_id
    WHERE m.agency_id = p_agency_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND r.name = 'OWNER'
  );
$$;

-- Verifica se auth.uid() possui uma permissão específica na agência
CREATE OR REPLACE FUNCTION public.has_agency_permission(p_agency_id UUID, p_permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agency_members m
    JOIN public.roles r ON r.id = m.role_id
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE m.agency_id = p_agency_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND p.permission_key = p_permission_key
      AND rp.allowed = true
  ) OR public.is_agency_owner(p_agency_id);
$$;

-- ------------------------------------------------------------
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------

-- A. PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own_or_agency_peers"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.agency_members m1
      JOIN public.agency_members m2 ON m1.agency_id = m2.agency_id
      WHERE m1.user_id = auth.uid()
        AND m2.user_id = public.profiles.id
    )
  );

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- B. AGENCIES
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agencies_select_for_members"
  ON public.agencies FOR SELECT
  USING (public.is_agency_member(id));

CREATE POLICY "agencies_update_for_authorized"
  ON public.agencies FOR UPDATE
  USING (
    public.has_agency_permission(id, 'settings.edit')
    OR public.is_agency_owner(id)
  )
  WITH CHECK (
    public.has_agency_permission(id, 'settings.edit')
    OR public.is_agency_owner(id)
  );

-- C. AGENCY_MEMBERS
ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_members_select"
  ON public.agency_members FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_members_insert"
  ON public.agency_members FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'members.invite')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_members_update"
  ON public.agency_members FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'members.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'members.edit')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_members_delete"
  ON public.agency_members FOR DELETE
  USING (
    (
      public.has_agency_permission(agency_id, 'members.remove')
      OR public.is_agency_owner(agency_id)
    )
    -- Impede remover o último OWNER
    AND NOT (
      EXISTS (
        SELECT 1 FROM public.roles r
        WHERE r.id = public.agency_members.role_id
          AND r.name = 'OWNER'
      )
      AND (
        SELECT count(*)
        FROM public.agency_members am2
        JOIN public.roles r2 ON r2.id = am2.role_id
        WHERE am2.agency_id = public.agency_members.agency_id
          AND r2.name = 'OWNER'
      ) <= 1
    )
  );

-- D. ROLES
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_select"
  ON public.roles FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "roles_modify"
  ON public.roles FOR ALL
  USING (
    public.has_agency_permission(agency_id, 'permissions.manage')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'permissions.manage')
    OR public.is_agency_owner(agency_id)
  );

-- E. PERMISSIONS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "permissions_select_authenticated"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (true);

-- F. ROLE_PERMISSIONS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_permissions_select"
  ON public.role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = public.role_permissions.role_id
        AND public.is_agency_member(r.agency_id)
    )
  );

CREATE POLICY "role_permissions_modify"
  ON public.role_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = public.role_permissions.role_id
        AND (
          public.has_agency_permission(r.agency_id, 'permissions.manage')
          OR public.is_agency_owner(r.agency_id)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = public.role_permissions.role_id
        AND (
          public.has_agency_permission(r.agency_id, 'permissions.manage')
          OR public.is_agency_owner(r.agency_id)
        )
    )
  );

-- G. AGENCY_INVITATIONS
ALTER TABLE public.agency_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_invitations_select"
  ON public.agency_invitations FOR SELECT
  USING (
    public.has_agency_permission(agency_id, 'members.view')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_invitations_insert"
  ON public.agency_invitations FOR INSERT
  WITH CHECK (
    public.has_agency_permission(agency_id, 'members.invite')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "agency_invitations_update"
  ON public.agency_invitations FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'members.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'members.edit')
    OR public.is_agency_owner(agency_id)
  );

-- H. AGENCY_SETTINGS
ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_settings_select"
  ON public.agency_settings FOR SELECT
  USING (public.is_agency_member(agency_id));

CREATE POLICY "agency_settings_update"
  ON public.agency_settings FOR UPDATE
  USING (
    public.has_agency_permission(agency_id, 'settings.edit')
    OR public.is_agency_owner(agency_id)
  )
  WITH CHECK (
    public.has_agency_permission(agency_id, 'settings.edit')
    OR public.is_agency_owner(agency_id)
  );

-- I. AUDIT_LOGS (Imutável por usuários normais)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select"
  ON public.audit_logs FOR SELECT
  USING (
    public.has_agency_permission(agency_id, 'settings.view')
    OR public.is_agency_owner(agency_id)
  );

CREATE POLICY "audit_logs_insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_agency_member(agency_id));

-- ------------------------------------------------------------
-- 13. PROCEDIMENTO TRANSACIONAL: BOOTSTRAP DA PRIMEIRA AGÊNCIA E OWNER
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bootstrap_agency(
  p_agency_name TEXT,
  p_agency_slug TEXT,
  p_owner_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_manager_role_id UUID;
  v_member_role_id UUID;
  v_viewer_role_id UUID;
BEGIN
  -- 1. Cria a Agência
  INSERT INTO public.agencies (name, slug)
  VALUES (p_agency_name, p_agency_slug)
  RETURNING id INTO v_agency_id;

  -- 2. Cria os 5 Papéis Padrão para esta agência
  INSERT INTO public.roles (agency_id, name, description, is_system)
  VALUES
    (v_agency_id, 'OWNER', 'Proprietário com autoridade soberana e controle total', true)
  RETURNING id INTO v_owner_role_id;

  INSERT INTO public.roles (agency_id, name, description, is_system)
  VALUES
    (v_agency_id, 'ADMIN', 'Administrador com controle operacional e de equipe', true)
  RETURNING id INTO v_admin_role_id;

  INSERT INTO public.roles (agency_id, name, description, is_system)
  VALUES
    (v_agency_id, 'MANAGER', 'Gestor de projetos, clientes e squads', true)
  RETURNING id INTO v_manager_role_id;

  INSERT INTO public.roles (agency_id, name, description, is_system)
  VALUES
    (v_agency_id, 'MEMBER', 'Membro executor com acesso às ferramentas de produção', true)
  RETURNING id INTO v_member_role_id;

  INSERT INTO public.roles (agency_id, name, description, is_system)
  VALUES
    (v_agency_id, 'VIEWER', 'Visualizador com acesso apenas de consulta', true)
  RETURNING id INTO v_viewer_role_id;

  -- 3. Associa TODAS as permissões ao papel OWNER
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT v_owner_role_id, p.id, true
  FROM public.permissions p;

  -- 4. Associa permissões ao ADMIN (todas exceto exclusão crítica/soberana do owner)
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT v_admin_role_id, p.id, true
  FROM public.permissions p
  WHERE p.permission_key NOT IN ('finance.manage');

  -- 5. Associa permissões operacionais ao MANAGER
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT v_manager_role_id, p.id, true
  FROM public.permissions p
  WHERE p.module IN ('dashboard', 'clients', 'projects', 'tasks', 'squads', 'briefings', 'meetings', 'chat');

  -- 6. Associa permissões de produção ao MEMBER
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT v_member_role_id, p.id, true
  FROM public.permissions p
  WHERE p.permission_key IN (
    'dashboard.view', 'projects.view', 'tasks.view', 'tasks.edit',
    'squads.view', 'briefings.view', 'meetings.view', 'chat.access', 'presentations.view'
  );

  -- 7. Associa apenas leitura ao VIEWER
  INSERT INTO public.role_permissions (role_id, permission_id, allowed)
  SELECT v_viewer_role_id, p.id, true
  FROM public.permissions p
  WHERE p.permission_key LIKE '%.view' OR p.permission_key = 'chat.access';

  -- 8. Vincula o usuário criador como OWNER ativo da agência
  INSERT INTO public.agency_members (agency_id, user_id, role_id, status)
  VALUES (v_agency_id, p_owner_id, v_owner_role_id, 'active');

  -- 9. Inicializa as configurações padrão da agência
  INSERT INTO public.agency_settings (agency_id, settings)
  VALUES (v_agency_id, jsonb_build_object(
    'timezone', 'America/Sao_Paulo',
    'locale', 'pt-BR',
    'primary_color', '#7952FF',
    'accent_color', '#B8FF65'
  ));

  -- 10. Registra o evento no audit log
  INSERT INTO public.audit_logs (agency_id, actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_agency_id,
    p_owner_id,
    'bootstrap_agency',
    'agency',
    v_agency_id::text,
    jsonb_build_object('agency_name', p_agency_name, 'slug', p_agency_slug)
  );

  RETURN v_agency_id;
END;
$$;
