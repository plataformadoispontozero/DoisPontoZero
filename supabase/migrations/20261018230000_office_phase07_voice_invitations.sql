-- Private, tenant-scoped voice invitations. Chat history and existing room access are unchanged.
ALTER TABLE public.chat_preferences
  ADD COLUMN office_do_not_disturb boolean NOT NULL DEFAULT false;

CREATE TABLE public.office_voice_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  caller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','cancelled','expired','ended')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '60 seconds',
  accepted_at timestamptz,
  resolved_at timestamptz,
  CHECK (caller_id <> recipient_id)
);
CREATE INDEX office_voice_invites_inbox_idx
  ON public.office_voice_invitations(agency_id,recipient_id,status,created_at DESC);
CREATE INDEX office_voice_invites_caller_idx
  ON public.office_voice_invitations(agency_id,caller_id,status,created_at DESC);
ALTER TABLE public.office_voice_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.office_voice_invitations FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.office_voice_invitations TO authenticated;

CREATE FUNCTION private.office_invitation_member(a uuid,u uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT private.operational_notification_access(a,u,'chat.access')
$$;
REVOKE ALL ON FUNCTION private.office_invitation_member(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_invitation_member(uuid,uuid) TO authenticated;

CREATE POLICY office_voice_invitation_participant_read ON public.office_voice_invitations
  FOR SELECT TO authenticated
  USING (
    private.office_invitation_member(agency_id,auth.uid())
    AND (caller_id=auth.uid() OR recipient_id=auth.uid())
  );

CREATE FUNCTION private.office_voice_invite_topic(topic text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE parts text[]; a uuid; i uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  parts:=string_to_array(topic,':');
  IF cardinality(parts)<>3 OR parts[1]<>'office-call' THEN RETURN false; END IF;
  a:=parts[2]::uuid; i:=parts[3]::uuid;
  RETURN EXISTS (
    SELECT 1 FROM public.office_voice_invitations v
    WHERE v.id=i AND v.agency_id=a
      AND (v.caller_id=auth.uid() OR v.recipient_id=auth.uid())
      AND private.office_invitation_member(a,v.caller_id)
      AND private.office_invitation_member(a,v.recipient_id)
  );
EXCEPTION WHEN invalid_text_representation THEN RETURN false;
END; $$;
REVOKE ALL ON FUNCTION private.office_voice_invite_topic(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.office_voice_invite_topic(text) TO authenticated;
CREATE POLICY office_voice_invitation_events_read ON realtime.messages
  FOR SELECT TO authenticated USING (
    extension IN ('broadcast','presence') AND private.office_voice_invite_topic(realtime.topic())
  );
CREATE POLICY office_voice_invitation_events_send ON realtime.messages
  FOR INSERT TO authenticated WITH CHECK (
    extension IN ('broadcast','presence') AND private.office_voice_invite_topic(realtime.topic())
  );

CREATE FUNCTION private.office_voice_invite_send(a uuid,target uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); new_id uuid; stamp timestamptz:=clock_timestamp();
BEGIN
  IF uid IS NULL OR NOT private.office_invitation_member(a,uid) THEN
    RAISE EXCEPTION 'Acesso ao escritório necessário' USING ERRCODE='42501';
  END IF;
  IF target IS NULL OR target=uid OR NOT private.office_invitation_member(a,target) THEN
    RAISE EXCEPTION 'Membro indisponível' USING ERRCODE='42501';
  END IF;

  IF uid<target THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(a::text||uid::text,0));
    PERFORM pg_advisory_xact_lock(hashtextextended(a::text||target::text,0));
  ELSE
    PERFORM pg_advisory_xact_lock(hashtextextended(a::text||target::text,0));
    PERFORM pg_advisory_xact_lock(hashtextextended(a::text||uid::text,0));
  END IF;
  UPDATE public.office_voice_invitations
    SET status='expired',resolved_at=stamp
    WHERE agency_id=a AND status='pending' AND expires_at<=stamp;
  UPDATE public.office_voice_invitations
    SET status='ended',resolved_at=stamp
    WHERE agency_id=a AND status='accepted' AND expires_at<=stamp;

  IF coalesce((SELECT office_do_not_disturb FROM public.chat_preferences WHERE agency_id=a AND user_id=target),false) THEN
    RAISE EXCEPTION 'OFFICE_RECIPIENT_BUSY' USING ERRCODE='P0001';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.office_voice_invitations v
    WHERE v.agency_id=a AND (v.caller_id IN (uid,target) OR v.recipient_id IN (uid,target))
      AND ((v.status='pending' AND v.expires_at>stamp) OR (v.status='accepted' AND v.expires_at>stamp))
  ) THEN RAISE EXCEPTION 'OFFICE_PARTICIPANT_BUSY' USING ERRCODE='P0001'; END IF;
  IF (SELECT count(*) FROM public.office_voice_invitations v
      WHERE v.agency_id=a AND v.caller_id=uid AND v.created_at>stamp-interval '10 minutes')>=5 THEN
    RAISE EXCEPTION 'OFFICE_INVITATION_RATE_LIMIT' USING ERRCODE='P0001';
  END IF;

  INSERT INTO public.office_voice_invitations(agency_id,caller_id,recipient_id,created_at,expires_at)
  VALUES(a,uid,target,stamp,stamp+interval '60 seconds') RETURNING id INTO new_id;
  INSERT INTO public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
  VALUES(a,target,'office_voice_invitation','Convite para conversa de voz',
    'Um membro da sua equipe convidou você para conversar por voz.','office_voice_invitation',new_id);
  RETURN jsonb_build_object('id',new_id,'status','pending','expires_at',stamp+interval '60 seconds');
END; $$;
REVOKE ALL ON FUNCTION private.office_voice_invite_send(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.office_voice_invite_send(uuid,uuid) TO authenticated;

CREATE FUNCTION private.office_voice_invite_directory(a uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); stamp timestamptz:=clock_timestamp();
BEGIN
  IF uid IS NULL OR NOT private.office_invitation_member(a,uid) THEN
    RAISE EXCEPTION 'Acesso ao escritório necessário' USING ERRCODE='42501';
  END IF;
  UPDATE public.office_voice_invitations v SET status='expired',resolved_at=stamp
    WHERE v.agency_id=a AND v.status='pending' AND v.expires_at<=stamp;
  UPDATE public.office_voice_invitations v SET status='ended',resolved_at=stamp
    WHERE v.agency_id=a AND v.status='accepted' AND v.expires_at<=stamp;
  UPDATE public.notifications n SET title='Chamada perdida',body='O convite para conversar por voz expirou.',read_at=coalesce(n.read_at,stamp)
    WHERE n.agency_id=a AND n.recipient_id=uid AND n.resource_type='office_voice_invitation'
      AND n.read_at IS NULL AND EXISTS(SELECT 1 FROM public.office_voice_invitations v
        WHERE v.id=n.resource_id AND v.recipient_id=uid AND v.status='expired');
  RETURN coalesce((
    SELECT jsonb_agg(jsonb_build_object(
      'id',v.id,'status',v.status,'direction',CASE WHEN v.caller_id=uid THEN 'outgoing' ELSE 'incoming' END,
      'counterpart_id',other.id,'counterpart_name',other.full_name,'expires_at',v.expires_at,'created_at',v.created_at
    ) ORDER BY v.created_at DESC)
    FROM public.office_voice_invitations v
    JOIN public.profiles other ON other.id=CASE WHEN v.caller_id=uid THEN v.recipient_id ELSE v.caller_id END
    WHERE v.agency_id=a AND (v.caller_id=uid OR v.recipient_id=uid)
      AND v.status IN ('pending','accepted') AND v.expires_at>stamp
  ),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION private.office_voice_invite_directory(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.office_voice_invite_directory(uuid) TO authenticated;

CREATE FUNCTION private.office_voice_invite_respond(invite_id uuid,response text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE uid uuid:=auth.uid(); v public.office_voice_invitations; stamp timestamptz:=clock_timestamp();
BEGIN
  IF uid IS NULL OR response NOT IN ('accept','decline','cancel','end','expire') THEN
    RAISE EXCEPTION 'Ação indisponível' USING ERRCODE='42501';
  END IF;
  SELECT * INTO v FROM public.office_voice_invitations WHERE id=invite_id FOR UPDATE;
  IF NOT FOUND OR NOT private.office_invitation_member(v.agency_id,uid)
    OR NOT private.office_invitation_member(v.agency_id,v.caller_id)
    OR NOT private.office_invitation_member(v.agency_id,v.recipient_id)
    OR uid NOT IN (v.caller_id,v.recipient_id) THEN
    RAISE EXCEPTION 'Convite indisponível' USING ERRCODE='42501';
  END IF;
  IF v.caller_id<v.recipient_id THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v.agency_id::text||v.caller_id::text,0));
    PERFORM pg_advisory_xact_lock(hashtextextended(v.agency_id::text||v.recipient_id::text,0));
  ELSE
    PERFORM pg_advisory_xact_lock(hashtextextended(v.agency_id::text||v.recipient_id::text,0));
    PERFORM pg_advisory_xact_lock(hashtextextended(v.agency_id::text||v.caller_id::text,0));
  END IF;
  IF v.status='pending' AND v.expires_at<=stamp THEN
    UPDATE public.office_voice_invitations SET status='expired',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF v.status='accepted' AND v.expires_at<=stamp THEN
    UPDATE public.office_voice_invitations SET status='ended',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF v.status='pending' AND response='accept' THEN
    IF uid<>v.recipient_id THEN RAISE EXCEPTION 'Somente quem recebeu pode aceitar' USING ERRCODE='42501'; END IF;
    IF coalesce((SELECT office_do_not_disturb FROM public.chat_preferences WHERE agency_id=v.agency_id AND user_id=uid),false)
      OR EXISTS(SELECT 1 FROM public.office_voice_invitations x WHERE x.agency_id=v.agency_id AND x.id<>invite_id
        AND (x.caller_id=uid OR x.recipient_id=uid)
        AND ((x.status='pending' AND x.expires_at>stamp) OR (x.status='accepted' AND x.expires_at>stamp))) THEN
      RAISE EXCEPTION 'OFFICE_PARTICIPANT_BUSY' USING ERRCODE='P0001';
    END IF;
    UPDATE public.office_voice_invitations SET status='accepted',accepted_at=stamp,expires_at=stamp+interval '3 hours'
      WHERE id=invite_id AND status='pending' RETURNING * INTO v;
  ELSIF v.status='pending' AND response='decline' THEN
    IF uid<>v.recipient_id THEN RAISE EXCEPTION 'Somente quem recebeu pode recusar' USING ERRCODE='42501'; END IF;
    UPDATE public.office_voice_invitations SET status='declined',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF v.status='pending' AND response='cancel' THEN
    IF uid<>v.caller_id THEN RAISE EXCEPTION 'Somente quem chamou pode cancelar' USING ERRCODE='42501'; END IF;
    UPDATE public.office_voice_invitations SET status='cancelled',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF v.status='accepted' AND response='end' THEN
    UPDATE public.office_voice_invitations SET status='ended',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF v.status='pending' AND response='expire' AND v.expires_at<=stamp THEN
    UPDATE public.office_voice_invitations SET status='expired',resolved_at=stamp WHERE id=invite_id RETURNING * INTO v;
  ELSIF NOT ((response='accept' AND v.status='accepted') OR (response='decline' AND v.status='declined')
      OR (response='cancel' AND v.status='cancelled') OR ((response='end' OR response='expire') AND v.status IN ('ended','expired')))
      THEN RAISE EXCEPTION 'Convite já foi resolvido' USING ERRCODE='P0001';
  END IF;
  UPDATE public.notifications SET read_at=coalesce(read_at,stamp),
    title=CASE WHEN v.status='expired' THEN 'Chamada perdida' ELSE title END,
    body=CASE WHEN v.status='expired' THEN 'O convite para conversar por voz expirou.' ELSE body END
    WHERE agency_id=v.agency_id AND recipient_id=v.recipient_id
      AND resource_type='office_voice_invitation' AND resource_id=v.id;
  RETURN jsonb_build_object('id',v.id,'status',v.status,'expires_at',v.expires_at);
END; $$;
REVOKE ALL ON FUNCTION private.office_voice_invite_respond(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.office_voice_invite_respond(uuid,text) TO authenticated;

CREATE FUNCTION private.office_voice_set_do_not_disturb(a uuid,enabled boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF auth.uid() IS NULL OR enabled IS NULL OR NOT private.office_invitation_member(a,auth.uid()) THEN
    RAISE EXCEPTION 'Acesso ao escritório necessário' USING ERRCODE='42501';
  END IF;
  INSERT INTO public.chat_preferences(agency_id,user_id,office_do_not_disturb)
    VALUES(a,auth.uid(),enabled)
    ON CONFLICT(agency_id,user_id) DO UPDATE SET office_do_not_disturb=excluded.office_do_not_disturb;
END; $$;
REVOKE ALL ON FUNCTION private.office_voice_set_do_not_disturb(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.office_voice_set_do_not_disturb(uuid,boolean) TO authenticated;

CREATE FUNCTION public.office_voice_invite_send(p_agency uuid,p_recipient uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_voice_invite_send(p_agency,p_recipient)$$;
CREATE FUNCTION public.office_voice_invite_directory(p_agency uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_voice_invite_directory(p_agency)$$;
CREATE FUNCTION public.office_voice_invite_respond(p_invitation uuid,p_response text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_voice_invite_respond(p_invitation,p_response)$$;
CREATE FUNCTION public.office_voice_set_do_not_disturb(p_agency uuid,p_enabled boolean) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$SELECT private.office_voice_set_do_not_disturb(p_agency,p_enabled)$$;
REVOKE ALL ON FUNCTION public.office_voice_invite_send(uuid,uuid),public.office_voice_invite_directory(uuid),
  public.office_voice_invite_respond(uuid,text),public.office_voice_set_do_not_disturb(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.office_voice_invite_send(uuid,uuid),public.office_voice_invite_directory(uuid),
  public.office_voice_invite_respond(uuid,text),public.office_voice_set_do_not_disturb(uuid,boolean) TO authenticated;

-- Permit the token endpoint to sign either an enabled team room or an active, participant-only private call.
CREATE OR REPLACE FUNCTION private.office_voice_context(r uuid,consume boolean) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a uuid; room_kind text; stamp timestamptz:=clock_timestamp(); counted integer;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='42501'; END IF;
  SELECT c.agency_id,'team' INTO a,room_kind
    FROM public.chat_channels c WHERE c.id=r AND private.office_room_access(c.agency_id,c.id);
  IF a IS NULL THEN
    SELECT v.agency_id,'private_call' INTO a,room_kind FROM public.office_voice_invitations v
      WHERE v.id=r AND v.expires_at>stamp
        AND v.status='accepted' AND auth.uid() IN (v.caller_id,v.recipient_id)
        AND private.office_invitation_member(v.agency_id,v.caller_id)
        AND private.office_invitation_member(v.agency_id,v.recipient_id);
  END IF;
  IF a IS NULL THEN RAISE EXCEPTION 'Sala indisponível' USING ERRCODE='42501'; END IF;
  IF consume IS TRUE THEN
    INSERT INTO private.office_token_limits(agency_id,user_id,window_started,requests) VALUES(a,auth.uid(),stamp,1)
      ON CONFLICT(agency_id,user_id) DO UPDATE SET
        window_started=CASE WHEN excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' THEN excluded.window_started ELSE private.office_token_limits.window_started END,
        requests=CASE WHEN excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' THEN 1 ELSE private.office_token_limits.requests+1 END
      WHERE excluded.window_started-private.office_token_limits.window_started>=interval '60 seconds' OR private.office_token_limits.requests<10
      RETURNING requests INTO counted;
    IF counted IS NULL THEN RAISE EXCEPTION 'OFFICE_RATE_LIMIT' USING ERRCODE='P0001'; END IF;
  END IF;
  RETURN jsonb_build_object('agency_id',a,'user_id',auth.uid(),'room_id',r,'room_type',room_kind,
    'room_name',CASE WHEN room_kind='private_call' THEN 'office_call_'||a::text||'_'||r::text ELSE 'office_'||a::text||'_'||r::text END);
END; $$;

ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK(type IN (
  'meeting_invitation','meeting_updated','meeting_cancelled','meeting_action_assigned','chat_mention','chat_direct_message','chat_channel_message',
  'team_registration_pending','material_approved','material_changes_requested','member_birthday','calendar_approved','calendar_changes_requested',
  'calendar_production','client_created','task_production_started','office_voice_invitation'
));
DO $$ BEGIN
  IF EXISTS(SELECT 1 FROM pg_publication WHERE pubname='supabase_realtime')
    AND NOT EXISTS(SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='office_voice_invitations')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.office_voice_invitations; END IF;
END $$;
