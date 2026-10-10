-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- FASE 08: PROPOSAL STUDIO + COMMERCIAL PROPOSALS
-- Schema Migration, Permissions, RLS & RPC Functions
-- ============================================================

-- 1. NOVAS PERMISSÕES DO MÓDULO DE PROPOSTAS
INSERT INTO public.permissions (id, name, description, module) VALUES
  ('proposals.delete', 'Excluir Propostas', 'Permite remover propostas comerciais da agência', 'proposals'),
  ('proposals.publish', 'Publicar Propostas', 'Permite publicar propostas para compartilhamento externo', 'proposals'),
  ('proposals.manage_templates', 'Gerenciar Templates', 'Permite criar e editar modelos de propostas comerciais', 'proposals'),
  ('proposals.manage_services', 'Gerenciar Catálogo de Serviços', 'Permite gerenciar serviços e preços base da agência', 'proposals'),
  ('proposals.manage_pricing', 'Alterar Precificação Comercial', 'Permite definir e alterar valores e descontos em propostas', 'proposals'),
  ('proposals.manage_public_links', 'Gerenciar Links Públicos', 'Permite gerar, revogar e definir expiração de links de propostas', 'proposals')
ON CONFLICT (id) DO NOTHING;

-- Atribuir permissões por padrão ao papel 'admin' e 'manager'
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name IN ('admin', 'owner', 'manager')
  AND p.module = 'proposals'
ON CONFLICT DO NOTHING;

-- 2. TABELA: agency_services (Catálogo de Serviços)
CREATE TABLE IF NOT EXISTS public.agency_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  pricing_model TEXT NOT NULL DEFAULT 'fixed' CHECK (pricing_model IN ('fixed', 'monthly', 'hourly', 'unit', 'custom')),
  base_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (base_price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  estimated_duration TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. TABELA: proposals (Propostas Comerciais)
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  briefing_id UUID REFERENCES public.briefings(id) ON DELETE SET NULL,
  briefing_version_id UUID,
  strategy_id UUID REFERENCES public.content_strategies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  proposal_number TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'internal_review', 'approved', 'published', 'viewed', 'negotiation', 'accepted', 'rejected', 'expired', 'archived'
  )),
  currency TEXT NOT NULL DEFAULT 'BRL',
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- 4. TABELA: proposal_sections (Seções Estruturadas da Proposta)
CREATE TABLE IF NOT EXISTS public.proposal_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'cover', 'introduction', 'diagnosis', 'objectives', 'scope', 'services', 'deliverables', 'timeline', 'investment', 'terms', 'team', 'portfolio', 'closing', 'custom'
  )),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABELA: proposal_items (Itens e Serviços da Proposta)
CREATE TABLE IF NOT EXISTS public.proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.agency_services(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'unidade',
  unit_price_cents BIGINT NOT NULL DEFAULT 0 CHECK (unit_price_cents >= 0),
  discount_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  total_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  billing_type TEXT NOT NULL DEFAULT 'one_time' CHECK (billing_type IN ('one_time', 'recurring', 'optional')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TABELA: proposal_pricing (Totais e Condições Financeiras)
CREATE TABLE IF NOT EXISTS public.proposal_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID UNIQUE NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  subtotal_cents BIGINT NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  discount_cents BIGINT NOT NULL DEFAULT 0 CHECK (discount_cents >= 0),
  fees_cents BIGINT NOT NULL DEFAULT 0 CHECK (fees_cents >= 0),
  total_cents BIGINT NOT NULL DEFAULT 0 CHECK (total_cents >= 0),
  one_time_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (one_time_total_cents >= 0),
  recurring_monthly_total_cents BIGINT NOT NULL DEFAULT 0 CHECK (recurring_monthly_total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'BRL',
  billing_frequency TEXT NOT NULL DEFAULT 'Mensal',
  payment_terms TEXT NOT NULL DEFAULT '50% no aceite e 50% na entrega',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABELA: proposal_templates (Modelos Reutilizáveis)
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'Geral',
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1,
  sections_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  items_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

-- 8. TABELA: proposal_versions (Snapshots Imutáveis de Revisão)
CREATE TABLE IF NOT EXISTS public.proposal_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. TABELA: proposal_approvals (Revisões Internas da Equipe)
CREATE TABLE IF NOT EXISTS public.proposal_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.proposal_versions(id) ON DELETE SET NULL,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'changes_requested', 'rejected')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. TABELA: proposal_public_links (Links de Compartilhamento Seguro)
CREATE TABLE IF NOT EXISTS public.proposal_public_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.proposal_versions(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. TABELA: proposal_events (Auditoria e Histórico de Eventos)
CREATE TABLE IF NOT EXISTS public.proposal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'edited', 'submitted_for_review', 'approved', 'published', 'opened', 'negotiation_started', 'accepted', 'rejected', 'expired', 'archived'
  )),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. TABELA: proposal_exports (Registro de Downloads PDF)
CREATE TABLE IF NOT EXISTS public.proposal_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.proposal_versions(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  branding_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_agency_services_agency ON public.agency_services(agency_id);
CREATE INDEX IF NOT EXISTS idx_proposals_agency_client ON public.proposals(agency_id, client_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_sections_prop_pos ON public.proposal_sections(proposal_id, position);
CREATE INDEX IF NOT EXISTS idx_proposal_items_prop ON public.proposal_items(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_public_links_hash ON public.proposal_public_links(token_hash);
CREATE INDEX IF NOT EXISTS idx_proposal_events_prop ON public.proposal_events(proposal_id, created_at DESC);

-- 14. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.agency_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_public_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_exports ENABLE ROW LEVEL SECURITY;

-- Regras genéricas para membros da agência
CREATE POLICY agency_services_member_access ON public.agency_services
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposals_member_access ON public.proposals
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_sections_member_access ON public.proposal_sections
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_items_member_access ON public.proposal_items
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_pricing_member_access ON public.proposal_pricing
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_templates_member_access ON public.proposal_templates
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_versions_member_access ON public.proposal_versions
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_approvals_member_access ON public.proposal_approvals
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_public_links_member_access ON public.proposal_public_links
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_events_member_access ON public.proposal_events
  FOR ALL USING (public.is_agency_member(agency_id));

CREATE POLICY proposal_exports_member_access ON public.proposal_exports
  FOR ALL USING (public.is_agency_member(agency_id));

-- 15. RPC FUNÇÃO PÚBLICA SEGURA PARA VISUALIZAÇÃO EXTERNA DA PROPOSTA
CREATE OR REPLACE FUNCTION public.get_public_proposal(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash text;
  v_link public.proposal_public_links%ROWTYPE;
  v_proposal public.proposals%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_agency public.agencies%ROWTYPE;
  v_sections jsonb;
  v_items jsonb;
  v_pricing jsonb;
BEGIN
  -- 1. Gerar hash SHA-256 do token fornecido
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  -- 2. Buscar link público ativo
  SELECT * INTO v_link
  FROM public.proposal_public_links
  WHERE token_hash = v_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Link de proposta inválido, revogado ou expirado.');
  END IF;

  -- 3. Buscar proposta publicada
  SELECT * INTO v_proposal
  FROM public.proposals
  WHERE id = v_link.proposal_id;

  IF v_proposal.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Proposta não encontrada.');
  END IF;

  -- 4. Buscar cliente e agência
  SELECT * INTO v_client FROM public.clients WHERE id = v_proposal.client_id;
  SELECT * INTO v_agency FROM public.agencies WHERE id = v_proposal.agency_id;

  -- 5. Buscar seções e itens
  SELECT jsonb_agg(to_jsonb(s) ORDER BY position ASC) INTO v_sections
  FROM public.proposal_sections s
  WHERE s.proposal_id = v_proposal.id AND s.is_visible = true;

  SELECT jsonb_agg(to_jsonb(i) ORDER BY position ASC) INTO v_items
  FROM public.proposal_items i
  WHERE i.proposal_id = v_proposal.id;

  SELECT to_jsonb(p) INTO v_pricing
  FROM public.proposal_pricing p
  WHERE p.proposal_id = v_proposal.id;

  -- Registrar evento de abertura
  INSERT INTO public.proposal_events (agency_id, proposal_id, event_type, metadata)
  VALUES (v_proposal.agency_id, v_proposal.id, 'opened', jsonb_build_object('opened_at', NOW()));

  -- Atualizar status para viewed se estivesse published
  IF v_proposal.status = 'published' THEN
    UPDATE public.proposals SET status = 'viewed', updated_at = NOW() WHERE id = v_proposal.id;
  END IF;

  RETURN jsonb_build_object(
    'proposal', to_jsonb(v_proposal),
    'client', jsonb_build_object('name', v_client.name, 'company_name', v_client.company_name, 'logo_url', v_client.logo_url),
    'agency', jsonb_build_object('name', v_agency.name, 'logo_url', v_agency.logo_url, 'primary_color', v_agency.primary_color),
    'sections', COALESCE(v_sections, '[]'::jsonb),
    'items', COALESCE(v_items, '[]'::jsonb),
    'pricing', COALESCE(v_pricing, '{}'::jsonb)
  );
END;
$$;

-- 16. RPC FUNÇÃO PARA RESPOSTA/DECISÃO DO CLIENTE NA PROPOSTA PÚBLICA
CREATE OR REPLACE FUNCTION public.submit_public_proposal_feedback(
  p_token text,
  p_decision text,
  p_notes text DEFAULT NULL,
  p_client_name text DEFAULT NULL,
  p_client_email text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hash text;
  v_link public.proposal_public_links%ROWTYPE;
  v_proposal public.proposals%ROWTYPE;
  v_new_status text;
BEGIN
  v_hash := encode(digest(p_token, 'sha256'), 'hex');

  SELECT * INTO v_link
  FROM public.proposal_public_links
  WHERE token_hash = v_hash
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token de proposta inválido ou expirado.');
  END IF;

  SELECT * INTO v_proposal FROM public.proposals WHERE id = v_link.proposal_id;

  IF p_decision = 'accepted' THEN
    v_new_status := 'accepted';
    UPDATE public.proposals SET status = 'accepted', accepted_at = NOW(), updated_at = NOW() WHERE id = v_proposal.id;
  ELSIF p_decision = 'rejected' THEN
    v_new_status := 'rejected';
    UPDATE public.proposals SET status = 'rejected', rejected_at = NOW(), updated_at = NOW() WHERE id = v_proposal.id;
  ELSIF p_decision = 'negotiation' THEN
    v_new_status := 'negotiation';
    UPDATE public.proposals SET status = 'negotiation', updated_at = NOW() WHERE id = v_proposal.id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Decisão inválida.');
  END IF;

  -- Registrar evento no audit log do proposal_events
  INSERT INTO public.proposal_events (agency_id, proposal_id, event_type, metadata)
  VALUES (
    v_proposal.agency_id,
    v_proposal.id,
    CASE WHEN p_decision = 'accepted' THEN 'accepted'
         WHEN p_decision = 'rejected' THEN 'rejected'
         ELSE 'negotiation_started' END,
    jsonb_build_object(
      'decision', p_decision,
      'notes', p_notes,
      'client_name', p_client_name,
      'client_email', p_client_email,
      'responded_at', NOW()
    )
  );

  RETURN jsonb_build_object('success', true, 'status', v_new_status);
END;
$$;
