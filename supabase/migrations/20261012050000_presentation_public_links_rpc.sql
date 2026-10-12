-- Dois.Zero: geração autenticada de links públicos para apresentações.
-- O token em claro é retornado somente na criação; o banco armazena apenas o hash.

CREATE OR REPLACE FUNCTION public.create_presentation_public_link(
  p_agency UUID,
  p_presentation UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token TEXT;
  v_hash TEXT;
  v_presentation_agency UUID;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_agency_member(p_agency) THEN
    RAISE EXCEPTION 'Acesso não autorizado';
  END IF;

  SELECT agency_id
    INTO v_presentation_agency
    FROM public.presentations
   WHERE id = p_presentation;

  IF v_presentation_agency IS NULL OR v_presentation_agency <> p_agency THEN
    RAISE EXCEPTION 'Apresentação não encontrada';
  END IF;

  v_token := encode(gen_random_bytes(24), 'hex');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');

  INSERT INTO public.presentation_public_links (
    agency_id,
    presentation_id,
    token_hash,
    created_by
  ) VALUES (
    p_agency,
    p_presentation,
    v_hash,
    auth.uid()
  );

  RETURN v_token;
END;
$$;

REVOKE ALL ON FUNCTION public.create_presentation_public_link(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_presentation_public_link(UUID, UUID) TO authenticated;
