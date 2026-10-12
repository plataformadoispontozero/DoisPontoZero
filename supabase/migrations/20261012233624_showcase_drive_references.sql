-- Expose only the materials attached to a valid published showcase, never the agency file catalog.
CREATE OR REPLACE FUNCTION private.get_public_showcase(p_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_link public.presentation_public_links%ROWTYPE;
  v_pres public.presentations%ROWTYPE;
  v_client public.clients%ROWTYPE;
  v_agency public.agencies%ROWTYPE;
  v_sections jsonb;
  v_assets jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 20 OR length(p_token) > 512 THEN
    RETURN jsonb_build_object('error','Link de apresentação inválido, revogado ou expirado.');
  END IF;
  SELECT * INTO v_link FROM public.presentation_public_links
   WHERE token_hash = encode(extensions.digest(p_token,'sha256'),'hex')
     AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now());
  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('error','Link de apresentação inválido, revogado ou expirado.');
  END IF;
  SELECT * INTO v_pres FROM public.presentations
   WHERE id=v_link.presentation_id AND agency_id=v_link.agency_id AND status='published';
  IF v_pres.id IS NULL THEN
    RETURN jsonb_build_object('error','Apresentação não publicada ou indisponível.');
  END IF;
  SELECT * INTO v_client FROM public.clients WHERE id=v_pres.client_id AND agency_id=v_pres.agency_id;
  SELECT * INTO v_agency FROM public.agencies WHERE id=v_pres.agency_id;
  SELECT jsonb_agg(jsonb_build_object('id',s.id,'section_type',s.section_type,'title',s.title,'description',s.description,'content',s.content,'position',s.position) ORDER BY s.position) INTO v_sections
   FROM public.presentation_sections s WHERE s.presentation_id=v_pres.id AND s.agency_id=v_pres.agency_id;
  SELECT jsonb_agg(jsonb_build_object('id',a.id,'section_id',a.section_id,'title',a.title,'description',a.description,'position',a.position,
    'web_view_link', CASE WHEN f.availability_status='available' THEN f.web_view_link END,
    'thumbnail_reference',CASE WHEN f.availability_status='available' THEN f.thumbnail_reference END,
    'mime_type',CASE WHEN f.availability_status='available' THEN f.mime_type END) ORDER BY a.position) INTO v_assets
   FROM public.presentation_assets a
   LEFT JOIN public.drive_file_references f ON f.id=a.file_reference_id AND f.agency_id=v_pres.agency_id
   WHERE a.presentation_id=v_pres.id AND a.agency_id=v_pres.agency_id;
  INSERT INTO public.presentation_activity(agency_id,presentation_id,action,metadata)
   VALUES(v_pres.agency_id,v_pres.id,'showcase_viewed',jsonb_build_object('viewed_at',now()));
  RETURN jsonb_build_object(
    'presentation',jsonb_build_object('title',v_pres.title,'description',v_pres.description,'period_month',v_pres.period_month,'period_year',v_pres.period_year,'published_at',v_pres.published_at,'agency_name',v_agency.name,'client_name',v_client.name),
    'client',jsonb_build_object('name',v_client.name,'logo_url',v_client.logo_url),
    'agency',jsonb_build_object('name',v_agency.name,'logo_url',v_agency.logo_url),
    'sections',coalesce(v_sections,'[]'::jsonb),'assets',coalesce(v_assets,'[]'::jsonb));
END;
$$;
REVOKE ALL ON FUNCTION private.get_public_showcase(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_public_showcase(text) TO anon,authenticated;
CREATE OR REPLACE FUNCTION public.get_public_showcase(p_token text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = ''
AS $$ SELECT private.get_public_showcase(p_token); $$;
REVOKE ALL ON FUNCTION public.get_public_showcase(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_showcase(text) TO anon,authenticated;
