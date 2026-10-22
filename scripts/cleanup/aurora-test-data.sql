-- Aurora Café: exact scoped cleanup plan, 22/10/2026.
-- REVIEW ONLY: not a migration. Requires privileged maintenance connection.
-- No auth users, memberships, audit logs, Google files or shared Drive references are deleted.
-- Default ROLLBACK. The backup may contain private data: save outside Git with restricted access.
BEGIN ISOLATION LEVEL SERIALIZABLE;
-- Shared preparation, deliberately duplicated in the two self-contained scripts.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
CREATE TEMP TABLE aurora_target(
 relation oid NOT NULL, row_tid tid NOT NULL, row_data jsonb NOT NULL,
 PRIMARY KEY(relation,row_tid)
) ON COMMIT DROP;
CREATE TEMP TABLE aurora_scope(client uuid,agency uuid,projects uuid[]) ON COMMIT DROP;
INSERT INTO aurora_scope VALUES(
 'd80253af-69ea-4d74-9224-24f39d8b2d61','a0f00e64-e8ba-44e5-b0cf-2ad7adb44211',
 ARRAY['f1f42f39-2e8a-419f-aff2-765b4f691e41','451d44b6-2221-493b-aa30-2a77a9a82aca']::uuid[]);
DO $prepare$
DECLARE cfg record; r record; fk record; n integer; added integer; join_sql text; bad boolean;
BEGIN
 SELECT * INTO cfg FROM aurora_scope;
 -- Only this proven fictitious client. The name is an equality guard, not a deletion search.
 PERFORM 1 FROM public.clients WHERE id=cfg.client AND agency_id=cfg.agency
  AND name='Aurora Café — TESTE FICTÍCIO' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'STOP: exact Aurora identity/name/agency guard failed'; END IF;
 -- Prevent concurrent changes to client-owned roots during backup/deletion planning.
 LOCK TABLE public.clients,public.projects,public.tasks,public.briefings,
 public.content_strategies,public.monthly_editorial_campaigns,public.meetings,
 public.presentations,public.proposals IN SHARE ROW EXCLUSIVE MODE;
 IF (SELECT count(*) FROM public.projects WHERE client_id=cfg.client)<>2
 OR EXISTS(SELECT 1 FROM public.projects WHERE client_id=cfg.client
  AND (agency_id<>cfg.agency OR NOT(id=ANY(cfg.projects)) OR position('TESTE FICTÍCIO' in name)=0))
 THEN RAISE EXCEPTION 'STOP: project inventory changed; review backup/allowlist'; END IF;
 IF (SELECT count(*) FROM public.tasks WHERE project_id=ANY(cfg.projects))<>16
 THEN RAISE EXCEPTION 'STOP: expected 16 scoped tasks; review current inventory'; END IF;
 -- Include direct client-scoped records, regardless of display/status. Never match titles.
 FOR r IN SELECT c.oid,n.nspname,c.relname FROM pg_class c
 JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid
 WHERE n.nspname IN('public','private') AND c.relkind='r' AND a.attname='client_id'
 AND a.atttypid='uuid'::regtype AND NOT a.attisdropped LOOP
  EXECUTE format('LOCK TABLE %I.%I IN SHARE ROW EXCLUSIVE MODE',r.nspname,r.relname);
  EXECUTE format('INSERT INTO aurora_target SELECT %s,ctid,to_jsonb(t) FROM %I.%I t WHERE client_id=$1 ON CONFLICT DO NOTHING',r.oid,r.nspname,r.relname) USING cfg.client;
 END LOOP;
 INSERT INTO aurora_target SELECT 'public.clients'::regclass,ctid,to_jsonb(t)
  FROM public.clients t WHERE id=cfg.client ON CONFLICT DO NOTHING;
 -- The only message proven in the creation receipt. No channel-wide/message-text deletion.
 INSERT INTO aurora_target SELECT 'public.chat_messages'::regclass,ctid,to_jsonb(t)
 FROM public.chat_messages t WHERE id='a3707896-5788-49c6-b862-8d540f12e6f3' AND agency_id=cfg.agency ON CONFLICT DO NOTHING;
 -- Close CASCADE descendants (including private snapshots and composite PK rows).
 -- Explicit structural NO ACTION children are included so FK blockers are not bypassed.
 LOOP
  added:=0;
  FOR fk IN SELECT con.*,nc.nspname child_schema,cc.relname child_name,
   np.nspname parent_schema,cp.relname parent_name FROM pg_constraint con
   JOIN pg_class cc ON cc.oid=con.conrelid JOIN pg_namespace nc ON nc.oid=cc.relnamespace
   JOIN pg_class cp ON cp.oid=con.confrelid JOIN pg_namespace np ON np.oid=cp.relnamespace
   WHERE con.contype='f' AND nc.nspname IN('public','private')
   AND (con.confdeltype='c' OR cc.relname IN('presentation_material_reviews','editorial_campaign_versions','editorial_idea_registry'))
   AND EXISTS(SELECT 1 FROM aurora_target WHERE relation=con.confrelid) LOOP
   SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ' ORDER BY k.ord)
   INTO join_sql FROM unnest(fk.conkey,fk.confkey) WITH ORDINALITY k(child_att,parent_att,ord)
   JOIN pg_attribute ca ON ca.attrelid=fk.conrelid AND ca.attnum=k.child_att
   JOIN pg_attribute pa ON pa.attrelid=fk.confrelid AND pa.attnum=k.parent_att;
   EXECUTE format('LOCK TABLE %I.%I IN SHARE ROW EXCLUSIVE MODE',fk.child_schema,fk.child_name);
   EXECUTE format('INSERT INTO aurora_target SELECT %s,c.ctid,to_jsonb(c) FROM %I.%I c JOIN %I.%I p ON %s JOIN aurora_target t ON t.relation=%s AND t.row_tid=p.ctid ON CONFLICT DO NOTHING',fk.conrelid,fk.child_schema,fk.child_name,fk.parent_schema,fk.parent_name,join_sql,fk.confrelid);
   GET DIAGNOSTICS n=ROW_COUNT;added:=added+n;
  END LOOP;
  EXIT WHEN added=0;
 END LOOP;
 -- Reject tenant/client/project boundaries rather than deleting or SET NULL-ing real data.
 IF EXISTS(SELECT 1 FROM aurora_target WHERE
  (row_data->>'agency_id' IS NOT NULL AND row_data->>'agency_id'<>cfg.agency::text)
  OR (row_data->>'client_id' IS NOT NULL AND row_data->>'client_id'<>cfg.client::text)
  OR (row_data->>'project_id' IS NOT NULL AND NOT((row_data->>'project_id')::uuid=ANY(cfg.projects))))
 THEN RAISE EXCEPTION 'STOP: target closure crosses client/project/agency boundary'; END IF;
 -- Notifications are selected only by exact typed resource IDs already proven in the closure.
 INSERT INTO aurora_target SELECT 'public.notifications'::regclass,notif.ctid,to_jsonb(notif)
 FROM public.notifications notif WHERE notif.agency_id=cfg.agency AND EXISTS(
 SELECT 1 FROM aurora_target t WHERE t.row_data->>'id'=notif.resource_id::text AND
 ((t.relation='public.tasks'::regclass AND notif.resource_type='task') OR
 (t.relation='public.meetings'::regclass AND notif.resource_type='meeting') OR
 (t.relation='public.chat_messages'::regclass AND notif.resource_type='chat_message') OR
 (t.relation='public.presentations'::regclass AND notif.resource_type='presentation')))
 ON CONFLICT DO NOTHING;
 -- Any uncovered inbound FK, including SET NULL, means unexpected real references: abort.
 FOR fk IN SELECT con.*,nc.nspname child_schema,cc.relname child_name,
  np.nspname parent_schema,cp.relname parent_name FROM pg_constraint con
  JOIN pg_class cc ON cc.oid=con.conrelid JOIN pg_namespace nc ON nc.oid=cc.relnamespace
  JOIN pg_class cp ON cp.oid=con.confrelid JOIN pg_namespace np ON np.oid=cp.relnamespace
  WHERE con.contype='f' AND EXISTS(SELECT 1 FROM aurora_target WHERE relation=con.confrelid) LOOP
  SELECT string_agg(format('c.%I=p.%I',ca.attname,pa.attname),' AND ' ORDER BY k.ord)
  INTO join_sql FROM unnest(fk.conkey,fk.confkey) WITH ORDINALITY k(child_att,parent_att,ord)
  JOIN pg_attribute ca ON ca.attrelid=fk.conrelid AND ca.attnum=k.child_att
  JOIN pg_attribute pa ON pa.attrelid=fk.confrelid AND pa.attnum=k.parent_att;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I.%I c JOIN %I.%I p ON %s JOIN aurora_target t ON t.relation=%s AND t.row_tid=p.ctid WHERE NOT EXISTS(SELECT 1 FROM aurora_target own WHERE own.relation=%s AND own.row_tid=c.ctid))',fk.child_schema,fk.child_name,fk.parent_schema,fk.parent_name,join_sql,fk.confrelid,fk.conrelid) INTO bad;
  IF bad THEN RAISE EXCEPTION 'STOP: uncovered inbound FK %.% (%)',fk.child_schema,fk.child_name,fk.conname; END IF;
 END LOOP;
END $prepare$;

-- Save this COMPLETE JSON result locally before considering permanent deletion.
-- It includes public/private rows, ciphertext/snapshots/reviews and composite-key children.
SELECT jsonb_build_object('client_id',(SELECT client FROM aurora_scope),'captured_at',now(),
 'rows',coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'data',t.row_data)
 ORDER BY n.nspname,c.relname,t.row_data::text),'[]'::jsonb)) AS aurora_backup
FROM aurora_target t JOIN pg_class c ON c.oid=t.relation JOIN pg_namespace n ON n.oid=c.relnamespace;
SELECT relation::regclass::text AS target_table,count(*) AS planned_rows
FROM aurora_target GROUP BY relation ORDER BY target_table;

-- Re-run preparation immediately before execution; never persist/use CTIDs across transactions.
-- Existing strategy-delete guard also requires the authorized operator auth.uid() context.
-- Supply only the requesting active authorized operator for the maintenance transaction;
-- do not disable triggers or remove the permission checks.
-- Proof of backup is deliberately mandatory. Set this only after saving/verifying inventory JSON:
-- SET LOCAL app.aurora_backup_verified = 'd80253af-69ea-4d74-9224-24f39d8b2d61';
DO $delete$
DECLARE r record; deleted integer; progress integer; remaining integer; rounds integer:=0;
BEGIN
 IF current_setting('app.aurora_backup_verified',true) IS DISTINCT FROM 'd80253af-69ea-4d74-9224-24f39d8b2d61'
 THEN RAISE EXCEPTION 'STOP: save and verify complete inventory JSON before deletion'; END IF;
 -- Child tables are attempted before parents. FK violations roll back that statement only;
 -- each pass removes newly unblocked parents. No constraints/triggers/RLS are disabled.
 LOOP
  progress:=0;remaining:=0;rounds:=rounds+1;
  FOR r IN SELECT DISTINCT t.relation,n.nspname,c.relname,CASE WHEN c.relname='content_strategies' THEN 1 ELSE 0 END AS deletion_priority FROM aurora_target t
   JOIN pg_class c ON c.oid=t.relation JOIN pg_namespace n ON n.oid=c.relnamespace
   ORDER BY deletion_priority,c.relname LOOP
   BEGIN
    EXECUTE format('DELETE FROM %I.%I d USING aurora_target t WHERE t.relation=%s AND t.row_tid=d.ctid',r.nspname,r.relname,r.relation);
    GET DIAGNOSTICS deleted=ROW_COUNT;progress:=progress+deleted;
   EXCEPTION WHEN foreign_key_violation THEN
    remaining:=remaining+1;
   END;
  END LOOP;
  EXIT WHEN remaining=0;
  IF progress=0 OR rounds>50 THEN RAISE EXCEPTION 'STOP: dependency cycle/unexpected FK; transaction rolled back'; END IF;
 END LOOP;
 IF EXISTS(SELECT 1 FROM public.clients WHERE id=(SELECT client FROM aurora_scope))
 THEN RAISE EXCEPTION 'STOP: client still present'; END IF;
END $delete$;
-- Dry-run by default. Only replace this last ROLLBACK with COMMIT after explicit review.
ROLLBACK;
