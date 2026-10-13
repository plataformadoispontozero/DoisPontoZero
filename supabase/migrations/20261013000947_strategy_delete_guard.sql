-- Existing strategy records only; historical references must remain intact.
create or replace function private.guard_strategy_delete() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.can_editorial(old.agency_id,'strategy.edit') then
  raise exception 'Sem permissão para apagar estratégias.' using errcode='42501';
 end if;
 if old.status not in ('draft','archived') then
  raise exception 'Arquive a estratégia antes de apagar.' using errcode='23514';
 end if;
 if exists(select 1 from public.monthly_editorial_campaigns c where c.context->>'strategyId'=old.id::text)
 or exists(select 1 from public.editorial_campaign_versions c where c.context->>'strategyId'=old.id::text)
 or exists(select 1 from public.proposals p where p.strategy_id=old.id)
 or exists(select 1 from public.editorial_items i where i.strategy_id=old.id and (i.task_id is not null or i.status not in ('draft','idea')))
 or exists(select 1 from public.content_ideas i where i.strategy_id=old.id and (i.task_id is not null or i.editorial_item_id is not null)) then
  raise exception 'Esta estratégia possui calendário, proposta ou produção vinculada. Mantenha-a arquivada para preservar o histórico.' using errcode='23514';
 end if;
 return old;
end $$;
revoke all on function private.guard_strategy_delete() from public,anon,authenticated;
create trigger strategy_delete_dependencies before delete on public.content_strategies for each row execute function private.guard_strategy_delete();
drop policy if exists content_strategies_delete on public.content_strategies;
create policy content_strategies_delete on public.content_strategies for delete to authenticated using(private.can_editorial(agency_id,'strategy.edit'));
create or replace function public.delete_content_strategy(p_agency_id uuid,p_strategy_id uuid) returns uuid
language plpgsql security invoker set search_path='' as $$
declare deleted uuid;
begin
 if auth.uid() is null or not private.can_editorial(p_agency_id,'strategy.edit') then raise exception 'Sem permissão para apagar estratégias.' using errcode='42501'; end if;
 delete from public.content_strategies where id=p_strategy_id and agency_id=p_agency_id returning id into deleted;
 if deleted is null then raise exception 'Estratégia não encontrada nesta agência.' using errcode='42501'; end if;
 return deleted;
end $$;
revoke all on function public.delete_content_strategy(uuid,uuid) from public,anon;
grant execute on function public.delete_content_strategy(uuid,uuid) to authenticated;

-- Monthly strategy references live in JSON; take a parent lock just like a foreign key.
create or replace function private.lock_editorial_strategy_reference() returns trigger
language plpgsql security definer set search_path='' as $$
declare reference uuid;
begin
 if coalesce(new.context->>'strategyId','')<>'' then
  reference:=(new.context->>'strategyId')::uuid;
  perform 1 from public.content_strategies s where s.id=reference and s.agency_id=new.agency_id and s.client_id=new.client_id for key share;
  if not found then raise exception 'Estratégia não encontrada para este cliente.' using errcode='23503'; end if;
 end if;
 return new;
end $$;
revoke all on function private.lock_editorial_strategy_reference() from public,anon,authenticated;
create trigger editorial_strategy_parent_lock before insert or update on public.monthly_editorial_campaigns for each row execute function private.lock_editorial_strategy_reference();
create trigger editorial_version_strategy_parent_lock before insert on public.editorial_campaign_versions for each row execute function private.lock_editorial_strategy_reference();
