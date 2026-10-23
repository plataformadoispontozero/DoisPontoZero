-- Permanent deletion is explicit, tenant-scoped and restricted to unreferenced briefings.
CREATE OR REPLACE FUNCTION public.delete_briefing_permanently(p_agency uuid,p_briefing uuid,p_confirmation text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE b public.briefings; cross_tenant boolean; child_table text;
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency,'briefings.delete') THEN RAISE EXCEPTION 'Permissão para excluir briefings necessária' USING ERRCODE='42501'; END IF;
 SELECT * INTO b FROM public.briefings WHERE id=p_briefing AND agency_id=p_agency FOR UPDATE;
 IF b.id IS NULL OR p_confirmation IS DISTINCT FROM b.title THEN RAISE EXCEPTION 'Confirme o título exato do briefing'; END IF;
 IF EXISTS(SELECT 1 FROM public.monthly_editorial_campaigns WHERE briefing_id=b.id)
 OR EXISTS(SELECT 1 FROM public.content_strategies WHERE briefing_id=b.id)
 OR EXISTS(SELECT 1 FROM public.proposals WHERE briefing_id=b.id)
 OR EXISTS(SELECT 1 FROM public.editorial_campaign_versions WHERE briefing_snapshot->>'id'=b.id::text) THEN
 RAISE EXCEPTION 'Exclusão bloqueada: este briefing está vinculado a histórico operacional de calendário, estratégia ou proposta.'; END IF;
 -- These six child FKs are ON DELETE CASCADE in phase06. Never delete their storage/Drive files.
 FOREACH child_table IN ARRAY ARRAY['briefing_answers','briefing_public_links','briefing_attachments','briefing_versions','briefing_exports','briefing_activity'] LOOP
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE briefing_id=$1 AND agency_id<>$2)',child_table) INTO cross_tenant USING b.id,p_agency;
 IF cross_tenant THEN RAISE EXCEPTION 'Vínculo de agência inconsistente; exclusão bloqueada'; END IF;
 END LOOP;
 INSERT INTO public.audit_logs(agency_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES(p_agency,auth.uid(),'briefing.permanently_deleted','briefing',b.id::text,jsonb_build_object('title',b.title,'client_id',b.client_id,'template_preserved',true,'external_files_preserved',true));
 DELETE FROM public.briefings WHERE id=b.id AND agency_id=p_agency;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.delete_briefing_permanently(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_briefing_permanently(uuid,uuid,text) TO authenticated;

-- Review fingerprints bind each new decision to the exact current presentation content.
ALTER TABLE public.presentation_material_reviews ADD COLUMN content_hash text;
CREATE OR REPLACE FUNCTION private.presentation_review_content_hash(p_presentation uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT encode(sha256(convert_to(jsonb_build_object(
 'presentation',jsonb_build_object('id',p.id,'client_id',p.client_id,'title',p.title,'description',p.description,'period_month',p.period_month,'period_year',p.period_year),
 'sections',coalesce((SELECT jsonb_agg(jsonb_build_object('id',s.id,'type',s.section_type,'title',s.title,'description',s.description,'content',s.content,'position',s.position) ORDER BY s.position,s.id) FROM public.presentation_sections s WHERE s.presentation_id=p.id AND s.agency_id=p.agency_id),'[]'::jsonb),
 'assets',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'section_id',a.section_id,'file_reference_id',a.file_reference_id,'title',a.title,'description',a.description,'position',a.position,'reference',jsonb_build_object('google_file_id',d.google_file_id,'name',d.name,'mime_type',d.mime_type,'modified_time',d.modified_time,'size_bytes',d.size_bytes)) ORDER BY a.position,a.id) FROM public.presentation_assets a LEFT JOIN public.drive_file_references d ON d.id=a.file_reference_id AND d.agency_id=a.agency_id WHERE a.presentation_id=p.id AND a.agency_id=p.agency_id),'[]'::jsonb)
 )::text,'UTF8')),'hex') FROM public.presentations p WHERE p.id=p_presentation;
$$;
REVOKE ALL ON FUNCTION private.presentation_review_content_hash(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.stamp_presentation_review_content()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM 1 FROM public.presentations WHERE id=NEW.presentation_id AND agency_id=NEW.agency_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Apresentação indisponível'; END IF;
 NEW.content_hash:=private.presentation_review_content_hash(NEW.presentation_id);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.stamp_presentation_review_content() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER presentation_review_content_stamp BEFORE INSERT ON public.presentation_material_reviews FOR EACH ROW EXECUTE FUNCTION private.stamp_presentation_review_content();

CREATE TABLE public.presentation_review_completions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 agency_id uuid NOT NULL REFERENCES public.agencies(id),
 presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
 public_link_id uuid NOT NULL REFERENCES public.presentation_public_links(id) ON DELETE CASCADE,
 content_hash text NOT NULL,
 material_count integer NOT NULL CHECK(material_count>0),
 completed_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(public_link_id,content_hash)
);
ALTER TABLE public.presentation_review_completions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.presentation_review_completions FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.presentation_review_completions TO authenticated;
CREATE POLICY presentation_completion_team_read ON public.presentation_review_completions FOR SELECT TO authenticated USING(private.can_editorial(agency_id,'presentations.view'));
CREATE INDEX presentation_completion_scope ON public.presentation_review_completions(agency_id,presentation_id,completed_at DESC);

CREATE OR REPLACE FUNCTION public.complete_showcase_review(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE l public.presentation_public_links; p public.presentations; fingerprint text; asset_count integer; approved_count integer; completed public.presentation_review_completions;
BEGIN
 IF p_token IS NULL OR length(p_token)<20 OR length(p_token)>512 THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 SELECT * INTO l FROM public.presentation_public_links WHERE token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now());
 IF l.id IS NULL THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 SELECT * INTO p FROM public.presentations WHERE id=l.presentation_id AND agency_id=l.agency_id AND status='published' AND archived_at IS NULL FOR UPDATE;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Apresentação indisponível.'; END IF;
 -- Recheck the link after waiting on the presentation lock; serialize with material review inserts.
 SELECT * INTO l FROM public.presentation_public_links WHERE id=l.id AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()) FOR UPDATE;
 IF l.id IS NULL THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 PERFORM 1 FROM public.presentation_assets WHERE presentation_id=p.id AND agency_id=p.agency_id FOR SHARE;
 PERFORM 1 FROM public.presentation_sections WHERE presentation_id=p.id AND agency_id=p.agency_id FOR SHARE;
 fingerprint:=private.presentation_review_content_hash(p.id);
 SELECT count(*) INTO asset_count FROM public.presentation_assets WHERE presentation_id=p.id AND agency_id=p.agency_id;
 SELECT count(*) INTO approved_count FROM public.presentation_assets a JOIN LATERAL(SELECT r.decision,r.content_hash FROM public.presentation_material_reviews r WHERE r.presentation_id=p.id AND r.agency_id=p.agency_id AND r.asset_id=a.id AND r.public_link_id=l.id ORDER BY r.created_at DESC,r.id DESC LIMIT 1) last_review ON last_review.decision='approved' AND last_review.content_hash=fingerprint WHERE a.presentation_id=p.id AND a.agency_id=p.agency_id;
 IF asset_count=0 OR approved_count<>asset_count THEN RAISE EXCEPTION 'Aprove todos os materiais da versão atual antes de concluir. Materiais alterados precisam de nova avaliação.'; END IF;
 SELECT * INTO completed FROM public.presentation_review_completions WHERE public_link_id=l.id AND content_hash=fingerprint;
 IF completed.id IS NULL THEN
 INSERT INTO public.presentation_review_completions(agency_id,presentation_id,public_link_id,content_hash,material_count) VALUES(p.agency_id,p.id,l.id,fingerprint,asset_count) RETURNING * INTO completed;
 INSERT INTO public.presentation_activity(agency_id,presentation_id,action,metadata) VALUES(p.agency_id,p.id,'client_review_completed',jsonb_build_object('completion_id',completed.id,'public_link_id',l.id,'material_count',asset_count));
 INSERT INTO public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 SELECT p.agency_id,m.user_id,'material_approved','Cliente concluiu a aprovação da apresentação',p.title||' · Todos os '||asset_count||' materiais foram aprovados.','presentation',p.id
 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id
 WHERE m.agency_id=p.agency_id AND private.operational_notification_access(p.agency_id,m.user_id,'presentations.view') AND (m.user_id=p.owner_id OR m.user_id=p.created_by OR m.user_id=l.created_by OR r.name IN ('OWNER','ADMIN','MANAGER','GESTOR'));
 END IF;
 RETURN jsonb_build_object('completedAt',completed.completed_at,'total',completed.material_count,'status','completed');
END; $$;
REVOKE ALL ON FUNCTION public.complete_showcase_review(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_showcase_review(text) TO anon,authenticated;


-- Use presentation-first locks, matching completion and the content stamp trigger.
CREATE OR REPLACE FUNCTION private.submit_showcase_material_review(p_token text,p_asset uuid,p_decision text,p_note text DEFAULT '')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=''
AS $$
DECLARE v_link public.presentation_public_links%ROWTYPE; v_review public.presentation_material_reviews%ROWTYPE;
BEGIN
 IF p_token IS NULL OR length(p_token)<20 OR length(p_token)>512 THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approved','changes_requested','rejected') OR length(coalesce(p_note,''))>4000 THEN RAISE EXCEPTION 'Avaliação inválida.'; END IF;
 IF p_decision<>'approved' AND length(trim(coalesce(p_note,'')))=0 THEN RAISE EXCEPTION 'Informe a observação para a equipe.'; END IF;
 SELECT l.* INTO v_link FROM public.presentation_public_links l JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
 WHERE l.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now()) AND p.status='published' AND p.archived_at IS NULL FOR UPDATE OF p;
 IF v_link.id IS NOT NULL THEN
 SELECT * INTO v_link FROM public.presentation_public_links WHERE id=v_link.id AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at>now()) FOR SHARE;
 END IF;
 IF v_link.id IS NULL OR NOT EXISTS (SELECT 1 FROM public.presentation_assets a WHERE a.id=p_asset AND a.presentation_id=v_link.presentation_id AND a.agency_id=v_link.agency_id) THEN RAISE EXCEPTION 'Material indisponível para este link.'; END IF;
 INSERT INTO public.presentation_material_reviews(agency_id,presentation_id,asset_id,public_link_id,decision,note)
 VALUES(v_link.agency_id,v_link.presentation_id,p_asset,v_link.id,p_decision,trim(coalesce(p_note,''))) RETURNING * INTO v_review;
 INSERT INTO public.presentation_activity(agency_id,presentation_id,action,metadata) VALUES(v_link.agency_id,v_link.presentation_id,'material_reviewed',jsonb_build_object('asset_id',p_asset,'decision',p_decision,'review_id',v_review.id));
 RETURN jsonb_build_object('id',v_review.id,'asset_id',p_asset,'decision',p_decision,'note',v_review.note,'created_at',v_review.created_at);
END $$;


CREATE OR REPLACE FUNCTION private.get_showcase_material_reviews(p_token text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_link public.presentation_public_links%ROWTYPE;
BEGIN
 IF p_token IS NULL OR length(p_token)<20 OR length(p_token)>512 THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 SELECT l.* INTO v_link FROM public.presentation_public_links l JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
 WHERE l.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now()) AND p.status='published' AND p.archived_at IS NULL;
 IF v_link.id IS NULL THEN RAISE EXCEPTION 'Link inválido ou expirado.'; END IF;
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('asset_id',r.asset_id,'decision',r.decision,'note',r.note,'created_at',r.created_at) ORDER BY r.created_at DESC,r.id DESC)
 FROM public.presentation_material_reviews r JOIN public.presentation_assets a ON a.id=r.asset_id AND a.presentation_id=r.presentation_id AND a.agency_id=r.agency_id
 WHERE r.presentation_id=v_link.presentation_id AND r.agency_id=v_link.agency_id AND r.public_link_id=v_link.id AND r.content_hash=private.presentation_review_content_hash(v_link.presentation_id)),'[]'::jsonb);
END $$;

-- Prevent direct DELETE from silently nulling real strategy/proposal relationships.
CREATE OR REPLACE FUNCTION private.guard_referenced_briefing_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.monthly_editorial_campaigns WHERE briefing_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.content_strategies WHERE briefing_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.proposals WHERE briefing_id=OLD.id)
 OR EXISTS(SELECT 1 FROM public.editorial_campaign_versions WHERE briefing_snapshot->>'id'=OLD.id::text) THEN RAISE EXCEPTION 'Exclusão bloqueada: briefing vinculado a histórico operacional.'; END IF;
 RETURN OLD;
END; $$;
REVOKE ALL ON FUNCTION private.guard_referenced_briefing_delete() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER briefing_referenced_delete_guard BEFORE DELETE ON public.briefings FOR EACH ROW EXECUTE FUNCTION private.guard_referenced_briefing_delete();
