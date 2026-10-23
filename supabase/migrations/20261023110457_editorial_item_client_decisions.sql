-- Public review exposes approved content only; never strategy facts, sources or tracing.
CREATE OR REPLACE FUNCTION private.editorial_public_items(p_items jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('date',v->'date','format',v->'format','title',v->'title','copy',v->'copy','editorial',jsonb_build_object(
 'caption',v->'editorial'->'caption','hashtags',v->'editorial'->'hashtags',
 'postConcept',CASE WHEN jsonb_typeof(v->'editorial'->'postConcept')='object' THEN jsonb_build_object('headline',v->'editorial'->'postConcept'->'headline','support',v->'editorial'->'postConcept'->'support','caption',v->'editorial'->'postConcept'->'caption') END,
 'slides',(SELECT jsonb_agg(jsonb_build_object('headline',x->'headline','text',x->'text')) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v->'editorial'->'slides')='array' THEN v->'editorial'->'slides' ELSE '[]'::jsonb END) x),
 'scenes',(SELECT jsonb_agg(jsonb_build_object('text',x->'text','onScreen',x->'onScreen','narration',x->'narration','seconds',x->'seconds')) FROM jsonb_array_elements(CASE WHEN jsonb_typeof(v->'editorial'->'scenes')='array' THEN v->'editorial'->'scenes' ELSE '[]'::jsonb END) x)
 )) ORDER BY ord),'[]'::jsonb) FROM jsonb_array_elements(p_items) WITH ORDINALITY t(v,ord);
$$;
REVOKE ALL ON FUNCTION private.editorial_public_items(jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.share_monthly_editorial(p_campaign uuid,p_token text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; client_name text; expires timestamptz;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR c.project_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid share'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c.items) i WHERE i.value->>'copy' ~ '\[(Completar|Complementar)') THEN RAISE EXCEPTION 'Complete as lacunas antes de enviar para aprovação.'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=c.id;
 INSERT INTO public.monthly_editorial_shares(campaign_id,token_hash,snapshot) VALUES(c.id,encode(sha256(convert_to(p_token,'UTF8')),'hex'),jsonb_build_object('client',client_name,'month',c.month,'items',private.editorial_public_items(c.items),'contentHash',encode(sha256(convert_to(c.items::text,'UTF8')),'hex'))) RETURNING expires_at INTO expires;
 UPDATE public.monthly_editorial_campaigns SET status='pending',updated_at=now() WHERE id=c.id;
 RETURN expires;
END; $$;

CREATE OR REPLACE FUNCTION private.editorial_share_is_current(p_snapshot jsonb,p_items jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN p_snapshot ? 'contentHash' THEN p_snapshot->>'contentHash'=encode(sha256(convert_to(p_items::text,'UTF8')),'hex')
 ELSE p_snapshot->'items'=(SELECT jsonb_agg(value-'editorial') FROM jsonb_array_elements(p_items)) END;
$$;
REVOKE ALL ON FUNCTION private.editorial_share_is_current(jsonb,jsonb) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.get_public_editorial(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('client',s.snapshot->'client','month',s.snapshot->'month','items',private.editorial_public_items(c.items),'status',c.status,'expiresAt',s.expires_at,'itemReviews',coalesce((SELECT jsonb_agg(jsonb_build_object('itemIndex',f.item_index,'decision',f.decision,'note',f.note,'copy',f.suggested_copy)) FROM (SELECT DISTINCT ON (item_index) * FROM public.monthly_editorial_feedback WHERE share_id=s.id AND item_index>=0 ORDER BY item_index,created_at DESC,id DESC) f),'[]'::jsonb))
 FROM public.monthly_editorial_shares s JOIN public.monthly_editorial_campaigns c ON c.id=s.campaign_id
 WHERE p_token ~ '^[a-f0-9]{64}$' AND s.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT s.revoked AND s.expires_at>now() AND private.editorial_share_is_current(s.snapshot,c.items);
$$;

CREATE OR REPLACE FUNCTION public.submit_public_editorial(p_token text,p_index integer,p_decision text,p_copy text,p_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.monthly_editorial_shares; c public.monthly_editorial_campaigns; approved_count integer; adjustment_count integer;
BEGIN
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE p_token ~ '^[a-f0-9]{64}$' AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT revoked AND expires_at>now();
 IF s.id IS NULL THEN RAISE EXCEPTION 'Link expired or unavailable'; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=s.campaign_id FOR UPDATE;
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE id=s.id AND NOT revoked AND expires_at>now() FOR UPDATE;
 IF s.id IS NULL OR NOT private.editorial_share_is_current(s.snapshot,c.items) THEN RAISE EXCEPTION 'Link expired or unavailable'; END IF;
 IF c.project_id IS NOT NULL OR c.status='approved' THEN RAISE EXCEPTION 'Review already closed'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approve','adjust') OR p_index IS NULL OR p_index < -1 OR p_index>=jsonb_array_length(c.items) OR length(coalesce(p_copy,''))>3000 OR length(coalesce(p_note,''))>3000 OR (p_decision='adjust' AND trim(coalesce(p_note,'')||coalesce(p_copy,''))='') THEN RAISE EXCEPTION 'Invalid feedback'; END IF;
 -- 90 materials can be reviewed without the previous 30-per-hour ceiling.
 IF (SELECT count(*) FROM public.monthly_editorial_feedback WHERE share_id=s.id AND created_at>now()-interval '1 hour')>=360 THEN RAISE EXCEPTION 'Too many requests'; END IF;
 INSERT INTO public.monthly_editorial_feedback(campaign_id,share_id,item_index,decision,suggested_copy,note) VALUES(s.campaign_id,s.id,p_index,p_decision,coalesce(p_copy,''),coalesce(p_note,''));
 IF p_index=-1 THEN
   UPDATE public.monthly_editorial_campaigns SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'changes_requested' END,updated_at=now() WHERE id=c.id;
 ELSE
   SELECT count(*) FILTER(WHERE decision='approve'),count(*) FILTER(WHERE decision='adjust') INTO approved_count,adjustment_count FROM (SELECT DISTINCT ON(item_index) item_index,decision FROM public.monthly_editorial_feedback WHERE share_id=s.id AND item_index>=0 ORDER BY item_index,created_at DESC,id DESC) latest;
   UPDATE public.monthly_editorial_campaigns SET status=CASE WHEN adjustment_count>0 THEN 'changes_requested' WHEN approved_count=jsonb_array_length(c.items) THEN 'approved' ELSE 'pending' END,updated_at=now() WHERE id=c.id;
 END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.share_monthly_editorial(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.share_monthly_editorial(uuid,text) TO authenticated;
REVOKE ALL ON FUNCTION public.get_public_editorial(text),public.submit_public_editorial(text,integer,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_editorial(text),public.submit_public_editorial(text,integer,text,text,text) TO anon,authenticated;

-- Internal current-version overview: authenticated tenant permission is mandatory.
CREATE OR REPLACE FUNCTION public.get_editorial_item_reviews(p_campaign uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.view') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('itemIndex',f.item_index,'decision',f.decision,'note',f.note,'copy',f.suggested_copy,'createdAt',f.created_at)) FROM (SELECT DISTINCT ON(fb.item_index) fb.* FROM public.monthly_editorial_feedback fb JOIN public.monthly_editorial_shares s ON s.id=fb.share_id WHERE fb.campaign_id=c.id AND fb.item_index>=0 AND NOT s.revoked AND private.editorial_share_is_current(s.snapshot,c.items) ORDER BY fb.item_index,fb.created_at DESC,fb.id DESC) f),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION public.get_editorial_item_reviews(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_editorial_item_reviews(uuid) TO authenticated;
