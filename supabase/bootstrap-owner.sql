-- Run manually in the selected project's SQL editor only AFTER verifying the Auth user.
-- This template intentionally fails until an existing, confirmed Auth UUID is supplied.
-- Replace the empty value below. Never put a password, email shortcut, or service key here.
begin;
set local cms.bootstrap_owner_id = '';
do $$
declare v_user_id uuid; v_email text;
begin
  perform pg_advisory_xact_lock(hashtextextended('cms-members',0));
  if exists(select 1 from public.cms_members where role='owner') then
    raise exception 'Owner bootstrap has already been completed. Use the existing owner account.';
  end if;
  if nullif(current_setting('cms.bootstrap_owner_id',true),'') is null then
    raise exception 'Set cms.bootstrap_owner_id to a verified existing Auth user UUID first.';
  end if;
  v_user_id:=current_setting('cms.bootstrap_owner_id')::uuid;
  select email into v_email from auth.users where id=v_user_id and email_confirmed_at is not null;
  if v_email is null then raise exception 'Confirmed Auth user not found.'; end if;
  insert into public.cms_members(user_id,role,active,email) values(v_user_id,'owner',true,v_email);
  insert into public.cms_audit(actor,action,target) values(v_user_id,'owner.bootstrap',v_user_id::text);
end;
$$;
commit;
