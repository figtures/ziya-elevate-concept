// Deterministic installer for the authored public seed; contains no owner or credentials.
export function seedSQL(seed){
 const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
 return ['begin;',...seed.map(d=>'insert into cms_private.cms_templates(template) values('+quote(d.template)+') on conflict do nothing;'),...seed.flatMap(d=>{const doc=quote(JSON.stringify(d));return [
  `insert into public.cms_documents(id,route,kind,draft,revision,published_revision) values(${quote(d.id)},${quote(d.route)},${quote(d.kind)},${doc}::jsonb,1,1) on conflict(id) do nothing;`,
  `insert into public.cms_published(id,route,kind,payload,revision) select id,route,kind,draft,revision from public.cms_documents where id=${quote(d.id)} on conflict(id) do nothing;`,
  `insert into public.cms_versions(document_id,payload,revision,action) select id,draft,revision,'seed' from public.cms_documents d where id=${quote(d.id)} and not exists(select 1 from public.cms_versions v where v.document_id=d.id);`
 ]}),'commit;'].join('\n');
}
export function installationSQL(seed,schema){
 return '-- Ziya CMS: schema plus original public content. Initial owner setup is separate.\n'+schema+'\n'+seedSQL(seed)+'\n';
}
