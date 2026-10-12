-- Optional profession is descriptive and never alters agency membership or access roles.
alter table public.profiles add column profession text check(profession is null or profession in ('designer','social_media','videomaker','paid_traffic','manager','other'));
create table private.member_profile_details(user_id uuid primary key references public.profiles(id) on delete cascade,birth_date date check(birth_date<=current_date),updated_at timestamptz not null default now());
alter table private.member_profile_details enable row level security;
revoke all on private.member_profile_details from public,anon,authenticated;
create table private.member_birthday_events(agency_id uuid not null references public.agencies(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,event_year int not null,created_at timestamptz not null default now(),primary key(agency_id,user_id,event_year));
alter table private.member_birthday_events enable row level security;
revoke all on private.member_birthday_events from public,anon,authenticated;
create function private.my_profile() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Autenticação necessária' using errcode='42501';end if;
 return (select jsonb_build_object('id',p.id,'full_name',p.full_name,'avatar_url',p.avatar_url,'profession',p.profession,'birth_date',d.birth_date) from public.profiles p left join private.member_profile_details d on d.user_id=p.id where p.id=auth.uid());
end;$$;
create function public.get_my_profile() returns jsonb language sql security invoker set search_path='' as $$select private.my_profile()$$;
create function private.save_my_profile(p_name text,p_avatar_url text,p_profession text,p_birth_date date) returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); old_avatar text; avatar_path text;
begin
 if u is null then raise exception 'Autenticação necessária' using errcode='42501';end if;
 if p_name is null or length(trim(p_name)) not between 2 and 120 then raise exception 'Nome deve ter entre 2 e 120 caracteres';end if;
 if p_profession is not null and p_profession not in ('designer','social_media','videomaker','paid_traffic','manager','other') then raise exception 'Profissão inválida';end if;
 if p_birth_date>current_date then raise exception 'Data de nascimento não pode estar no futuro';end if;
 select avatar_url into old_avatar from public.profiles where id=u;
 if not found then raise exception 'Perfil não encontrado';end if;
 if nullif(p_avatar_url,'') is not null and p_avatar_url is distinct from old_avatar then
  avatar_path:=substring(p_avatar_url from '^https://pvkhlobsiszrjtblpruu[.]supabase[.]co/storage/v1/object/public/profile-avatars/(.+)$');
  if avatar_path is null or split_part(avatar_path,'/',1)<>u::text or avatar_path !~ '^[a-f0-9-]{36}/[A-Za-z0-9_-]+[.](jpg|jpeg|png|webp)$' or not exists(select 1 from storage.objects o where o.bucket_id='profile-avatars' and o.name=avatar_path) then raise exception 'Envie a imagem para a sua pasta de avatar';end if;
 end if;
 update public.profiles set full_name=trim(p_name),avatar_url=nullif(p_avatar_url,''),profession=p_profession where id=u;
 insert into private.member_profile_details(user_id,birth_date) values(u,p_birth_date) on conflict(user_id) do update set birth_date=excluded.birth_date,updated_at=now();
 return private.my_profile();
end;$$;
create function public.save_my_profile(p_name text,p_avatar_url text default null,p_profession text default null,p_birth_date date default null) returns jsonb language sql security invoker set search_path='' as $$select private.save_my_profile(p_name,p_avatar_url,p_profession,p_birth_date)$$;
-- Include the existing material response notification types as well as birthdays.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check(type in ('meeting_invitation','meeting_updated','meeting_cancelled','meeting_action_assigned','chat_mention','chat_direct_message','chat_channel_message','team_registration_pending','material_approved','material_changes_requested','member_birthday'));
create function private.sync_member_birthdays(p_agency uuid) returns integer language plpgsql security definer set search_path='' as $$
declare member record; sent integer:=0; claimed uuid; local_today date; agency_zone text;
begin
 if auth.uid() is null or not exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=p_agency and m.user_id=auth.uid() and m.status='active' and a.status='active' and r.name in ('OWNER','ADMIN','MANAGER')) then raise exception 'Somente a gestão pode sincronizar aniversários' using errcode='42501';end if;
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
create function public.sync_member_birthdays(p_agency uuid) returns integer language sql security invoker set search_path='' as $$select private.sync_member_birthdays(p_agency)$$;
revoke all on function private.my_profile(),private.save_my_profile(text,text,text,date),private.sync_member_birthdays(uuid),public.get_my_profile(),public.save_my_profile(text,text,text,date),public.sync_member_birthdays(uuid) from public,anon;
grant execute on function private.my_profile(),private.save_my_profile(text,text,text,date),private.sync_member_birthdays(uuid),public.get_my_profile(),public.save_my_profile(text,text,text,date),public.sync_member_birthdays(uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('profile-avatars','profile-avatars',true,2097152,array['image/jpeg','image/png','image/webp']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy profile_avatar_select on storage.objects for select to authenticated using(bucket_id='profile-avatars' and split_part(name,'/',1)=(select auth.uid())::text);
create policy profile_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='profile-avatars' and split_part(name,'/',1)=(select auth.uid())::text and name ~ '^[a-f0-9-]{36}/[A-Za-z0-9_-]+[.](jpg|jpeg|png|webp)$');
create policy profile_avatar_update on storage.objects for update to authenticated using(bucket_id='profile-avatars' and split_part(name,'/',1)=(select auth.uid())::text) with check(bucket_id='profile-avatars' and split_part(name,'/',1)=(select auth.uid())::text and name ~ '^[a-f0-9-]{36}/[A-Za-z0-9_-]+[.](jpg|jpeg|png|webp)$');
create policy profile_avatar_delete on storage.objects for delete to authenticated using(bucket_id='profile-avatars' and split_part(name,'/',1)=(select auth.uid())::text);
-- Tenant integrity also applies to privileged/service writes; callers additionally need squad permission.
create function private.validate_squad_member() returns trigger language plpgsql security definer set search_path='' as $$
declare agency uuid;
begin
 select agency_id into agency from public.squads where id=new.squad_id;
 if agency is null or not exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=agency and m.user_id=new.user_id and m.status='active' and a.status='active') then raise exception 'Membro deve estar ativo na agência do squad' using errcode='42501';end if;
 if auth.uid() is not null and not private.can_editorial(agency,'squads.manage_members') then raise exception 'Sem permissão para gerenciar membros do squad' using errcode='42501';end if;return new;
end;$$;
revoke all on function private.validate_squad_member() from public,anon,authenticated;
create trigger validate_squad_member before insert or update on public.squad_members for each row execute function private.validate_squad_member();
drop policy if exists squad_members_insert on public.squad_members;
create policy squad_members_insert on public.squad_members for insert to authenticated with check(exists(select 1 from public.squads s where s.id=squad_id and private.can_editorial(s.agency_id,'squads.manage_members')));
drop policy if exists squad_members_update on public.squad_members;
create policy squad_members_update on public.squad_members for update to authenticated using(exists(select 1 from public.squads s where s.id=squad_id and private.can_editorial(s.agency_id,'squads.manage_members'))) with check(exists(select 1 from public.squads s where s.id=squad_id and private.can_editorial(s.agency_id,'squads.manage_members')));
drop policy if exists squad_members_delete on public.squad_members;
create policy squad_members_delete on public.squad_members for delete to authenticated using(exists(select 1 from public.squads s where s.id=squad_id and private.can_editorial(s.agency_id,'squads.manage_members')));

-- Protect direct profile writes as well as the RPC; unchanged legacy avatars remain valid.
create function private.validate_member_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare avatar_path text;
begin
 if new.full_name is null or length(trim(new.full_name)) not between 2 and 120 then raise exception 'Nome deve ter entre 2 e 120 caracteres';end if;
 if nullif(new.avatar_url,'') is not null and (tg_op='INSERT' or new.avatar_url is distinct from old.avatar_url) then
  avatar_path:=substring(new.avatar_url from '^https://pvkhlobsiszrjtblpruu[.]supabase[.]co/storage/v1/object/public/profile-avatars/(.+)$');
  if avatar_path is null or split_part(avatar_path,'/',1)<>new.id::text or avatar_path !~ '^[a-f0-9-]{36}/[A-Za-z0-9_-]+[.](jpg|jpeg|png|webp)$' or not exists(select 1 from storage.objects o where o.bucket_id='profile-avatars' and o.name=avatar_path) then raise exception 'Envie a imagem para a sua pasta de avatar';end if;
 end if;return new;
end;$$;
revoke all on function private.validate_member_profile() from public,anon,authenticated;
create trigger validate_member_profile before update on public.profiles for each row execute function private.validate_member_profile();
-- Approved registration profession is descriptive; existing user preferences take precedence.
update public.profiles p set profession=q.profession from public.agency_registration_requests q where q.user_id=p.id and q.status='approved' and p.profession is null;
create function private.registration_profile_profession() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='approved' and old.status is distinct from new.status then update public.profiles set profession=new.profession where id=new.user_id and profession is null;end if;return new;
end;$$;
revoke all on function private.registration_profile_profession() from public,anon,authenticated;
create trigger registration_profile_profession after update of status on public.agency_registration_requests for each row execute function private.registration_profile_profession();
