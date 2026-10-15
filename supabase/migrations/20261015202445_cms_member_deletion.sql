begin;
create or replace function cms_private.prepare_member_deletion(p_user_id uuid,p_email text)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid; target public.cms_members;
begin
 perform pg_advisory_xact_lock(hashtextextended('cms-members',0));
 actor:=cms_private.require_role(array['owner']);
 select * into target from public.cms_members where user_id=p_user_id for update;
 if not found or p_user_id=actor or target.role='owner' or lower(target.email) is distinct from lower(p_email) then
  raise exception 'Bu hesap silinemez.' using errcode='42501';
 end if;
 update public.cms_members set active=false where user_id=p_user_id;
 insert into public.cms_audit(actor,action,target) values(actor,'member.delete_requested',p_user_id::text);
end;
$$;
create or replace function public.cms_prepare_member_deletion(p_user_id uuid,p_email text)
returns void language sql security invoker set search_path='' as $$
 select cms_private.prepare_member_deletion(p_user_id,p_email);
$$;
revoke all on function cms_private.prepare_member_deletion(uuid,text),public.cms_prepare_member_deletion(uuid,text) from public,anon;
grant execute on function cms_private.prepare_member_deletion(uuid,text),public.cms_prepare_member_deletion(uuid,text) to authenticated;
-- Protect against role/reactivation races between revocation and Auth API deletion.
create or replace function cms_private.guard_member_auth_deletion()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('cms-members',0));
 if exists(select 1 from public.cms_members where user_id=old.id and (active or role='owner')) then
  raise exception 'Etkin veya sahip hesap silinemez.' using errcode='42501';
 end if;
 return old;
end;
$$;
revoke all on function cms_private.guard_member_auth_deletion() from public,anon,authenticated;
drop trigger if exists cms_guard_member_auth_deletion on auth.users;
create trigger cms_guard_member_auth_deletion before delete on auth.users for each row execute function cms_private.guard_member_auth_deletion();
commit;
