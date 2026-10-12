-- Privacy repair: legacy policies accidentally correlated agency_id to the outer row.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.chat_active(a uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.agency_members m WHERE m.agency_id=a AND m.user_id=auth.uid() AND m.status='active')
$$;
CREATE OR REPLACE FUNCTION private.chat_target(a uuid,c uuid,d uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT private.chat_active(a) AND ((c IS NOT NULL AND d IS NULL AND EXISTS(SELECT 1 FROM public.chat_channels x WHERE x.id=c AND x.agency_id=a AND x.archived_at IS NULL AND (x.visibility='agency' OR EXISTS(SELECT 1 FROM public.chat_channel_members m WHERE m.channel_id=x.id AND m.agency_id=a AND m.user_id=auth.uid() AND m.left_at IS NULL)))) OR (d IS NOT NULL AND c IS NULL AND EXISTS(SELECT 1 FROM public.chat_conversation_members m JOIN public.chat_conversations x ON x.id=m.conversation_id AND x.agency_id=m.agency_id WHERE m.conversation_id=d AND m.agency_id=a AND m.user_id=auth.uid() AND m.left_at IS NULL)))
$$;
CREATE OR REPLACE FUNCTION private.chat_message(a uuid,m uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.chat_messages x WHERE x.id=m AND x.agency_id=a AND x.deleted_at IS NULL AND private.chat_target(a,x.channel_id,x.conversation_id))
$$;
REVOKE ALL ON FUNCTION private.chat_active(uuid),private.chat_target(uuid,uuid,uuid),private.chat_message(uuid,uuid) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.chat_active(uuid),private.chat_target(uuid,uuid,uuid),private.chat_message(uuid,uuid) TO authenticated;
DO $$DECLARE t text;p record;BEGIN FOREACH t IN ARRAY ARRAY['chat_channels','chat_channel_members','chat_conversations','chat_conversation_members','chat_messages','chat_attachments','chat_mentions','chat_reactions'] LOOP
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,t);END LOOP;
 EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON public.%I FROM anon,authenticated',t);
 EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
 END LOOP;END$$;
CREATE POLICY chat_channel_read ON public.chat_channels FOR SELECT TO authenticated USING(private.chat_target(agency_id,id,NULL));
CREATE POLICY chat_channel_member_read ON public.chat_channel_members FOR SELECT TO authenticated USING(private.chat_target(agency_id,channel_id,NULL));
CREATE POLICY chat_conversation_read ON public.chat_conversations FOR SELECT TO authenticated USING(private.chat_target(agency_id,NULL,id));
CREATE POLICY chat_conversation_member_read ON public.chat_conversation_members FOR SELECT TO authenticated USING(private.chat_target(agency_id,NULL,conversation_id));
CREATE POLICY chat_message_read ON public.chat_messages FOR SELECT TO authenticated USING(private.chat_target(agency_id,channel_id,conversation_id));
CREATE POLICY chat_message_send ON public.chat_messages FOR INSERT TO authenticated WITH CHECK(sender_id=auth.uid() AND message_type='text' AND length(btrim(body)) BETWEEN 1 AND 10000 AND private.chat_target(agency_id,channel_id,conversation_id) AND (parent_message_id IS NULL OR EXISTS(SELECT 1 FROM public.chat_messages p WHERE p.id=parent_message_id AND p.agency_id=chat_messages.agency_id AND p.channel_id IS NOT DISTINCT FROM chat_messages.channel_id AND p.conversation_id IS NOT DISTINCT FROM chat_messages.conversation_id)));
GRANT INSERT ON public.chat_messages TO authenticated;
CREATE POLICY chat_attachment_read ON public.chat_attachments FOR SELECT TO authenticated USING(private.chat_message(agency_id,message_id));
CREATE POLICY chat_mention_read ON public.chat_mentions FOR SELECT TO authenticated USING(private.chat_message(agency_id,message_id));
CREATE POLICY chat_reaction_read ON public.chat_reactions FOR SELECT TO authenticated USING(private.chat_message(agency_id,message_id));
CREATE POLICY chat_reaction_insert ON public.chat_reactions FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid() AND length(emoji) BETWEEN 1 AND 32 AND private.chat_message(agency_id,message_id));
CREATE POLICY chat_reaction_delete ON public.chat_reactions FOR DELETE TO authenticated USING(user_id=auth.uid() AND private.chat_message(agency_id,message_id));
GRANT INSERT,DELETE ON public.chat_reactions TO authenticated;
CREATE TABLE public.chat_preferences(agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,direct_notifications boolean NOT NULL DEFAULT true,mention_notifications boolean NOT NULL DEFAULT true,PRIMARY KEY(agency_id,user_id));
ALTER TABLE public.chat_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.chat_preferences FROM anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.chat_preferences TO authenticated;
CREATE POLICY chat_preferences_own ON public.chat_preferences FOR ALL TO authenticated USING(user_id=auth.uid() AND private.chat_active(agency_id)) WITH CHECK(user_id=auth.uid() AND private.chat_active(agency_id));
CREATE OR REPLACE FUNCTION public.chat_start_direct(p_agency uuid,p_other uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid;BEGIN
 IF NOT private.chat_active(p_agency) OR p_other=auth.uid() OR NOT EXISTS(SELECT 1 FROM public.agency_members WHERE agency_id=p_agency AND user_id=p_other AND status='active') THEN RAISE EXCEPTION 'Selecione outro membro ativo desta agência';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_agency::text||least(auth.uid(),p_other)::text||greatest(auth.uid(),p_other)::text,0));
 SELECT c.id INTO target FROM public.chat_conversations c WHERE c.agency_id=p_agency AND c.conversation_type='direct' AND (SELECT count(*) FROM public.chat_conversation_members m WHERE m.conversation_id=c.id AND m.left_at IS NULL)=2 AND EXISTS(SELECT 1 FROM public.chat_conversation_members m WHERE m.conversation_id=c.id AND m.user_id=auth.uid() AND m.left_at IS NULL) AND EXISTS(SELECT 1 FROM public.chat_conversation_members m WHERE m.conversation_id=c.id AND m.user_id=p_other AND m.left_at IS NULL) ORDER BY c.created_at LIMIT 1;
 IF target IS NULL THEN INSERT INTO public.chat_conversations(agency_id) VALUES(p_agency) RETURNING id INTO target; INSERT INTO public.chat_conversation_members(agency_id,conversation_id,user_id) VALUES(p_agency,target,auth.uid()),(p_agency,target,p_other);END IF;
 RETURN target;END$$;
CREATE OR REPLACE FUNCTION public.chat_create_channel(p_agency uuid,p_name text,p_description text DEFAULT '',p_visibility text DEFAULT 'agency',p_type text DEFAULT 'custom',p_members uuid[] DEFAULT '{}') RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE target uuid;u uuid;BEGIN
 IF NOT private.chat_active(p_agency) THEN RAISE EXCEPTION 'Sem acesso à agência';END IF;
 IF length(btrim(p_name)) NOT BETWEEN 1 AND 80 OR p_visibility NOT IN('agency','private') OR p_type NOT IN('general','custom','squad','project') OR length(p_description)>1000 OR cardinality(p_members)>100 THEN RAISE EXCEPTION 'Canal inválido';END IF;
 FOREACH u IN ARRAY p_members LOOP IF NOT EXISTS(SELECT 1 FROM public.agency_members WHERE agency_id=p_agency AND user_id=u AND status='active') THEN RAISE EXCEPTION 'Participante não pertence à agência';END IF;END LOOP;
 INSERT INTO public.chat_channels(agency_id,name,description,visibility,channel_type,created_by) VALUES(p_agency,btrim(p_name),p_description,p_visibility,p_type,auth.uid()) RETURNING id INTO target;
 INSERT INTO public.chat_channel_members(agency_id,channel_id,user_id,member_role) SELECT p_agency,target,x,CASE WHEN x=auth.uid() THEN 'owner' ELSE 'member' END FROM (SELECT DISTINCT unnest(array_append(p_members,auth.uid())) x) s;
 RETURN target;END$$;
CREATE OR REPLACE FUNCTION public.chat_mark_read(p_agency uuid,p_target uuid,p_direct boolean,p_last_message uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE stamp timestamptz;BEGIN
 IF NOT private.chat_target(p_agency,CASE WHEN p_direct THEN NULL ELSE p_target END,CASE WHEN p_direct THEN p_target ELSE NULL END) THEN RAISE EXCEPTION 'Conversa indisponível';END IF;
 SELECT created_at INTO stamp FROM public.chat_messages WHERE id=p_last_message AND agency_id=p_agency AND CASE WHEN p_direct THEN conversation_id=p_target ELSE channel_id=p_target END;
 IF stamp IS NULL THEN RETURN;END IF;
 IF p_direct THEN UPDATE public.chat_conversation_members SET last_read_at=greatest(last_read_at,stamp),last_read_message_id=p_last_message WHERE agency_id=p_agency AND conversation_id=p_target AND user_id=auth.uid() AND left_at IS NULL;
 ELSE INSERT INTO public.chat_channel_members(agency_id,channel_id,user_id,last_read_at,last_read_message_id) VALUES(p_agency,p_target,auth.uid(),stamp,p_last_message) ON CONFLICT(channel_id,user_id) DO UPDATE SET last_read_at=greatest(public.chat_channel_members.last_read_at,excluded.last_read_at),last_read_message_id=excluded.last_read_message_id;END IF;END$$;
REVOKE ALL ON FUNCTION public.chat_start_direct(uuid,uuid),public.chat_create_channel(uuid,text,text,text,text,uuid[]),public.chat_mark_read(uuid,uuid,boolean,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chat_start_direct(uuid,uuid),public.chat_create_channel(uuid,text,text,text,text,uuid[]),public.chat_mark_read(uuid,uuid,boolean,uuid) TO authenticated;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime') AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_messages') THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;END IF;END$$;
CREATE INDEX IF NOT EXISTS chat_messages_channel_recent ON public.chat_messages(agency_id,channel_id,created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_direct_recent ON public.chat_messages(agency_id,conversation_id,created_at DESC);
CREATE OR REPLACE FUNCTION public.chat_directory(p_agency uuid) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
SELECT jsonb_build_object('channels',coalesce((SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('unread_count',(SELECT count(*) FROM public.chat_messages x WHERE x.channel_id=c.id AND x.agency_id=p_agency AND x.sender_id<>auth.uid() AND x.deleted_at IS NULL AND x.created_at>coalesce((SELECT last_read_at FROM public.chat_channel_members WHERE channel_id=c.id AND user_id=auth.uid()),'-infinity'::timestamptz)))) FROM public.chat_channels c WHERE c.agency_id=p_agency),'[]'::jsonb),'conversations',coalesce((SELECT jsonb_agg(to_jsonb(c)||jsonb_build_object('other_user',(SELECT jsonb_build_object('id',p.id,'name',p.full_name,'avatar_url',p.avatar_url) FROM public.chat_conversation_members m JOIN public.profiles p ON p.id=m.user_id WHERE m.conversation_id=c.id AND m.left_at IS NULL AND m.user_id<>auth.uid() LIMIT 1),'unread_count',(SELECT count(*) FROM public.chat_messages x WHERE x.conversation_id=c.id AND x.agency_id=p_agency AND x.sender_id<>auth.uid() AND x.deleted_at IS NULL AND x.created_at>coalesce((SELECT last_read_at FROM public.chat_conversation_members WHERE conversation_id=c.id AND user_id=auth.uid()),'-infinity'::timestamptz)))) FROM public.chat_conversations c WHERE c.agency_id=p_agency),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.chat_directory(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.chat_directory(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.chat_notify() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.conversation_id IS NOT NULL THEN
 UPDATE public.chat_conversations SET updated_at=now() WHERE id=NEW.conversation_id AND agency_id=NEW.agency_id;
 INSERT INTO public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
 SELECT NEW.agency_id,m.user_id,'chat_direct_message','Nova mensagem privada','Você recebeu uma mensagem da equipe.','chat_conversation',NEW.conversation_id FROM public.chat_conversation_members m JOIN public.agency_members a ON a.agency_id=m.agency_id AND a.user_id=m.user_id AND a.status='active' LEFT JOIN public.chat_preferences p ON p.agency_id=m.agency_id AND p.user_id=m.user_id WHERE m.agency_id=NEW.agency_id AND m.conversation_id=NEW.conversation_id AND m.left_at IS NULL AND m.user_id<>NEW.sender_id AND coalesce(p.direct_notifications,true);
 END IF;RETURN NEW;END$$;
REVOKE ALL ON FUNCTION private.chat_notify() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER chat_direct_notification AFTER INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION private.chat_notify();
