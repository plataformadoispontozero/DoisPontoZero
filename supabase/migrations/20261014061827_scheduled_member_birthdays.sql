-- Birthday dispatch remains private and runs without a browser session.
create function private.dispatch_member_birthdays(p_agency uuid) returns integer language plpgsql security definer set search_path='' as $$
declare member record; sent integer:=0; claimed uuid; local_today date; agency_zone text;
begin
 select z.name into agency_zone from public.agency_preferences ap join pg_catalog.pg_timezone_names z on z.name=ap.timezone where ap.agency_id=p_agency;
 local_today:=(now() at time zone coalesce(agency_zone,'UTC'))::date;
 for member in select p.id,p.full_name,m.id membership_id from public.profiles p join private.member_profile_details d on d.user_id=p.id join public.agency_members m on m.user_id=p.id and m.agency_id=p_agency and m.status='active' where extract(month from d.birth_date)=extract(month from local_today) and extract(day from d.birth_date)=extract(day from local_today) loop
  claimed:=null;
  insert into private.member_birthday_events(agency_id,user_id,event_year) values(p_agency,member.id,extract(year from local_today)::int) on conflict do nothing returning user_id into claimed;
  if claimed is not null then
   insert into public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id) select p_agency,m.user_id,'member_birthday','Aniversário da equipe',member.full_name||' faz aniversário hoje.','member',member.membership_id from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id where m.agency_id=p_agency and m.status='active' and r.name in ('OWNER','ADMIN','MANAGER');
   sent:=sent+1;
  end if;
 end loop;return sent;
end;$$;

revoke all on function private.dispatch_member_birthdays(uuid) from public,anon,authenticated;
create or replace function private.sync_member_birthdays(p_agency uuid) returns integer language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=p_agency and m.user_id=auth.uid() and m.status='active' and a.status='active' and r.name in ('OWNER','ADMIN','MANAGER')) then raise exception 'Somente a gestão pode sincronizar aniversários' using errcode='42501';end if;
 return private.dispatch_member_birthdays(p_agency);
end;$$;
create function private.dispatch_all_member_birthdays() returns integer language plpgsql security definer set search_path='' as $$
declare agency record; sent integer:=0;
begin
 for agency in select id from public.agencies where status='active' loop
  sent:=sent+private.dispatch_member_birthdays(agency.id);
 end loop;return sent;
end;$$;
revoke all on function private.dispatch_all_member_birthdays() from public,anon,authenticated;
-- Hourly check respects agency time zones; event PK prevents repeats within the same year.
create extension if not exists pg_cron;
select cron.schedule('doiszero-member-birthdays','10 * * * *','select private.dispatch_all_member_birthdays()');
