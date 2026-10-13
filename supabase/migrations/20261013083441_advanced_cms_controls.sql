begin;
-- Optional CMS models are validated at the same RPC boundary as all authored content.
-- No table grants, publishing privileges or revision guards are changed.
create function cms_private.cms_object_keys(p_value jsonb,p_allowed text[],p_required text[] default '{}') returns boolean
language sql immutable security invoker set search_path='' as $$
  select case when jsonb_typeof(p_value) is distinct from 'object' then false else
    not exists(select 1 from jsonb_object_keys(p_value) k where not (k=any(p_allowed)))
    and p_value ?& p_required end;
$$;
create function cms_private.cms_text(p_value jsonb,p_min int,p_max int) returns boolean
language sql immutable security invoker set search_path='' as $$
  select coalesce(jsonb_typeof(p_value)='string' and length(btrim(p_value #>> '{}'))>=p_min and length(p_value #>> '{}')<=p_max,false);
$$;
create function cms_private.cms_url(p_value jsonb,p_media boolean default false) returns boolean
language plpgsql immutable security invoker set search_path='' as $$
declare v text:=p_value #>> '{}';
begin
  if not cms_private.cms_text(p_value,1,2048) or v ~ '[[:space:][:cntrl:]<>"`]' or strpos(v,chr(92))>0
    or v ~* '%(00|09|0a|0d|5c)' then return false; end if;
  if left(v,1)='/' then return left(v,2)<>'//'; end if;
  if v ~* '^https://([a-z0-9]([a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])(:[0-9]{1,5})?([/?#]|$)' then return true; end if;
  if p_media then return false; end if;
  return v ~ '^#[a-zA-Z0-9_-]+$' or v ~* '^(mailto|tel):[^[:space:][:cntrl:]]+$';
end;
$$;
create function cms_private.cms_navigation_item(p_item jsonb,p_children boolean default false) returns text[]
language plpgsql immutable security invoker set search_path='' as $$
declare ids text[]; child jsonb;
begin
  if not cms_private.cms_object_keys(p_item,array['id','label','href','hidden','newTab','children'],array['id','label','href','hidden','newTab'])
    or jsonb_typeof(p_item->'id') is distinct from 'string' or coalesce(p_item->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
    or not cms_private.cms_text(p_item->'label',1,160) or not cms_private.cms_url(p_item->'href')
    or jsonb_typeof(p_item->'hidden') is distinct from 'boolean' or jsonb_typeof(p_item->'newTab') is distinct from 'boolean' then
    raise exception 'Geçersiz menü bağlantısı.' using errcode='22023';
  end if;
  ids:=array[p_item->>'id'];
  if p_item ? 'children' then
    if jsonb_typeof(p_item->'children') is distinct from 'array' then raise exception 'Alt menü bir liste olmalıdır.' using errcode='22023'; end if;
    if jsonb_array_length(p_item->'children')>(case when p_children then 20 else 0 end) then
      raise exception 'Alt menü derinliği veya bağlantı sayısı sınırı aşıldı.' using errcode='22023';
    end if;
    for child in select value from jsonb_array_elements(p_item->'children') loop
      ids:=ids || cms_private.cms_navigation_item(child,false);
    end loop;
  end if;
  return ids;
end;
$$;
create function cms_private.validate_advanced_controls(p_payload jsonb) returns void
language plpgsql immutable security invoker set search_path='' as $$
declare n jsonb; c jsonb; e jsonb; s jsonb; g jsonb; item jsonb; v jsonb; prop record; k text;
  ids text[]:='{}'; routes text[]:='{}'; excluded text[]:='{}'; route_pattern text; allowed text[]; limit_n int; total_n int:=0;
begin
  if p_payload ? 'robots' and (jsonb_typeof(p_payload->'robots') is distinct from 'string' or p_payload->>'robots' not in ('index','noindex')) then
    raise exception 'Arama motoru görünürlüğü geçersiz.' using errcode='22023';
  end if;
  -- Existing repeaters retain their current model; visibility is optional for old payloads.
  for s in select value from jsonb_array_elements(p_payload->'sections') loop
    for g in select value from jsonb_array_elements(s->'groups') loop
      for item in select value from jsonb_array_elements(g->'items') loop
        if item ? 'hidden' and jsonb_typeof(item->'hidden') is distinct from 'boolean' then
          raise exception 'Madde görünürlüğü doğru veya yanlış olmalıdır.' using errcode='22023';
        end if;
      end loop;
    end loop;
  end loop;
  if p_payload ? 'navigation' then
    n:=p_payload->'navigation';
    if p_payload->>'route'<>'/_global/' or p_payload->>'kind'<>'global'
      or not cms_private.cms_object_keys(n,array['version','primary','mobileSecondary','audience','social','footer'],array['version','primary','mobileSecondary','audience','social','footer'])
      or n->'version' is distinct from '1'::jsonb then
      raise exception 'Geçersiz genel menü tanımı.' using errcode='22023';
    end if;
    foreach k in array array['primary','mobileSecondary','audience','social','footer'] loop
      if jsonb_typeof(n->k) is distinct from 'array' then raise exception 'Menü alanları liste olmalıdır.' using errcode='22023'; end if;
      limit_n:=case k when 'primary' then 20 when 'footer' then 8 else 40 end;
      if jsonb_array_length(n->k)>limit_n then raise exception 'Menü bağlantı sınırı aşıldı.' using errcode='22023'; end if;
      for item in select value from jsonb_array_elements(n->k) loop
        if k='footer' then
          if not cms_private.cms_object_keys(item,array['id','title','placement','hidden','items'],array['id','title','placement','hidden','items'])
            or jsonb_typeof(item->'id') is distinct from 'string' or coalesce(item->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
            or not cms_private.cms_text(item->'title',1,160) or jsonb_typeof(item->'placement') is distinct from 'string' or item->>'placement' not in ('columns','programs')
            or jsonb_typeof(item->'hidden') is distinct from 'boolean' or jsonb_typeof(item->'items') is distinct from 'array' then
            raise exception 'Geçersiz alt bilgi grubu.' using errcode='22023';
          end if;
          if jsonb_array_length(item->'items')>40 then raise exception 'Alt bilgi bağlantı sınırı aşıldı.' using errcode='22023'; end if;
          ids:=array_append(ids,item->>'id');
          for g in select value from jsonb_array_elements(item->'items') loop ids:=ids || cms_private.cms_navigation_item(g,false); end loop;
        else ids:=ids || cms_private.cms_navigation_item(item,k='primary'); end if;
      end loop;
    end loop;
    if cardinality(ids)<>(select count(distinct id) from unnest(ids) id) then raise exception 'Menü kimlikleri benzersiz olmalıdır.' using errcode='22023'; end if;
  end if;
  if p_payload ? 'collection' then
    c:=p_payload->'collection';
    if p_payload->>'route' not in ('/makaleler/','/hayattan-notlar/')
      or not cms_private.cms_object_keys(c,array['version','appendNew','excluded','categories'],array['version','appendNew','excluded','categories'])
      or c->'version' is distinct from '1'::jsonb or jsonb_typeof(c->'appendNew') is distinct from 'boolean'
      or jsonb_typeof(c->'excluded') is distinct from 'array' or jsonb_typeof(c->'categories') is distinct from 'array' then
      raise exception 'Geçersiz yazı listesi tanımı.' using errcode='22023';
    end if;
    if jsonb_array_length(c->'categories') not between 1 and 20 or jsonb_array_length(c->'excluded')>500 then
      raise exception 'Yazı listesi kategori veya dışlama sınırı aşıldı.' using errcode='22023';
    end if;
    route_pattern:=case p_payload->>'route' when '/makaleler/' then '^/makaleler/[a-z0-9-]+/$' else '^/notlar/[a-z0-9-]+/$' end;
    ids:='{}';
    for v in select value from jsonb_array_elements(c->'excluded') loop
      if not cms_private.cms_text(v,1,200) or (v #>> '{}') !~ route_pattern then raise exception 'Geçersiz dışlanan yazı adresi.' using errcode='22023'; end if;
      excluded:=array_append(excluded,v #>> '{}');
    end loop;
    for g in select value from jsonb_array_elements(c->'categories') loop
      if not cms_private.cms_object_keys(g,array['id','source','label','hidden','items'],array['id','source','label','hidden','items'])
        or jsonb_typeof(g->'id') is distinct from 'string' or coalesce(g->>'id','') !~ '^[a-zA-Z0-9_-]{1,100}$'
        or jsonb_typeof(g->'source') is distinct from 'string' or coalesce(g->>'source','') !~ '^[a-zA-Z0-9_-]{1,100}$'
        or not cms_private.cms_text(g->'label',1,200) or jsonb_typeof(g->'hidden') is distinct from 'boolean'
        or jsonb_typeof(g->'items') is distinct from 'array' then raise exception 'Geçersiz yazı kategorisi.' using errcode='22023'; end if;
      ids:=array_append(ids,g->>'id');
      total_n:=total_n+jsonb_array_length(g->'items');
      if total_n>500 then raise exception 'Yazı listesi en fazla 500 kayıt içerebilir.' using errcode='22023'; end if;
      for item in select value from jsonb_array_elements(g->'items') loop
        if not cms_private.cms_object_keys(item,array['route','label','badge','hidden'],array['route','label','badge','hidden'])
          or not cms_private.cms_text(item->'route',1,200) or coalesce(item->>'route','') !~ route_pattern
          or not cms_private.cms_text(item->'label',1,300) or not cms_private.cms_text(item->'badge',0,100)
          or jsonb_typeof(item->'hidden') is distinct from 'boolean' then raise exception 'Geçersiz yazı listesi kaydı.' using errcode='22023'; end if;
        routes:=array_append(routes,item->>'route');
      end loop;
    end loop;
    if cardinality(ids)<>(select count(distinct id) from unnest(ids) id)
      or cardinality(routes)<>(select count(distinct route) from unnest(routes) route)
      or cardinality(excluded)<>(select count(distinct route) from unnest(excluded) route)
      or routes && excluded then raise exception 'Yazı listesi kimlikleri ve adresleri benzersiz olmalıdır.' using errcode='22023'; end if;
  end if;
  if p_payload ? 'experience' then
    e:=p_payload->'experience';
    if not cms_private.cms_object_keys(e,array['floating','playback','talk','contact','playlist','testUI']) then
      raise exception 'Geçersiz site etkileşim ayarları.' using errcode='22023';
    end if;
    for prop in select key,value from jsonb_each(e) loop
      if prop.key='playlist' then
        if jsonb_typeof(prop.value) is distinct from 'array' then raise exception 'Video akışı liste olmalıdır.' using errcode='22023'; end if;
        if jsonb_array_length(prop.value) not between 1 and 12 then raise exception 'Video akışı 1–12 kayıt içermelidir.' using errcode='22023'; end if;
        ids:='{}';
        for item in select value from jsonb_array_elements(prop.value) loop
          if not cms_private.cms_object_keys(item,array['id','src','poster','focal'],array['id','src','poster','focal'])
            or jsonb_typeof(item->'id') is distinct from 'string' or coalesce(item->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
            or not cms_private.cms_url(item->'src',true) or not cms_private.cms_url(item->'poster',true)
            or not cms_private.cms_text(item->'src',1,2000) or not cms_private.cms_text(item->'poster',1,2000)
            or not cms_private.cms_text(item->'focal',1,2000)
            or coalesce(item->>'focal','') !~ '^(center|left|right|top|bottom|[0-9]+([.][0-9]+)?%)([[:space:]]+(center|left|right|top|bottom|[0-9]+([.][0-9]+)?%))?$' then
            raise exception 'Geçersiz video akışı kaydı.' using errcode='22023';
          end if;
          ids:=array_append(ids,item->>'id');
        end loop;
        if cardinality(ids)<>(select count(distinct id) from unnest(ids) id) then raise exception 'Video kimlikleri benzersiz olmalıdır.' using errcode='22023'; end if;
      else
        allowed:=case prop.key
          when 'floating' then array['enabled','label','href']
          when 'playback' then array['playLabel','pauseLabel']
          when 'talk' then array['title','closeLabel','watchLabel','href']
          when 'contact' then array['phone','submitLabel','sendingLabel','successTitle','successText','errorTitle','errorText','retryLabel','againLabel','minMessageText','greeting','privacyText','whatsappLabel']
          when 'testUI' then array['previousLabel','scoreLabel','scoreDisclaimer','resultNote','strongLabel','weakLabel','strongSuffix','maintainLabel','maintainTip','stepsLabel','downloadLabel','downloadNote','retryLabel','actionLabel','actionHref','teamPrefix','teamLabel','teamHref','layerPrefix','questionPrefix','reportTitle','reportAuthor','reportScorePrefix','reportStrongPrefix','reportWeakPrefix','reportStepsLabel','reportDisclaimer'] end;
        if not cms_private.cms_object_keys(prop.value,allowed) then raise exception 'Geçersiz etkileşim alanı.' using errcode='22023'; end if;
        for k,v in select key,value from jsonb_each(prop.value) loop
          if k='enabled' then
            if jsonb_typeof(v) is distinct from 'boolean' then raise exception 'Etkileşim görünürlüğü geçersiz.' using errcode='22023'; end if;
          else
            if not cms_private.cms_text(v,0,2000) then raise exception 'Etkileşim metni geçersiz veya çok uzun.' using errcode='22023'; end if;
            if k in ('href','actionHref','teamHref') and not cms_private.cms_url(v) then raise exception 'Etkileşim bağlantısı geçersiz.' using errcode='22023'; end if;
            if k='phone' and (v #>> '{}') !~ '^[0-9]{7,15}$' then raise exception 'WhatsApp numarası geçersiz.' using errcode='22023'; end if;
          end if;
        end loop;
      end if;
    end loop;
  end if;
end;
$$;
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
  perform cms_private.validate_advanced_controls(p_payload);
end;
$$;

revoke all on function cms_private.cms_object_keys(jsonb,text[],text[]),
  cms_private.cms_text(jsonb,int,int),cms_private.cms_url(jsonb,boolean),
  cms_private.cms_navigation_item(jsonb,boolean),cms_private.validate_advanced_controls(jsonb)
  from public,anon,authenticated,service_role;
commit;
