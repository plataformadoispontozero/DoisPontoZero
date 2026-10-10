-- ============================================================
-- DOIS.ZERO | CREATIVE AGENCY OS
-- FASE 07: STRATEGY STUDIO + EDITORIAL GENERATOR
-- Migration: Content Strategies, Editorial Pillars, Ideas, Calendar
-- ============================================================

-- ============================================================
-- 1. CONTENT STRATEGIES (Plano Estratégico Principal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_strategies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id   UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  client_id   UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  briefing_id UUID REFERENCES public.briefings(id) ON DELETE SET NULL,

  -- Identity
  name        TEXT NOT NULL,
  description TEXT,
  slug        TEXT,

  -- Strategic data
  objective          TEXT,              -- Objetivo principal da estratégia
  target_audience    TEXT,              -- Público-alvo definido
  tone_of_voice      TEXT,              -- Tom de voz da marca
  brand_positioning  TEXT,              -- Posicionamento de marca
  channels           TEXT[] DEFAULT '{}', -- Canais: instagram, tiktok, linkedin, youtube etc
  competitors        TEXT[] DEFAULT '{}', -- Concorrentes mapeados
  key_messages       TEXT[] DEFAULT '{}', -- Mensagens-chave
  restrictions       TEXT[] DEFAULT '{}', -- Restrições comunicacionais
  visual_references  JSONB DEFAULT '[]'::jsonb,  -- URLs ou paths de referências visuais

  -- Metadata
  status      TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  period_start  DATE,
  period_end    DATE,

  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ,

  CONSTRAINT unique_strategy_slug UNIQUE (agency_id, slug)
);

-- ============================================================
-- 2. EDITORIAL PILLARS (Pilares Editoriais)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.editorial_pillars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  strategy_id   UUID NOT NULL REFERENCES public.content_strategies(id) ON DELETE CASCADE,

  name          TEXT NOT NULL,           -- Ex: "Autoridade", "Conexão", "Bastidores"
  description   TEXT,                    -- Explicação do pilar
  color         TEXT DEFAULT '#7952FF',  -- Cor para identificação visual
  icon          TEXT DEFAULT 'Layers',   -- Nome do ícone Lucide
  percentage    INT DEFAULT 0,           -- Peso % no mix de conteúdo (0-100)
  position      INT DEFAULT 0,          -- Ordem de exibição

  content_formats   TEXT[] DEFAULT '{}', -- carrossel, reels, stories, artigo, vídeo
  posting_frequency TEXT,                -- Ex: "3x por semana", "diário"
  example_topics    TEXT[] DEFAULT '{}', -- Exemplos de temas

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. CONTENT IDEAS (Banco de Ideias de Conteúdo)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.content_ideas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  strategy_id   UUID NOT NULL REFERENCES public.content_strategies(id) ON DELETE CASCADE,
  pillar_id     UUID REFERENCES public.editorial_pillars(id) ON DELETE SET NULL,

  title         TEXT NOT NULL,
  description   TEXT,
  content_format TEXT,                   -- carrossel, reels, stories, artigo, vídeo, thread
  channel       TEXT,                    -- instagram, tiktok, linkedin, youtube, blog
  hook          TEXT,                    -- Gancho / headline sugerida
  cta           TEXT,                    -- Call to Action sugerido
  hashtags      TEXT[] DEFAULT '{}',
  references    JSONB DEFAULT '[]'::jsonb,  -- Links de referência

  -- Status & Priority
  status        TEXT NOT NULL DEFAULT 'idea'
    CHECK (status IN ('idea', 'approved', 'in_production', 'scheduled', 'published', 'discarded')),
  priority      TEXT DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'high', 'normal', 'low')),

  -- Conversion to task/editorial
  task_id       UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  editorial_item_id UUID, -- FK added after editorial_items creation

  -- Metadata
  suggested_by  TEXT DEFAULT 'manual',   -- 'manual', 'briefing_intelligence', 'editorial_engine'
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. EDITORIAL ITEMS (Pauta / Itens do Calendário Editorial)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.editorial_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  strategy_id   UUID NOT NULL REFERENCES public.content_strategies(id) ON DELETE CASCADE,
  pillar_id     UUID REFERENCES public.editorial_pillars(id) ON DELETE SET NULL,
  idea_id       UUID REFERENCES public.content_ideas(id) ON DELETE SET NULL,

  -- Content
  title         TEXT NOT NULL,
  description   TEXT,
  content_format TEXT,                   -- carrossel, reels, stories, artigo, vídeo
  channel       TEXT,                    -- canal principal
  copy_text     TEXT,                    -- Texto/copy do post
  hook          TEXT,                    -- Gancho
  cta           TEXT,                    -- Call to Action
  hashtags      TEXT[] DEFAULT '{}',
  visual_notes  TEXT,                    -- Orientações para o designer

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  publish_date   DATE,

  -- Status
  status        TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'paused')),

  -- Linkage
  task_id       UUID REFERENCES public.tasks(id) ON DELETE SET NULL,

  -- Metadata
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for content_ideas.editorial_item_id
ALTER TABLE public.content_ideas
  ADD CONSTRAINT fk_content_ideas_editorial_item
  FOREIGN KEY (editorial_item_id) REFERENCES public.editorial_items(id) ON DELETE SET NULL;

-- ============================================================
-- 5. STRATEGY VERSIONS (Versionamento de Estratégia)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.strategy_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  strategy_id   UUID NOT NULL REFERENCES public.content_strategies(id) ON DELETE CASCADE,
  version_number INT NOT NULL DEFAULT 1,
  snapshot      JSONB NOT NULL,          -- Cópia imutável da estratégia e pilares
  notes         TEXT,                    -- Notas sobre a versão

  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_strategy_version UNIQUE (strategy_id, version_number)
);

-- ============================================================
-- 6. STRATEGY ACTIVITY LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.strategy_activity (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id     UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  strategy_id   UUID NOT NULL REFERENCES public.content_strategies(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ============================================================
-- 7. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_content_strategies_agency ON public.content_strategies(agency_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_client ON public.content_strategies(client_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_status ON public.content_strategies(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_editorial_pillars_strategy ON public.editorial_pillars(strategy_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_strategy ON public.content_ideas(strategy_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_pillar ON public.content_ideas(pillar_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_status ON public.content_ideas(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_editorial_items_strategy ON public.editorial_items(strategy_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_pillar ON public.editorial_items(pillar_id);
CREATE INDEX IF NOT EXISTS idx_editorial_items_date ON public.editorial_items(agency_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_editorial_items_status ON public.editorial_items(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_strategy_versions_strategy ON public.strategy_versions(strategy_id);
CREATE INDEX IF NOT EXISTS idx_strategy_activity_strategy ON public.strategy_activity(strategy_id);


-- ============================================================
-- 8. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.content_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editorial_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategy_activity ENABLE ROW LEVEL SECURITY;

-- content_strategies
CREATE POLICY "content_strategies_select" ON public.content_strategies
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "content_strategies_insert" ON public.content_strategies
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "content_strategies_update" ON public.content_strategies
  FOR UPDATE USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "content_strategies_delete" ON public.content_strategies
  FOR DELETE USING (public.is_agency_member(agency_id));

-- editorial_pillars
CREATE POLICY "editorial_pillars_select" ON public.editorial_pillars
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "editorial_pillars_insert" ON public.editorial_pillars
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "editorial_pillars_update" ON public.editorial_pillars
  FOR UPDATE USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "editorial_pillars_delete" ON public.editorial_pillars
  FOR DELETE USING (public.is_agency_member(agency_id));

-- content_ideas
CREATE POLICY "content_ideas_select" ON public.content_ideas
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "content_ideas_insert" ON public.content_ideas
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "content_ideas_update" ON public.content_ideas
  FOR UPDATE USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "content_ideas_delete" ON public.content_ideas
  FOR DELETE USING (public.is_agency_member(agency_id));

-- editorial_items
CREATE POLICY "editorial_items_select" ON public.editorial_items
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "editorial_items_insert" ON public.editorial_items
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "editorial_items_update" ON public.editorial_items
  FOR UPDATE USING (public.is_agency_member(agency_id))
  WITH CHECK (public.is_agency_member(agency_id));

CREATE POLICY "editorial_items_delete" ON public.editorial_items
  FOR DELETE USING (public.is_agency_member(agency_id));

-- strategy_versions
CREATE POLICY "strategy_versions_select" ON public.strategy_versions
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "strategy_versions_insert" ON public.strategy_versions
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));

-- strategy_activity
CREATE POLICY "strategy_activity_select" ON public.strategy_activity
  FOR SELECT USING (public.is_agency_member(agency_id));

CREATE POLICY "strategy_activity_insert" ON public.strategy_activity
  FOR INSERT WITH CHECK (public.is_agency_member(agency_id));


-- ============================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_content_strategies_updated') THEN
    CREATE TRIGGER trg_content_strategies_updated
      BEFORE UPDATE ON public.content_strategies
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_editorial_pillars_updated') THEN
    CREATE TRIGGER trg_editorial_pillars_updated
      BEFORE UPDATE ON public.editorial_pillars
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_content_ideas_updated') THEN
    CREATE TRIGGER trg_content_ideas_updated
      BEFORE UPDATE ON public.content_ideas
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_editorial_items_updated') THEN
    CREATE TRIGGER trg_editorial_items_updated
      BEFORE UPDATE ON public.editorial_items
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;


-- ============================================================
-- 10. RPCs (Remote Procedure Calls)
-- ============================================================

-- RPC: Get strategy with pillars, ideas count and editorial count
CREATE OR REPLACE FUNCTION public.get_strategy_overview(p_strategy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_strategy RECORD;
BEGIN
  SELECT * INTO v_strategy FROM public.content_strategies WHERE id = p_strategy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;

  IF NOT public.is_agency_member(v_strategy.agency_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'strategy', row_to_json(s)::jsonb,
    'pillars', COALESCE((
      SELECT jsonb_agg(row_to_json(p)::jsonb ORDER BY p.position)
      FROM public.editorial_pillars p WHERE p.strategy_id = p_strategy_id
    ), '[]'::jsonb),
    'ideas_count', (
      SELECT COUNT(*) FROM public.content_ideas WHERE strategy_id = p_strategy_id
    ),
    'editorial_items_count', (
      SELECT COUNT(*) FROM public.editorial_items WHERE strategy_id = p_strategy_id
    ),
    'published_count', (
      SELECT COUNT(*) FROM public.editorial_items WHERE strategy_id = p_strategy_id AND status = 'published'
    )
  ) INTO v_result
  FROM public.content_strategies s
  WHERE s.id = p_strategy_id;

  RETURN v_result;
END;
$$;

-- RPC: Generate editorial suggestions (deterministic rule-based)
CREATE OR REPLACE FUNCTION public.generate_editorial_suggestions(
  p_strategy_id UUID,
  p_period_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_strategy RECORD;
  v_pillars RECORD;
  v_suggestions JSONB := '[]'::jsonb;
  v_pillar_row RECORD;
  v_items_needed INT;
  v_day_offset INT;
  v_format TEXT;
  v_formats TEXT[];
BEGIN
  SELECT * INTO v_strategy FROM public.content_strategies WHERE id = p_strategy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;

  IF NOT public.is_agency_member(v_strategy.agency_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- For each pillar, generate suggestions based on percentage weight
  FOR v_pillar_row IN
    SELECT * FROM public.editorial_pillars WHERE strategy_id = p_strategy_id ORDER BY position
  LOOP
    -- Calculate items needed based on percentage
    v_items_needed := GREATEST(1, (p_period_days * v_pillar_row.percentage / 100));

    -- Get formats for this pillar
    v_formats := v_pillar_row.content_formats;
    IF array_length(v_formats, 1) IS NULL THEN
      v_formats := ARRAY['post'];
    END IF;

    FOR v_day_offset IN 0..(v_items_needed - 1)
    LOOP
      v_format := v_formats[1 + (v_day_offset % array_length(v_formats, 1))];

      v_suggestions := v_suggestions || jsonb_build_object(
        'pillar_id', v_pillar_row.id,
        'pillar_name', v_pillar_row.name,
        'pillar_color', v_pillar_row.color,
        'suggested_format', v_format,
        'suggested_date', (CURRENT_DATE + v_day_offset * (p_period_days / v_items_needed))::text,
        'example_topics', v_pillar_row.example_topics
      );
    END LOOP;
  END LOOP;

  RETURN v_suggestions;
END;
$$;


-- ============================================================
-- 11. PERMISSIONS (add to existing permissions table)
-- ============================================================
INSERT INTO public.permissions (id, module, action, description) VALUES
  (gen_random_uuid(), 'strategy', 'view',    'Ver estratégias de conteúdo'),
  (gen_random_uuid(), 'strategy', 'create',  'Criar novas estratégias'),
  (gen_random_uuid(), 'strategy', 'edit',    'Editar estratégias existentes'),
  (gen_random_uuid(), 'strategy', 'delete',  'Excluir estratégias'),
  (gen_random_uuid(), 'strategy', 'manage_editorial', 'Gerenciar calendário editorial'),
  (gen_random_uuid(), 'strategy', 'export',  'Exportar estratégias em PDF')
ON CONFLICT DO NOTHING;
