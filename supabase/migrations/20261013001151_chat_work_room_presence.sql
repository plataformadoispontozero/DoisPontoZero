-- Presence stores only recent room activity; identity and time are assigned by the server.
CREATE TABLE private.chat_work_room_presence (
 agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
 channel_id uuid NOT NULL REFERENCES public.chat_channels(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(agency_id,channel_id,user_id)
);
ALTER TABLE private.chat_work_room_presence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.chat_work_room_presence FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.chat_work_room_presence(p_agency uuid,p_channel uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT private.chat_target(p_agency,p_channel,NULL) THEN RAISE EXCEPTION 'Acesso à sala necessário'; END IF;
 INSERT INTO private.chat_work_room_presence(agency_id,channel_id,user_id,last_seen_at)
 VALUES(p_agency,p_channel,auth.uid(),now()) ON CONFLICT(agency_id,channel_id,user_id) DO UPDATE SET last_seen_at=excluded.last_seen_at;
 DELETE FROM private.chat_work_room_presence WHERE agency_id=p_agency AND last_seen_at<now()-interval '1 day';
 RETURN coalesce((SELECT jsonb_agg(jsonb_build_object('user_id',p.id,'name',p.full_name,'avatar_url',p.avatar_url) ORDER BY p.full_name,p.id)
 FROM private.chat_work_room_presence r JOIN public.profiles p ON p.id=r.user_id
 WHERE r.agency_id=p_agency AND r.channel_id=p_channel AND r.last_seen_at>now()-interval '2 minutes'
 AND EXISTS(SELECT 1 FROM public.agency_members m WHERE m.agency_id=p_agency AND m.user_id=r.user_id AND m.status='active')
 AND EXISTS(SELECT 1 FROM public.chat_channels c WHERE c.id=r.channel_id AND c.agency_id=r.agency_id AND c.archived_at IS NULL AND (c.visibility='agency' OR EXISTS(SELECT 1 FROM public.chat_channel_members cm WHERE cm.channel_id=c.id AND cm.agency_id=c.agency_id AND cm.user_id=r.user_id AND cm.left_at IS NULL)))), '[]'::jsonb);
END;
$$;
CREATE FUNCTION private.leave_chat_work_room(p_agency uuid,p_channel uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sessão necessária';END IF;
 DELETE FROM private.chat_work_room_presence WHERE agency_id=p_agency AND channel_id=p_channel AND user_id=auth.uid();
END;
$$;
CREATE FUNCTION public.chat_work_room_presence(p_agency uuid,p_channel uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.chat_work_room_presence(p_agency,p_channel)$$;
CREATE FUNCTION public.leave_chat_work_room(p_agency uuid,p_channel uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.leave_chat_work_room(p_agency,p_channel)$$;
REVOKE ALL ON FUNCTION private.chat_work_room_presence(uuid,uuid),private.leave_chat_work_room(uuid,uuid),public.chat_work_room_presence(uuid,uuid),public.leave_chat_work_room(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.chat_work_room_presence(uuid,uuid),private.leave_chat_work_room(uuid,uuid),public.chat_work_room_presence(uuid,uuid),public.leave_chat_work_room(uuid,uuid) TO authenticated;
