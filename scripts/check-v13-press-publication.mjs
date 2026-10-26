/** V13 press bootstrap and lifecycle: local fixtures, no live Supabase access. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import {parseHTML,DOMParser} from 'linkedom';
import * as dependencies from './admin-test-dependencies.mjs';
import {withInitialPageDrafts} from '../cms/admin-initial-pages.mjs';

const json=name=>JSON.parse(fs.readFileSync(new URL('../cms/'+name+'.json',import.meta.url),'utf8'));
const seed=json('seed'),catalog=json('catalog'),templates=json('templates'),press=seed.find(row=>row.route==='/basin/');
assert(press,'V13 press seed is present');
let passed=0;const check=async(label,fn)=>{await fn();passed++;console.log('PASS '+label);};
await check('only missing press page is offered as an unsaved private admin draft',()=>{
 const rows=withInitialPageDrafts([],seed);assert.equal(rows.length,1);assert.equal(rows[0].route,'/basin/');assert.equal(rows[0].revision,0);assert.equal(rows[0].published_revision,null);assert.equal(rows[0].archived,false);assert.notEqual(rows[0].draft,press);rows[0].draft.title='Private edit';assert.notEqual(press.title,'Private edit');assert.deepEqual(withInitialPageDrafts([],seed.filter(row=>row.route!=='/basin/')),[]);
});
await check('existing draft, archive, publication or moved ID always prevents seed replacement',()=>{
 for(const patch of [{published_revision:null},{archived:true,published_revision:null},{published_revision:3},{id:'different-id',route:'/basin/'},{id:press.id,route:'/renamed-press/'}]){const existing=[{id:press.id,route:press.route,revision:3,archived:false,draft:{title:'Existing editorial draft'},...patch}];assert.equal(withInitialPageDrafts(existing,seed),existing);assert.equal(existing.length,1);assert.equal(existing[0].draft.title,'Existing editorial draft');}
});

function mountAdmin(initial=[]){
 const {document,window}=parseHTML('<!doctype html><html><head></head><body><div id="app"></div><div id="toasts"></div></body></html>');
 const tables={cms_documents:structuredClone(initial),cms_published:[]},calls=[];
 const client={from(table){const query={select(){return query;},order(){return query;},async range(from,to){calls.push({kind:'read',table});return {data:structuredClone(tables[table].slice(from,to+1)),error:null};}};return query;},async rpc(name,args){calls.push({kind:'rpc',name,args:structuredClone(args)});let row=tables.cms_documents.find(row=>row.id===args.p_id);
  if(name==='cms_save_document'){assert.equal(args.p_expected,row?.revision||0);if(row){row.draft=structuredClone(args.p_payload);row.revision++;}else{row={id:args.p_id,route:args.p_payload.route,kind:args.p_payload.kind,draft:structuredClone(args.p_payload),revision:1,published_revision:null,archived:false};tables.cms_documents.push(row);}}
  if(name==='cms_publish_document'){assert(row&&!row.archived);assert.equal(args.p_expected,row.revision);row.published_revision=row.revision;tables.cms_published=[{id:row.id,route:row.route,payload:structuredClone(row.draft)}];}
  if(['cms_unpublish_document','cms_archive_document'].includes(name)){assert(row);row.published_revision=null;if(name==='cms_archive_document')row.archived=true;tables.cms_published=tables.cms_published.filter(item=>item.id!==row.id);}
  return {data:[structuredClone(row)],error:null};}};
 const source=fs.readFileSync('cms/admin.mjs','utf8').replace(/^import .*;\n/gm,'').replace(/\nboot\(\);\s*$/,'\nglobalThis.api={S,refreshRows,save,action,openEditor,setClient:value=>client=value};');
 const context={...dependencies,document,window,DOMParser,URL,URLSearchParams,structuredClone,crypto:webcrypto,iconNodes:json('icon-nodes'),location:{origin:'https://example.org',hash:''},navigator:{},console,setTimeout:()=>0,clearTimeout(){},confirm:()=>true,requestAnimationFrame:fn=>fn(),cancelAnimationFrame(){},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),fetch:async input=>({ok:true,text:async()=>templates[new URL(String(input),'https://example.org').searchParams.get('id')]})};
 vm.createContext(context);vm.runInContext(source,context,{filename:'cms/admin.mjs'});const api=context.api;api.setClient(client);Object.assign(api.S,{offline:false,member:{role:'owner',active:true},seed:structuredClone(seed),catalog:structuredClone(catalog),originalMedia:[],media:[]});
 return {api,tables,calls,document};
}
await check('actual admin refresh performs no writes; save creates revision zero through the normal RPC',async()=>{
 const {api,tables,calls}=mountAdmin();await api.refreshRows();assert.equal(tables.cms_documents.length,0);assert.equal(calls.filter(call=>call.kind==='rpc').length,0);assert.equal(api.S.rows.length,1);api.S.row=api.S.rows[0];api.S.doc=structuredClone(api.S.row.draft);await api.save();const save=calls.find(call=>call.name==='cms_save_document');assert(save);assert.equal(save.args.p_expected,0);assert.equal(save.args.p_id,press.id);assert.equal(api.S.row.revision,1);assert.equal(tables.cms_published.length,0);assert.equal(tables.cms_documents.length,1);
});
await check('normal admin publish, unpublish and archive never reactivate the press page on refresh',async()=>{
 const {api,tables,calls}=mountAdmin();await api.refreshRows();api.S.row=api.S.rows[0];api.S.doc=structuredClone(api.S.row.draft);await api.action('publish');assert(calls.some(call=>call.name==='cms_save_document'&&call.args.p_expected===0));assert(calls.some(call=>call.name==='cms_publish_document'));assert.equal(tables.cms_published.length,1);await api.action('unpublish');assert.equal(tables.cms_published.length,0);await api.refreshRows();assert.equal(api.S.rows.length,1);assert.equal(api.S.rows[0].revision,1);assert.equal(api.S.rows[0].published_revision,null);api.openEditor(press.id);await api.action('archive');await api.refreshRows();assert.equal(api.S.rows.length,1);assert.equal(api.S.rows[0].archived,true);assert.equal(tables.cms_published.length,0);
});

const migrations=fs.readdirSync('supabase/migrations');
const registration=fs.readFileSync('supabase/migrations/'+migrations.find(file=>file.endsWith('_v13_press_template_registration.sql')),'utf8');
const bootstrap=fs.readFileSync('supabase/migrations/'+migrations.find(file=>file.endsWith('_v13_initial_press_publication.sql')),'utf8');
if(process.env.CMS_PGLITE_MODULE){
 const {PGlite}=await import(process.env.CMS_PGLITE_MODULE),db=new PGlite();
 await db.exec(`create schema cms_private;create table cms_private.cms_templates(template text primary key);
 create table cms_documents(id text primary key,route text unique not null,kind text not null,draft jsonb not null,revision integer not null,published_revision integer,archived boolean not null default false);
 create table cms_published(id text primary key references cms_documents(id),route text unique not null,kind text not null,payload jsonb not null,revision integer not null);
 create table cms_versions(document_id text not null references cms_documents(id),payload jsonb not null,revision integer not null,action text not null);`);
 const snapshot=async()=>{const result={};for(const name of ['cms_documents','cms_published','cms_versions'])result[name]=(await db.query('select * from '+name)).rows;return result;};
 await check('registration SQL is idempotent and changes no content or publications',async()=>{await db.exec(registration);await db.exec(registration);assert.deepEqual((await db.query('select * from cms_private.cms_templates')).rows,[{template:'/basin/'}]);assert.deepEqual(await snapshot(),{cms_documents:[],cms_published:[],cms_versions:[]});});
 await check('launch bootstrap creates only the new press document, publication and one seed history',async()=>{await db.exec(bootstrap);const state=await snapshot();assert.equal(state.cms_documents.length,1);assert.deepEqual(state.cms_documents[0].draft,press);assert.equal(state.cms_documents[0].published_revision,1);assert.deepEqual(state.cms_published[0].payload,press);assert.equal(state.cms_versions[0].action,'seed');await db.exec(bootstrap);assert.deepEqual(await snapshot(),state);});
 await check('rerunning SQL after deliberate unpublish or archive never restores publication',async()=>{await db.exec("delete from cms_published;update cms_documents set published_revision=null;");let before=await snapshot();await db.exec(bootstrap);assert.deepEqual(await snapshot(),before);await db.exec('update cms_documents set archived=true;');before=await snapshot();await db.exec(bootstrap);assert.deepEqual(await snapshot(),before);});
 await check('either an occupied ID or route blocks the entire bootstrap without changing existing data',async()=>{for(const [id,route] of [['custom-document-id','/basin/'],['/basin/','/moved-press/']]){await db.exec('delete from cms_versions;delete from cms_published;delete from cms_documents;');await db.query('insert into cms_documents values($1,$2,$3,$4,8,null,true)',[id,route,'page',{title:'Existing private editorial copy'}]);const before=await snapshot();await db.exec(bootstrap);assert.deepEqual(await snapshot(),before);}});
 await db.close();
}else console.log('SKIP PostgreSQL execution: set CMS_PGLITE_MODULE for local migration checks.');
console.log(`${passed} V13 press lifecycle checks passed; no external writes.`);
