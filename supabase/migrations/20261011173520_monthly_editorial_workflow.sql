-- Additive monthly editorial workflow. No changes to existing Auth or client data.
CREATE OR REPLACE FUNCTION private.can_editorial(p_agency uuid,p_permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id
 JOIN public.agencies a ON a.id=m.agency_id
 WHERE m.agency_id=p_agency AND m.user_id=auth.uid() AND m.status='active' AND a.status='active'
 AND (r.name='OWNER' OR EXISTS(SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id
 WHERE rp.role_id=r.id AND rp.allowed AND p.permission_key=p_permission)));
$$;
REVOKE ALL ON FUNCTION private.can_editorial(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_editorial(uuid,text) TO authenticated;
CREATE TABLE public.monthly_editorial_campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid NOT NULL REFERENCES public.agencies(id),
 client_id uuid NOT NULL REFERENCES public.clients(id),briefing_id uuid REFERENCES public.briefings(id),
 month date NOT NULL CHECK(extract(day from month)=1),context jsonb NOT NULL DEFAULT '{}',
 items jsonb NOT NULL CHECK(jsonb_typeof(items)='array' AND jsonb_array_length(items) BETWEEN 1 AND 90 AND octet_length(items::text)<300000),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','changes_requested','approved','production')),
 project_id uuid REFERENCES public.projects(id),created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX monthly_editorial_agency_month ON public.monthly_editorial_campaigns(agency_id,month DESC);
CREATE INDEX monthly_editorial_client ON public.monthly_editorial_campaigns(client_id);
CREATE INDEX monthly_editorial_briefing ON public.monthly_editorial_campaigns(briefing_id);
CREATE INDEX monthly_editorial_project ON public.monthly_editorial_campaigns(project_id);
ALTER TABLE public.monthly_editorial_campaigns ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monthly_editorial_campaigns FROM anon,authenticated;
GRANT SELECT ON public.monthly_editorial_campaigns TO authenticated;
CREATE POLICY editorial_read ON public.monthly_editorial_campaigns FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'strategy.view'));
CREATE TABLE public.monthly_editorial_shares (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL REFERENCES public.monthly_editorial_campaigns(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,snapshot jsonb NOT NULL,expires_at timestamptz NOT NULL DEFAULT now()+interval '30 days',revoked boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX monthly_editorial_shares_campaign ON public.monthly_editorial_shares(campaign_id);
ALTER TABLE public.monthly_editorial_shares ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monthly_editorial_shares FROM anon,authenticated;
CREATE TABLE public.monthly_editorial_feedback (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),campaign_id uuid NOT NULL REFERENCES public.monthly_editorial_campaigns(id) ON DELETE CASCADE,
 share_id uuid NOT NULL REFERENCES public.monthly_editorial_shares(id),item_index integer NOT NULL,
 decision text NOT NULL CHECK(decision IN ('approve','adjust')),suggested_copy text NOT NULL DEFAULT '' CHECK(length(suggested_copy)<=3000),
 note text NOT NULL DEFAULT '' CHECK(length(note)<=3000),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX monthly_editorial_feedback_campaign ON public.monthly_editorial_feedback(campaign_id,created_at DESC);
CREATE INDEX monthly_editorial_feedback_share ON public.monthly_editorial_feedback(share_id,created_at DESC);
ALTER TABLE public.monthly_editorial_feedback ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.monthly_editorial_feedback FROM anon,authenticated;
GRANT SELECT ON public.monthly_editorial_feedback TO authenticated;
CREATE POLICY editorial_feedback_read ON public.monthly_editorial_feedback FOR SELECT TO authenticated USING(EXISTS(
 SELECT 1 FROM public.monthly_editorial_campaigns c WHERE c.id=campaign_id AND private.can_editorial(c.agency_id,'strategy.view')));
CREATE OR REPLACE FUNCTION public.save_monthly_editorial(p_id uuid,p_agency uuid,p_client uuid,p_briefing uuid,p_month date,p_context jsonb,p_items jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result_id uuid; existing public.monthly_editorial_campaigns; item jsonb;
BEGIN
 IF NOT private.can_editorial(p_agency,CASE WHEN p_id IS NULL THEN 'strategy.create' ELSE 'strategy.edit' END) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.clients WHERE id=p_client AND agency_id=p_agency) THEN RAISE EXCEPTION 'Client mismatch'; END IF;
 IF p_briefing IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.briefings WHERE id=p_briefing AND client_id=p_client AND agency_id=p_agency) THEN RAISE EXCEPTION 'Briefing mismatch'; END IF;
 IF p_month IS NULL OR extract(day from p_month)<>1 OR jsonb_typeof(p_context) IS DISTINCT FROM 'object' OR octet_length(p_context::text)>16000 OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 90 THEN RAISE EXCEPTION 'Invalid campaign'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_items) LOOP
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' OR coalesce(item->>'format','') NOT IN ('post','reels','carousel') OR coalesce(length(item->>'title'),0) NOT BETWEEN 1 AND 200 OR coalesce(length(item->>'copy'),0) NOT BETWEEN 1 AND 3000 OR date_trunc('month',(item->>'date')::date)::date IS DISTINCT FROM p_month THEN RAISE EXCEPTION 'Invalid item'; END IF;
 END LOOP;
 IF p_id IS NULL THEN
 INSERT INTO public.monthly_editorial_campaigns(agency_id,client_id,briefing_id,month,context,items) VALUES(p_agency,p_client,p_briefing,p_month,p_context,p_items) RETURNING id INTO result_id;
 ELSE
 SELECT * INTO existing FROM public.monthly_editorial_campaigns WHERE id=p_id AND agency_id=p_agency FOR UPDATE;
 IF existing.id IS NULL OR existing.project_id IS NOT NULL THEN RAISE EXCEPTION 'Campaign unavailable or already in production'; END IF;
 UPDATE public.monthly_editorial_campaigns SET client_id=p_client,briefing_id=p_briefing,month=p_month,context=p_context,items=p_items,status='draft',updated_at=now() WHERE id=p_id;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=p_id;
 result_id:=p_id;
 END IF;
 RETURN result_id;
END; $$;
CREATE OR REPLACE FUNCTION public.share_monthly_editorial(p_campaign uuid,p_token text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; client_name text; expires timestamptz;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR c.project_id IS NOT NULL THEN RAISE EXCEPTION 'Invalid share'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=c.id;
 INSERT INTO public.monthly_editorial_shares(campaign_id,token_hash,snapshot) VALUES(c.id,encode(sha256(convert_to(p_token,'UTF8')),'hex'),jsonb_build_object('client',client_name,'month',c.month,'items',c.items)) RETURNING expires_at INTO expires;
 UPDATE public.monthly_editorial_campaigns SET status='pending',updated_at=now() WHERE id=c.id;
 RETURN expires;
END; $$;
CREATE OR REPLACE FUNCTION public.get_public_editorial(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT snapshot || jsonb_build_object('status',c.status,'expiresAt',s.expires_at) FROM public.monthly_editorial_shares s JOIN public.monthly_editorial_campaigns c ON c.id=s.campaign_id
 WHERE p_token ~ '^[a-f0-9]{64}$' AND s.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT s.revoked AND s.expires_at>now();
$$;
CREATE OR REPLACE FUNCTION public.submit_public_editorial(p_token text,p_index integer,p_decision text,p_copy text,p_note text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.monthly_editorial_shares; c public.monthly_editorial_campaigns;
BEGIN
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE p_token ~ '^[a-f0-9]{64}$' AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT revoked AND expires_at>now() FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Link expired or unavailable'; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=s.campaign_id FOR UPDATE;
 IF c.project_id IS NOT NULL OR c.status='approved' THEN RAISE EXCEPTION 'Review already closed'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approve','adjust') OR p_index IS NULL OR p_index < -1 OR p_index>=jsonb_array_length(s.snapshot->'items') OR length(coalesce(p_copy,''))>3000 OR length(coalesce(p_note,''))>3000 OR (p_decision='approve' AND p_index<>-1) OR (p_decision='adjust' AND trim(coalesce(p_note,'')||coalesce(p_copy,''))='') THEN RAISE EXCEPTION 'Invalid feedback'; END IF;
 IF (SELECT count(*) FROM public.monthly_editorial_feedback WHERE share_id=s.id AND created_at>now()-interval '1 hour')>=30 THEN RAISE EXCEPTION 'Too many requests'; END IF;
 INSERT INTO public.monthly_editorial_feedback(campaign_id,share_id,item_index,decision,suggested_copy,note) VALUES(s.campaign_id,s.id,p_index,p_decision,coalesce(p_copy,''),coalesce(p_note,''));
 UPDATE public.monthly_editorial_campaigns SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'changes_requested' END,updated_at=now() WHERE id=s.campaign_id;
 RETURN true;
END; $$;
CREATE OR REPLACE FUNCTION public.produce_monthly_editorial(p_campaign uuid,p_include_traffic boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; project uuid; board uuid; column_id uuid; client_name text; item jsonb; idx integer:=0;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') OR NOT private.can_editorial(c.agency_id,'projects.create') OR NOT private.can_editorial(c.agency_id,'tasks.create') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF c.project_id IS NOT NULL THEN RETURN c.project_id; END IF;
 IF c.status<>'approved' THEN RAISE EXCEPTION 'Approve the calendar before production'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 INSERT INTO public.projects(agency_id,client_id,name,description,status,created_by,start_date,due_date) VALUES(c.agency_id,c.client_id,'Campanha '||client_name||' — '||to_char(c.month,'MM/YYYY'),'Calendário editorial aprovado.','active',auth.uid(),c.month,(c.month+interval '1 month -1 day')::date) RETURNING id INTO project;
 INSERT INTO public.project_boards(agency_id,project_id,name,is_default) VALUES(c.agency_id,project,'Produção mensal',true) RETURNING id INTO board;
 INSERT INTO public.board_columns(agency_id,board_id,name,category,position) VALUES(c.agency_id,board,'A produzir','backlog',0) RETURNING id INTO column_id;
 INSERT INTO public.board_columns(agency_id,board_id,name,category,position) VALUES(c.agency_id,board,'Em produção','in_progress',1),(c.agency_id,board,'Revisão','review',2),(c.agency_id,board,'Concluído','done',3);
 FOR item IN SELECT value FROM jsonb_array_elements(c.items) LOOP
  INSERT INTO public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by,position)
  VALUES(c.agency_id,project,board,column_id,CASE WHEN item->>'format'='reels' THEN '[Videomaker] ' ELSE '[Design] ' END||(item->>'title'),(item->>'format')||E'\n\n'||(item->>'copy'),(item->>'date')::date,auth.uid(),idx);
  idx:=idx+1;
 END LOOP;
 IF p_include_traffic THEN INSERT INTO public.tasks(agency_id,project_id,board_id,column_id,title,description,due_date,created_by,position)
 VALUES(c.agency_id,project,board,column_id,'[Tráfego Pago] Planejar mídia — '||client_name,'Definir objetivo, orçamento, público e peças aprovadas com a equipe. Não publica anúncios automaticamente.',c.month,auth.uid(),idx); END IF;
 UPDATE public.monthly_editorial_campaigns SET project_id=project,status='production',updated_at=now() WHERE id=c.id;
 RETURN project;
END; $$;
REVOKE ALL ON FUNCTION public.save_monthly_editorial(uuid,uuid,uuid,uuid,date,jsonb,jsonb),public.share_monthly_editorial(uuid,text),public.produce_monthly_editorial(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_monthly_editorial(uuid,uuid,uuid,uuid,date,jsonb,jsonb),public.share_monthly_editorial(uuid,text),public.produce_monthly_editorial(uuid,boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.get_public_editorial(text),public.submit_public_editorial(text,integer,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_editorial(text),public.submit_public_editorial(text,integer,text,text,text) TO anon,authenticated;
