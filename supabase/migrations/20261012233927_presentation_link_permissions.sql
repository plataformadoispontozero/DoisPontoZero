-- Public showcase reads remain token-authorized; link creation requires a team session.
REVOKE ALL ON FUNCTION public.create_presentation_public_link(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_presentation_public_link(uuid,uuid) TO authenticated;
