-- Anonymous callers cannot resolve private schema names; grant no private schema access.
-- This fixed endpoint delegates exclusively to the token validator and whitelisted projection.
CREATE OR REPLACE FUNCTION public.get_public_showcase(p_token text)
-- The anonymous endpoint bridges to an unexposed schema without granting schema USAGE.
-- It can only delegate the token-validated, whitelisted showcase projection.
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$ SELECT private.get_public_showcase(p_token); $$;
REVOKE ALL ON FUNCTION public.get_public_showcase(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_showcase(text) TO anon,authenticated;
