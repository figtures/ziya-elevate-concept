-- Register the explicitly requested V13 press template. This changes no
-- document, publication, permission, role or policy, and is safe to rerun.
begin;
insert into cms_private.cms_templates(template) values('/basin/') on conflict do nothing;
commit;
