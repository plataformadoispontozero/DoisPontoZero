-- Durable bounded token issuance counter, not presence telemetry.
CREATE TABLE private.office_token_limits(
 agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 window_started timestamptz NOT NULL,
 requests integer NOT NULL CHECK(requests BETWEEN 1 AND 10),
 PRIMARY KEY(agency_id,user_id)
);
ALTER TABLE private.office_token_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.office_token_limits FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.office_voice_context(r uuid,consume boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a uuid;stamp timestamptz:=clock_timestamp();counted integer;BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='42501';END IF;
 SELECT c.agency_id INTO a FROM public.chat_channels c WHERE c.id=r AND private.office_room_access(c.agency_id,c.id);
 IF a IS NULL THEN RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='42501';END IF;
 IF consume IS TRUE THEN
 INSERT INTO private.office_token_limits(agency_id,user_id,window_started,requests) VALUES(a,auth.uid(),stamp,1)
 ON CONFLICT(agency_id,user_id) DO UPDATE SET
 window_started=CASE WHEN excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' THEN excluded.window_started ELSE private.office_token_limits.window_started END,
 requests=CASE WHEN excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' THEN 1 ELSE private.office_token_limits.requests+1 END
 WHERE excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' OR private.office_token_limits.requests<10
 RETURNING requests INTO counted;
 IF counted IS NULL THEN RAISE EXCEPTION 'OFFICE_RATE_LIMIT' USING ERRCODE='P0001';END IF;
 END IF;
 RETURN jsonb_build_object('agency_id',a,'user_id',auth.uid(),'room_id',r,'room_name','office_'||a::text||'_'||r::text);
END;$$;
REVOKE ALL ON FUNCTION private.office_voice_context(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_voice_context(uuid,boolean) TO authenticated;
CREATE FUNCTION public.office_voice_context(p_room uuid,p_consume boolean DEFAULT false) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_voice_context(p_room,p_consume)$$;
REVOKE ALL ON FUNCTION public.office_voice_context(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.office_voice_context(uuid,boolean) TO authenticated;
