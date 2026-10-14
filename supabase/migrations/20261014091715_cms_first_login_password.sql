begin;
alter table public.cms_members add column if not exists must_change_password boolean not null default false;

-- All private content, storage and write RPC policies share this role check.
create or replace function cms_private.has_role(p_roles text[]) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.cms_members m where m.user_id=auth.uid() and m.active
   and not m.must_change_password and m.role=any(p_roles)
 );
$$;

-- Only a real Auth password update unlocks access. Metadata, client flags and
-- refreshing a token cannot clear the requirement. Existing accounts stay unchanged.
create or replace function cms_private.complete_initial_password() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if old.encrypted_password is distinct from new.encrypted_password
    and coalesce(new.encrypted_password,'')<>'' then
  update public.cms_members set must_change_password=false
   where user_id=new.id and must_change_password;
 end if;
 return new;
end;
$$;
revoke all on function cms_private.complete_initial_password() from public,anon,authenticated;
drop trigger if exists cms_initial_password_changed on auth.users;
create trigger cms_initial_password_changed after update of encrypted_password on auth.users
 for each row execute function cms_private.complete_initial_password();

create or replace function cms_private.register_created_member(p_user_id uuid,p_role text)
returns public.cms_members language plpgsql security definer set search_path='' as $$
declare actor uuid; member_email text; result public.cms_members;
begin
 perform pg_advisory_xact_lock(hashtextextended('cms-members',0));
 actor:=cms_private.require_role(array['owner']);
 if p_role is null or p_role not in ('admin','editor') then
  raise exception 'Geçersiz kullanıcı yetkisi.' using errcode='22023';
 end if;
 select email into member_email from auth.users where id=p_user_id and email_confirmed_at is not null;
 if member_email is null then raise exception 'Kullanıcı bulunamadı.' using errcode='P0002'; end if;
 -- Do not alter an existing member or reset their password requirement.
 insert into public.cms_members(user_id,email,role,active,must_change_password)
 values(p_user_id,member_email,p_role,true,true) returning * into result;
 insert into public.cms_audit(actor,action,target) values(actor,'member.create',p_user_id::text);
 return result;
end;
$$;
create or replace function public.cms_register_created_member(p_user_id uuid,p_role text)
returns public.cms_members language sql security invoker set search_path='' as $$
 select cms_private.register_created_member(p_user_id,p_role);
$$;
revoke all on function cms_private.register_created_member(uuid,text),public.cms_register_created_member(uuid,text) from public,anon;
grant execute on function cms_private.register_created_member(uuid,text),public.cms_register_created_member(uuid,text) to authenticated;
commit;
