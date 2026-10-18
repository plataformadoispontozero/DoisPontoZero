-- Additive office metadata. Existing chat membership, history and policies stay intact.
ALTER TABLE public.chat_channels ADD COLUMN office_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.chat_preferences
 ADD COLUMN office_preferred_room uuid REFERENCES public.chat_channels(id) ON DELETE SET NULL,
 ADD COLUMN office_auto_join boolean NOT NULL DEFAULT false,
 ADD COLUMN office_microphone_id text CHECK(length(office_microphone_id)<=256),
 ADD COLUMN office_speaker_id text CHECK(length(office_speaker_id)<=256),
 ADD COLUMN office_camera_id text CHECK(length(office_camera_id)<=256);
CREATE INDEX chat_preferences_office_room_idx ON public.chat_preferences(office_preferred_room) WHERE office_preferred_room IS NOT NULL;

-- Narrow privileged lookup avoids recursion through existing chat RLS. No client identity supplied.
CREATE FUNCTION private.office_room_access(a uuid,r uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND private.chat_target(a,r,NULL)
 AND EXISTS(SELECT 1 FROM public.chat_channels c WHERE c.id=r AND c.agency_id=a AND c.office_enabled AND c.archived_at IS NULL
 AND (c.squad_id IS NULL OR EXISTS(SELECT 1 FROM public.squads s JOIN public.squad_members m ON m.squad_id=s.id
 WHERE s.id=c.squad_id AND s.agency_id=a AND m.user_id=auth.uid())));
$$;
REVOKE ALL ON FUNCTION private.office_room_access(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_room_access(uuid,uuid) TO authenticated;

CREATE FUNCTION private.office_configure_room(a uuid,r uuid,enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT private.can_editorial(a,'chat.access') OR NOT private.can_editorial(a,'chat.create_channels')
 OR NOT EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles role ON role.id=m.role_id AND role.agency_id=m.agency_id
 WHERE m.agency_id=a AND m.user_id=auth.uid() AND m.status='active' AND role.name IN('OWNER','ADMIN','MANAGER'))
 THEN RAISE EXCEPTION 'Sem permissão para configurar o escritório' USING ERRCODE='42501';END IF;
 IF enabled IS NULL OR NOT private.chat_target(a,r,NULL) OR NOT EXISTS(SELECT 1 FROM public.chat_channels c WHERE c.id=r AND c.agency_id=a
 AND (c.squad_id IS NULL OR EXISTS(SELECT 1 FROM public.squads s WHERE s.id=c.squad_id AND s.agency_id=a)))
 THEN RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='42501';END IF;
 UPDATE public.chat_channels SET office_enabled=enabled WHERE id=r AND agency_id=a;
END;$$;
REVOKE ALL ON FUNCTION private.office_configure_room(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_configure_room(uuid,uuid,boolean) TO authenticated;
CREATE FUNCTION public.office_configure_room(p_agency uuid,p_room uuid,p_enabled boolean) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_configure_room(p_agency,p_room,p_enabled)$$;
REVOKE ALL ON FUNCTION public.office_configure_room(uuid,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.office_configure_room(uuid,uuid,boolean) TO authenticated;
CREATE FUNCTION public.office_directory(p_agency uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',c.id,'agency_id',c.agency_id,'name',c.name,'description',c.description,
 'channel_type',c.channel_type,'visibility',c.visibility,'squad_id',c.squad_id,'office_enabled',c.office_enabled) ORDER BY c.name),'[]'::jsonb)
 FROM public.chat_channels c WHERE c.agency_id=p_agency AND private.office_room_access(p_agency,c.id);
$$;
REVOKE ALL ON FUNCTION public.office_directory(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.office_directory(uuid) TO authenticated;

-- Own preferences keep the existing RLS and notification choices. Validate room on change only:
-- revoking a room later must not prevent the user from updating their notification settings.
CREATE FUNCTION private.office_validate_preferences() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF NEW.office_preferred_room IS NOT NULL AND (TG_OP='INSERT' OR NEW.office_preferred_room IS DISTINCT FROM OLD.office_preferred_room
 OR NEW.agency_id IS DISTINCT FROM OLD.agency_id OR NEW.user_id IS DISTINCT FROM OLD.user_id) THEN
 IF NOT private.office_room_access(NEW.agency_id,NEW.office_preferred_room) THEN
 RAISE EXCEPTION 'Sala preferida indisponível' USING ERRCODE='42501';END IF;END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION private.office_validate_preferences() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER office_preferences_room_check BEFORE INSERT OR UPDATE ON public.chat_preferences
FOR EACH ROW EXECUTE FUNCTION private.office_validate_preferences();

-- Authorization prepared now; no subscriptions, presence or media started in this phase.
-- Topic contract: office:<agency UUID>:<room UUID>. Malformed topics fail closed.
CREATE FUNCTION private.office_topic_access(topic text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE parts text[];BEGIN
 parts:=string_to_array(topic,':');
 IF cardinality(parts)<>3 OR parts[1]<>'office' THEN RETURN false;END IF;
 RETURN private.office_room_access(parts[2]::uuid,parts[3]::uuid);
EXCEPTION WHEN invalid_text_representation THEN RETURN false;END;$$;
REVOKE ALL ON FUNCTION private.office_topic_access(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_topic_access(text) TO authenticated;
CREATE POLICY office_events_read ON realtime.messages FOR SELECT TO authenticated
USING(private.office_topic_access(realtime.topic()) AND extension IN('broadcast','presence'));
CREATE POLICY office_events_send ON realtime.messages FOR INSERT TO authenticated
WITH CHECK(private.office_topic_access(realtime.topic()) AND extension IN('broadcast','presence'));
