-- Binary data remains exclusively in Google Drive. Public attachment rows retain metadata only.
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id);
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS google_file_id text;
ALTER TABLE public.chat_attachments ADD COLUMN IF NOT EXISTS drive_folder_id text;
CREATE OR REPLACE FUNCTION private.chat_drive_target(a uuid,u uuid,c uuid,d uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT EXISTS(SELECT 1 FROM public.agency_members m JOIN public.agencies g ON g.id=m.agency_id WHERE m.agency_id=a AND m.user_id=u AND m.status='active' AND g.status='active') AND
((c IS NOT NULL AND d IS NULL AND EXISTS(SELECT 1 FROM public.chat_channels x WHERE x.id=c AND x.agency_id=a AND x.archived_at IS NULL AND (x.visibility='agency' OR EXISTS(SELECT 1 FROM public.chat_channel_members m WHERE m.channel_id=c AND m.agency_id=a AND m.user_id=u AND m.left_at IS NULL)))) OR
(d IS NOT NULL AND c IS NULL AND EXISTS(SELECT 1 FROM public.chat_conversations x JOIN public.chat_conversation_members m ON m.conversation_id=x.id WHERE x.id=d AND x.agency_id=a AND m.agency_id=a AND m.user_id=u AND m.left_at IS NULL)))
$$;
REVOKE ALL ON FUNCTION private.chat_drive_target(uuid,uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.chat_drive_context(p_agency uuid,p_channel uuid DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_attachment uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.chat_attachments%ROWTYPE;
BEGIN
 IF p_attachment IS NULL THEN
  IF NOT private.chat_drive_target(p_agency,auth.uid(),p_channel,p_conversation) THEN RAISE EXCEPTION 'Acesso ao chat necessário'; END IF;
  RETURN jsonb_build_object('allowed',true);
 END IF;
 SELECT * INTO a FROM public.chat_attachments WHERE id=p_attachment AND agency_id=p_agency;
 IF NOT FOUND OR a.google_file_id IS NULL OR NOT EXISTS(SELECT 1 FROM public.agencies WHERE id=p_agency AND status='active') OR NOT private.chat_message(p_agency,a.message_id) OR NOT EXISTS(SELECT 1 FROM public.clients WHERE id=a.client_id AND agency_id=p_agency) OR NOT public.has_agency_permission(p_agency,'clients.view') THEN RAISE EXCEPTION 'Acesso ao material necessário'; END IF;
 RETURN jsonb_build_object('client_id',a.client_id,'google_file_id',a.google_file_id,'drive_folder_id',a.drive_folder_id,'file_name',a.file_name,'mime_type',a.mime_type);
END $$;
CREATE OR REPLACE FUNCTION public.chat_drive_context(p_agency uuid,p_channel uuid DEFAULT NULL,p_conversation uuid DEFAULT NULL,p_attachment uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.chat_drive_context(p_agency,p_channel,p_conversation,p_attachment)$$;
REVOKE ALL ON FUNCTION private.chat_drive_context(uuid,uuid,uuid,uuid),public.chat_drive_context(uuid,uuid,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.chat_drive_context(uuid,uuid,uuid,uuid),public.chat_drive_context(uuid,uuid,uuid,uuid) TO authenticated;
-- The Edge function alone can persist verified Google metadata. Browser never supplies a trusted URL.
CREATE OR REPLACE FUNCTION private.chat_drive_send(p_agency uuid,p_actor uuid,p_client uuid,p_channel uuid,p_conversation uuid,p_body text,p_file jsonb) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE message_id uuid; file_id text:=p_file->>'google_file_id'; folder_id text:=p_file->>'parent_folder_id';
BEGIN
 IF NOT private.chat_drive_target(p_agency,p_actor,p_channel,p_conversation) OR NOT EXISTS(SELECT 1 FROM public.agency_members m JOIN public.roles r ON r.id=m.role_id AND r.agency_id=m.agency_id WHERE m.agency_id=p_agency AND m.user_id=p_actor AND m.status='active' AND (r.name='OWNER' OR EXISTS(SELECT 1 FROM public.role_permissions rp JOIN public.permissions p ON p.id=rp.permission_id WHERE rp.role_id=m.role_id AND rp.allowed AND p.permission_key='clients.view'))) OR NOT EXISTS(SELECT 1 FROM public.clients WHERE id=p_client AND agency_id=p_agency) THEN RAISE EXCEPTION 'Acesso ao chat e cliente necessário'; END IF;
 IF p_body IS NULL OR p_file->>'name' IS NULL OR p_file->>'mime_type' IS NULL OR file_id IS NULL OR file_id !~ '^[A-Za-z0-9_-]{10,200}$' OR folder_id IS NULL OR folder_id !~ '^[A-Za-z0-9_-]{10,200}$' OR length(btrim(p_body)) NOT BETWEEN 1 AND 10000 OR length(p_file->>'name') NOT BETWEEN 1 AND 500 OR length(p_file->>'mime_type') NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'Material inválido'; END IF;
 INSERT INTO public.chat_messages(agency_id,sender_id,channel_id,conversation_id,body,message_type,client_message_id) VALUES(p_agency,p_actor,p_channel,p_conversation,btrim(p_body),'text',gen_random_uuid()) RETURNING id INTO message_id;
 INSERT INTO public.chat_attachments(agency_id,message_id,storage_path,file_name,mime_type,file_size,uploaded_by,client_id,google_file_id,drive_folder_id) VALUES(p_agency,message_id,'drive:'||file_id,p_file->>'name',p_file->>'mime_type',coalesce((p_file->>'size_bytes')::bigint,0),p_actor,p_client,file_id,folder_id);
 RETURN message_id;
END $$;
CREATE OR REPLACE FUNCTION public.chat_drive_send(p_agency uuid,p_actor uuid,p_client uuid,p_channel uuid,p_conversation uuid,p_body text,p_file jsonb) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.chat_drive_send(p_agency,p_actor,p_client,p_channel,p_conversation,p_body,p_file)$$;
REVOKE ALL ON FUNCTION private.chat_drive_send(uuid,uuid,uuid,uuid,uuid,text,jsonb),public.chat_drive_send(uuid,uuid,uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT EXECUTE ON FUNCTION private.chat_drive_send(uuid,uuid,uuid,uuid,uuid,text,jsonb),public.chat_drive_send(uuid,uuid,uuid,uuid,uuid,text,jsonb) TO service_role;
