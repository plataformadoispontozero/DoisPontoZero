-- Append-only decisions: public callers have no direct catalog or history access.
CREATE TABLE public.presentation_material_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 agency_id uuid NOT NULL REFERENCES public.agencies(id),
 presentation_id uuid NOT NULL REFERENCES public.presentations(id),
 asset_id uuid NOT NULL REFERENCES public.presentation_assets(id),
 public_link_id uuid NOT NULL REFERENCES public.presentation_public_links(id),
 decision text NOT NULL CHECK (decision IN ('approved','changes_requested','rejected')),
 note text NOT NULL DEFAULT '' CHECK (length(note)<=4000),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX presentation_material_reviews_history ON public.presentation_material_reviews(presentation_id,created_at DESC);
ALTER TABLE public.presentation_material_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.presentation_material_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.presentation_material_reviews TO authenticated;
CREATE POLICY material_reviews_team_read ON public.presentation_material_reviews FOR SELECT TO authenticated USING (private.can_editorial(agency_id,'presentations.view'));
CREATE OR REPLACE FUNCTION private.submit_showcase_material_review(p_token text,p_asset uuid,p_decision text,p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_link public.presentation_public_links%ROWTYPE; v_review public.presentation_material_reviews%ROWTYPE;
BEGIN
 IF p_token IS NULL OR length(p_token)<20 OR length(p_token)>512 THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approved','changes_requested','rejected') OR length(coalesce(p_note,''))>4000 THEN RAISE EXCEPTION 'Avaliação inválida.'; END IF;
 IF p_decision<>'approved' AND length(trim(coalesce(p_note,'')))=0 THEN RAISE EXCEPTION 'Informe a observação para a equipe.'; END IF;
 SELECT l.* INTO v_link FROM public.presentation_public_links l JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
 WHERE l.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now()) AND p.status='published' AND p.archived_at IS NULL FOR SHARE OF l,p;
 IF v_link.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.presentation_assets a WHERE a.id=p_asset AND a.presentation_id=v_link.presentation_id AND a.agency_id=v_link.agency_id) THEN RAISE EXCEPTION 'Material indisponível para este link.'; END IF;
 INSERT INTO public.presentation_material_reviews(agency_id,presentation_id,asset_id,public_link_id,decision,note)
 VALUES(v_link.agency_id,v_link.presentation_id,p_asset,v_link.id,p_decision,trim(coalesce(p_note,''))) RETURNING * INTO v_review;
 INSERT INTO public.presentation_activity(agency_id,presentation_id,action,metadata) VALUES(v_link.agency_id,v_link.presentation_id,'material_reviewed',jsonb_build_object('asset_id',p_asset,'decision',p_decision,'review_id',v_review.id));
 RETURN jsonb_build_object('id',v_review.id,'asset_id',p_asset,'decision',p_decision,'note',v_review.note,'created_at',v_review.created_at);
END $$;
REVOKE ALL ON FUNCTION private.submit_showcase_material_review(text,uuid,text,text) FROM PUBLIC,anon,authenticated;
-- Fixed anonymous bridge delegates only to the validated token endpoint, without private schema usage.
CREATE OR REPLACE FUNCTION public.submit_showcase_material_review(p_token text,p_asset uuid,p_decision text,p_note text DEFAULT '')
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$ SELECT private.submit_showcase_material_review(p_token,p_asset,p_decision,p_note); $$;
REVOKE ALL ON FUNCTION public.submit_showcase_material_review(text,uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_showcase_material_review(text,uuid,text,text) TO anon,authenticated;
-- A valid link can restore its decisions after refresh without opening the review catalog.
CREATE FUNCTION private.get_showcase_material_reviews(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_link public.presentation_public_links%ROWTYPE;
BEGIN
 IF p_token IS NULL OR length(p_token)<20 OR length(p_token)>512 THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 SELECT l.* INTO v_link FROM public.presentation_public_links l JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
 WHERE l.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now()) AND p.status='published' AND p.archived_at IS NULL;
 IF v_link.id IS NULL THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('asset_id',r.asset_id,'decision',r.decision,'note',r.note,'created_at',r.created_at) ORDER BY r.created_at DESC,r.id DESC)
 FROM public.presentation_material_reviews r JOIN public.presentation_assets a ON a.id=r.asset_id AND a.presentation_id=r.presentation_id AND a.agency_id=r.agency_id
 WHERE r.presentation_id=v_link.presentation_id AND r.agency_id=v_link.agency_id),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION private.get_showcase_material_reviews(text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION public.get_showcase_material_reviews(p_token text) RETURNS jsonb
LANGUAGE sql SECURITY DEFINER SET search_path='' AS $$SELECT private.get_showcase_material_reviews(p_token);$$;
REVOKE ALL ON FUNCTION public.get_showcase_material_reviews(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_showcase_material_reviews(text) TO anon,authenticated;
