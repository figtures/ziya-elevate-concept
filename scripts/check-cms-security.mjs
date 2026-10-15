// Offline PostgreSQL-compatible checks using PGlite. No Supabase project is contacted.
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { checkAdvancedCMS } from './check-advanced-cms-security.mjs';
const { PGlite } = await import(process.env.CMS_PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
await db.exec(`
  create role anon; create role authenticated; create role service_role;
  create schema auth; create schema storage;
  grant usage on schema public,auth,storage to anon,authenticated,service_role;
  create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,encrypted_password text);
  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
  $$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
  alter table storage.objects enable row level security;
  grant select,insert,update,delete on storage.objects to authenticated;
`);
const migrationsURL=new URL('../supabase/migrations/',import.meta.url);
const migrationFiles=(await readdir(migrationsURL)).filter(name=>/^\d+_.+\.sql$/.test(name)).sort();
for(const name of migrationFiles)await db.exec(await readFile(new URL(name,migrationsURL),'utf8'));
const owner='00000000-0000-0000-0000-000000000001';
const admin='00000000-0000-0000-0000-000000000002';
const editor='00000000-0000-0000-0000-000000000003';
const outsider='00000000-0000-0000-0000-000000000004';
await db.exec(`
  insert into auth.users(id,email,email_confirmed_at) values('${owner}','owner@example.test',now()),('${admin}','admin@example.test',now()),('${editor}','editor@example.test',now()),('${outsider}','other@example.test',now());
  insert into public.cms_members(user_id,role,email) values('${owner}','owner','owner@example.test'),('${admin}','admin','admin@example.test'),('${editor}','editor','editor@example.test');
  insert into cms_private.cms_templates values('/sample/');
`);
const doc={id:'sample',route:'/sample/',kind:'page',template:'/sample/',title:'Örnek',description:'',ogImage:'',values:{title:'Taslak'},sections:[]};
let checks=0;
async function asUser(user,sql,params=[],claims={}) {
  return db.transaction(async tx=>{
    await tx.exec(`set local role ${user==='anon'?'anon':user==='service'?'service_role':'authenticated'}`);
    await tx.query(`select set_config('request.jwt.claims',$1,true)`,[JSON.stringify({...claims,...(user==='service'?{role:'service_role'}:user==='anon'?{role:'anon'}:{sub:user,role:'authenticated'})})]);
    return tx.query(sql,params);
  });
}
async function allow(user,sql,params=[]) {const out=await asUser(user,sql,params);checks++;return out;}
async function deny(user,sql,params=[],code) {
  let err;try{await asUser(user,sql,params);}catch(e){err=e;}
  assert.ok(err,`Expected denial: ${sql}`);if(code)assert.equal(err.code,code);checks++;
}
await deny('anon','select * from public.cms_documents',[], '42501');
assert.equal((await allow(outsider,'select * from public.cms_documents')).rows.length,0);
await deny(outsider,'select * from public.cms_save_document($1,$2,$3)',['sample',0,doc],'42501');
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',1,doc],'PT409');
await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',0,doc]);
assert.equal((await allow('anon','select * from public.cms_published')).rows.length,0);
await deny(editor,'select * from public.cms_publish_document($1,$2)',['sample',1],'42501');
await deny(editor,'update public.cms_documents set revision=999',[],'42501');
await deny(editor,'select * from public.cms_set_member($1,$2,$3)',[editor,'owner',true],'42501');
await allow(admin,'select * from public.cms_publish_document($1,$2)',['sample',1]);
assert.equal((await allow('anon','select * from public.cms_published')).rows.length,1);
const saved=await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',1,{...doc,title:'Yeni taslak'}]);
assert.equal(saved.rows[0].revision,2);
assert.equal((await allow('anon','select payload from public.cms_published')).rows[0].payload.title,'Örnek');
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',1,doc],'PT409');
await deny(admin,'select * from public.cms_unpublish_document($1,$2)',['sample',1],'PT409');
await deny(admin,'select * from public.cms_archive_document($1,$2)',['sample',1],'PT409');
assert.equal((await allow(editor,"select revision from public.cms_documents where id='sample'")).rows[0].revision,2);
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',2,{...doc,template:'/unknown/'}],'22023');
await deny(owner,'select * from public.cms_set_member($1,$2,$3)',[owner,'editor',true],'22023');
await allow(owner,'select * from public.cms_set_member($1,$2,$3)',[editor,'editor',false]);
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',2,doc],'42501');
await allow(owner,'select * from public.cms_set_member($1,$2,$3)',[editor,'editor',true]);
const version=(await allow(editor,'select id from public.cms_versions where action=$1 order by created_at limit 1',['save'])).rows[0].id;
await deny(editor,'select * from public.cms_restore_document($1,$2,$3)',['sample',version,1],'PT409');
await allow(editor,'select * from public.cms_restore_document($1,$2,$3)',['sample',version,2]);
assert.equal((await allow('anon','select revision from public.cms_published')).rows[0].revision,1);
assert.equal((await allow(editor,'select * from public.cms_leads')).rows.length,0);
await deny('anon','select * from public.cms_submit_lead($1,$2,$3)',['a'.repeat(64),'b'.repeat(64),{}],'42501');
const lead={name:'Test Kullanıcı',email:'test@example.test',topic:'kurumsal',message:'Bu yalnızca yerel doğrulama kaydıdır.'};
const leadId=(await allow('service','select public.cms_submit_lead($1,$2,$3) as id',['a'.repeat(64),'b'.repeat(64),lead])).rows[0].id;
await allow(admin,'select * from public.cms_update_lead($1,$2,$3,$4)',[leadId,1,'in_progress','Yerel test']);
await deny(admin,'select * from public.cms_update_lead($1,$2,$3,$4)',[leadId,1,'closed',''],'PT409');
await deny(editor,'select * from public.cms_update_lead($1,$2,$3,$4)',[leadId,2,'closed',''],'42501');
await allow('service','select public.cms_submit_lead($1,$2,$3)',['a'.repeat(64),'b'.repeat(64),lead]);
await allow('service','select public.cms_submit_lead($1,$2,$3)',['a'.repeat(64),'b'.repeat(64),lead]);
await deny('service','select public.cms_submit_lead($1,$2,$3)',['a'.repeat(64),'b'.repeat(64),lead],'P0001');
await allow(admin,'select * from public.cms_archive_document($1,$2)',['sample',3]);
assert.equal((await allow('anon','select * from public.cms_published')).rows.length,0);
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',4,doc],'22023');
await deny(editor,'select * from public.cms_unarchive_document($1,$2)',['sample',4],'42501');
await deny(editor,'select * from public.cms_restore_document($1,$2,$3)',['sample',version,4],'22023');
await deny(admin,'select * from public.cms_unarchive_document($1,$2)',['sample',3],'PT409');
const unarchived=await allow(admin,'select * from public.cms_unarchive_document($1,$2)',['sample',4]);
assert.equal(unarchived.rows[0].archived,false);
assert.equal(unarchived.rows[0].revision,5);
assert.equal(unarchived.rows[0].published_revision,null);
assert.equal((await allow('anon','select * from public.cms_published')).rows.length,0);
await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',5,doc]);
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',6,{...doc,route:'/changed/'}],'22023');
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',6,{...doc,kind:'article'}],'22023');
for (const bad of [
  {...doc,title:'MeRkEz'}, {...doc,kind:'unknown'}, {...doc,id:'different'},
  {...doc,sections:Array.from({length:41},(_,i)=>({id:String(i),source:String(i),hidden:false,values:{},groups:[]}))},
  {...doc,sections:[{id:'a',source:'a',hidden:'false',values:{},groups:[]}]},
  {...doc,sections:[{id:'a',source:'a',hidden:false,values:{},groups:[{id:'g',items:[{id:'item',source:'item',values:[]}]}]}]},
  {...doc,sections:[{id:'a',source:'a',hidden:false,values:{},groups:[{id:'g',items:Array.from({length:101},(_,i)=>({id:String(i),source:'item',values:{}}))}]}]},
]) await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['sample',6,bad],'22023');

const layerKeys=['ic','red','bas','bel','top'];
const validTest={key:'kgky',layerLabel:'Zırh Katmanı',
  layers:Object.fromEntries(layerKeys.map(k=>[k,{name:k,tip:'Öneri',steps:[['Adım','Açıklama']]}])),
  questions:layerKeys.flatMap(l=>Array.from({length:4},()=>({l,q:'Soru metni',o:[['Bir',1],['İki',2],['Üç',3],['Dört',4]]}))),
  verdicts:[80,60,40,0].map(min=>({min,v:'Sonuç',vt:'Sonuç açıklaması'}))};
const testDoc={...doc,id:'test',route:'/testler/kafa-yapisi-testi/',kind:'test',test:validTest};
await allow(editor,'select * from public.cms_save_document($1,$2,$3)',['test',0,testDoc]);
await allow(admin,'select * from public.cms_publish_document($1,$2)',['test',1]);
await deny(admin,'select * from public.cms_archive_document($1,$2)',['test',1],'22023');
await deny(admin,'select * from public.cms_unpublish_document($1,$2)',['test',1],'22023');
const invalidMutations=[
  t=>{delete t.layers.ic;},t=>{t.questions.pop();},t=>{t.questions[0].l='red';},
  t=>{t.questions[0].q=' ';},t=>{t.questions[0].o.pop();},
  t=>{t.questions[0].o[0][0]=' ';},t=>{t.questions[0].o[0][1]=2.5;},
  t=>{t.questions[0].o[0][1]=5;},t=>{t.questions[0].o[0][1]='1';},
  t=>{t.layers.ic.name='';},t=>{t.verdicts[1].min=90;},
  t=>{t.verdicts[0].min=101;},t=>{t.verdicts[3].min=1;},
  t=>{t.verdicts[0].min=80.5;},t=>{t.verdicts[0].v='';},t=>{t.verdicts=[];},
];
for(const mutate of invalidMutations){const t=structuredClone(validTest);mutate(t);
  await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['test',1,{...testDoc,test:t}],'22023');}
await deny(editor,'select * from public.cms_save_document($1,$2,$3)',['test',1,{...testDoc,test:null}],'22023');
for(const [id,route,kind] of [['home','/','page'],['global','/_global/','global']]){
  await allow(editor,'select * from public.cms_save_document($1,$2,$3)',[id,0,{...doc,id,route,kind}]);
  await deny(admin,'select * from public.cms_archive_document($1,$2)',[id,1],'22023');
  await deny(admin,'select * from public.cms_unpublish_document($1,$2)',[id,1],'22023');
}
await allow(editor,`insert into storage.objects(bucket_id,name) values('cms-public','11111111-1111-1111-1111-111111111111.jpg')`);
await deny(outsider,`insert into storage.objects(bucket_id,name) values('cms-public','22222222-2222-2222-2222-222222222222.jpg')`,[],'42501');
await deny(editor,`insert into storage.objects(bucket_id,name) values('cms-public','unsafe.svg')`,[],'42501');
assert.equal((await allow(editor,`update storage.objects set name='bad.jpg' returning *`)).rows.length,0);

// Privilege and persistence regression cases: these exercise SQL/RLS, not UI visibility.
for(const table of ['cms_members','cms_documents','cms_published','cms_versions','cms_leads','cms_audit']) {
  await deny(owner,`delete from public.${table}`,[],'42501');
  await deny(owner,`update public.${table} set ${table==='cms_members'?'active=false':table==='cms_documents'?'revision=1':table==='cms_published'?'revision=1':table==='cms_versions'?"action='save'":table==='cms_leads'?"status='closed'":"action='changed'"}`,[],'42501');
}
for(const table of ['cms_members','cms_versions','cms_media','cms_leads','cms_audit']) {
  await deny('anon',`select * from public.${table}`,[],'42501');
  assert.equal((await allow(outsider,`select * from public.${table}`)).rows.length,0);
}
assert.equal((await allow(editor,'select * from public.cms_members')).rows.length,1);
assert.equal((await allow(owner,'select * from public.cms_members')).rows.length,3);
const forged=await asUser(outsider,'select * from public.cms_documents',[],{user_metadata:{role:'owner'},app_metadata:{role:'owner'}});
assert.equal(forged.rows.length,0);checks++;
await deny('anon','select cms_private.has_role($1)',[['owner']], '42501');
await deny(editor,'select cms_private.validate_document($1,$2)',['sample',doc], '42501');
await deny(admin,'select public.cms_set_member($1,$2,$3)',[outsider,'owner',true], '42501');
await deny(owner,'select public.cms_set_member($1,$2,$3)',[owner,'owner',false], '22023');
await deny(editor,'select public.cms_submit_lead($1,$2,$3)',['c'.repeat(64),'d'.repeat(64),lead], '42501');
assert.equal((await allow(admin,'select notes,revision from public.cms_leads where id=$1',[leadId])).rows[0].notes,'Yerel test');
assert.ok((await allow(admin,"select * from public.cms_audit where action='lead.update'")).rows.length);
assert.equal((await allow(editor,'select * from public.cms_audit')).rows.length,0);
const objectPath='11111111-1111-1111-1111-111111111111.jpg';
const mediaUrl=`https://storage.example.test/storage/v1/object/public/cms-public/${objectPath}`;
await deny(editor,'insert into public.cms_media(path,url,mime,size,created_by) values($1,$2,$3,$4,$5)',[objectPath,mediaUrl,'image/jpeg',100,owner],'42501');
await deny(editor,'insert into public.cms_media(path,url,mime,size) values($1,$2,$3,$4)',['33333333-3333-3333-3333-333333333333.jpg',mediaUrl,'image/jpeg',100],'42501');
await allow(editor,'insert into public.cms_media(path,url,mime,size,alt) values($1,$2,$3,$4,$5)',[objectPath,mediaUrl,'image/jpeg',100,'Özgün açıklama']);
await deny(editor,'update public.cms_media set url=$1',['https://wrong.example.test/image.jpg'],'42501');
await deny(editor,'delete from public.cms_media',[],'42501');
const mediaArchived=await allow(editor,'update public.cms_media set alt=$1,archived=true where path=$2 returning *',['Yeni açıklama',objectPath]);
assert.equal(mediaArchived.rows[0].alt,'Yeni açıklama');assert.equal(mediaArchived.rows[0].url,mediaUrl);
assert.equal((await allow(editor,'delete from storage.objects returning *')).rows.length,0);
await allow(owner,'select public.cms_set_member($1,$2,$3)',[editor,'editor',false]);
assert.equal((await allow(editor,'select * from public.cms_documents')).rows.length,0);
assert.equal((await allow(editor,'select * from public.cms_media')).rows.length,0);
await deny(editor,"insert into storage.objects(bucket_id,name) values('cms-public','44444444-4444-4444-4444-444444444444.jpg')",[],'42501');
await allow(owner,'select public.cms_set_member($1,$2,$3)',[editor,'editor',true]);
await allow(admin,'select public.cms_publish_document($1,$2)',['sample',6]);
await deny(editor,'select public.cms_unpublish_document($1,$2)',['sample',6],'42501');
await allow(admin,'select public.cms_unpublish_document($1,$2)',['sample',6]);
assert.equal((await allow('anon',"select * from public.cms_published where id='sample'")).rows.length,0);
await deny(admin,'select public.cms_publish_document($1,$2)',['sample',6],'PT409');
await allow(admin,'select public.cms_publish_document($1,$2)',['sample',7]);
assert.equal((await allow('anon',"select * from public.cms_published where id='sample'")).rows.length,1);
if(process.env.CMS_SEED_FILE){
  const docs=JSON.parse(await readFile(process.env.CMS_SEED_FILE,'utf8'));
  for(const d of docs){
    await db.query('insert into cms_private.cms_templates(template) values($1) on conflict do nothing',[d.template]);
    await db.query('select cms_private.validate_document($1,$2)',[d.id,d]);checks++;
  }
  console.log(`Validated ${docs.length} actual seed documents`);
}
await checkAdvancedCMS({db,allow,deny,editor,admin,doc});

// First-login credentials cannot access private content until Auth changes the hash.
const firstLogin='00000000-0000-0000-0000-000000000099';
await db.exec(`insert into auth.users(id,email,email_confirmed_at,encrypted_password) values('${firstLogin}','first@example.test',now(),'temporary-hash')`);
await deny(editor,'select public.cms_register_created_member($1,$2)',[firstLogin,'editor'],'42501');
await deny(owner,'select public.cms_register_created_member($1,$2)',[firstLogin,'owner'],'22023');
await allow(owner,'select public.cms_register_created_member($1,$2)',[firstLogin,'admin']);
assert.equal((await allow(firstLogin,'select must_change_password from public.cms_members where user_id=$1',[firstLogin])).rows[0].must_change_password,true);
assert.equal((await allow(firstLogin,'select * from public.cms_documents')).rows.length,0);
assert.equal((await allow(firstLogin,'select * from public.cms_leads')).rows.length,0);
assert.equal((await allow(firstLogin,'select * from public.cms_media')).rows.length,0);
await deny(firstLogin,'update public.cms_members set must_change_password=false where user_id=$1',[firstLogin],'42501');
await deny(firstLogin,'select * from public.cms_save_document($1,$2,$3)',['locked',0,doc],'42501');
await deny(firstLogin,'select * from public.cms_set_member($1,$2,$3)',[firstLogin,'owner',true],'42501');
await allow(owner,'select * from public.cms_set_member($1,$2,$3)',[firstLogin,'editor',true]);
assert.equal((await allow(firstLogin,'select must_change_password from public.cms_members where user_id=$1',[firstLogin])).rows[0].must_change_password,true);
await db.exec(`update auth.users set email='renamed@example.test',encrypted_password='temporary-hash' where id='${firstLogin}'`);
assert.equal((await allow(firstLogin,'select must_change_password from public.cms_members where user_id=$1',[firstLogin])).rows[0].must_change_password,true);
await db.exec(`update auth.users set encrypted_password='new-hash' where id='${firstLogin}'`);
assert.equal((await allow(firstLogin,'select must_change_password from public.cms_members where user_id=$1',[firstLogin])).rows[0].must_change_password,false);
assert.equal((await allow(firstLogin,"select cms_private.has_role(array['editor']) as allowed")).rows[0].allowed,true);
assert.equal((await allow(owner,'select must_change_password from public.cms_members where user_id=$1',[owner])).rows[0].must_change_password,false);
console.log('PASS first-login database enforcement and Auth password trigger');


const deletionTarget='00000000-0000-0000-0000-000000009999';
await db.exec(`insert into auth.users(id,email,email_confirmed_at) values('${deletionTarget}','delete@example.test',now());insert into public.cms_members(user_id,email,role) values('${deletionTarget}','delete@example.test','editor');`);
await deny(editor,'select public.cms_prepare_member_deletion($1,$2)',[deletionTarget,'delete@example.test']);
await deny(owner,'select public.cms_prepare_member_deletion($1,$2)',[owner,'owner@example.test']);
await deny(owner,'select public.cms_prepare_member_deletion($1,$2)',[deletionTarget,'wrong@example.test']);
await assert.rejects(db.exec(`delete from auth.users where id='${deletionTarget}'`));checks++;
await allow(owner,'select public.cms_prepare_member_deletion($1,$2)',[deletionTarget,'delete@example.test']);
assert.equal((await asUser(deletionTarget,'select * from public.cms_documents')).rows.length,0);checks++;
await allow(owner,'select public.cms_set_member($1,$2,$3)',[deletionTarget,'owner',true]);
await assert.rejects(db.exec(`delete from auth.users where id='${deletionTarget}'`));checks++;
await allow(owner,'select public.cms_set_member($1,$2,$3)',[deletionTarget,'editor',true]);
await allow(owner,'select public.cms_prepare_member_deletion($1,$2)',[deletionTarget,'delete@example.test']);
await db.exec(`delete from auth.users where id='${deletionTarget}'`);
assert.equal((await db.query(`select * from public.cms_members where user_id='${deletionTarget}'`)).rows.length,0);checks++;
await db.close();
console.log(`PASS ${checks} offline allow/deny checks`);

// Execute the actual Edge Function handlers with isolated Auth/REST/Turnstile stubs.
// No request leaves the process; this is not a live gateway/SMTP/Storage verification.
let edgeChecks=0;
const origin='https://site.example.test';
async function edgeHarness(name) {
  const env={CMS_ALLOWED_ORIGINS:origin,CMS_CLIENT_IP_HEADER:'cf-connecting-ip',CMS_RATE_LIMIT_SECRET:'local-test-secret',SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'local-service-key',CMS_PUBLISHABLE_KEY:'local-publishable-key',CMS_ADMIN_REDIRECT_URL:`${origin}/admin/`};
  const state={env,clients:[],rpc:[],invites:[],fetches:[],authCalls:[],getUserError:null,member:{role:'owner',active:true},memberError:null,rpcError:null,rpcData:'00000000-0000-0000-0000-000000000011',inviteError:null,grantError:null,captchaSuccess:true};
  let handler;
  const compiled=await build({entryPoints:[new URL(`../supabase/functions/${name}/index.ts`,import.meta.url).pathname],bundle:true,write:false,platform:'neutral',format:'iife',plugins:[{name:'offline-supabase',setup(b){b.onResolve({filter:/^npm:@supabase\/supabase-js/},()=>({path:'client',namespace:'offline'}));b.onLoad({filter:/.*/,namespace:'offline'},()=>({contents:'export const createClient = globalThis.__createClient;',loader:'js'}));}}]});
  vm.runInNewContext(compiled.outputFiles[0].text,{
    Deno:{env:{get:key=>env[key]},serve:fn=>{handler=fn;}},Request,Response,URL,URLSearchParams,TextEncoder,TextDecoder,AbortSignal,Uint8Array,crypto:webcrypto,
    console:{error(){}},
    fetch:async(url,options)=>{state.fetches.push({url,options});return Response.json({success:state.captchaSuccess});},
    __createClient:(url,key,options)=>{
      state.clients.push({url,key,options});
      return {
        auth:{getUser:async token=>{state.authCalls.push(token);return {data:{user:state.getUserError?null:{id:owner}},error:state.getUserError};},admin:{inviteUserByEmail:async(email,opts)=>{state.invites.push({email,opts});return {data:{user:state.inviteError?null:{id:outsider}},error:state.inviteError};}}},
        from:()=>({select:()=>({eq:()=>({single:async()=>({data:state.member,error:state.memberError})})})}),
        rpc:async(name,args)=>{state.rpc.push({name,args});return {data:state.rpcData,error:name==='cms_set_member'?state.grantError:state.rpcError};},
      };
    },
  });
  return {state,async request(body,extra={}){
    const method=extra.method||'POST';
    const headers={origin,'content-type':'application/json','cf-connecting-ip':'203.0.113.1',...(extra.headers||{})};
    for(const key of Object.keys(headers))if(headers[key]===null)delete headers[key];
    const req=new Request(`https://functions.example.test/${name}`,{method,headers,...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})});
    const res=await handler(req);const text=await res.text();return {status:res.status,headers:res.headers,body:text?JSON.parse(text):null};
  }};
}
async function edgeStatus(h,body,status,extra){const result=await h.request(body,extra);assert.equal(result.status,status,JSON.stringify(result.body));edgeChecks++;return result;}
const form={...lead,website:''};
const submit=await edgeHarness('submit-lead');
await edgeStatus(submit,form,204,{method:'OPTIONS'});
await edgeStatus(submit,form,405,{method:'GET'});
await edgeStatus(submit,form,403,{headers:{origin:'https://untrusted.example.test'}});
await edgeStatus(submit,form,403,{headers:{origin:null}});
await edgeStatus(submit,form,415,{headers:{'content-type':'text/plain'}});
await edgeStatus(submit,'{broken',400);
await edgeStatus(submit,[],400);
await edgeStatus(submit,{...form,message:'x'.repeat(66000)},413);
await edgeStatus(submit,{...form,website:'bot.example.test'},400);
await edgeStatus(submit,{...form,email:'not-email'},400);
await edgeStatus(submit,{...form,topic:'unexpected'},400);
await edgeStatus(submit,{...form,message:'short'},400);
await edgeStatus(submit,form,503,{headers:{'cf-connecting-ip':null}});
assert.equal(submit.state.rpc.length,0);edgeChecks++;
const submitted=await edgeStatus(submit,form,201);
assert.equal(submitted.headers.get('access-control-allow-origin'),origin);
assert.equal(submitted.headers.get('cache-control'),'no-store');
assert.match(submit.state.rpc[0].args.p_ip_hash,/^[a-f0-9]{64}$/);
assert.match(submit.state.rpc[0].args.p_email_hash,/^[a-f0-9]{64}$/);
assert.equal(submit.state.rpc[0].args.p_payload.email,lead.email);edgeChecks++;
submit.state.rpcError={message:'RATE_LIMITED'};
const limited=await edgeStatus(submit,form,429);assert.equal(limited.headers.get('retry-after'),'3600');
submit.state.rpcError={message:'database details must not escape'};
const rejected=await edgeStatus(submit,form,503);assert.ok(!JSON.stringify(rejected.body).includes('database details'));edgeChecks++;
submit.state.rpcError=null;submit.state.env.CMS_TURNSTILE_SECRET='local-captcha-key';
await edgeStatus(submit,form,400);
submit.state.captchaSuccess=false;await edgeStatus(submit,{...form,captcha_token:'invalid'},400);
submit.state.captchaSuccess=true;await edgeStatus(submit,{...form,captcha_token:'valid'},201);
const users=await edgeHarness('admin-users');
const invite={action:'invite',email:'invited@example.test',role:'editor'};
const auth={headers:{authorization:'Bearer local-user-token'}};
await edgeStatus(users,invite,401);
await edgeStatus(users,invite,401,{headers:{authorization:'Basic nope'}});
users.state.getUserError={message:'invalid user'};await edgeStatus(users,invite,401,auth);users.state.getUserError=null;
users.state.member={role:'admin',active:true};await edgeStatus(users,invite,403,auth);
users.state.member={role:'owner',active:false};await edgeStatus(users,invite,403,auth);
users.state.member={role:'owner',active:true};
await edgeStatus(users,{...invite,role:'owner'},400,auth);
await edgeStatus(users,{...invite,action:'delete'},400,auth);
users.state.env.CMS_ADMIN_REDIRECT_URL='https://untrusted.example.test/admin/';await edgeStatus(users,invite,503,auth);
assert.equal(users.state.invites.length,0);edgeChecks++;
users.state.env.CMS_ADMIN_REDIRECT_URL=`${origin}/admin/`;
users.state.inviteError={message:'already exists'};await edgeStatus(users,invite,409,auth);users.state.inviteError=null;
users.state.grantError={message:'caller lost owner access'};
const partial=await edgeStatus(users,invite,409,auth);assert.equal(partial.body.user_id,outsider);assert.equal(partial.body.ok,false);edgeChecks++;
users.state.grantError=null;await edgeStatus(users,invite,201,auth);
assert.equal(users.state.rpc.at(-1).name,'cms_set_member');
assert.equal(users.state.rpc.at(-1).args.p_role,'editor');
assert.ok(users.state.authCalls.every(token=>token==='local-user-token'));edgeChecks++;
console.log(`PASS ${edgeChecks} offline Edge Function request/response checks (stubbed services; no network)`);
