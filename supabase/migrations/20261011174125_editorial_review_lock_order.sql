CREATE OR REPLACE FUNCTION public.submit_public_editorial(p_token text,p_index integer,p_decision text,p_copy text,p_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.monthly_editorial_shares; c public.monthly_editorial_campaigns;
BEGIN
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE p_token ~ '^[a-f0-9]{64}$' AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT revoked AND expires_at>now();
 IF s.id IS NULL THEN RAISE EXCEPTION 'Link expired or unavailable'; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=s.campaign_id FOR UPDATE;
 -- Consistent campaign-first lock order; recheck revocation after waiting.
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE id=s.id AND NOT revoked AND expires_at>now() FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Link expired or unavailable'; END IF;
 IF c.project_id IS NOT NULL OR c.status='approved' THEN RAISE EXCEPTION 'Review already closed'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approve','adjust') OR p_index IS NULL OR p_index < -1 OR p_index>=jsonb_array_length(s.snapshot->'items') OR length(coalesce(p_copy,''))>3000 OR length(coalesce(p_note,''))>3000 OR (p_decision='approve' AND p_index<>-1) OR (p_decision='adjust' AND trim(coalesce(p_note,'')||coalesce(p_copy,''))='') THEN RAISE EXCEPTION 'Invalid feedback'; END IF;
 IF (SELECT count(*) FROM public.monthly_editorial_feedback WHERE share_id=s.id AND created_at>now()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Too many requests'; END IF;
 INSERT INTO public.monthly_editorial_feedback(campaign_id,share_id,item_index,decision,suggested_copy,note) VALUES(s.campaign_id,s.id,p_index,p_decision,coalesce(p_copy,''),coalesce(p_note,''));
 UPDATE public.monthly_editorial_campaigns SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'changes_requested' END,updated_at=now() WHERE id=s.campaign_id;
 RETURN true;
END; $$;
