-- Recoverable removal; answers, attachments and templates remain intact.
CREATE OR REPLACE FUNCTION public.set_briefing_archived(p_agency uuid, p_briefing uuid, p_archived boolean)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE target public.briefings%ROWTYPE;
BEGIN
  IF p_archived IS NULL THEN RAISE EXCEPTION 'Informe a ação de arquivamento'; END IF;
  IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency,'briefings.edit') THEN
    RAISE EXCEPTION 'Sem permissão para organizar briefings' USING ERRCODE='42501';
  END IF;
  SELECT * INTO target FROM public.briefings WHERE id=p_briefing AND agency_id=p_agency FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Briefing não encontrado ou sem acesso'; END IF;
  IF p_archived AND EXISTS(SELECT 1 FROM public.briefing_public_links WHERE briefing_id=p_briefing AND agency_id=p_agency AND revoked_at IS NULL) THEN
    IF NOT public.has_agency_permission(p_agency,'briefings.manage_public_links') THEN
      RAISE EXCEPTION 'É necessário poder gerenciar links públicos para arquivar este formulário' USING ERRCODE='42501';
    END IF;
    UPDATE public.briefing_public_links SET revoked_at=now() WHERE briefing_id=p_briefing AND agency_id=p_agency AND revoked_at IS NULL;
  END IF;
  IF p_archived THEN
    UPDATE public.briefings SET status='archived',archived_at=now(),updated_at=now() WHERE id=p_briefing AND agency_id=p_agency;
  ELSE
    IF target.archived_at IS NULL AND target.status<>'archived' THEN RAISE EXCEPTION 'Este briefing não está arquivado'; END IF;
    UPDATE public.briefings SET status='draft',archived_at=NULL,updated_at=now() WHERE id=p_briefing AND agency_id=p_agency;
  END IF;
  INSERT INTO public.briefing_activity(agency_id,briefing_id,action,metadata)
  VALUES(p_agency,p_briefing,CASE WHEN p_archived THEN 'briefing_archived' ELSE 'briefing_restored_as_draft' END,jsonb_build_object('previous_status',target.status,'actor_id',auth.uid()));
  RETURN p_briefing;
END $$;
REVOKE ALL ON FUNCTION public.set_briefing_archived(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.set_briefing_archived(uuid,uuid,boolean) TO authenticated;
