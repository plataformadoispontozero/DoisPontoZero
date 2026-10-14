CREATE OR REPLACE FUNCTION public.get_strategy_overview(p_strategy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_result JSONB;
  v_strategy RECORD;
BEGIN
  SELECT * INTO v_strategy FROM public.content_strategies WHERE id = p_strategy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;

  IF NOT private.can_editorial(v_strategy.agency_id, 'strategy.view') THEN
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

CREATE OR REPLACE FUNCTION public.generate_editorial_suggestions(
  p_strategy_id UUID,
  p_period_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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
  IF p_period_days IS NULL OR p_period_days NOT BETWEEN 1 AND 90 THEN RAISE EXCEPTION 'Período deve estar entre 1 e 90 dias'; END IF;
  SELECT * INTO v_strategy FROM public.content_strategies WHERE id = p_strategy_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Strategy not found';
  END IF;

  IF NOT private.can_editorial(v_strategy.agency_id, 'strategy.manage_editorial') THEN
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

REVOKE ALL ON FUNCTION public.get_strategy_overview(uuid), public.generate_editorial_suggestions(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_strategy_overview(uuid), public.generate_editorial_suggestions(uuid,integer) TO authenticated;
-- Proposals are retired: preserve data but disable their old browser RPCs.
REVOKE ALL ON FUNCTION public.get_public_proposal(text),public.submit_public_proposal_feedback(text,text,text,text,text),public.create_agency_proposal(uuid,jsonb),public.save_agency_proposal(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
ALTER FUNCTION public.get_public_proposal(text) SET search_path='public';
ALTER FUNCTION public.submit_public_proposal_feedback(text,text,text,text,text) SET search_path='public';