begin;
-- V13 explicitly approves four exact editorial labels. All other occurrences of
-- "merkez" remain prohibited, including nested values and JSON object keys.
-- No role grants, RLS policies, publishing/revision guards or other validation
-- rules are changed. This helper is private and only called by the existing
-- security-definer validator; it does not grant access to application data.
create or replace function cms_private.contains_disallowed_center_term(p_value jsonb) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare v text; entry record; child jsonb;
begin
  if jsonb_typeof(p_value)='string' then
    v:=p_value #>> '{}';
    if v !~* 'merkez' then return false; end if;
    return btrim(v,E' \t\n\r\f') not in (
      'Başarı Bilgi Merkezi','Satış Bilgi Merkezi','Liderlik Bilgi Merkezi','Kafa Yapısı Bilgi Merkezi',
      'Başarı Bilgi Merkezi · 8 başlık','Satış Bilgi Merkezi · 8 başlık',
      'Liderlik Bilgi Merkezi · 8 başlık','Kafa Yapısı Bilgi Merkezi · 8 başlık'
    );
  elsif jsonb_typeof(p_value)='object' then
    for entry in select key,value from jsonb_each(p_value) loop
      if cms_private.contains_disallowed_center_term(to_jsonb(entry.key))
        or cms_private.contains_disallowed_center_term(entry.value) then return true; end if;
    end loop;
  elsif jsonb_typeof(p_value)='array' then
    for child in select value from jsonb_array_elements(p_value) loop
      if cms_private.contains_disallowed_center_term(child) then return true; end if;
    end loop;
  end if;
  return false;
end;
$$;
revoke all on function cms_private.contains_disallowed_center_term(jsonb) from public,anon,authenticated,service_role;

-- Complete existing validator retained for an ordinary, reviewable migration.
create or replace function cms_private.validate_document(p_id text,p_payload jsonb) returns void
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
  if cms_private.contains_disallowed_center_term(p_payload) then
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
  perform cms_private.validate_advanced_controls(p_payload);
end;
$$;
commit;
