-- Application revision conflicts are not retryable serialization failures.
-- PT409 maps to HTTP 409 without PostgREST 14 transaction retry loops.
-- Preserve signatures, grants, role checks and optimistic revision guards.
begin;

create or replace function cms_private.save_document(p_id text,p_expected int,p_payload jsonb)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin','editor']);
  perform cms_private.validate_document(p_id,p_payload);
  -- Serialize create/update for the same logical id, including absent rows.
  perform pg_advisory_xact_lock(hashtextextended('cms-document:'||p_id,0));
  select * into v from public.cms_documents where id=p_id for update;
  if not found then
    if p_expected is distinct from 0 then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
    insert into public.cms_documents(id,route,kind,draft)
      values(p_id,p_payload->>'route',p_payload->>'kind',p_payload) returning * into v;
  else
    if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
    if v.archived then raise exception 'Arşivlenmiş sayfa düzenlenemez.' using errcode='22023'; end if;
    -- Existing document identity remains stable whether or not it is published.
    if v.route is distinct from p_payload->>'route' or v.kind is distinct from p_payload->>'kind' then
      raise exception 'Sayfanın adresi ve türü değiştirilemez.' using errcode='22023';
    end if;
    update public.cms_documents set draft=p_payload,route=p_payload->>'route',kind=p_payload->>'kind',
      revision=revision+1,updated_at=now() where id=p_id returning * into v;
  end if;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,'save',a);
  insert into public.cms_audit(actor,action,target) values(a,'document.save',p_id);
  return v;
end;
$$;

create or replace function cms_private.publish_document(p_id text,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
  if v.archived then raise exception 'Arşivlenmiş sayfa yayımlanamaz.' using errcode='22023'; end if;
  perform cms_private.validate_document(v.id,v.draft);
  insert into public.cms_published(id,route,kind,payload,revision,published_at)
    values(v.id,v.route,v.kind,v.draft,v.revision,now())
    on conflict(id) do update set route=excluded.route,kind=excluded.kind,payload=excluded.payload,
      revision=excluded.revision,published_at=excluded.published_at;
  update public.cms_documents set published_revision=revision,updated_at=now() where id=p_id returning * into v;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,'publish',a);
  insert into public.cms_audit(actor,action,target) values(a,'document.publish',p_id);
  return v;
end;
$$;

create or replace function cms_private.remove_publication(p_id text,p_expected int,p_archive boolean)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid; action_name text;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
  if v.route in ('/','/_global/','/testler/kafa-yapisi-testi/') or v.kind in ('global','test') then
    raise exception 'Ana sayfa, genel ayarlar ve aktif test yayından kaldırılamaz.' using errcode='22023';
  end if;
  delete from public.cms_published where id=p_id;
  update public.cms_documents set published_revision=null,archived=p_archive,
    revision=revision+1,updated_at=now() where id=p_id returning * into v;
  action_name:=case when p_archive then 'archive' else 'unpublish' end;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,action_name,a);
  insert into public.cms_audit(actor,action,target) values(a,'document.'||action_name,p_id);
  return v;
end;
$$;

create or replace function cms_private.restore_document(p_id text,p_version uuid,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; old_payload jsonb; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin','editor']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
  if v.archived then raise exception 'Önce bir yönetici sayfayı arşivden çıkarmalıdır.' using errcode='22023'; end if;
  select payload into old_payload from public.cms_versions where id=p_version and document_id=p_id;
  if not found then raise exception 'Sürüm bulunamadı.' using errcode='P0002'; end if;
  -- Keep the current route, id and kind when restoring content to avoid broken public paths.
  old_payload:=old_payload||jsonb_build_object('id',v.id,'route',v.route,'kind',v.kind);
  perform cms_private.validate_document(p_id,old_payload);
  update public.cms_documents set draft=old_payload,revision=revision+1,archived=false,updated_at=now()
    where id=p_id returning * into v;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,'restore',a);
  insert into public.cms_audit(actor,action,target) values(a,'document.restore',p_id);
  return v;
end;
$$;

create or replace function cms_private.unarchive_document(p_id text,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
  if not v.archived then return v; end if;
  delete from public.cms_published where id=p_id;
  update public.cms_documents set archived=false,published_revision=null,revision=revision+1,updated_at=now()
    where id=p_id returning * into v;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,'unarchive',a);
  insert into public.cms_audit(actor,action,target) values(a,'document.unarchive',p_id);
  return v;
end;
$$;

create or replace function cms_private.update_lead(p_id uuid,p_expected int,p_status text,p_notes text)
returns public.cms_leads language plpgsql security definer set search_path = '' as $$
declare a uuid; v public.cms_leads;
begin
  a:=cms_private.require_role(array['owner','admin']);
  if p_status is null or p_status not in ('new','in_progress','contacted','closed','spam')
    or p_notes is null or length(p_notes)>20000 then raise exception 'Geçersiz başvuru güncellemesi.' using errcode='22023'; end if;
  select * into v from public.cms_leads where id=p_id for update;
  if not found then raise exception 'Başvuru bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='PT409'; end if;
  update public.cms_leads set status=p_status,notes=p_notes,revision=revision+1 where id=p_id returning * into v;
  insert into public.cms_audit(actor,action,target) values(a,'lead.update',p_id::text);
  return v;
end;
$$;

commit;
