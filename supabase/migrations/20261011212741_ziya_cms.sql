-- Supabase CMS: install in a dedicated project; seed templates/documents separately.
begin;
create schema if not exists cms_private;
revoke all on schema cms_private from public, anon, authenticated;
grant usage on schema cms_private to authenticated, service_role;

create table public.cms_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor')),
  active boolean not null default true,
  email text not null,
  created_at timestamptz not null default now()
);
create table cms_private.cms_templates (template text primary key);
create table public.cms_documents (
  id text primary key check (length(id) between 1 and 160),
  route text not null unique,
  kind text not null check (kind in ('page','article','note','global','test')),
  draft jsonb not null,
  revision integer not null default 1 check (revision > 0),
  published_revision integer,
  updated_at timestamptz not null default now(),
  archived boolean not null default false
);
create table public.cms_published (
  id text primary key references public.cms_documents(id),
  route text not null unique,
  kind text not null check (kind in ('page','article','note','global','test')),
  payload jsonb not null,
  revision integer not null,
  published_at timestamptz not null default now()
);
create table public.cms_versions (
  id uuid primary key default gen_random_uuid(),
  document_id text not null references public.cms_documents(id),
  payload jsonb not null,
  revision integer not null,
  action text not null check (action in ('seed','save','publish','unpublish','restore','archive','unarchive')),
  created_at timestamptz not null default now(),
  actor uuid references auth.users(id) on delete set null
);
create index cms_versions_document_created_idx on public.cms_versions(document_id, created_at desc);
create table public.cms_media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique check (path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif|gif|mp4|webm)$'),
  url text not null check (url ~ '^https://'),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm')),
  size bigint not null check (size > 0 and size <= 52428800),
  alt text not null default '' check (length(alt) <= 500),
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create table public.cms_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 2 and 120),
  email text not null check (length(email) between 3 and 254),
  company text not null default '' check (length(company) <= 200),
  team_size text not null default '' check (length(team_size) <= 80),
  topic text not null check (topic in ('konusmaci','kurumsal','bireysel','mentorluk','basin','soru')),
  message text not null check (length(message) between 10 and 10000),
  status text not null default 'new' check (status in ('new','in_progress','contacted','closed','spam')),
  notes text not null default '' check (length(notes) <= 20000),
  revision integer not null default 1,
  created_at timestamptz not null default now()
);
create index cms_leads_status_created_idx on public.cms_leads(status, created_at desc);
create table cms_private.cms_rate_windows (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key(key, window_start)
);
create index cms_rate_windows_expiry_idx on cms_private.cms_rate_windows(window_start);
create table public.cms_audit (
  id uuid primary key default gen_random_uuid(),
  actor uuid references auth.users(id) on delete set null,
  action text not null,
  target text not null,
  created_at timestamptz not null default now()
);
create index cms_audit_created_idx on public.cms_audit(created_at desc);

alter table public.cms_members enable row level security;
alter table public.cms_documents enable row level security;
alter table public.cms_published enable row level security;
alter table public.cms_versions enable row level security;
alter table public.cms_media enable row level security;
alter table public.cms_leads enable row level security;
alter table public.cms_audit enable row level security;
alter table cms_private.cms_templates enable row level security;
alter table cms_private.cms_rate_windows enable row level security;
revoke all on public.cms_members, public.cms_documents, public.cms_published,
  public.cms_versions, public.cms_media, public.cms_leads, public.cms_audit from anon, authenticated;
revoke all on all tables in schema cms_private from anon, authenticated;
grant select on public.cms_members, public.cms_documents, public.cms_versions,
  public.cms_media, public.cms_leads, public.cms_audit to authenticated;
grant select on public.cms_published to anon, authenticated;
grant insert (id,path,url,mime,size,alt,created_by) on public.cms_media to authenticated;
grant update (alt,archived) on public.cms_media to authenticated;

create function cms_private.has_role(p_roles text[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.cms_members m where m.user_id=auth.uid() and m.active and m.role=any(p_roles)
  );
$$;
create function cms_private.require_role(p_roles text[]) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if not cms_private.has_role(p_roles) then
    raise exception 'Bu işlem için yetkiniz yok.' using errcode='42501';
  end if;
  return auth.uid();
end;
$$;
create policy members_read on public.cms_members for select to authenticated
  using (user_id=(select auth.uid()) or (select cms_private.has_role(array['owner'])));
create policy documents_read on public.cms_documents for select to authenticated
  using ((select cms_private.has_role(array['owner','admin','editor'])));
create policy versions_read on public.cms_versions for select to authenticated
  using ((select cms_private.has_role(array['owner','admin','editor'])));
create policy published_read on public.cms_published for select to anon, authenticated using (true);
create policy media_read on public.cms_media for select to authenticated
  using ((select cms_private.has_role(array['owner','admin','editor'])));
create policy media_insert on public.cms_media for insert to authenticated
  with check (created_by=(select auth.uid()) and (select cms_private.has_role(array['owner','admin','editor']))
    and exists(select 1 from storage.objects o where o.bucket_id='cms-public' and o.name=path));
create policy media_update on public.cms_media for update to authenticated
  using ((select cms_private.has_role(array['owner','admin','editor'])))
  with check ((select cms_private.has_role(array['owner','admin','editor'])));
create policy leads_read on public.cms_leads for select to authenticated
  using ((select cms_private.has_role(array['owner','admin'])));
create policy audit_read on public.cms_audit for select to authenticated
  using ((select cms_private.has_role(array['owner','admin'])));

create function cms_private.validate_document(p_id text,p_payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare s jsonb; g jsonb; item jsonb; t jsonb; layer record; q jsonb; option_value jsonb;
  verdict jsonb; step jsonb; threshold numeric; previous_threshold numeric:=101;
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object'
    or octet_length(p_payload::text)>1048576
    or p_payload->>'id' is distinct from p_id
    or jsonb_typeof(p_payload->'id') is distinct from 'string'
    or jsonb_typeof(p_payload->'route') is distinct from 'string'
    or jsonb_typeof(p_payload->'template') is distinct from 'string'
    or jsonb_typeof(p_payload->'kind') is distinct from 'string'
    or jsonb_typeof(p_payload->'title') is distinct from 'string'
    or coalesce(p_payload->>'route','') !~ '^/([a-z0-9_-]+/)*$'
    or p_payload->>'route' like '/admin/%'
    or length(coalesce(p_payload->>'route',''))>240
    or jsonb_typeof(p_payload->'values') is distinct from 'object'
    or jsonb_typeof(p_payload->'sections') is distinct from 'array'
    or length(coalesce(p_payload->>'title','')) not between 1 and 300
    or length(coalesce(p_payload->>'description',''))>2000
    or p_payload->>'kind' not in ('page','article','note','global','test')
    or length(coalesce(p_payload->>'ogImage',''))>2048
    or not exists (select 1 from cms_private.cms_templates t where t.template=p_payload->>'template') then
    raise exception 'Geçersiz sayfa belgesi veya izin verilmeyen şablon.' using errcode='22023';
  end if;
  if p_payload::text ~* 'merkez' then
    raise exception 'İçerikte izin verilmeyen ifade bulunuyor.' using errcode='22023';
  end if;
  if jsonb_array_length(p_payload->'sections')>40 then
    raise exception 'Bir sayfada en fazla 40 bölüm olabilir.' using errcode='22023';
  end if;
  for s in select value from jsonb_array_elements(p_payload->'sections') loop
    if jsonb_typeof(s) is distinct from 'object'
      or jsonb_typeof(s->'id') is distinct from 'string' or coalesce(s->>'id','') !~ '[^[:space:]]'
      or jsonb_typeof(s->'source') is distinct from 'string' or coalesce(s->>'source','') !~ '[^[:space:]]'
      or jsonb_typeof(s->'hidden') is distinct from 'boolean'
      or jsonb_typeof(s->'values') is distinct from 'object'
      or jsonb_typeof(s->'groups') is distinct from 'array' then
      raise exception 'Geçersiz bölüm tanımı.' using errcode='22023';
    end if;
    for g in select value from jsonb_array_elements(s->'groups') loop
      if jsonb_typeof(g) is distinct from 'object'
        or jsonb_typeof(g->'id') is distinct from 'string' or coalesce(g->>'id','') !~ '[^[:space:]]'
        or jsonb_typeof(g->'items') is distinct from 'array' then
        raise exception 'Geçersiz madde grubu.' using errcode='22023';
      end if;
      if jsonb_array_length(g->'items')>100 then
        raise exception 'Bir grupta en fazla 100 madde olabilir.' using errcode='22023';
      end if;
      for item in select value from jsonb_array_elements(g->'items') loop
        if jsonb_typeof(item) is distinct from 'object'
          or jsonb_typeof(item->'id') is distinct from 'string' or coalesce(item->>'id','') !~ '[^[:space:]]'
          or jsonb_typeof(item->'source') is distinct from 'string' or coalesce(item->>'source','') !~ '[^[:space:]]'
          or jsonb_typeof(item->'values') is distinct from 'object' then
          raise exception 'Geçersiz madde tanımı.' using errcode='22023';
        end if;
      end loop;
    end loop;
  end loop;
  if p_payload ? 'test' and jsonb_typeof(p_payload->'test') not in ('object','null') then
    raise exception 'Geçersiz test tanımı.' using errcode='22023';
  end if;
  if p_payload->>'kind'='test' then
    t:=p_payload->'test';
    if jsonb_typeof(t) is distinct from 'object'
      or jsonb_typeof(t->'layers') is distinct from 'object'
      or jsonb_typeof(t->'questions') is distinct from 'array'
      or jsonb_typeof(t->'verdicts') is distinct from 'array' then
      raise exception 'Test katmanları, soruları ve sonuçları zorunludur.' using errcode='22023';
    end if;
    if (select count(*) from jsonb_object_keys(t->'layers'))<>5
      or jsonb_array_length(t->'questions')<>20
      or jsonb_array_length(t->'verdicts') not between 1 and 101 then
      raise exception 'Test 5 katman ve 20 soru içermelidir.' using errcode='22023';
    end if;
    for layer in select key,value from jsonb_each(t->'layers') loop
      if layer.key !~ '[^[:space:]]' or jsonb_typeof(layer.value) is distinct from 'object'
        or jsonb_typeof(layer.value->'name') is distinct from 'string' or coalesce(layer.value->>'name','') !~ '[^[:space:]]'
        or jsonb_typeof(layer.value->'tip') is distinct from 'string' or coalesce(layer.value->>'tip','') !~ '[^[:space:]]'
        or jsonb_typeof(layer.value->'steps') is distinct from 'array' then
        raise exception 'Katman adı, önerisi ve adımları geçersiz.' using errcode='22023';
      end if;
      for step in select value from jsonb_array_elements(layer.value->'steps') loop
        if jsonb_typeof(step) is distinct from 'array' then raise exception 'Geçersiz katman adımı.' using errcode='22023'; end if;
        if jsonb_array_length(step)<>2 or jsonb_typeof(step->0) is distinct from 'string'
          or jsonb_typeof(step->1) is distinct from 'string' or coalesce(step->>0,'') !~ '[^[:space:]]'
          or coalesce(step->>1,'') !~ '[^[:space:]]' then raise exception 'Geçersiz katman adımı.' using errcode='22023'; end if;
      end loop;
      if (select count(*) from jsonb_array_elements(t->'questions') as question where question->>'l'=layer.key)<>4 then
        raise exception 'Her katmanda tam 4 soru bulunmalıdır.' using errcode='22023';
      end if;
    end loop;
    for q in select value from jsonb_array_elements(t->'questions') loop
      if jsonb_typeof(q) is distinct from 'object'
        or jsonb_typeof(q->'l') is distinct from 'string' or not (t->'layers' ? (q->>'l'))
        or jsonb_typeof(q->'q') is distinct from 'string' or coalesce(q->>'q','') !~ '[^[:space:]]'
        or jsonb_typeof(q->'o') is distinct from 'array' then
        raise exception 'Geçersiz test sorusu.' using errcode='22023';
      end if;
      if jsonb_array_length(q->'o')<>4 then raise exception 'Her soruda 4 yanıt olmalıdır.' using errcode='22023'; end if;
      for option_value in select value from jsonb_array_elements(q->'o') loop
        if jsonb_typeof(option_value) is distinct from 'array' then raise exception 'Geçersiz yanıt.' using errcode='22023'; end if;
        if jsonb_array_length(option_value)<>2 or jsonb_typeof(option_value->0) is distinct from 'string'
          or coalesce(option_value->>0,'') !~ '[^[:space:]]' or jsonb_typeof(option_value->1) is distinct from 'number' then
          raise exception 'Yanıt metni ve puanı zorunludur.' using errcode='22023';
        end if;
        if (option_value->>1)::numeric not in (1,2,3,4) then
          raise exception 'Yanıt puanı 1–4 arası tam sayı olmalıdır.' using errcode='22023';
        end if;
      end loop;
    end loop;
    for verdict in select value from jsonb_array_elements(t->'verdicts') loop
      if jsonb_typeof(verdict) is distinct from 'object'
        or jsonb_typeof(verdict->'min') is distinct from 'number'
        or jsonb_typeof(verdict->'v') is distinct from 'string' or coalesce(verdict->>'v','') !~ '[^[:space:]]'
        or jsonb_typeof(verdict->'vt') is distinct from 'string' or coalesce(verdict->>'vt','') !~ '[^[:space:]]' then
        raise exception 'Geçersiz sonuç tanımı.' using errcode='22023';
      end if;
      threshold:=(verdict->>'min')::numeric;
      if threshold<>trunc(threshold) or threshold<0 or threshold>100 or threshold>=previous_threshold then
        raise exception 'Sonuç eşikleri 0–100 arası azalan tam sayılar olmalıdır.' using errcode='22023';
      end if;
      previous_threshold:=threshold;
    end loop;
    if previous_threshold<>0 then raise exception 'Son sonuç eşiği 0 olmalıdır.' using errcode='22023'; end if;
  end if;
end;
$$;

create function cms_private.save_document(p_id text,p_expected int,p_payload jsonb)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin','editor']);
  perform cms_private.validate_document(p_id,p_payload);
  -- Serialize create/update for the same logical id, including absent rows.
  perform pg_advisory_xact_lock(hashtextextended('cms-document:'||p_id,0));
  select * into v from public.cms_documents where id=p_id for update;
  if not found then
    if p_expected is distinct from 0 then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
    insert into public.cms_documents(id,route,kind,draft)
      values(p_id,p_payload->>'route',p_payload->>'kind',p_payload) returning * into v;
  else
    if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
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

create function cms_private.publish_document(p_id text,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
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
create function cms_private.remove_publication(p_id text,p_expected int,p_archive boolean)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid; action_name text;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
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
create function cms_private.restore_document(p_id text,p_version uuid,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; old_payload jsonb; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin','editor']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
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

create function cms_private.unarchive_document(p_id text,p_expected int)
returns public.cms_documents language plpgsql security definer set search_path = '' as $$
declare v public.cms_documents; a uuid;
begin
  a:=cms_private.require_role(array['owner','admin']);
  select * into v from public.cms_documents where id=p_id for update;
  if not found then raise exception 'Sayfa bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  if not v.archived then return v; end if;
  delete from public.cms_published where id=p_id;
  update public.cms_documents set archived=false,published_revision=null,revision=revision+1,updated_at=now()
    where id=p_id returning * into v;
  insert into public.cms_versions(document_id,payload,revision,action,actor) values(v.id,v.draft,v.revision,'unarchive',a);
  insert into public.cms_audit(actor,action,target) values(a,'document.unarchive',p_id);
  return v;
end;
$$;

create function cms_private.set_member(p_user_id uuid,p_role text,p_active boolean)
returns public.cms_members language plpgsql security definer set search_path = '' as $$
declare a uuid; v public.cms_members; member_email text;
begin
  perform pg_advisory_xact_lock(hashtextextended('cms-members',0));
  a:=cms_private.require_role(array['owner']);
  if p_role is null or p_role not in ('owner','admin','editor') or p_active is null then
    raise exception 'Geçersiz rol.' using errcode='22023';
  end if;
  select email into member_email from auth.users where id=p_user_id;
  if member_email is null then raise exception 'Kullanıcı bulunamadı.' using errcode='P0002'; end if;
  select * into v from public.cms_members where user_id=p_user_id for update;
  if found and v.role='owner' and v.active and (p_role<>'owner' or not p_active)
    and (select count(*) from public.cms_members where role='owner' and active)<=1 then
    raise exception 'Son aktif hesap sahibi kaldırılamaz.' using errcode='22023';
  end if;
  insert into public.cms_members(user_id,role,active,email) values(p_user_id,p_role,p_active,member_email)
    on conflict(user_id) do update set role=excluded.role,active=excluded.active,email=excluded.email returning * into v;
  insert into public.cms_audit(actor,action,target) values(a,'member.update',p_user_id::text);
  return v;
end;
$$;
create function cms_private.update_lead(p_id uuid,p_expected int,p_status text,p_notes text)
returns public.cms_leads language plpgsql security definer set search_path = '' as $$
declare a uuid; v public.cms_leads;
begin
  a:=cms_private.require_role(array['owner','admin']);
  if p_status is null or p_status not in ('new','in_progress','contacted','closed','spam')
    or p_notes is null or length(p_notes)>20000 then raise exception 'Geçersiz başvuru güncellemesi.' using errcode='22023'; end if;
  select * into v from public.cms_leads where id=p_id for update;
  if not found then raise exception 'Başvuru bulunamadı.' using errcode='P0002'; end if;
  if p_expected is distinct from v.revision then raise exception 'REVISION_CONFLICT' using errcode='40001'; end if;
  update public.cms_leads set status=p_status,notes=p_notes,revision=revision+1 where id=p_id returning * into v;
  insert into public.cms_audit(actor,action,target) values(a,'lead.update',p_id::text);
  return v;
end;
$$;

create function public.cms_save_document(p_id text,p_expected int,p_payload jsonb) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.save_document(p_id,p_expected,p_payload);$$;
create function public.cms_publish_document(p_id text,p_expected int) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.publish_document(p_id,p_expected);$$;
create function public.cms_unpublish_document(p_id text,p_expected int) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.remove_publication(p_id,p_expected,false);$$;
create function public.cms_archive_document(p_id text,p_expected int) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.remove_publication(p_id,p_expected,true);$$;
create function public.cms_unarchive_document(p_id text,p_expected int) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.unarchive_document(p_id,p_expected);$$;
create function public.cms_restore_document(p_id text,p_version uuid,p_expected int) returns public.cms_documents
language sql security invoker set search_path='' as $$select cms_private.restore_document(p_id,p_version,p_expected);$$;
create function public.cms_set_member(p_user_id uuid,p_role text,p_active boolean) returns public.cms_members
language sql security invoker set search_path='' as $$select cms_private.set_member(p_user_id,p_role,p_active);$$;
create function public.cms_update_lead(p_id uuid,p_expected int,p_status text,p_notes text) returns public.cms_leads
language sql security invoker set search_path='' as $$select cms_private.update_lead(p_id,p_expected,p_status,p_notes);$$;

-- Public form submissions go through an Edge Function only, never a public insert policy.
create function cms_private.submit_lead(p_ip_hash text,p_email_hash text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare ip_hits integer; email_hits integer; v_id uuid; start_at timestamptz;
begin
  if coalesce(current_setting('request.jwt.claims',true),'{}')::jsonb->>'role' is distinct from 'service_role' then
    raise exception 'Server credentials required.' using errcode='42501';
  end if;
  if p_ip_hash !~ '^[0-9a-f]{64}$' or p_email_hash !~ '^[0-9a-f]{64}$'
    or p_ip_hash is null or p_email_hash is null then raise exception 'Invalid rate key.' using errcode='22023'; end if;
  start_at:=date_trunc('hour',now());
  insert into cms_private.cms_rate_windows(key,window_start) values('ip:'||p_ip_hash,start_at)
    on conflict(key,window_start) do update set hits=cms_private.cms_rate_windows.hits+1 returning hits into ip_hits;
  insert into cms_private.cms_rate_windows(key,window_start) values('email:'||p_email_hash,start_at)
    on conflict(key,window_start) do update set hits=cms_private.cms_rate_windows.hits+1 returning hits into email_hits;
  if ip_hits>10 or email_hits>3 then raise exception 'RATE_LIMITED' using errcode='P0001'; end if;
  delete from cms_private.cms_rate_windows where window_start<now()-interval '48 hours';
  insert into public.cms_leads(name,email,company,team_size,topic,message)
    values(p_payload->>'name',p_payload->>'email',coalesce(p_payload->>'company',''),
      coalesce(p_payload->>'team_size',''),p_payload->>'topic',p_payload->>'message') returning id into v_id;
  return v_id;
end;
$$;
create function public.cms_submit_lead(p_ip_hash text,p_email_hash text,p_payload jsonb) returns uuid
language sql security invoker set search_path='' as $$select cms_private.submit_lead(p_ip_hash,p_email_hash,p_payload);$$;

-- Never rely on default function grants. Scope revocations to CMS-owned functions.
revoke all on all functions in schema cms_private from public,anon,authenticated;
grant execute on function cms_private.has_role(text[]) to authenticated;
grant execute on function cms_private.save_document(text,int,jsonb), cms_private.publish_document(text,int),
  cms_private.remove_publication(text,int,boolean),cms_private.restore_document(text,uuid,int),cms_private.unarchive_document(text,int),
  cms_private.set_member(uuid,text,boolean),cms_private.update_lead(uuid,int,text,text) to authenticated;
revoke all on function public.cms_save_document(text,int,jsonb),public.cms_publish_document(text,int),
  public.cms_unpublish_document(text,int),public.cms_archive_document(text,int),public.cms_unarchive_document(text,int),public.cms_restore_document(text,uuid,int),
  public.cms_set_member(uuid,text,boolean),public.cms_update_lead(uuid,int,text,text),
  public.cms_submit_lead(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.cms_save_document(text,int,jsonb),public.cms_publish_document(text,int),
  public.cms_unpublish_document(text,int),public.cms_archive_document(text,int),public.cms_unarchive_document(text,int),public.cms_restore_document(text,uuid,int),
  public.cms_set_member(uuid,text,boolean),public.cms_update_lead(uuid,int,text,text) to authenticated;
grant execute on function public.cms_submit_lead(text,text,jsonb),cms_private.submit_lead(text,text,jsonb) to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('cms-public','cms-public',true,52428800,array['image/jpeg','image/png','image/webp','image/avif','image/gif','video/mp4','video/webm'])
on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy cms_storage_read on storage.objects for select to authenticated
using (bucket_id='cms-public' and (select cms_private.has_role(array['owner','admin','editor'])));
create policy cms_storage_insert on storage.objects for insert to authenticated
with check (bucket_id='cms-public' and (select cms_private.has_role(array['owner','admin','editor']))
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|avif|gif|mp4|webm)$');
-- Intentionally no UPDATE/DELETE storage policies: paths are immutable, archive metadata instead.
commit;
