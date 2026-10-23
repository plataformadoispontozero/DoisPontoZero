-- Internal view of current review decisions; the full history is explicitly separate.
CREATE OR REPLACE FUNCTION public.get_presentation_current_review(p_agency uuid,p_presentation uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.presentations; l public.presentation_public_links; fingerprint text; total_count integer; approved_count integer:=0; adjustment_count integer:=0; current_reviews jsonb:='[]'::jsonb; history_reviews jsonb:='[]'::jsonb; completion jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT private.can_editorial(p_agency,'presentations.view') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO p FROM public.presentations WHERE id=p_presentation AND agency_id=p_agency;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Apresentação não encontrada ou sem acesso'; END IF;
 fingerprint:=private.presentation_review_content_hash(p.id);
 SELECT * INTO l FROM public.presentation_public_links WHERE presentation_id=p.id AND agency_id=p_agency AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()) ORDER BY created_at DESC,id DESC LIMIT 1;
 SELECT count(*) INTO total_count FROM public.presentation_assets WHERE presentation_id=p.id AND agency_id=p_agency;
 IF l.id IS NOT NULL THEN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'agency_id',r.agency_id,'presentation_id',r.presentation_id,'asset_id',r.asset_id,'public_link_id',r.public_link_id,'decision',r.decision,'note',r.note,'created_at',r.created_at) ORDER BY r.created_at DESC,r.id DESC),'[]'::jsonb),count(*) FILTER(WHERE r.decision='approved'),count(*) FILTER(WHERE r.decision IN ('changes_requested','rejected'))
 INTO current_reviews,approved_count,adjustment_count
 FROM (SELECT DISTINCT ON(rv.asset_id) rv.* FROM public.presentation_material_reviews rv JOIN public.presentation_assets a ON a.id=rv.asset_id AND a.presentation_id=rv.presentation_id AND a.agency_id=rv.agency_id WHERE rv.agency_id=p_agency AND rv.presentation_id=p.id AND rv.public_link_id=l.id AND rv.content_hash=fingerprint ORDER BY rv.asset_id,rv.created_at DESC,rv.id DESC) r;
 IF total_count>0 AND approved_count=total_count THEN
 SELECT jsonb_build_object('completedAt',c.completed_at,'total',c.material_count) INTO completion FROM public.presentation_review_completions c WHERE c.agency_id=p_agency AND c.presentation_id=p.id AND c.public_link_id=l.id AND c.content_hash=fingerprint ORDER BY c.completed_at DESC,c.id DESC LIMIT 1;
 END IF;
 END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',r.id,'agency_id',r.agency_id,'presentation_id',r.presentation_id,'asset_id',r.asset_id,'public_link_id',r.public_link_id,'decision',r.decision,'note',r.note,'created_at',r.created_at) ORDER BY r.created_at DESC,r.id DESC),'[]'::jsonb) INTO history_reviews FROM public.presentation_material_reviews r WHERE r.agency_id=p_agency AND r.presentation_id=p.id AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(current_reviews) cur WHERE cur->>'id'=r.id::text);
 RETURN jsonb_build_object('total',total_count,'approved',approved_count,'adjustments',adjustment_count,'pending',total_count-approved_count-adjustment_count,'reviews',current_reviews,'history',history_reviews,'completion',completion,'linkGeneratedAt',l.created_at);
END; $$;
REVOKE ALL ON FUNCTION public.get_presentation_current_review(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_presentation_current_review(uuid,uuid) TO authenticated;
