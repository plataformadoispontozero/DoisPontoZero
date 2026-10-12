-- READ ONLY: tenant fixed to the user's existing Dois.Zero agency.
select table_name,column_name,data_type from information_schema.columns
where table_schema='public' and table_name in ('clients','briefings','briefing_answers','briefing_questions','briefing_templates','client_legacy_records','profiles','agency_members')
order by table_name,ordinal_position;
select id,profile->>'source_id' source_id from public.clients
where agency_id='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211';
select source_kind,count(*) from public.client_legacy_records
where agency_id='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211' group by source_kind;
select count(*) native_briefings from public.briefings
where agency_id='a0f00e64-e8ba-44e5-b0cf-2ad7adb44211';
select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('clients','briefings','briefing_answers','client_legacy_records');
