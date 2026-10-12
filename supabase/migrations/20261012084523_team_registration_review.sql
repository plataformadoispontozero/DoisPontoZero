-- Manual identity review does not assert that the applicant verified their email.
CREATE TABLE public.agency_registration_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),agency_id uuid NOT NULL REFERENCES public.agencies(id),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,email text NOT NULL,
 full_name text NOT NULL CHECK(length(full_name) BETWEEN 2 AND 120),
 profession text NOT NULL CHECK(profession IN('designer','social_media','videomaker','paid_traffic','manager')),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),
 role_id uuid REFERENCES public.roles(id),reviewed_by uuid REFERENCES public.profiles(id),reviewed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(agency_id,user_id)
);
ALTER TABLE public.agency_registration_requests ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION private.can_review_registration(p_agency uuid,p_actor uuid DEFAULT auth.uid()) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT p_actor IS NOT NULL AND EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id JOIN public.agencies a ON a.id=m.agency_id WHERE m.agency_id=p_agency AND m.user_id=p_actor AND m.status='active' AND a.status='active' AND r.name IN('OWNER','ADMIN','MANAGER') AND (r.name='OWNER' OR EXISTS(SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=r.id AND rp.allowed AND p.permission_key='members.edit')));
$$;
REVOKE ALL ON FUNCTION private.can_review_registration(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.can_review_registration(uuid,uuid) TO authenticated,service_role;
CREATE POLICY registration_request_select ON public.agency_registration_requests FOR SELECT TO authenticated USING(private.can_review_registration(agency_id) OR user_id=(select auth.uid()));
REVOKE ALL ON public.agency_registration_requests FROM anon,authenticated;
GRANT SELECT ON public.agency_registration_requests TO authenticated;
GRANT ALL ON public.agency_registration_requests TO service_role;
CREATE INDEX registration_pending_agency ON public.agency_registration_requests(agency_id,status,created_at DESC);
CREATE TABLE private.registration_rate_limits(bucket text NOT NULL,window_start timestamptz NOT NULL,hits integer NOT NULL,PRIMARY KEY(bucket,window_start));
ALTER TABLE private.registration_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_team_registration(p_ip_hash text,p_email_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b text; w timestamptz; n integer; maximum integer;
BEGIN
 IF p_ip_hash !~ '^[a-f0-9]{64}$' OR p_email_hash !~ '^[a-f0-9]{64}$' THEN RETURN false;END IF;
 -- Serialize reservations across all buckets; failed attempts still count.
 PERFORM pg_advisory_xact_lock(83582015);
 DELETE FROM private.registration_rate_limits WHERE window_start<now()-interval '2 days';
 FOREACH b IN ARRAY ARRAY['ip:'||p_ip_hash,'email:'||p_email_hash,'global'] LOOP
  w:=date_trunc(CASE WHEN b='global' THEN 'day' ELSE 'hour' END,now());
  maximum:=CASE WHEN b='global' THEN 100 WHEN b LIKE 'email:%' THEN 3 ELSE 10 END;
  INSERT INTO private.registration_rate_limits VALUES(b,w,1) ON CONFLICT(bucket,window_start) DO UPDATE SET hits=private.registration_rate_limits.hits+1 RETURNING hits INTO n;
  IF n>maximum THEN RETURN false;END IF;
 END LOOP;
 RETURN true;
END;$$;
CREATE OR REPLACE FUNCTION public.prepare_team_registration_review(p_agency uuid,p_id uuid,p_actor uuid,p_decision text,p_role uuid DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.agency_registration_requests;r text; actor_role text;
BEGIN
 IF NOT private.can_review_registration(p_agency,p_actor) THEN RAISE EXCEPTION 'Sem permissão para revisar cadastros.' USING ERRCODE='42501';END IF;
 SELECT * INTO q FROM public.agency_registration_requests WHERE id=p_id AND agency_id=p_agency FOR UPDATE;
 IF q.id IS NULL OR q.status<>'pending' THEN RAISE EXCEPTION 'Cadastro indisponível ou já revisado.';END IF;
 IF p_decision NOT IN('approve','reject') THEN RAISE EXCEPTION 'Decisão inválida.';END IF;
 IF p_decision='approve' THEN
  SELECT name INTO r FROM public.roles WHERE id=p_role AND agency_id=p_agency;
  SELECT ar.name INTO actor_role FROM public.agency_members m JOIN public.roles ar ON ar.id=m.role_id AND ar.agency_id=m.agency_id WHERE m.user_id=p_actor AND m.agency_id=p_agency AND m.status='active';
  IF r IS NULL OR r='OWNER' OR (r='ADMIN' AND actor_role<>'OWNER') THEN RAISE EXCEPTION 'Papel inválido para este revisor.';END IF;
  IF EXISTS(SELECT 1 FROM public.agency_members WHERE agency_id=p_agency AND user_id=q.user_id) THEN RAISE EXCEPTION 'Usuário já possui vínculo. Revise a equipe.';END IF;
 END IF;
 RETURN jsonb_build_object('userId',q.user_id,'email',q.email);
END;$$;
CREATE OR REPLACE FUNCTION public.finalize_team_registration_review(p_agency uuid,p_id uuid,p_actor uuid,p_decision text,p_role uuid DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.agency_registration_requests;
BEGIN
 PERFORM public.prepare_team_registration_review(p_agency,p_id,p_actor,p_decision,p_role);
 SELECT * INTO q FROM public.agency_registration_requests WHERE id=p_id AND agency_id=p_agency FOR UPDATE;
 IF p_decision='approve' THEN
  IF NOT EXISTS(SELECT 1 FROM auth.users WHERE id=q.user_id AND email_confirmed_at IS NOT NULL AND lower(email)=lower(q.email)) THEN RAISE EXCEPTION 'Conta ainda não liberada pela revisão.';END IF;
  INSERT INTO public.profiles(id,full_name) VALUES(q.user_id,q.full_name) ON CONFLICT(id) DO UPDATE SET full_name=excluded.full_name;
  INSERT INTO public.agency_members(agency_id,user_id,role_id,status) VALUES(p_agency,q.user_id,p_role,'active');
 END IF;
 UPDATE public.agency_registration_requests SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END,role_id=CASE WHEN p_decision='approve' THEN p_role ELSE NULL END,reviewed_by=p_actor,reviewed_at=now() WHERE id=q.id;
 INSERT INTO public.audit_logs(agency_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES(p_agency,p_actor,'team_registration.'||p_decision,'agency_registration_request',q.id::text,jsonb_build_object('profession',q.profession,'manual_identity_review',p_decision='approve'));
 RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.reserve_team_registration(text,text),public.prepare_team_registration_review(uuid,uuid,uuid,text,uuid),public.finalize_team_registration_review(uuid,uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_team_registration(text,text),public.prepare_team_registration_review(uuid,uuid,uuid,text,uuid),public.finalize_team_registration_review(uuid,uuid,uuid,text,uuid) TO service_role;
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK(type IN('meeting_invitation','meeting_updated','meeting_cancelled','meeting_action_assigned','chat_mention','chat_direct_message','chat_channel_message','team_registration_pending'));
CREATE OR REPLACE FUNCTION private.notify_team_registration() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 INSERT INTO public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 SELECT NEW.agency_id,m.user_id,'team_registration_pending','Novo cadastro aguardando aprovação',NEW.full_name||' solicitou acesso à equipe.','team_registration_request',NEW.id FROM public.agency_members m WHERE m.agency_id=NEW.agency_id AND private.can_review_registration(NEW.agency_id,m.user_id);
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION private.notify_team_registration() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER notify_team_registration AFTER INSERT ON public.agency_registration_requests FOR EACH ROW EXECUTE FUNCTION private.notify_team_registration();
