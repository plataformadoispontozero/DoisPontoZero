-- Dedicated encrypted configuration. Only Edge Functions using service_role may call these RPCs.
CREATE TABLE private.editorial_ai_configurations (
 agency_id uuid PRIMARY KEY REFERENCES public.agencies(id) ON DELETE CASCADE,
 ciphertext text NOT NULL CHECK(length(ciphertext) BETWEEN 32 AND 32768),
 updated_by uuid NOT NULL REFERENCES auth.users(id), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.editorial_ai_daily_usage (
 agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
 day date NOT NULL, calls integer NOT NULL CHECK(calls BETWEEN 1 AND 30),
 PRIMARY KEY(agency_id,day)
);
ALTER TABLE private.editorial_ai_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.editorial_ai_daily_usage ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.editorial_ai_configurations,private.editorial_ai_daily_usage FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.editorial_ai_secret(action text,a uuid,u uuid DEFAULT NULL,cipher text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE value text; n integer; BEGIN
 IF action='read' THEN
 SELECT ciphertext INTO value FROM private.editorial_ai_configurations WHERE agency_id=a;
 RETURN jsonb_build_object('ciphertext',value);
 ELSIF action='save' AND length(cipher) BETWEEN 32 AND 32768 AND u IS NOT NULL THEN
 INSERT INTO private.editorial_ai_configurations(agency_id,ciphertext,updated_by) VALUES(a,cipher,u)
 ON CONFLICT(agency_id) DO UPDATE SET ciphertext=excluded.ciphertext,updated_by=excluded.updated_by,updated_at=now();
 RETURN '{}'::jsonb;
 ELSIF action='reserve' AND u IS NOT NULL THEN
 INSERT INTO private.editorial_ai_daily_usage(agency_id,day,calls) VALUES(a,(now() AT TIME ZONE 'UTC')::date,1)
 ON CONFLICT(agency_id,day) DO UPDATE SET calls=private.editorial_ai_daily_usage.calls+1 WHERE private.editorial_ai_daily_usage.calls<30 RETURNING calls INTO n;
 RETURN jsonb_build_object('allowed',n IS NOT NULL);
 END IF;
 RAISE EXCEPTION 'Invalid editorial configuration action'; END; $$;
REVOKE ALL ON FUNCTION private.editorial_ai_secret(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.editorial_ai_secret(text,uuid,uuid,text) TO service_role;
CREATE FUNCTION public.editorial_ai_secret(p_action text,p_agency uuid,p_user uuid DEFAULT NULL,p_ciphertext text DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.editorial_ai_secret(p_action,p_agency,p_user,p_ciphertext) $$;
REVOKE ALL ON FUNCTION public.editorial_ai_secret(text,uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.editorial_ai_secret(text,uuid,uuid,text) TO service_role;
