begin;
-- Optional clip timing extends the existing playlist model without changing saved
-- entries, table grants, helper privileges, RLS, or the draft/publish boundary.
-- CREATE OR REPLACE keeps the private function's existing owner and ACL intact.
create or replace function cms_private.validate_advanced_controls(p_payload jsonb) returns void
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
          if not cms_private.cms_object_keys(item,array['id','src','poster','focal','start','end'],array['id','src','poster','focal'])
            or jsonb_typeof(item->'id') is distinct from 'string' or coalesce(item->>'id','') !~ '^[a-zA-Z0-9_-]{1,80}$'
            or not cms_private.cms_url(item->'src',true) or not cms_private.cms_url(item->'poster',true)
            or not cms_private.cms_text(item->'src',1,2000) or not cms_private.cms_text(item->'poster',1,2000)
            or not cms_private.cms_text(item->'focal',1,2000)
            or coalesce(item->>'focal','') !~ '^(center|left|right|top|bottom|[0-9]+([.][0-9]+)?%)([[:space:]]+(center|left|right|top|bottom|[0-9]+([.][0-9]+)?%))?$' then
            raise exception 'Geçersiz video akışı kaydı.' using errcode='22023';
          end if;
          -- Missing start preserves full-video playback; missing end means the file's end.
          -- Validate the JSON type before casting: null, strings, arrays and booleans
          -- must never coerce into timing values. PostgreSQL JSON numbers are finite.
          if item ? 'start' then
            if jsonb_typeof(item->'start') is distinct from 'number' then
              raise exception 'Video başlangıcı saniye olarak bir sayı olmalıdır.' using errcode='22023';
            end if;
            if (item->>'start')::numeric < 0 or (item->>'start')::numeric > 36000 then
              raise exception 'Video başlangıcı 0–36000 saniye arasında olmalıdır.' using errcode='22023';
            end if;
          end if;
          if item ? 'end' then
            if jsonb_typeof(item->'end') is distinct from 'number' then
              raise exception 'Video bitişi saniye olarak bir sayı olmalıdır.' using errcode='22023';
            end if;
            if (item->>'end')::numeric < 0 or (item->>'end')::numeric > 36000
              or (item->>'end')::numeric <= coalesce((item->>'start')::numeric,0) then
              raise exception 'Video bitişi başlangıçtan sonra ve en fazla 36000 saniye olmalıdır.' using errcode='22023';
            end if;
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
commit;
