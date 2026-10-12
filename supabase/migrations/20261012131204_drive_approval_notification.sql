create function private.notify_drive_material_response() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.status='pending' and new.status in ('approved','changes_requested') then
  insert into public.notifications(agency_id,recipient_id,type,title,body,resource_type,resource_id)
  values(new.agency_id,new.owner_id,case when new.status='approved' then 'material_approved' else 'material_changes_requested' end,case when new.status='approved' then 'Cliente aprovou os materiais' else 'Cliente solicitou ajustes' end,coalesce(nullif(new.feedback,''),'Confira a ficha do cliente para continuar a produção.'),'client',new.client_id);
 end if;return new;
end;$$;
revoke all on function private.notify_drive_material_response() from public,anon,authenticated;
create trigger notify_drive_material_response after update of status on private.drive_material_approvals for each row execute function private.notify_drive_material_response();
