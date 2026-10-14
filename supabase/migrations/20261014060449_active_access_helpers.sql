-- Canonical access checks consult current database membership, role scope and active agency.
create or replace function public.is_agency_member(p_agency_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id join public.agencies a on a.id=m.agency_id where m.agency_id=p_agency_id and m.user_id=auth.uid() and m.status='active' and a.status='active');
$$;
create or replace function public.is_agency_admin(p_agency_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_agency_member(p_agency_id) and exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id where m.agency_id=p_agency_id and m.user_id=auth.uid() and m.status='active' and r.name in ('OWNER','ADMIN'));
$$;
create or replace function public.is_agency_owner(p_agency_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select public.is_agency_member(p_agency_id) and exists(select 1 from public.agency_members m join public.roles r on r.id=m.role_id and r.agency_id=m.agency_id where m.agency_id=p_agency_id and m.user_id=auth.uid() and m.status='active' and r.name='OWNER');
$$;
create or replace function public.has_agency_permission(p_agency_id uuid,p_permission_key text) returns boolean language sql stable security definer set search_path='' as $$select private.can_editorial(p_agency_id,p_permission_key);$$;
alter function public.set_updated_at() set search_path='';
-- This helper avoids recursive membership RLS while exposing only a visibility boolean.
create function private.visible_active_agency_peer(p_profile_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.agency_members current_member join public.agency_members peer on peer.agency_id=current_member.agency_id join public.roles actor_role on actor_role.id=current_member.role_id and actor_role.agency_id=current_member.agency_id join public.roles peer_role on peer_role.id=peer.role_id and peer_role.agency_id=peer.agency_id join public.agencies agency on agency.id=current_member.agency_id where current_member.user_id=auth.uid() and current_member.status='active' and peer.user_id=p_profile_id and peer.status='active' and agency.status='active');
$$;
revoke all on function private.visible_active_agency_peer(uuid) from public,anon;
grant execute on function private.visible_active_agency_peer(uuid) to authenticated;
-- Own profile remains available; peer visibility requires both members to be active.
alter policy profiles_select_own_or_agency_peers on public.profiles using (id=auth.uid() or private.visible_active_agency_peer(id));
