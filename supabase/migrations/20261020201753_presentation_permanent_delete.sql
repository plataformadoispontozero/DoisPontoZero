-- An explicit, permission-gated deletion removes the presentation and its reviews atomically.
-- Drive files and drive_file_references are deliberately preserved.
CREATE OR REPLACE FUNCTION public.delete_presentation_permanently(p_agency uuid,p_presentation uuid,p_confirmation text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.has_agency_permission(p_agency,'presentations.delete') THEN RAISE EXCEPTION 'Permissão para excluir apresentações necessária' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM public.presentations WHERE id=p_presentation AND agency_id=p_agency AND title=p_confirmation FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Confirme o título exato da apresentação'; END IF;
 DELETE FROM public.presentation_material_reviews WHERE presentation_id=p_presentation AND agency_id=p_agency;
 DELETE FROM public.presentations WHERE id=p_presentation AND agency_id=p_agency;
 RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION public.delete_presentation_permanently(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.delete_presentation_permanently(uuid,uuid,text) TO authenticated;
