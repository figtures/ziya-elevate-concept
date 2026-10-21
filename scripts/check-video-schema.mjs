/** Actual PostgreSQL clip-range validation and draft/publish regression checks.
 * Uses an isolated PGlite instance; never contacts Supabase or writes live data.
 * CMS_PGLITE_MODULE may point to a disposable test dependency installation.
 */
import {readFile,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PGlite}=await import(process.env.CMS_PGLITE_MODULE || '@electric-sql/pglite');
const db=new PGlite();
let checks=0;
try {
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
  const directory=new URL('../supabase/migrations/',import.meta.url);
  const migrations=(await readdir(directory)).filter(name=>/^\d+_.+\.sql$/.test(name)).sort();
  const permissions=async()=> (await db.query(`select proacl::text,prosecdef,provolatile,proconfig
    from pg_proc where oid='cms_private.validate_advanced_controls(jsonb)'::regprocedure`)).rows[0];
  for(const name of migrations){
    const before=name.endsWith('_cms_video_clip_ranges.sql') ? await permissions() : null;
    await db.exec(await readFile(new URL(name,directory),'utf8'));
    if(before){assert.deepEqual(await permissions(),before,'Migration must preserve validation privileges');checks++;}
  }
  const editor='00000000-0000-0000-0000-000000000003', admin='00000000-0000-0000-0000-000000000002';
  await db.exec(`
    insert into auth.users(id,email,email_confirmed_at) values
      ('${editor}','editor@example.test',now()),('${admin}','admin@example.test',now());
    insert into public.cms_members(user_id,role,email) values
      ('${editor}','editor','editor@example.test'),('${admin}','admin','admin@example.test');
    insert into cms_private.cms_templates values('/sample/');
  `);
  const userQuery=(user,sql,params=[])=>db.transaction(async tx=>{
    await tx.exec(`set local role ${user==='anon'?'anon':'authenticated'}`);
    await tx.query("select set_config('request.jwt.claims',$1,true)",[JSON.stringify(user==='anon'?{role:'anon'}:{role:'authenticated',sub:user})]);
    return tx.query(sql,params);
  });
  const clip={id:'stage',src:'/assets/stage.mp4',poster:'/assets/stage.jpg',focal:'50% 40%'};
  const payload={id:'video',route:'/liderlik/',kind:'page',template:'/sample/',title:'Video denemesi',description:'',ogImage:'',values:{},sections:[],experience:{playlist:[clip]}};
  const save=(body,revision)=>userQuery(editor,'select * from public.cms_save_document($1,$2,$3)',[body.id,revision,body]);
  await save(payload,0);
  await userQuery(admin,'select * from public.cms_publish_document($1,$2)',[payload.id,1]);
  assert.deepEqual((await userQuery('anon','select payload from public.cms_published')).rows[0].payload,payload);
  checks++;
  const trimmed=structuredClone(payload);
  trimmed.experience.playlist[0]={...clip,start:31.125,end:35.75};
  await save(trimmed,1);
  assert.deepEqual((await userQuery('anon','select payload from public.cms_published')).rows[0].payload,payload,'A trim draft must not affect the live playlist');
  await userQuery(admin,'select * from public.cms_publish_document($1,$2)',[payload.id,2]);
  assert.deepEqual((await userQuery('anon','select payload from public.cms_published')).rows[0].payload,trimmed);
  checks+=2;

  const assertDenied=async(body,code='22023')=>{
    let error;try{await save(body,2);}catch(e){error=e;}
    assert.ok(error,'Invalid clip must be rejected: '+JSON.stringify(body.experience.playlist));
    assert.equal(error.code,code);checks++;
  };
  for(const range of [
    {start:null},{end:null},{start:'31'},{end:'35'},{start:true},{end:false},{start:[]},{end:{}},
    {start:-0.01},{end:-1},{start:36000.01},{end:36000.01},{end:0},{start:4,end:4},{start:4,end:3},
    {start:'NaN'},{end:'Infinity'},{start:1e100},{end:1e100},{unexpected:1},
  ]){
    const invalid=structuredClone(payload);invalid.experience.playlist=[{...clip,...range}];
    await assertDenied(invalid);
  }
  const duplicate=structuredClone(payload);duplicate.experience.playlist=[clip,{...clip,start:1,end:2}];
  await assertDenied(duplicate);
  for(const range of [{},{start:0},{start:31.25},{end:0.01},{start:0,end:36000},{start:35999.99,end:36000}]){
    const valid=structuredClone(payload);valid.experience.playlist=[{...clip,...range}];
    await db.query('select cms_private.validate_document($1,$2)',[valid.id,valid]);checks++;
  }
  for(const role of ['anon','authenticated','service_role']){
    assert.equal((await db.query('select has_function_privilege($1,$2,$3) as allowed',[role,'cms_private.validate_advanced_controls(jsonb)','EXECUTE'])).rows[0].allowed,false);
    checks++;
  }
  let denied;try{await userQuery(editor,'select * from public.cms_publish_document($1,$2)',[payload.id,2]);}catch(e){denied=e;}
  assert.equal(denied?.code,'42501');checks++;
  console.log(`PASS ${checks} video schema checks: legacy compatibility, precise ranges, subpage playlists, draft isolation, publication and private ACLs.`);
} finally {
  await db.close();
}
