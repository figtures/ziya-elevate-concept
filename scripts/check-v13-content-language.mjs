import assert from 'node:assert/strict';
import { APPROVED_KNOWLEDGE_LABELS, containsDisallowedCenterTerm, CONTENT_LANGUAGE_ERROR } from '../cms/content-language.mjs';
import { validateDocument } from '../cms/render.mjs';
import { validateNavigation } from '../cms/navigation.mjs';
import { validateCollection } from '../cms/collections.mjs';
import { validateExperience } from '../cms/experience.mjs';

const definition = {fields:[], sections:[], groups:[]};
const page = label => ({kind:'page',route:'/basari/',title:'Başarı',values:{label},sections:[]});
const navigation = label => ({version:1, primary:[{id:'knowledge',label,href:'/basari/',hidden:false,newTab:false}], mobileSecondary:[],audience:[],social:[],footer:[]});
const collection = label => ({version:1,appendNew:false,excluded:[],categories:[{id:'success',source:'success',label,hidden:false,items:[]}]});
const accepted = APPROVED_KNOWLEDGE_LABELS.flatMap(label => [label,`${label} · 8 başlık`]);
const rejected = ['merkez','merkezi','Başarı merkezi','Başarı Merkezi','Liderlik Merkezi','Satış Merkezi','Yeni Bilgi Merkezi','Başarı Bilgi Merkezi Pro','Başarı Bilgi Merkezim','Başarı Bilgi Merkezi · 9 başlık','başarı bilgi merkezi','BAŞARI BİLGİ MERKEZİ','Başarı Bilgi Merkezi ve Liderlik Merkezi','Başarı Bilgi Merkezi.','Başarı  Bilgi Merkezi'];

for (const label of accepted) {
  assert.equal(containsDisallowedCenterTerm(label),false,label);
  assert.equal(containsDisallowedCenterTerm({sections:[{groups:[{items:[{values:{label}}]}]}]}),false,label);
  assert.deepEqual(validateDocument(page(label),definition),[],label);
  assert.deepEqual(validateNavigation(navigation(label)),[],label);
  assert.deepEqual(validateCollection(collection(label),'/makaleler/'),[],label);
  assert.deepEqual(validateExperience({talk:{title:label}}),[],label);
}
for (const label of rejected) {
  assert.equal(containsDisallowedCenterTerm(label),true,label);
  assert.equal(containsDisallowedCenterTerm({values:{good:accepted[0]},sections:[{groups:[{items:[{values:{bad:label}}]}]}]}),true,label);
  assert(validateDocument(page(label),definition).includes(CONTENT_LANGUAGE_ERROR),label);
  assert(validateNavigation(navigation(label)).length,label);
  assert(validateCollection(collection(label),'/makaleler/').length,label);
  assert(validateExperience({talk:{title:label}}).includes(CONTENT_LANGUAGE_ERROR),label);
}
assert.equal(containsDisallowedCenterTerm(null),false);
assert.equal(containsDisallowedCenterTerm({count:8,enabled:false}),false);
assert.equal(containsDisallowedCenterTerm({'merkez':'Güvenli görünen değer'}),true);
assert.equal(containsDisallowedCenterTerm(` ${accepted[0]} `),false);
console.log(`PASS: ${accepted.length} exact labels accepted and ${rejected.length} near-matches/fabricated labels rejected across document, navigation, collection and experience validators.`);

// Optional offline PostgreSQL check; no Supabase account is used.
if (process.env.CMS_PGLITE_MODULE) {
  const {readFile,readdir} = await import('node:fs/promises');
  const {PGlite} = await import(process.env.CMS_PGLITE_MODULE);
  const db = new PGlite();
  const migrationDirectory = new URL('../supabase/migrations/',import.meta.url);
  const name = (await readdir(migrationDirectory)).find(file => file.endsWith('_v13_approved_knowledge_labels.sql'));
  assert(name,'Incremental SQL migration exists');
  // Minimal dependencies for the unchanged production validator body.
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema cms_private;
    create table cms_private.cms_templates(template text primary key);
    insert into cms_private.cms_templates values('/sample/');
    create function cms_private.validate_advanced_controls(jsonb) returns void language sql as $$select$$;`);
  await db.exec(await readFile(new URL(name,migrationDirectory),'utf8'));
  for (const label of [...accepted,...rejected,` ${accepted[0]} `]) {
    const expected = containsDisallowedCenterTerm(label);
    const payload={...page(label),id:'sample',template:'/sample/',route:'/sample/'};
    const result=await db.query('select cms_private.contains_disallowed_center_term($1::jsonb) as rejected',[payload]);
    assert.equal(result.rows[0].rejected,expected,`SQL/JS parity: ${label}`);
    if (expected) await assert.rejects(db.query('select cms_private.validate_document($1,$2::jsonb)',['sample',payload]),error=>error.code==='22023');
    else await db.query('select cms_private.validate_document($1,$2::jsonb)',['sample',payload]);
  }
  for (const payload of [{deep:[{values:{label:'Başarı merkezi'}}]},{merkez:'safe'},{label:accepted[0],other:'merkez'}]) {
    assert.equal((await db.query('select cms_private.contains_disallowed_center_term($1::jsonb) as rejected',[payload])).rows[0].rejected,true);
  }
  for (const role of ['anon','authenticated','service_role']) {
    assert.equal((await db.query("select has_function_privilege($1,'cms_private.contains_disallowed_center_term(jsonb)','execute') as allowed",[role])).rows[0].allowed,false,`${role} cannot invoke the private helper`);
  }
  const valid={...page(accepted[0]),id:'sample',template:'/sample/',route:'/sample/'};
  for (const invalid of [{...valid,title:''},{...valid,route:'/admin/'},{...valid,template:'/unknown/'}]) {
    await assert.rejects(db.query('select cms_private.validate_document($1,$2::jsonb)',['sample',invalid]),error=>error.code==='22023');
  }
  await db.close();
  console.log('PASS: incremental PostgreSQL migration parses; exact-label and nested-payload behavior matches JavaScript; other validator errors still reject with 22023.');
}
