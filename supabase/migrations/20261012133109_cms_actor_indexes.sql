-- Cover the Auth foreign keys used during member/account maintenance.
begin;
create index cms_audit_actor_idx on public.cms_audit(actor);
create index cms_media_created_by_idx on public.cms_media(created_by);
create index cms_versions_actor_idx on public.cms_versions(actor);
commit;
