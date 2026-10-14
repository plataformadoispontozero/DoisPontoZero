-- Individual private topics bind published identity to auth.uid(), not untrusted Presence payload.
-- One shared Supabase socket, one small subscription per authorized colleague; no PG heartbeat writes.
CREATE FUNCTION private.office_presence_topic(topic text,publish boolean) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE parts text[];a uuid;u uuid;BEGIN
 IF auth.uid() IS NULL THEN RETURN false;END IF;
 parts:=string_to_array(topic,':');
 IF cardinality(parts)<>3 OR parts[1]<>'office-user' THEN RETURN false;END IF;
 a:=parts[2]::uuid;u:=parts[3]::uuid;
 RETURN private.can_editorial(a,'chat.access') AND private.operational_notification_access(a,u,'chat.access')
 AND (NOT publish OR u=auth.uid());
EXCEPTION WHEN invalid_text_representation THEN RETURN false;END;$$;
REVOKE ALL ON FUNCTION private.office_presence_topic(text,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_presence_topic(text,boolean) TO authenticated;
CREATE POLICY office_user_presence_read ON realtime.messages FOR SELECT TO authenticated
USING(extension='presence' AND private.office_presence_topic(realtime.topic(),false));
CREATE POLICY office_user_presence_publish ON realtime.messages FOR INSERT TO authenticated
WITH CHECK(extension='presence' AND private.office_presence_topic(realtime.topic(),true));

CREATE FUNCTION private.office_presence_members(a uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT CASE WHEN private.can_editorial(a,'chat.access') THEN coalesce((SELECT jsonb_agg(jsonb_build_object(
 'user_id',m.user_id,'name',p.full_name,'avatar_url',p.avatar_url) ORDER BY p.full_name)
 FROM public.agency_members m JOIN public.profiles p ON p.id=m.user_id
 WHERE m.agency_id=a AND m.status='active' AND private.operational_notification_access(a,m.user_id,'chat.access')),'[]'::jsonb) ELSE '[]'::jsonb END;
$$;
REVOKE ALL ON FUNCTION private.office_presence_members(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_presence_members(uuid) TO authenticated;
CREATE FUNCTION public.office_presence_directory(p_agency uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$SELECT private.office_presence_members(p_agency)$$;
REVOKE ALL ON FUNCTION public.office_presence_directory(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.office_presence_directory(uuid) TO authenticated;
