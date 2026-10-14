-- Revocation in Permission Studio applies to chat policies and room RPCs too.
CREATE OR REPLACE FUNCTION private.chat_active(a uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$SELECT private.can_editorial(a,'chat.access')$$;
CREATE OR REPLACE FUNCTION public.chat_create_channel(p_agency uuid,p_name text,p_description text DEFAULT '',p_visibility text DEFAULT 'agency',p_type text DEFAULT 'custom',p_members uuid[] DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid;u uuid;BEGIN
 IF NOT private.can_editorial(p_agency,'chat.create_channels') THEN RAISE EXCEPTION 'Sem permissão para criar salas';END IF;
 IF NOT private.chat_active(p_agency) THEN RAISE EXCEPTION 'Sem acesso à agência';END IF;
 IF length(btrim(p_name)) NOT BETWEEN 1 AND 80 OR p_visibility NOT IN('agency','private') OR p_type NOT IN('general','custom','squad','project') OR length(p_description)>1000 OR cardinality(p_members)>100 THEN RAISE EXCEPTION 'Canal inválido';END IF;
 FOREACH u IN ARRAY p_members LOOP IF NOT EXISTS(SELECT 1 FROM public.agency_members WHERE agency_id=p_agency AND user_id=u AND status='active') THEN RAISE EXCEPTION 'Participante não pertence à agência';END IF;END LOOP;
 INSERT INTO public.chat_channels(agency_id,name,description,visibility,channel_type,created_by) VALUES(p_agency,btrim(p_name),p_description,p_visibility,p_type,auth.uid()) RETURNING id INTO target;
 INSERT INTO public.chat_channel_members(agency_id,channel_id,user_id,member_role) SELECT p_agency,target,x,CASE WHEN x=auth.uid() THEN 'owner' ELSE 'member' END FROM (SELECT DISTINCT unnest(array_append(p_members,auth.uid())) x) s;
 RETURN target;END$$;
CREATE OR REPLACE FUNCTION private.chat_drive_target(a uuid,u uuid,c uuid,d uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT private.operational_notification_access(a,u,'chat.access') AND ((c IS NOT NULL AND d IS NULL AND EXISTS(SELECT 1 FROM public.chat_channels x WHERE x.id=c AND x.agency_id=a AND x.archived_at IS NULL AND (x.visibility='agency' OR EXISTS(SELECT 1 FROM public.chat_channel_members m WHERE m.channel_id=c AND m.agency_id=a AND m.user_id=u AND m.left_at IS NULL)))) OR (d IS NOT NULL AND c IS NULL AND EXISTS(SELECT 1 FROM public.chat_conversations x JOIN public.chat_conversation_members m ON m.conversation_id=x.id WHERE x.id=d AND x.agency_id=a AND m.agency_id=a AND m.user_id=u AND m.left_at IS NULL)))
$$;
