-- Sharing tokens are encrypted by the Edge Function with its server-side AES-GCM key.
-- Only the service role can use this storage RPC; member permissions are checked by the Edge Function.
CREATE TABLE private.presentation_sharing_secrets (
 link_id uuid PRIMARY KEY REFERENCES public.presentation_public_links(id) ON DELETE CASCADE,
 ciphertext text NOT NULL CHECK(length(ciphertext)<4096)
);
ALTER TABLE private.presentation_sharing_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.presentation_sharing_secrets FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.presentation_sharing_secret(p_agency uuid,p_presentation uuid,p_hash text DEFAULT NULL,p_ciphertext text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE result text;
BEGIN
 IF coalesce(current_setting('request.jwt.claims',true)::jsonb->>'role','')<>'service_role' THEN RAISE EXCEPTION 'Acesso não autorizado' USING ERRCODE='42501'; END IF;
 IF p_ciphertext IS NOT NULL THEN
  INSERT INTO private.presentation_sharing_secrets(link_id,ciphertext)
  SELECT l.id,p_ciphertext FROM public.presentation_public_links l JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
  WHERE l.agency_id=p_agency AND l.presentation_id=p_presentation AND l.token_hash=p_hash AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now())
  ON CONFLICT(link_id) DO UPDATE SET ciphertext=excluded.ciphertext;
  IF NOT FOUND THEN RAISE EXCEPTION 'Link não encontrado'; END IF;
 END IF;
 SELECT s.ciphertext INTO result FROM private.presentation_sharing_secrets s JOIN public.presentation_public_links l ON l.id=s.link_id JOIN public.presentations p ON p.id=l.presentation_id AND p.agency_id=l.agency_id
 WHERE l.agency_id=p_agency AND l.presentation_id=p_presentation AND l.revoked_at IS NULL AND (l.expires_at IS NULL OR l.expires_at>now()) ORDER BY l.created_at DESC LIMIT 1;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.presentation_sharing_secret(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.presentation_sharing_secret(uuid,uuid,text,text) TO service_role;
