-- Explicit permanent deletion of an editorial campaign; production remains protected.
CREATE OR REPLACE FUNCTION public.delete_editorial_campaign_permanently(p_agency uuid,p_campaign uuid,p_confirmation text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.monthly_editorial_campaigns; client_name text; expected text;
BEGIN
 IF auth.uid() IS NULL OR NOT private.can_editorial(p_agency,'strategy.delete') THEN RAISE EXCEPTION 'Permissão para excluir calendários necessária' USING ERRCODE='42501'; END IF;
 SELECT * INTO c FROM public.monthly_editorial_campaigns WHERE id=p_campaign AND agency_id=p_agency FOR UPDATE;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Calendário não encontrado ou sem acesso'; END IF;
 IF c.project_id IS NOT NULL OR c.status='production' THEN RAISE EXCEPTION 'Calendário vinculado à produção não pode ser excluído. Projetos e demandas serão preservados.'; END IF;
 SELECT name INTO client_name FROM public.clients WHERE id=c.client_id AND agency_id=p_agency;
 expected:=client_name||' · '||to_char(c.month,'MM/YYYY');
 IF expected IS NULL OR p_confirmation IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Confirme o nome do cliente e mês exatamente: %',expected; END IF;
 -- Refuse inconsistent tenant children rather than deleting any cross-agency history.
 IF EXISTS(SELECT 1 FROM public.monthly_editorial_feedback WHERE campaign_id=c.id AND share_id IN(SELECT id FROM public.monthly_editorial_shares WHERE campaign_id<>c.id))
 OR EXISTS(SELECT 1 FROM public.editorial_campaign_versions WHERE campaign_id=c.id AND agency_id<>p_agency)
 OR EXISTS(SELECT 1 FROM public.editorial_idea_registry WHERE campaign_id=c.id AND agency_id<>p_agency) THEN RAISE EXCEPTION 'Vínculo de agência inconsistente; exclusão bloqueada'; END IF;
 INSERT INTO public.audit_logs(agency_id,actor_user_id,action,entity_type,entity_id,metadata) VALUES(p_agency,auth.uid(),'editorial.permanently_deleted','editorial_campaign',c.id::text,jsonb_build_object('client_id',c.client_id,'month',c.month,'previous_status',c.status,'was_archived',c.archived_at IS NOT NULL,'materials',jsonb_array_length(c.items),'production_preserved',true));
 -- These belong exclusively to the campaign. Delete feedback before its share FK.
 DELETE FROM public.monthly_editorial_feedback WHERE campaign_id=c.id;
 DELETE FROM public.monthly_editorial_shares WHERE campaign_id=c.id;
 DELETE FROM public.editorial_idea_registry WHERE campaign_id=c.id AND agency_id=p_agency;
 DELETE FROM public.editorial_campaign_versions WHERE campaign_id=c.id AND agency_id=p_agency;
 DELETE FROM public.monthly_editorial_campaigns WHERE id=c.id AND agency_id=p_agency;
 RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.delete_editorial_campaign_permanently(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_editorial_campaign_permanently(uuid,uuid,text) TO authenticated;
