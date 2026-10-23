ALTER TABLE public.monthly_editorial_campaigns ADD COLUMN archived_at timestamptz;
ALTER TABLE public.monthly_editorial_shares ADD COLUMN sent_at timestamptz, ADD COLUMN first_view_at timestamptz, ADD COLUMN last_seen_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_editorial_campaign_archived(p_campaign uuid,p_archived boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns;
BEGIN
 IF p_archived IS NULL THEN RAISE EXCEPTION 'Invalid archive action'; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF c.project_id IS NOT NULL THEN RAISE EXCEPTION 'Calendário em produção não pode ser arquivado'; END IF;
 IF (c.archived_at IS NOT NULL)=p_archived THEN RETURN true; END IF;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=c.id;
 UPDATE public.monthly_editorial_campaigns SET archived_at=CASE WHEN p_archived THEN now() ELSE NULL END,status='draft',updated_at=now() WHERE id=c.id;
 INSERT INTO public.audit_logs(agency_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES(c.agency_id,auth.uid(),CASE WHEN p_archived THEN 'editorial.archived' ELSE 'editorial.restored' END,'editorial_campaign',c.id::text,jsonb_build_object('previous_status',c.status,'links_revoked',true));
 RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.mark_editorial_review_sent(p_campaign uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; s public.monthly_editorial_shares;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF c.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Calendário arquivado'; END IF;
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE campaign_id=c.id AND NOT revoked AND expires_at>now() AND private.editorial_share_is_current(snapshot,c.items) ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF s.id IS NULL THEN RAISE EXCEPTION 'Gere um link válido antes de marcar o envio'; END IF;
 IF s.sent_at IS NULL THEN
 UPDATE public.monthly_editorial_shares SET sent_at=now() WHERE id=s.id;
 INSERT INTO public.audit_logs(agency_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES(c.agency_id,auth.uid(),'editorial.marked_sent','editorial_campaign',c.id::text,jsonb_build_object('share_id',s.id,'delivery_confirmed_by_user',true));
 END IF;
 RETURN true;
END; $$;

-- Anonymous presence records only an aggregate recent heartbeat; no IP, fingerprint or named identity.
CREATE OR REPLACE FUNCTION public.touch_public_editorial_review(p_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.monthly_editorial_shares; c public.monthly_editorial_campaigns;
BEGIN
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE p_token ~ '^[a-f0-9]{64}$' AND token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND NOT revoked AND expires_at>now();
 IF s.id IS NULL THEN RETURN false; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=s.campaign_id FOR SHARE;
 IF c.id IS NULL OR c.archived_at IS NOT NULL OR c.project_id IS NOT NULL OR NOT private.editorial_share_is_current(s.snapshot,c.items) THEN RETURN false; END IF;
 IF auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.agency_members WHERE agency_id=c.agency_id AND user_id=auth.uid() AND status='active') THEN RETURN false; END IF;
 UPDATE public.monthly_editorial_shares SET first_view_at=coalesce(first_view_at,now()),last_seen_at=now() WHERE id=s.id AND NOT revoked AND expires_at>now() AND (last_seen_at IS NULL OR last_seen_at<now()-interval '15 seconds');
 RETURN true;
END; $$;

CREATE OR REPLACE FUNCTION public.get_editorial_review_monitor(p_campaign uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; s public.monthly_editorial_shares; approvals integer:=0; adjustments integer:=0;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.view') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 SELECT * INTO s FROM public.monthly_editorial_shares WHERE campaign_id=c.id AND NOT revoked AND private.editorial_share_is_current(snapshot,c.items) ORDER BY created_at DESC LIMIT 1;
 IF s.id IS NOT NULL THEN
 SELECT count(*) FILTER(WHERE decision='approve'),count(*) FILTER(WHERE decision='adjust') INTO approvals,adjustments FROM (SELECT DISTINCT ON(item_index) decision,item_index FROM public.monthly_editorial_feedback WHERE share_id=s.id AND item_index>=0 ORDER BY item_index,created_at DESC,id DESC) latest;
 END IF;
 IF c.status IN ('approved','production') THEN approvals:=jsonb_array_length(c.items);adjustments:=0; END IF;
 RETURN jsonb_build_object('generatedAt',s.created_at,'sentAt',s.sent_at,'firstViewAt',s.first_view_at,'lastSeenAt',s.last_seen_at,'online',coalesce(NOT s.revoked AND s.expires_at>now() AND s.last_seen_at>now()-interval '75 seconds' AND c.archived_at IS NULL,false),'expiresAt',s.expires_at,'revoked',coalesce(s.revoked,false),'total',jsonb_array_length(c.items),'approved',approvals,'adjust',adjustments,'reviewed',approvals+adjustments,'trackingLabel',CASE WHEN c.status IN ('approved','production') THEN 'Aprovado' WHEN c.status='changes_requested' OR s.first_view_at IS NOT NULL OR approvals+adjustments>0 THEN 'Em revisão' WHEN s.id IS NOT NULL THEN 'Link gerado' ELSE 'Sem link' END,'archivedAt',c.archived_at);
END; $$;
REVOKE ALL ON FUNCTION public.set_editorial_campaign_archived(uuid,boolean),public.mark_editorial_review_sent(uuid),public.get_editorial_review_monitor(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_editorial_campaign_archived(uuid,boolean),public.mark_editorial_review_sent(uuid),public.get_editorial_review_monitor(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.touch_public_editorial_review(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.touch_public_editorial_review(text) TO anon,authenticated;


CREATE OR REPLACE FUNCTION public.share_monthly_editorial(p_campaign uuid,p_token text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; client_name text; expires timestamptz;
BEGIN
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign FOR UPDATE;
 IF c.id IS NULL OR NOT private.can_editorial(c.agency_id,'strategy.edit') THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501'; END IF;
 IF p_token IS NULL OR p_token !~ '^[a-f0-9]{64}$' OR c.project_id IS NOT NULL OR c.archived_at IS NOT NULL THEN RAISE EXCEPTION 'Invalid share'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(c.items) i WHERE i.value->>'copy' ~ '\[(Completar|Complementar)') THEN RAISE EXCEPTION 'Complete as lacunas antes de enviar para aprovação.'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=c.agency_id;
 UPDATE public.monthly_editorial_shares SET revoked=true WHERE campaign_id=c.id;
 INSERT INTO public.monthly_editorial_shares(campaign_id,token_hash,snapshot) VALUES(c.id,encode(sha256(convert_to(p_token,'UTF8')),'hex'),jsonb_build_object('client',client_name,'month',c.month,'items',private.editorial_public_items(c.items),'contentHash',encode(sha256(convert_to(c.items::text,'UTF8')),'hex'))) RETURNING expires_at INTO expires;
 UPDATE public.monthly_editorial_campaigns SET status='pending',updated_at=now() WHERE id=c.id;
 RETURN expires;
END; $$;


CREATE OR REPLACE FUNCTION public.get_public_editorial(p_token text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('client',s.snapshot->'client','month',s.snapshot->'month','items',private.editorial_public_items(c.items),'status',c.status,'expiresAt',s.expires_at,'itemReviews',coalesce((SELECT jsonb_agg(jsonb_build_object('itemIndex',f.item_index,'decision',f.decision,'note',f.note,'copy',f.suggested_copy)) FROM (SELECT DISTINCT ON (item_index) * FROM public.monthly_editorial_feedback WHERE share_id=s.id AND item_index>=0 ORDER BY item_index,created_at DESC,id DESC) f),'[]'::jsonb))
 FROM public.monthly_editorial_shares s JOIN public.monthly_editorial_campaigns c ON c.id=s.campaign_id
 WHERE p_token ~ '^[a-f0-9]{64}$' AND s.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') AND c.archived_at IS NULL AND NOT s.revoked AND s.expires_at>now() AND private.editorial_share_is_current(s.snapshot,c.items);
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
 IF c.archived_at IS NOT NULL OR c.project_id IS NOT NULL OR c.status='approved' THEN RAISE EXCEPTION 'Review already closed'; END IF;
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

CREATE OR REPLACE FUNCTION private.guard_archived_editorial_content()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF OLD.archived_at IS NOT NULL AND NEW.archived_at IS NOT NULL AND (NEW.items IS DISTINCT FROM OLD.items OR NEW.context IS DISTINCT FROM OLD.context OR NEW.briefing_id IS DISTINCT FROM OLD.briefing_id OR NEW.client_id IS DISTINCT FROM OLD.client_id OR NEW.month IS DISTINCT FROM OLD.month OR NEW.project_id IS DISTINCT FROM OLD.project_id) THEN RAISE EXCEPTION 'Restaure o calendário antes de editar ou produzir demandas'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_archived_editorial_content() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER archived_editorial_content_guard BEFORE UPDATE ON public.monthly_editorial_campaigns FOR EACH ROW EXECUTE FUNCTION private.guard_archived_editorial_content();


-- Extend the existing notification trigger recipient set; no duplicate trigger or event.
create or replace function private.notify_calendar_transition() returns trigger language plpgsql security definer set search_path='' as $$
declare event_type text;event_title text;client_name text;
begin
 if new.status is not distinct from old.status or new.status not in ('approved','changes_requested','production') then return new;end if;
 if not exists(select 1 from public.clients where id=new.client_id and agency_id=new.agency_id) then return new;end if;
 -- Public client feedback has no auth.uid(); the existing token-validated RPC and campaign guard authorize the transition.
 event_type:=case new.status when 'approved' then 'calendar_approved' when 'changes_requested' then 'calendar_changes_requested' else 'calendar_production' end;
 event_title:=case new.status when 'approved' then 'Calendário aprovado pelo cliente' when 'changes_requested' then 'Cliente solicitou ajustes no calendário' else 'Calendário liberado para produção' end;
 select name into client_name from public.clients where id=new.client_id and agency_id=new.agency_id;
 insert into public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 select new.agency_id,m.user_id,event_type,event_title,client_name||' · '||to_char(new.month,'MM/YYYY')||'. Confira a campanha e os próximos passos.','editorial_campaign',new.id
 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id
 where m.agency_id=new.agency_id and m.user_id is distinct from auth.uid() and private.operational_notification_access(new.agency_id,m.user_id,'strategy.view')
 and (r.name in ('OWNER','ADMIN','MANAGER','GESTOR')
 or exists(select 1 from public.briefings b where b.id=new.briefing_id and b.agency_id=new.agency_id and b.client_id=new.client_id and b.assigned_to=m.user_id)
 or m.user_id=(select v.actor_id from public.editorial_campaign_versions v where v.campaign_id=new.id and v.agency_id=new.agency_id order by v.revision asc limit 1)
 or m.user_id=(select a.actor_user_id from public.audit_logs a where a.agency_id=new.agency_id and a.entity_type='editorial_campaign' and a.entity_id=new.id::text and a.action='editorial.marked_sent' order by a.created_at desc,a.id desc limit 1));
 return new;
end;$$;
