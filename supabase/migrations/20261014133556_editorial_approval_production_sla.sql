-- Approval is the canonical start of the 48 elapsed-hour production window.
ALTER TABLE public.monthly_editorial_campaigns ADD COLUMN approved_at timestamptz;
-- Historical dates are recovered only from actual whole-calendar approvals, never from updated_at.
UPDATE public.monthly_editorial_campaigns c SET approved_at=f.approved_at FROM (SELECT campaign_id,max(created_at) approved_at FROM public.monthly_editorial_feedback WHERE decision='approve' AND item_index=-1 GROUP BY campaign_id) f WHERE c.id=f.campaign_id AND c.status IN ('approved','production') AND c.approved_at IS NULL;
CREATE FUNCTION private.stamp_editorial_approval() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$ BEGIN
 IF TG_OP='INSERT' THEN NEW.approved_at:=CASE WHEN NEW.status='approved' THEN statement_timestamp() ELSE NULL END;
 ELSIF NEW.status='approved' AND OLD.status IS DISTINCT FROM 'approved' THEN NEW.approved_at:=statement_timestamp();
 ELSIF NEW.status IN ('approved','production') THEN NEW.approved_at:=OLD.approved_at;
 ELSE NEW.approved_at:=NULL; END IF; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION private.stamp_editorial_approval() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stamp_editorial_approval BEFORE INSERT OR UPDATE ON public.monthly_editorial_campaigns FOR EACH ROW EXECUTE FUNCTION private.stamp_editorial_approval();
CREATE FUNCTION private.task_production_timing(p_agency_id uuid,p_task_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT coalesce(public.is_agency_member(p_agency_id),false) OR NOT coalesce(public.has_agency_permission(p_agency_id,'tasks.view'),false) THEN RAISE EXCEPTION 'Acesso negado aos prazos de produção' USING errcode='42501'; END IF;
 IF p_task_ids IS NULL OR cardinality(p_task_ids)>1000 THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('task_id',t.id,'briefing_received_at',b.submitted_at,'calendar_approved_at',c.approved_at,'production_due_at',c.approved_at+interval '48 hours','production_finished_at',CASE WHEN t.status IN ('review','done') THEN coalesce((SELECT max(a.created_at) FROM public.task_activity a JOIN public.board_columns bc ON bc.id=(a.metadata->>'to_column_id')::uuid AND bc.board_id=t.board_id WHERE a.task_id=t.id AND a.agency_id=p_agency_id AND a.action='moved' AND bc.category IN ('review','done')),t.completed_at) ELSE NULL END)),'[]'::jsonb) INTO result
 FROM public.tasks t JOIN public.projects p ON p.id=t.project_id AND p.agency_id=p_agency_id
 LEFT JOIN public.monthly_editorial_campaigns c ON c.project_id=p.id AND c.agency_id=p_agency_id AND c.client_id=p.client_id AND NOT EXISTS(SELECT 1 FROM public.monthly_editorial_campaigns other WHERE other.project_id=p.id AND other.agency_id=p_agency_id AND other.id<>c.id)
 LEFT JOIN public.briefings b ON b.id=c.briefing_id AND b.agency_id=p_agency_id AND b.client_id=p.client_id
 WHERE t.id=ANY(p_task_ids) AND t.agency_id=p_agency_id AND t.archived_at IS NULL AND p.archived_at IS NULL AND public.can_access_task(t.id);
 RETURN result;
END;$$;
REVOKE ALL ON FUNCTION private.task_production_timing(uuid,uuid[]) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.task_production_timing(uuid,uuid[]) TO authenticated;
CREATE FUNCTION public.get_production_timing(p_agency_id uuid,p_task_ids uuid[]) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.task_production_timing(p_agency_id,p_task_ids); $$;
REVOKE ALL ON FUNCTION public.get_production_timing(uuid,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_production_timing(uuid,uuid[]) TO authenticated;
