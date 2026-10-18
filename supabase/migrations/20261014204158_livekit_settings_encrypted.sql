-- Expand only the provider CHECK; existing credentials and OAuth behavior are unchanged.
ALTER TABLE private.integration_credentials DROP CONSTRAINT integration_credentials_provider_check;
ALTER TABLE private.integration_credentials ADD CONSTRAINT integration_credentials_provider_check CHECK(provider IN('google','meta','livekit'));
CREATE FUNCTION private.livekit_configuration_secret(action text,a uuid,cipher text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE value text;BEGIN
 IF action='read' THEN SELECT ciphertext INTO value FROM private.integration_credentials WHERE agency_id=a AND provider='livekit' AND user_id='00000000-0000-0000-0000-000000000000';RETURN jsonb_build_object('ciphertext',value);
 ELSIF action='save' AND length(cipher) BETWEEN 32 AND 16384 THEN
 INSERT INTO private.integration_credentials(agency_id,provider,user_id,ciphertext) VALUES(a,'livekit','00000000-0000-0000-0000-000000000000',cipher)
 ON CONFLICT(agency_id,provider,user_id) DO UPDATE SET ciphertext=excluded.ciphertext,updated_at=now();RETURN '{}'::jsonb;
 END IF;RAISE EXCEPTION 'Invalid configuration action';END;$$;
REVOKE ALL ON FUNCTION private.livekit_configuration_secret(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.livekit_configuration_secret(text,uuid,text) TO service_role;
CREATE FUNCTION public.livekit_configuration_secret(p_action text,p_agency uuid,p_ciphertext text DEFAULT NULL) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.livekit_configuration_secret(p_action,p_agency,p_ciphertext)$$;
REVOKE ALL ON FUNCTION public.livekit_configuration_secret(text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.livekit_configuration_secret(text,uuid,text) TO service_role;
