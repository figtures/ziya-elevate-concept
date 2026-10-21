begin;
-- Home proof content has its own typed model, preserving positional CMS bindings.
create function cms_private.validate_home_proof(p_payload jsonb) returns void
language plpgsql immutable security invoker set search_path='' as $$
declare model jsonb; item jsonb; ids text[]; key text;
begin
  if (p_payload ? 'references' or p_payload ? 'testimonials') and p_payload->>'route' is distinct from '/' then
    raise exception 'Referanslar ve yorumlar yalnız ana sayfada düzenlenebilir.' using errcode='22023';
  end if;
  if p_payload ? 'references' then
    model:=p_payload->'references';
    if not cms_private.cms_object_keys(model,array['enabled','eyebrow','title','duration','logos'],array['enabled','eyebrow','title','duration','logos'])
      or jsonb_typeof(model->'enabled') is distinct from 'boolean'
      or not cms_private.cms_text(model->'eyebrow',0,160)
      or not cms_private.cms_text(model->'title',1,200)
      or jsonb_typeof(model->'duration') is distinct from 'number'
      or jsonb_typeof(model->'logos') is distinct from 'array' then
      raise exception 'Referans ayarları geçersiz.' using errcode='22023';
    end if;
    if (model->>'duration')::numeric not between 10 and 240 or jsonb_array_length(model->'logos')>100 then
      raise exception 'Referans sayısı veya kayma süresi geçersiz.' using errcode='22023';
    end if;
    ids:='{}';
    for item in select value from jsonb_array_elements(model->'logos') loop
      if not cms_private.cms_object_keys(item,array['id','name','src','width','height','url','enabled'],array['id','name','src','width','height','url','enabled'])
        or not cms_private.cms_text(item->'id',1,80) or coalesce(item->>'id','') !~ '^[a-zA-Z0-9_-]+$'
        or item->>'id'=any(ids) or not cms_private.cms_text(item->'name',1,160)
        or not cms_private.cms_text(item->'src',0,2048) or not cms_private.cms_text(item->'url',0,2048)
        or jsonb_typeof(item->'enabled') is distinct from 'boolean'
        or jsonb_typeof(item->'width') is distinct from 'number'
        or jsonb_typeof(item->'height') is distinct from 'number' then
        raise exception 'Referans logosu geçersiz.' using errcode='22023';
      end if;
      if ((item->>'enabled')::boolean and not cms_private.cms_url(item->'src',true))
        or (coalesce(item->>'src','')<>'' and not cms_private.cms_url(item->'src',true))
        or (coalesce(item->>'url','')<>'' and not cms_private.cms_url(item->'url'))
        or (item->>'width')::numeric<=0 or (item->>'width')::numeric>16000
        or (item->>'height')::numeric<=0 or (item->>'height')::numeric>16000 then
        raise exception 'Referans görseli, bağlantısı veya ölçüleri geçersiz.' using errcode='22023';
      end if;
      ids:=array_append(ids,item->>'id');
    end loop;
  end if;
  if p_payload ? 'testimonials' then
    model:=p_payload->'testimonials';
    if not cms_private.cms_object_keys(model,array['enabled','eyebrow','title','description','items'],array['enabled','items'])
      or jsonb_typeof(model->'enabled') is distinct from 'boolean'
      or jsonb_typeof(model->'items') is distinct from 'array' then
      raise exception 'Yorum ayarları geçersiz.' using errcode='22023';
    end if;
    if (model ? 'eyebrow' and not cms_private.cms_text(model->'eyebrow',0,100))
      or (model ? 'title' and not cms_private.cms_text(model->'title',0,200))
      or (model ? 'description' and not cms_private.cms_text(model->'description',0,600))
      or jsonb_array_length(model->'items')>50 then
      raise exception 'Yorum başlığı, açıklaması veya sayısı geçersiz.' using errcode='22023';
    end if;
    ids:='{}';
    for item in select value from jsonb_array_elements(model->'items') loop
      if not cms_private.cms_object_keys(item,array['id','name','role','company','avatar','quote','status','enabled','approvedAt'],array['id','status','enabled'])
        or not cms_private.cms_text(item->'id',1,100) or coalesce(item->>'id','') !~ '^[a-zA-Z0-9_-]+$'
        or item->>'id'=any(ids) or item->>'status' not in ('draft','approved')
        or jsonb_typeof(item->'status') is distinct from 'string'
        or jsonb_typeof(item->'enabled') is distinct from 'boolean' then
        raise exception 'Yorum kaydı veya onay durumu geçersiz.' using errcode='22023';
      end if;
      foreach key in array array['name','role','company','avatar','quote','approvedAt'] loop
        if item ? key and not cms_private.cms_text(item->key,0,case key when 'name' then 120 when 'role' then 160 when 'company' then 160 when 'avatar' then 2048 when 'quote' then 800 else 40 end) then
          raise exception 'Yorum alanı geçersiz veya çok uzun.' using errcode='22023';
        end if;
      end loop;
      if (item->>'status'='approved' and (not cms_private.cms_text(item->'name',1,120) or not cms_private.cms_text(item->'quote',1,800)))
        or (coalesce(item->>'avatar','')<>'' and not cms_private.cms_url(item->'avatar',true)) then
        raise exception 'Onaylı yorum metni, adı veya fotoğrafı geçersiz.' using errcode='22023';
      end if;
      ids:=array_append(ids,item->>'id');
    end loop;
  end if;
end;
$$;

create function cms_private.validate_home_proof_draft() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform cms_private.validate_home_proof(new.draft);
  return new;
end;
$$;
create trigger cms_validate_home_proof_draft before insert or update of draft on public.cms_documents
for each row execute function cms_private.validate_home_proof_draft();

-- cms_published is readable without signing in. Never copy draft proposals there.
-- Enforce at the table boundary so normal publishing, imports and restores agree.
create function cms_private.filter_public_testimonials() returns trigger
language plpgsql security definer set search_path='' as $$
declare approved jsonb;
begin
  perform cms_private.validate_home_proof(new.payload);
  if new.payload ? 'testimonials' then
    select coalesce(jsonb_agg(item order by position),'[]'::jsonb) into approved
    from jsonb_array_elements(new.payload->'testimonials'->'items') with ordinality as entry(item,position)
    where new.payload->'testimonials'->>'enabled'='true' and item->>'enabled'='true' and item->>'status'='approved';
    new.payload:=jsonb_set(new.payload,'{testimonials,items}',approved,false);
  end if;
  return new;
end;
$$;
create trigger cms_filter_public_testimonials before insert or update of payload on public.cms_published
for each row execute function cms_private.filter_public_testimonials();

revoke all on function cms_private.validate_home_proof(jsonb),cms_private.validate_home_proof_draft(),cms_private.filter_public_testimonials() from public,anon,authenticated;
-- Sanitize any existing publication while keeping private draft records intact.
update public.cms_published set payload=payload where payload ? 'testimonials';
commit;
