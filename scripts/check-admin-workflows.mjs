/** Admin interaction regression checks using LinkeDOM and local Supabase stubs.
 * No live credentials, external writes, browser, or visual QA are involved.
 */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {parseHTML,DOMParser} from 'linkedom';
import * as dependencies from './admin-test-dependencies.mjs';
const {applyContent,validateDocument,safeURL,deriveNavigation,deriveCollection,composeContent}=dependencies;
const json=name=>JSON.parse(fs.readFileSync(new URL('../cms/'+name+'.json',import.meta.url),'utf8'));
const catalog=json('catalog'),seed=json('seed'),media=json('media-seed'),templates=json('templates'),iconNodes=json('icon-nodes'),socialImages=json('social-images');
const source=fs.readFileSync(new URL('../cms/admin.mjs',import.meta.url),'utf8');
const exposed=['S','boot','navigate','openEditor','editor','action','preview','closeDialog','targetFor','mediaPicker','uploadFiles','loadMedia','refreshRows','readAll','loadHistory','leadsPage','leadDialog','teamPage','setMember','save','enter','passwordDialog','setMenu'];
const instrumented=source.replace(/^import .*;\n/gm,'').replace(/\nboot\(\);\s*$/,'\nglobalThis.api={'+exposed.join(',')+',setClient:value=>client=value};');
let passed=0,failed=0;
async function check(name,fn){try{await fn();passed++;console.log('PASS '+name);}catch(e){failed++;console.error('FAIL '+name+'\n'+e.stack);}}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
function setup(){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><div id="app"></div><div id="toasts"></div></body></html>');
 // LinkeDOM represents <video> as HTMLElement. Only model the native media
 // events used by the editor; decoding, CORS and visual playback need browser QA.
 const mediaCalls=[];
 window.HTMLElement.prototype.pause=function(){if(this.localName==='video'){const wasPlaying=this.paused===false;this.paused=true;mediaCalls.push({action:'pause',source:this.src});if(wasPlaying)this.dispatchEvent(new window.Event('pause'));}};
 window.HTMLElement.prototype.load=function(){if(this.localName==='video'){this.currentTime=0;this.duration=NaN;this.readyState=0;mediaCalls.push({action:'load',source:this.src});}};
 window.HTMLElement.prototype.play=function(){if(this.localName==='video'){this.paused=false;mediaCalls.push({action:'play',source:this.src});this.dispatchEvent(new window.Event('play'));}return Promise.resolve();};
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){const option=this.querySelector('option[selected]')||this.querySelector('option');return option?(option.getAttribute('value')??option.textContent):'';},set(value){for(const option of this.querySelectorAll('option')){if((option.getAttribute('value')??option.textContent)===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
 const confirmations=[];let confirmAnswer=true;
 class FormDataShim {constructor(form){this.form=form;}get(name){const el=this.form.querySelector('[name="'+name+'"]');return el?.value??null;}}
 const context={...dependencies,document,window,DOMParser,URL,URLSearchParams,structuredClone,crypto:webcrypto,iconNodes,FormData:FormDataShim,
  location:{origin:'https://example.org',hash:''},navigator:{clipboard:{writeText:async()=>{}}},console,
  setTimeout:()=>0,clearTimeout:()=>{},confirm:message=>(confirmations.push(message),confirmAnswer),
  applyContent,validateDocument,safeURL,requestAnimationFrame:fn=>fn(),cancelAnimationFrame:()=>{},
  matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
  fetch:async url=>String(url).startsWith('/api/cms/template')?{ok:true,text:async()=>templates[new URL('https://example.org'+url).searchParams.get('id')]}:{ok:true,json:async()=>({config:{enabled:false},catalog:structuredClone(catalog),seed:structuredClone(seed),media:structuredClone(media)})}
 };
 vm.createContext(context);vm.runInContext(instrumented,context,{filename:'cms/admin.mjs'});
 const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
 const change=(selector,value,event='input')=>{const el=$(selector);assert.ok(el,'Missing control '+selector);el.value=String(value);el.dispatchEvent(new window.Event(event));return el;};
 const toggle=(selector,checked,event='change')=>{const el=$(selector);assert.ok(el,'Missing checkbox '+selector);el.checked=checked;el.dispatchEvent(new window.Event(event));return el;};
 const click=async selector=>{const el=$(selector);assert.ok(el,'Missing button '+selector);assert.ok(!el.disabled,'Disabled button '+selector);if(el.onclick)await el.onclick({target:el,preventDefault(){}});else el.dispatchEvent(new window.Event('click',{bubbles:true}));await flush();return el;};
 const submit=async(selector,values)=>{const form=$(selector);assert.ok(form,'Missing form '+selector);for(const [name,value]of Object.entries(values))change(selector+' [name="'+name+'"]',value);await form.onsubmit({target:form,preventDefault(){}});await flush();};
 const textSelector=()=>{const def=context.api.S.catalog[context.api.S.doc.template],input=$$('[data-bind]').find(el=>def.fields.find(f=>f.id===JSON.parse(el.dataset.bind).field)?.label==='Ana başlık');assert.ok(input,'No title text input');return '#'+input.id;};
 const loadVideo=(seconds=120)=>{const video=$('[data-video-player]');assert.ok(video);video.duration=seconds;video.readyState=2;video.videoWidth=1920;video.videoHeight=1080;video.dispatchEvent(new window.Event('loadedmetadata'));return video;};
 return {setFetch:fn=>context.fetch=fn,api:context.api,document,window,$,$$,change,toggle,click,submit,textSelector,confirmations,mediaCalls,loadVideo,setConfirm:v=>confirmAnswer=v};
}
function fakeClient(initial={}){
 const tables={cms_published:structuredClone(seed.map(d=>({id:d.id,route:d.route,kind:d.kind,title:d.title,robots:d.robots,payload:d}))),cms_documents:structuredClone(seed.map(d=>({id:d.id,route:d.route,kind:d.kind,draft:d,revision:1,published_revision:1,archived:false}))),cms_media:[],cms_versions:[],cms_leads:[],cms_members:[],...initial};
 const calls=[];let rpcError=null,hold=null;
 const client={
  from(table){const filters=[];let mode='select',payload=null,start=0,end=Infinity,single=false;const q={
   select(){return q;},eq(key,value){filters.push([key,value]);return q;},order(){return q;},limit(n){end=n-1;return q;},range(a,b){start=a;end=b;return q;},maybeSingle(){single=true;return q;},
   update(value){mode='update';payload=value;return q;},insert(value){mode='insert';payload=value;return q;},
   async then(resolve,reject){try{calls.push({type:'query',table,mode,start,end,payload:structuredClone(payload)});let rows=tables[table].filter(row=>filters.every(([key,value])=>row[key]===value));if(mode==='insert'){tables[table].push({archived:false,...payload,id:'insert-'+tables[table].length});rows=[payload];}if(mode==='update')rows.forEach(row=>Object.assign(row,payload));const data=single?(rows[0]||null):rows.slice(start,end+1);resolve({data:structuredClone(data),error:null});}catch(e){reject(e);}}
  };return q;},
  async rpc(name,args){calls.push({type:'rpc',name,args:structuredClone(args)});if(hold){const wait=hold;hold=null;await wait;}if(rpcError)return {data:null,error:rpcError};const row=tables.cms_documents.find(r=>r.id===args.p_id);
   if(name==='cms_save_document'){if(row){row.draft=structuredClone(args.p_payload);row.revision++;}else tables.cms_documents.push({id:args.p_id,route:args.p_payload.route,kind:args.p_payload.kind,draft:structuredClone(args.p_payload),revision:1,published_revision:null,archived:false});}
   if(name==='cms_publish_document'){row.published_revision=row.revision;const published={id:row.id,route:row.route,kind:row.kind,title:row.draft.title,robots:row.draft.robots,payload:structuredClone(row.draft)},index=tables.cms_published.findIndex(p=>p.route===row.route);if(index<0)tables.cms_published.push(published);else tables.cms_published[index]=published;}
   if(name==='cms_unpublish_document'){row.published_revision=null;tables.cms_published=tables.cms_published.filter(p=>p.route!==row.route);}
   if(name==='cms_archive_document'){row.archived=true;row.published_revision=null;tables.cms_published=tables.cms_published.filter(p=>p.route!==row.route);}
   if(name==='cms_unarchive_document'){row.archived=false;row.revision++;}
   if(name==='cms_restore_document'){row.draft=structuredClone(tables.cms_versions.find(v=>v.id===args.p_version).payload);row.revision++;}
   if(name==='cms_update_lead')Object.assign(tables.cms_leads.find(l=>l.id===args.p_id),{status:args.p_status,notes:args.p_notes,revision:args.p_expected+1});
   if(name==='cms_set_member')Object.assign(tables.cms_members.find(m=>m.user_id===args.p_user_id),{role:args.p_role,active:args.p_active});
   return {data:row?[structuredClone(row)]:[],error:null};},
  storage:{from(bucket){return {async upload(path,file,options){calls.push({type:'upload',bucket,path,mime:file.type,size:file.size,options});return {error:null};},getPublicUrl:path=>({data:{publicUrl:'https://example.org/storage/'+path}})};}},
  functions:{async invoke(name,options){calls.push({type:'function',name,options});return {data:{},error:null};}},
  auth:{async getUser(){return {data:{user:{id:'owner-id'}},error:null};},async updateUser(values){calls.push({type:'auth',action:'updateUser',values});return {error:null};},async signOut(){calls.push({type:'auth',action:'signOut'});return {error:null};}}
 };
 return {client,tables,calls,setError:e=>rpcError=e,holdNext:()=>{let release;hold=new Promise(resolve=>release=resolve);return release;}};
}
async function offline(){const h=setup();await h.api.boot();return h;}
async function connected(role='owner',initial){const h=await offline(),db=fakeClient(initial);h.api.setClient(db.client);h.api.S.offline=false;h.api.S.member={role,user_id:'owner-id',email:'owner@example.org',active:true};await h.api.refreshRows();return {...h,db};}

await check('Every catalog field is reachable through its real section editor',async()=>{
 const h=await offline();let fields=0;
 for(const row of h.api.S.rows){h.api.openEditor(row.id);const seen=new Set();for(const section of h.api.S.doc.sections){h.api.S.section=section.id;h.api.editor();for(const input of h.$$('[data-bind]'))seen.add(JSON.parse(input.dataset.bind).field);}const definition=h.api.S.catalog[row.draft.template];for(const f of definition.fields)assert.ok(seen.has(f.id),row.route+' inaccessible field '+f.id);fields+=seen.size;}
 console.log('INFO '+h.api.S.rows.length+' documents, '+fields+' editable fields reachable');
});
await check('Text edits update the draft and preview without changing authored seed',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');const input=h.$(h.textSelector()),ctx=JSON.parse(input.dataset.bind),original=structuredClone(h.api.S.rows.find(r=>r.id==='/kitaplar/').draft);h.change(h.textSelector(),input.value+' Güncellendi');assert.equal(h.api.S.dirty,true);assert.match(h.api.targetFor(ctx)[ctx.field],/Güncellendi/);assert.deepEqual(h.api.S.rows.find(r=>r.id==='/kitaplar/').draft,original);await h.api.preview();assert.ok(h.$('#modal iframe').srcdoc.includes('Güncellendi'));assert.ok(h.$('#app').inert);h.api.closeDialog();assert.equal(h.$('#app').inert,false);
});
await check('Section order and visibility preserve the required opening video',async()=>{
 const h=await offline();h.api.openEditor('/');const initialSections=h.api.S.doc.sections.length;const hero=h.api.S.doc.sections[0].id;assert.equal(h.$('[data-section-move]'),null);h.api.S.section=h.api.S.doc.sections[2].id;h.api.editor();const moved=h.api.S.section;await h.click('[data-section-move="-1"]');assert.equal(h.api.S.doc.sections[1].id,moved);await h.click('[data-section-move="-1"]');assert.equal(h.api.S.doc.sections[0].id,hero);const visible=h.$('#section-visible');visible.checked=false;visible.dispatchEvent(new h.window.Event('change'));assert.equal(h.api.S.doc.sections[1].hidden,true);await h.click('[data-action="add-section"]');await h.click('[data-add-section]');assert.equal(h.api.S.doc.sections.length,initialSections+1);assert.equal(new Set(h.api.S.doc.sections.map(s=>s.id)).size,initialSections+1);
});
await check('Books and menu repeaters support edit, duplicate, reorder and remove',async()=>{
 const h=await offline();for(const route of ['/kitaplar/','_global']){h.api.openEditor(route);h.api.S.section=h.api.S.doc.sections.find(s=>s.groups.length).id;h.api.editor();let section=h.api.S.doc.sections.find(s=>s.id===h.api.S.section),group=section.groups[0];const before=group.items.length;const input=h.$('[data-bind]');h.change('[data-bind]',input.value+' örnek');await h.click('[data-item-copy]');assert.equal(group.items.length,before+1);assert.notEqual(group.items[0].id,group.items[1].id);const duplicated=group.items[1].id;await h.click('[data-item-move="'+group.id+'|1|1"]');assert.equal(group.items[2].id,duplicated);await h.click('[data-item-remove="'+group.id+'|2"]');assert.equal(group.items.length,before);await h.click('[data-item-add]');assert.equal(group.items.length,before+1);}
});
await check('Duplicating an edited document resets H1 overrides to the new title',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');const f=h.api.S.catalog[h.api.S.doc.template].fields.find(f=>f.label==='Ana başlık');h.api.S.doc.sections.find(s=>s.source===f.section).values[f.id]='Eski özel başlık';await h.click('[data-action="duplicate"]');await h.submit('#new-form',{title:'Yeni Kitap Seçkisi',route:'/kitap-seckisi/'});assert.equal(h.api.S.doc.title,'Yeni Kitap Seçkisi');assert.equal(h.api.S.doc.values[f.id],'Yeni Kitap Seçkisi');assert.equal(h.api.S.doc.sections.find(s=>s.source===f.section).values[f.id],undefined);await h.api.preview();assert.ok(h.$('#modal iframe').srcdoc.includes('Yeni Kitap Seçkisi'));assert.ok(!h.$('#modal iframe').srcdoc.includes('Eski özel başlık'));h.api.closeDialog();await h.click('[data-action="duplicate"]');assert.equal(h.$$('#new-form select option').length,1);await h.submit('#new-form',{title:'İkinci seçki',route:'/ikinci-secki/'});assert.equal(h.api.S.doc.route,'/ikinci-secki/');
});
await check('All 39 article/note templates create drafts without inherited publication dates',async()=>{
 const h=await offline(),writing=seed.filter(d=>['article','note'].includes(d.kind));assert.equal(writing.length,39);
 for(const [index,original] of writing.entries()){
  const def=h.api.S.catalog[original.template],dateFields=def.fields.filter(f=>['publication-dates','note-publication-date'].includes(f.semantic));assert.equal(dateFields.length,1,original.route+' publication field must be explicitly classified');
  await h.api.action('new');await h.submit('#new-form',{title:'Yeni yazı '+index,route:(original.kind==='article'?'/makaleler/':'/notlar/')+'yeni-tarih-'+index+'/',template:original.template});
  const copy=h.api.S.doc;assert.equal(copy.kind,original.kind);assert.equal(h.api.S.row.published_revision,null);
  for(const field of def.fields){if(field.semantic==='publication-dates')assert.equal(copy.values[field.id],'');else if(field.semantic==='note-publication-date')assert.equal(copy.values[field.id],original.values[field.id].split('·').slice(0,-1).map(s=>s.trim()).join(' · '));else if(field.label!=='Ana başlık')assert.equal(copy.values[field.id],original.values[field.id],original.route+' body field changed: '+field.id);}
  assert.deepEqual(h.api.S.seed.find(d=>d.template===original.template),original,'Creating a new draft cannot change the original seed.');
 }
});
await check('Duplicating removes overridden byline dates while retaining author and research dates',async()=>{
 for(const route of ['/makaleler/nasil-basarili-olunur/','/notlar/not-001/']){
  const h=await offline();h.api.openEditor(route);const source=h.api.S.doc,def=h.api.S.catalog[source.template],dateField=def.fields.find(f=>f.semantic),section=source.sections.find(s=>s.source===dateField.section),bodyField=def.fields.find(f=>f.id!==dateField.id&&f.type==='long'&&f.label!=='Ana başlık');assert.ok(bodyField);
  const override=source.kind==='article'?'Yayın: 4 Ekim 2026 · Son güncelleme: 8 Ekim 2026 · Yazar: Ziya Şakir Yılmaz':'Özel seri · NOT 042 · 4 Ekim 2026';
  section.values[dateField.id]=override;source.values[bodyField.id]='Araştırma 21 Eylül 2026 tarihinde yayımlandı; 2010 ve 2024 verileri karşılaştırıldı.';
  const bodySection=source.sections.find(s=>s.source===bodyField.section);bodySection.values[bodyField.id]='Son güncelleme: 29 Eylül 2026 araştırmasının yöntemi yeniden incelendi.';
  const before=structuredClone(source);await h.click('[data-action="duplicate"]');await h.submit('#new-form',{title:'Yeni tarihli içerik',route:source.kind==='article'?'/makaleler/yeni-tarih/':'/notlar/yeni-tarih/'});
  const copy=h.api.S.doc,expected=source.kind==='article'?'Yazar: Ziya Şakir Yılmaz':'Özel seri · NOT 042';assert.equal(copy.sections.find(s=>s.source===dateField.section).values[dateField.id],expected);assert.equal(copy.values[bodyField.id],before.values[bodyField.id]);assert.equal(copy.sections.find(s=>s.source===bodyField.section).values[bodyField.id],before.sections.find(s=>s.source===bodyField.section).values[bodyField.id]);assert.deepEqual(source,before,'The edited source must not be mutated by duplication.');
  await h.api.preview();const preview=new DOMParser().parseFromString(h.$('#modal iframe').srcdoc,'text/html'),node=preview.querySelector('[data-cms-node="'+dateField.node+'"]');assert.equal(node.textContent,expected);assert.ok(preview.body.textContent.includes('Son güncelleme: 29 Eylül 2026 araştırmasının yöntemi yeniden incelendi.'));assert.ok(!preview.body.textContent.includes('4 Ekim 2026'));assert.ok(!preview.body.textContent.includes('8 Ekim 2026'));
 }
});
await check('New content rejects duplicate and reserved routes before creating drafts',async()=>{
 const h=await offline();const initial=h.api.S.rows.length;await h.api.action('new');for(const route of ['/admin/','/api/cms/','/_global/','/kitaplar/','invalid']){await h.submit('#new-form',{title:'Örnek',route});assert.equal(h.api.S.rows.length,initial,route);}h.api.closeDialog();
});
await check('SEO metadata and social image remain editable and previewed',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');await h.click('[data-tab="seo"]');h.change('[data-meta="title"]','Yeni SEO başlığı');h.change('[data-meta="description"]','Kitapların yeni açıklaması.');h.change('[data-meta="ogImage"]','/assets/hero-poster.jpg');await h.click('#pick-og-image');await flush();assert.ok(h.$('#picker-grid'));assert.equal(h.$$('#picker-grid video').length,0);await h.click('[data-select-media]');h.change('[data-meta="ogImageAlt"]','Yeni paylaşım görseli <script>test</script>');assert.equal(h.api.S.doc.ogImageAltFor,h.api.S.doc.ogImage);await h.api.preview();const preview=new DOMParser().parseFromString(h.$('#modal iframe').srcdoc,'text/html');assert.equal(preview.title,'Yeni SEO başlığı');assert.equal(preview.querySelector('meta[name="description"]').content,'Kitapların yeni açıklaması.');assert.equal(preview.querySelector('meta[property="og:image:alt"]').content,'Yeni paylaşım görseli <script>test</script>');assert.equal(preview.head.querySelector('script'),null);
});
await check('Replacing a social image clears stale alt and measured card dimensions',async()=>{
 const asset={id:'new-social',url:'https://example.org/new-social.webp',path:'new-social.webp',mime:'image/webp',alt:'Yeni sahne fotoğrafı',archived:false};const h=await connected('owner',{cms_media:[asset]});h.api.openEditor('/kitaplar/');await h.click('[data-tab="seo"]');
 const card=Object.keys(socialImages)[0];h.change('[data-meta="ogImage"]',card);h.change('[data-meta="ogImageAlt"]','Eski kartın başlığı');h.change('[data-meta="ogImage"]','https://example.org/manual.jpg');assert.equal(h.api.S.doc.ogImageAlt,'');assert.equal(h.$('[data-meta="ogImageAlt"]').value,'');
 await h.click('#pick-og-image');await h.click('[data-select-media="https://example.org/new-social.webp"]');assert.equal(h.api.S.doc.ogImageAlt,asset.alt);assert.equal(h.api.S.doc.ogImageAltFor,asset.url);await h.api.preview();const preview=new DOMParser().parseFromString(h.$('#modal iframe').srcdoc,'text/html');assert.equal(preview.querySelector('meta[property="og:image:alt"]').content,asset.alt);for(const key of ['width','height','type'])assert.equal(preview.querySelector(`meta[property="og:image:${key}"]`),null);
 h.api.closeDialog();h.api.S.doc.ogImageAlt='a'.repeat(421);assert.ok(validateDocument(h.api.S.doc,h.api.S.catalog[h.api.S.doc.template]).some(e=>e.includes('420')));
});
await check('New and duplicated pages reset titled generated social cards but preserve custom photos',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');const card=Object.keys(socialImages)[0];h.api.S.doc.ogImage=card;h.api.S.doc.ogImageAlt='Eski kitap kartı';h.api.S.doc.ogImageAltFor=card;await h.click('[data-action="duplicate"]');await h.submit('#new-form',{title:'Yeni seçki',route:'/yeni-sosyal-secki/'});assert.equal(h.api.S.doc.ogImage,'');assert.equal(h.api.S.doc.ogImageAlt,'');await h.api.preview();let preview=new DOMParser().parseFromString(h.$('#modal iframe').srcdoc,'text/html');assert.ok(!preview.querySelector('meta[property="og:image"]').content.includes('/assets/og/'));assert.equal(preview.querySelector('meta[property="og:image:width"]'),null);h.api.closeDialog();
 h.api.S.doc.ogImage='https://example.org/portrait.jpg';h.api.S.doc.ogImageAlt='Ziya Şakir Yılmaz portresi';h.api.S.doc.ogImageAltFor=h.api.S.doc.ogImage;await h.click('[data-action="duplicate"]');await h.submit('#new-form',{title:'Özel fotoğraflı seçki',route:'/ozel-sosyal-secki/'});assert.equal(h.api.S.doc.ogImage,'https://example.org/portrait.jpg');assert.equal(h.api.S.doc.ogImageAlt,'Ziya Şakir Yılmaz portresi');
 const template=h.api.S.seed.find(d=>d.route==='/kitaplar/');template.ogImage=card;template.ogImageAlt='Eski şablon kartı';template.ogImageAltFor=card;await h.api.action('new');await h.submit('#new-form',{title:'Yeni içerik',route:'/yeni-sosyal-icerik/',template:template.template});assert.equal(h.api.S.doc.ogImage,'');assert.equal(h.api.S.doc.ogImageAlt,'');
});
await check('Image and video pickers filter types and searchable filenames',async()=>{
 const h=await offline();h.api.openEditor('/');for(const kind of ['image','video']){let chosen;await h.api.mediaPicker(url=>chosen=url,kind);const cards=h.$$('.media-card');assert.ok(cards.length);assert.equal(h.$$('#picker-grid '+(kind==='image'?'video':'img')).length,0);const link=h.$('[data-select-media]').dataset.selectMedia;h.change('#picker-search','no-such-file-123');assert.equal(h.$$('[data-select-media]').length,0);h.change('#picker-search',link.split('/').at(-1));await h.click('[data-select-media]');assert.equal(chosen,link);h.api.closeDialog();}
});
await check('Selecting an image carries its meaningful alternative text into the page draft',async()=>{
 const asset={id:'new-cover',url:'https://example.org/book.webp',path:'book.webp',mime:'image/webp',alt:'Yeni kitap kapağı',archived:false};const h=await connected('owner',{cms_media:[asset]});h.api.openEditor('/kitaplar/');h.api.S.section=h.api.S.doc.sections[1].id;h.api.editor();const def=h.api.S.catalog[h.api.S.doc.template],button=h.$$('[data-pick]').find(b=>{const field=def.fields.find(f=>f.id===JSON.parse(b.dataset.pick).field);return field.type==='image'&&field.target==='@src';});assert.ok(button);const ctx=JSON.parse(button.dataset.pick),field=def.fields.find(f=>f.id===ctx.field),alt=def.fields.find(f=>f.node===field.node&&f.target==='@alt');assert.ok(alt);await button.onclick();await h.click('[data-select-media="https://example.org/book.webp"]');assert.equal(h.api.targetFor(ctx)[alt.id],'Yeni kitap kapağı');await h.api.preview();const preview=new DOMParser().parseFromString(h.$('#modal iframe').srcdoc,'text/html');assert.equal(preview.querySelector('img[src="https://example.org/book.webp"]').getAttribute('alt'),'Yeni kitap kapağı');
});
await check('The original 20-question test supports questions, points, layer copy and order',async()=>{
 const h=await offline();h.api.navigate('test');await h.click('[data-tab="test"]');const t=h.api.S.doc.test,first=structuredClone(t.questions[0]);h.change('[data-test="questions.0.q"]','Yeni test sorusu');h.change('[data-test="questions.0.o.0.0"]','Yeni yanıt');h.change('[data-test="questions.0.o.0.1"]',4);assert.equal(t.questions[0].o[0][1],4);await h.click('[data-question-move="0|1"]');assert.equal(t.questions[1].q,'Yeni test sorusu');assert.equal(t.questions.length,20);assert.equal(Object.keys(t.layers).length,5);assert.equal(validateDocument(h.api.S.doc,h.api.S.catalog[h.api.S.doc.template]).length,0);h.change('[data-test="verdicts.0.v"]','Yeni sonuç başlığı');assert.equal(t.verdicts[0].v,'Yeni sonuç başlığı');assert.notEqual(first.q,t.questions[1].q);
});
await check('Owner/admin/editor permissions match the publishing and team UI',async()=>{
 for(const role of ['owner','admin','editor']){const h=await connected(role);h.api.openEditor('/kitaplar/');assert.equal(h.$('[data-action="save"]').disabled,false);assert.equal(h.$('[data-action="publish"]').disabled,role==='editor');await h.api.teamPage();assert.equal(h.$('[data-action="create-user"]').disabled,role!=='owner');if(role==='editor'){await h.api.action('publish');await h.api.action('unarchive');await h.api.action('create-user');assert.equal(h.db.calls.filter(c=>c.type==='rpc'||c.type==='function').length,0);}}
 const h=await offline();await h.api.action('save');await h.api.action('publish');await h.api.action('password');assert.equal(h.$('#modal'),null);
});
await check('Saving a draft sends only save RPC and leaves the published revision intact',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');h.change(h.textSelector(),'Yeni metin');await h.click('[data-action="save"]');const row=h.db.tables.cms_documents.find(r=>r.id==='/kitaplar/');assert.equal(row.revision,2);assert.equal(row.published_revision,1);assert.deepEqual(h.db.calls.filter(c=>c.type==='rpc').map(c=>c.name),['cms_save_document']);assert.equal(h.api.S.dirty,false);
});
await check('Publishing saves the changed draft first and uses its returned revision',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');h.change(h.textSelector(),'Yayına hazır');await h.click('[data-action="publish"]');const calls=h.db.calls.filter(c=>c.type==='rpc');assert.deepEqual(calls.map(c=>c.name),['cms_save_document','cms_publish_document']);assert.equal(calls[1].args.p_expected,2);assert.equal(h.api.S.row.published_revision,2);
});
await check('Revision conflicts preserve the draft and explain the conflict',async()=>{
 for(const code of ['PT409','40001']){const h=await connected();h.api.openEditor('/kitaplar/');h.change(h.textSelector(),'Kaybolmaması gereken taslak');h.db.setError({code,message:'REVISION_CONFLICT'});await h.click('[data-action="save"]');assert.equal(h.api.S.dirty,true);assert.match(h.$('#toasts').textContent,/başka bir kullanıcı/);assert.equal(h.api.S.busy,false);assert.equal(h.$('#app').inert,false);assert.equal(h.db.calls.filter(c=>c.type==='rpc').length,1,'Conflicts must never retry automatically');}
});
await check('An in-flight save cannot navigate away or publish another document',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');h.change(h.textSelector(),'Bekleyen kayıt');const release=h.db.holdNext();const pending=h.api.action('save');await flush();assert.equal(h.api.S.busy,true);assert.equal(h.$('#app').inert,true);h.api.navigate('pages');assert.equal(h.api.S.doc.id,'/kitaplar/');await h.api.action('publish');assert.equal(h.db.calls.filter(c=>c.type==='rpc').length,1);release();await pending;assert.equal(h.api.S.doc.id,'/kitaplar/');assert.equal(h.api.S.row.revision,2);assert.equal(h.$('#app').inert,false);
});
await check('Archive, unarchive and unpublish target the selected document revision',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');await h.api.action('archive');assert.equal(h.db.tables.cms_documents.find(r=>r.id==='/kitaplar/').archived,true);h.api.openEditor('/kitaplar/');assert.ok(h.$('[data-action="save"]').disabled);await h.api.action('unarchive');assert.equal(h.api.S.row.archived,false);await h.api.action('publish');await h.api.action('unpublish');assert.equal(h.db.tables.cms_documents.find(r=>r.id==='/kitaplar/').published_revision,null);
});
await check('Records beyond old list limits and the API default window stay reachable',async()=>{
 const docs=Array.from({length:1101},(_,i)=>({id:'doc-'+i,route:'/sayfa-'+i+'/',kind:'page',draft:structuredClone(seed[0]),revision:1,published_revision:1,archived:false}));
 const leads=Array.from({length:301},(_,i)=>({id:'lead-'+i,name:'Kişi '+i,email:'a'+i+'@example.org',topic:'keynote',status:'new',revision:1,created_at:'2026-10-12T00:00:00Z'}));
 const versions=Array.from({length:301},(_,i)=>({id:'version-'+i,document_id:'doc-0',revision:i+1,action:'save',created_at:'2026-10-12T00:00:00Z'}));
 const h=await connected('owner',{cms_documents:docs,cms_leads:leads,cms_versions:versions});assert.equal(h.api.S.rows.length,1101);h.api.S.view='leads';await h.api.leadsPage();assert.equal(h.api.S.leads.length,301);h.change('#lead-search','a300@example.org');assert.ok(h.$('[data-lead="lead-300"]'));h.api.openEditor('doc-0');h.api.S.tab='history';h.api.editor();await flush();assert.equal(h.$$('[data-restore]').length,301);assert.ok(h.db.calls.some(c=>c.table==='cms_documents'&&c.start===1000));
});
await check('Restoring a revision creates a draft without publishing',async()=>{
 const payload=structuredClone(seed.find(d=>d.id==='/kitaplar/'));payload.title='Eski sürüm başlığı';const h=await connected('owner',{cms_versions:[{id:'version-1',document_id:'/kitaplar/',revision:1,action:'save',created_at:'2026-10-12T00:00:00Z',payload}]});h.api.openEditor('/kitaplar/');await h.click('[data-tab="history"]');await h.click('[data-restore]');assert.equal(h.api.S.doc.title,'Eski sürüm başlığı');assert.equal(h.api.S.row.revision,2);assert.equal(h.api.S.row.published_revision,1);assert.deepEqual(h.db.calls.filter(c=>c.type==='rpc').map(c=>c.name),['cms_restore_document']);
});
await check('Invalid media types and over-50 MB files are rejected before Storage',async()=>{
 const h=await connected();await h.api.uploadFiles([{type:'image/svg+xml',size:1,name:'unsafe.svg'}]);await h.api.uploadFiles([{type:'video/mp4',size:50*1024*1024+1,name:'large.mp4'}]);assert.equal(h.db.calls.filter(c=>c.type==='upload').length,0);assert.match(h.$('#toasts').textContent,/50 MB/);
});
await check('A supported upload has a unique storage path and media metadata',async()=>{
 const h=await connected();await h.api.uploadFiles([{type:'image/webp',size:2048,name:'Portre.webp'}]);const call=h.db.calls.find(c=>c.type==='upload');assert.ok(call);assert.equal(call.bucket,'cms-public');assert.match(call.path,/^[\da-f-]{36}\.webp$/);assert.equal(call.options.upsert,false);assert.equal(h.db.tables.cms_media[0].alt,'Portre');assert.equal(h.db.tables.cms_media[0].created_by,'owner-id');assert.equal(h.api.S.media.length,media.length+1);
});
await check('Media alt text updates and archive preserve the file URL',async()=>{
 const item={id:'media-1',url:'https://example.org/photo.webp',path:'photo.webp',mime:'image/webp',alt:'Önceki',archived:false};const h=await connected('owner',{cms_media:[item]});await h.api.loadMedia();h.api.navigate('media');await h.click('[data-edit-media]');await h.submit('#media-edit',{alt:'Yeni alternatif metin'});assert.equal(item.alt,'Yeni alternatif metin');await h.click('[data-edit-media]');await h.click('#archive-media');assert.equal(item.archived,true);assert.equal(item.url,'https://example.org/photo.webp');assert.equal(h.db.calls.filter(c=>c.type==='upload').length,0);
});
await check('Lead notes/status and owner role changes call the expected revisions',async()=>{
 const lead={id:'lead-1',name:'Örnek',email:'ornek@example.org',company:'Şirket',topic:'keynote',status:'new',revision:7};const member={user_id:'editor-id',email:'editor@example.org',role:'editor',active:true};const h=await connected('owner',{cms_leads:[lead],cms_members:[member]});await h.api.leadsPage();await h.click('[data-lead]');await h.submit('#lead-form',{status:'contacted',notes:'Takip notu'});assert.equal(lead.status,'contacted');assert.equal(lead.notes,'Takip notu');const call=h.db.calls.find(c=>c.name==='cms_update_lead');assert.equal(call.args.p_expected,7);await h.api.teamPage();h.change('[data-role="editor-id"]','admin');await h.click('[data-member]');assert.equal(member.role,'admin');await h.click('[data-active]');assert.equal(member.active,false);
});
await check('Password form rejects mismatch and submits matching values once',async()=>{
 const h=await connected();h.api.navigate('settings');await h.click('[data-action="password"]');await h.submit('#password-form',{password:'not-real-demo-password',confirm:'mismatch-demo-password'});assert.equal(h.db.calls.filter(c=>c.type==='auth').length,0);await h.submit('#password-form',{password:'not-real-demo-password',confirm:'not-real-demo-password'});assert.equal(h.db.calls.filter(c=>c.type==='auth'&&c.action==='updateUser').length,1);assert.equal(h.$('#modal'),null);
});
await check('Dirty navigation confirmation can cancel leaving the active draft',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');h.change(h.textSelector(),'Kaydedilmemiş');h.setConfirm(false);h.api.navigate('pages');assert.equal(h.api.S.doc.id,'/kitaplar/');h.setConfirm(true);h.api.navigate('pages');assert.equal(h.api.S.doc,null);assert.equal(h.api.S.dirty,false);
});

const previewDocument=async h=>{
 await h.api.preview();const frame=h.$('#modal iframe');assert.ok(frame,'Preview failed: '+h.$('#toasts').textContent);
 assert.equal(frame.getAttribute('sandbox'),'allow-same-origin','Preview must not enable iframe script execution');
 const document=new DOMParser().parseFromString(frame.srcdoc,'text/html');
 assert.equal(document.querySelector('script,iframe,form'),null,'Preview cannot execute scripts, embeds or forms');
 for(const node of document.querySelectorAll('*'))assert.equal([...node.attributes].some(attr=>attr.name.startsWith('on')),false,'Preview cannot retain inline event handlers');
 for(const control of document.querySelectorAll('a,button,input,select,textarea')){
  assert.equal(control.getAttribute('tabindex'),'-1');assert.equal(control.style.pointerEvents,'none');
  if(control.tagName!=='A')assert.ok(control.hasAttribute('disabled'),'Preview controls must remain disabled');
 }
 h.api.closeDialog();return document;
};
const navAction=(action,path)=>`[data-navigation-action="${action}"][data-navigation-path="${path}"]`;
const collectionAction=(action,category,item)=>`[data-collection-action="${action}"][data-category="${category}"]${item===undefined?'':`[data-item="${item}"]`}`;
const renderedTemplate=payload=>{const doc=new DOMParser().parseFromString(templates[payload.template],'text/html');applyContent(doc,payload,catalog[payload.template],{global:payload.kind==='global'});return doc;};
await check('Opening advanced editors derives defaults without changing or dirtying authored documents',async()=>{
 for(const [route,tab] of [['_global','navigation'],['/makaleler/','collection'],['/hayattan-notlar/','collection'],['/','experience'],['/iletisim/','experience'],['/testler/kafa-yapisi-testi/','experience']]){
  const h=await offline();h.api.openEditor(route);const before=structuredClone(h.api.S.doc),originals=structuredClone(h.api.S.seed);await h.click(`[data-tab="${tab}"]`);assert.ok(h.$('#advanced-editor'),'Missing advanced editor '+route+' '+h.$('#app').textContent.slice(-300));assert.equal(h.api.S.dirty,false,route);assert.deepEqual(h.api.S.doc,before,route);assert.deepEqual(h.api.S.seed,originals,route);
 }
});
await check('Every video hero exposes its video workspace without changing the draft on entry',async()=>{
 const h=await offline();let count=0;
 for(const row of h.api.S.rows.filter(r=>r.kind!=='global')){
  const doc=renderedTemplate(row.draft),defaults=dependencies.experienceDefaults(doc,row.draft);
  if(!defaults.playlist?.length)continue;
  h.api.openEditor(row.id);const before=structuredClone(h.api.S.doc);
  assert.ok(h.$('[data-tab="experience"]'),'Video tab must be reachable on '+row.route);
  await h.click('[data-tab="experience"]');
  assert.ok(h.$('[data-video-editor]'),'Video workspace must mount on '+row.route);
  assert.deepEqual(h.api.S.doc,before,'Opening must preserve '+row.route);
  assert.equal(h.api.S.dirty,false);count++;
 }
 assert.ok(count>1,'Both the home and subpage heroes must be supported');
 console.log('INFO '+count+' hero video workspaces reachable');
});
await check('The current native home composition exposes its clip studio without legacy TEDx opening controls',async()=>{
 const h=await connected();h.api.openEditor('/');const before=structuredClone(h.api.S.doc);
 await h.click('[data-tab="experience"]');
 assert.equal(h.$('[data-opening-attr]'),null,'The revised native hero must not show an unused YouTube opening editor');
 assert.ok(h.$('[data-video-editor]'),'The composed home video stays editable');
 const clips=dependencies.experienceDefaults(h.api.S.advancedDefaults.document,h.api.S.doc).playlist;
 assert.equal(clips.length,1);assert.equal(clips[0].src,'/assets/hero-stage-clean-1080.mp4');
 assert.deepEqual(h.api.S.doc,before,'Opening video management does not rewrite a draft');
});
await check('Legacy TEDx opening ranges retain preview validation and cannot publish through a draft save',async()=>{
 const h=await connected();h.api.openEditor('/');await h.click('[data-tab="experience"]');
 const published=structuredClone(h.db.tables.cms_published.find(r=>r.route==='/').payload);
 // The approved home now has a native composition. Exercise retained legacy
 // editing support with an isolated template/catalog fixture, not live content.
 const host=h.api.S.advancedDefaults.document.querySelector('.hero-vid');
 host.setAttribute('data-tedx-hero','');host.removeAttribute('data-video-sequence');
 host.setAttribute('data-video-id','u-p2y6JH3aA');
 const node=host.getAttribute('data-cms-node'),section=h.api.S.doc.sections[0].source;
 assert.ok(node,'Legacy fixture uses an existing catalog node');
 for(const [attribute,value] of [['data-clip-start','31'],['data-clip-end','35']]){
  host.setAttribute(attribute,value);const id=node+':@'+attribute;
  h.api.S.catalog['/'].fields.push({id,node,target:'@'+attribute,label:attribute,type:'number',section});
  h.api.S.doc.values[id]=value;
 }
 h.api.editor();
 const start=h.$('[data-opening-attr="data-clip-start"]'),end=h.$('[data-opening-attr="data-clip-end"]');
 assert.ok(start&&end,'Opening has named start and end controls');
 h.change('[data-opening-attr="data-clip-start"]',35);h.change('[data-opening-attr="data-clip-end"]',31);
 await h.click('[data-preview-opening]');assert.equal(h.$('[data-opening-preview] iframe'),null);
 assert.match(h.$('[data-opening-error]').textContent,/başlangıçtan/);
 const calls=h.db.calls.filter(c=>c.type==='rpc').length;await h.click('[data-action="save"]');
 assert.equal(h.db.calls.filter(c=>c.type==='rpc').length,calls,'Invalid opening cannot reach the save RPC');
 h.change('[data-opening-attr="data-clip-start"]',31);h.change('[data-opening-attr="data-clip-end"]',35);
 await h.click('[data-preview-opening]');const frame=h.$('[data-opening-preview] iframe');assert.ok(frame);
 const url=new URL(frame.src);assert.equal(url.hostname,'www.youtube-nocookie.com');assert.equal(url.searchParams.get('start'),'31');assert.equal(url.searchParams.get('end'),'35');
 await h.click('[data-action="save"]');assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/').payload,published,'Opening preview and draft save cannot publish');
});
await check('Video studio adds, trims, selects covers, reorders and removes clips while publication stays explicit',async()=>{
 const h=await connected();h.api.openEditor('/liderlik/');await h.click('[data-tab="experience"]');
 const published=structuredClone(h.db.tables.cms_published.find(r=>r.route==='/liderlik/').payload);
 const initial=dependencies.experienceDefaults(h.api.S.advancedDefaults.document,h.api.S.doc).playlist;
 await h.click('[data-video-action="add-library"]');assert.ok(h.$('#picker-grid video'));assert.equal(h.$$('#picker-grid img').length,0);
 const chosen=h.$('[data-select-media]').dataset.selectMedia;await h.click('[data-select-media]');
 assert.equal(h.api.S.doc.experience.playlist.length,initial.length+1);const addedId=h.api.S.doc.experience.playlist.at(-1).id;
 assert.equal(h.api.S.doc.experience.playlist.at(-1).src,chosen);assert.equal(h.$('#modal'),null);
 h.loadVideo(120);h.change('[data-video-end]',7.5,'change');h.change('[data-video-start]',3.25,'change');h.change('[data-video-focal]','left center','change');
 await h.click('[data-video-action="cover-library"]');assert.equal(h.$$('#picker-grid video').length,0);const poster=h.$('[data-select-media]').dataset.selectMedia;await h.click('[data-select-media]');
 let added=h.api.S.doc.experience.playlist.find(c=>c.id===addedId);assert.equal(added.start,3.25);assert.equal(added.end,7.5);assert.equal(added.poster,poster);assert.equal(added.focal,'left center');
 await h.click(`[data-video-move="${initial.length}|-1"]`);assert.equal(h.api.S.doc.experience.playlist[initial.length-1].id,addedId);
 const removedId=h.api.S.doc.experience.playlist.at(-1).id;await h.click(`[data-video-remove="${initial.length}"]`);assert.equal(h.api.S.doc.experience.playlist.some(c=>c.id===removedId),false);assert.equal(h.api.S.doc.experience.playlist.length,initial.length);
 assert.equal(h.db.calls.some(c=>c.type==='query'&&c.table==='cms_media'&&c.mode==='update'),false,'Removing from a playlist must not archive shared media');
 const clips=structuredClone(h.api.S.doc.experience.playlist);await h.click('[data-action="save"]');
 assert.deepEqual(h.db.tables.cms_documents.find(r=>r.route==='/liderlik/').draft.experience.playlist,clips);
 assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/liderlik/').payload,published);
 await h.click('[data-action="publish"]');assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/liderlik/').payload.experience.playlist,clips);
});
await check('Video range errors preserve the last valid model and cleared end means natural video end',async()=>{
 const h=await connected();h.api.openEditor('/liderlik/');await h.click('[data-tab="experience"]');h.loadVideo(10);
 h.change('[data-video-end]',7,'change');h.change('[data-video-start]',3,'change');const valid=structuredClone(h.api.S.doc.experience.playlist);
 for(const [selector,value] of [['[data-video-end]',2],['[data-video-end]',11],['[data-video-start]',-1],['[data-video-start]',12]]){
  h.change(selector,value,'change');assert.deepEqual(h.api.S.doc.experience.playlist,valid);assert.equal(h.$('[data-video-message]').dataset.tone,'error');
 }
 h.change('[data-video-end]','','change');assert.equal(Object.hasOwn(h.api.S.doc.experience.playlist[0],'end'),false);assert.equal(h.api.S.doc.experience.playlist[0].start,3);
 await h.click('[data-video-action="reset-trim"]');assert.equal(h.api.S.doc.experience.playlist[0].start,0);assert.equal(Object.hasOwn(h.api.S.doc.experience.playlist[0],'end'),false);
});
await check('Ordered video preview advances at trim boundaries, stops without looping and makes no publish calls',async()=>{
 const h=await connected();h.api.openEditor('/liderlik/');h.api.S.doc.experience={playlist:[
  {id:'first',src:'/assets/first.mp4',poster:'/assets/hero-poster.jpg',focal:'center',start:3,end:5},
  {id:'second',src:'/assets/second.mp4',poster:'/assets/hero-poster.jpg',focal:'left center',start:8,end:10}
 ]};await h.click('[data-tab="experience"]');h.toggle('[data-video-loop]',false);
 const original=structuredClone(h.api.S.doc),calls=h.db.calls.filter(c=>c.type==='rpc').length;
 await h.click('[data-video-action="preview-all"]');let video=h.loadVideo(20);assert.equal(video.currentTime,3);assert.equal(video.paused,false);
 video.currentTime=5;video.dispatchEvent(new h.window.Event('timeupdate'));await flush();assert.equal(video.src,'/assets/second.mp4');h.loadVideo(20);assert.equal(video.currentTime,8);
 video.currentTime=10;video.dispatchEvent(new h.window.Event('timeupdate'));await flush();assert.equal(video.paused,true);assert.match(h.$('[data-video-message]').textContent,/tamamlandı/);
 assert.deepEqual(h.api.S.doc,original);assert.equal(h.db.calls.filter(c=>c.type==='rpc').length,calls);
 await h.click('[data-tab="content"]');assert.equal(video.paused,true);assert.equal(video.getAttribute('src'),null,'Leaving the editor must release its playback source');
});
await check('Picker upload keeps the current video draft and adds the uploaded media without publishing',async()=>{
 const h=await connected();h.api.openEditor('/liderlik/');await h.click('[data-tab="experience"]');
 const doc=h.api.S.doc,published=structuredClone(h.db.tables.cms_published.find(r=>r.route==='/liderlik/').payload),before=dependencies.experienceDefaults(h.api.S.advancedDefaults.document,doc).playlist.length;
 await h.click('[data-video-action="add-library"]');const file={name:'Sahne.mp4',type:'video/mp4',size:1024,lastModified:1};
 const input=h.$('#picker-upload');assert.ok(input,'Picker exposes upload alongside the archive');await input.onchange({target:{files:[file]}});await flush();
 assert.equal(h.api.S.doc,doc);assert.ok(h.$('[data-video-editor]'));assert.equal(h.api.S.doc.experience.playlist.length,before+1);assert.equal(h.api.S.doc.experience.playlist.at(-1).src,h.db.tables.cms_media[0].url);
 assert.equal(h.db.calls.filter(c=>c.type==='upload').length,1);assert.equal(h.db.calls.some(c=>c.type==='rpc'),false);assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/liderlik/').payload,published);assert.equal(h.api.S.busy,false);
});
await check('Menu editor adds links, selects pages, reorders, nests, hides and safely renders new tabs',async()=>{
 const h=await connected();h.api.navigate('global');await h.click('[data-tab="navigation"]');const defaults=structuredClone(h.api.S.advancedDefaults.navigation),count=defaults.primary.length;
 await h.click(navAction('add','primary'));assert.equal(h.api.S.doc.navigation.primary.length,count+1);h.change(`[data-navigation-page="primary.${count}"]`,'/kitaplar/','change');await flush();
 assert.equal(h.api.S.doc.navigation.primary[count].href,'/kitaplar/');assert.notEqual(h.api.S.doc.navigation.primary[count].label,'Yeni bağlantı');
 h.change(`[data-navigation-bind="primary.${count}.label"]`,'Editoryal kitaplar');h.toggle(`[data-navigation-bind="primary.${count}.newTab"]`,true);await h.click(navAction('up',`primary.${count}`));const index=count-1;assert.equal(h.api.S.doc.navigation.primary[index].label,'Editoryal kitaplar');
 await h.click(navAction('add',`primary.${index}.children`));h.change(`[data-navigation-page="primary.${index}.children.0"]`,'/makaleler/','change');await flush();h.change(`[data-navigation-bind="primary.${index}.children.0.label"]`,'Seçili yazılar');
 h.toggle('[data-navigation-bind="primary.0.hidden"]',true);const model=structuredClone(h.api.S.doc.navigation);assert.equal(h.api.S.dirty,true);assert.deepEqual(h.api.S.advancedDefaults.navigation,defaults,'Default menu must remain immutable');
 const preview=await previewDocument(h),links=[...preview.querySelectorAll('.nav-links > li > a')];assert.equal(links.length,count);assert.equal(links.some(a=>a.textContent===defaults.primary[0].label),false);const parent=links.find(a=>a.textContent==='Editoryal kitaplar');assert.equal(parent.getAttribute('href'),'/kitaplar/');assert.equal(parent.target,'_blank');assert.match(parent.rel,/noopener/);assert.equal(parent.parentElement.querySelector('.cms-submenu a').textContent,'Seçili yazılar');assert.equal(parent.parentElement.querySelector('.cms-submenu a').getAttribute('href'),'/makaleler/');assert.deepEqual(h.api.S.doc.navigation,model);
 await h.click('[data-action="save"]');const row=h.db.tables.cms_documents.find(r=>r.kind==='global');assert.deepEqual(row.draft.navigation,model);assert.equal(h.db.tables.cms_published.find(r=>r.kind==='global').payload.navigation,undefined,'Save alone cannot affect visitor navigation');await h.click('[data-action="publish"]');assert.deepEqual(h.db.tables.cms_published.find(r=>r.kind==='global').payload.navigation,model);
});
await check('Mobile links and footer groups have independent order, visibility, links and removal',async()=>{
 const h=await offline();h.api.navigate('global');await h.click('[data-tab="navigation"]');const count=h.api.S.advancedDefaults.navigation.footer.length;
 await h.click(navAction('add-group','footer'));h.change(`[data-navigation-bind="footer.${count}.title"]`,'Yeni kaynaklar');await h.click(navAction('add',`footer.${count}.items`));h.change(`[data-navigation-page="footer.${count}.items.0"]`,'/makaleler/','change');await flush();await h.click(navAction('up',`footer.${count}`));assert.equal(h.api.S.doc.navigation.footer[count-1].title,'Yeni kaynaklar');
 h.toggle('[data-navigation-bind="footer.0.hidden"]',true);h.toggle('[data-navigation-bind="mobileSecondary.0.hidden"]',true);const mobileBefore=h.api.S.doc.navigation.mobileSecondary.length;h.setConfirm(false);await h.click(navAction('remove','mobileSecondary.1'));assert.equal(h.api.S.doc.navigation.mobileSecondary.length,mobileBefore);h.setConfirm(true);await h.click(navAction('remove','mobileSecondary.1'));assert.equal(h.api.S.doc.navigation.mobileSecondary.length,mobileBefore-1);
 const preview=await previewDocument(h);assert.equal(preview.querySelectorAll('.menu-secondary a').length,mobileBefore-2);assert.ok([...preview.querySelectorAll('.footer-group h2')].some(n=>n.textContent==='Yeni kaynaklar'));assert.equal(preview.querySelectorAll('.footer-group,.footer-programs').length,count);
});
await check('Archive editor honors labels, item order, hidden/excluded items and category moves in preview',async()=>{
 const h=await connected();h.api.openEditor('/makaleler/');await h.click('[data-tab="collection"]');const initial=structuredClone(h.api.S.advancedDefaults.collection),first=initial.categories[0].items[0],second=initial.categories[0].items[1];
 h.change('[data-collection-label="0:0"]','Özel okuma başlığı');h.change('[data-collection-badge="0:0"]','Editör seçimi');await h.click(collectionAction('item-down',0,0));assert.equal(h.api.S.doc.collection.categories[0].items[1].route,first.route);assert.equal(h.api.S.doc.collection.categories[0].items[0].route,second.route);
 h.toggle('[data-collection-visible="0:0"]',false);const excluded=h.api.S.doc.collection.categories[0].items[2].route;await h.click(collectionAction('item-remove',0,2));assert.ok(h.api.S.doc.collection.excluded.includes(excluded));
 h.change('[data-collection-category-label="0"]','Özel seçki');await h.click(collectionAction('category-down',0));assert.equal(h.api.S.doc.collection.categories[1].label,'Özel seçki');const draft=structuredClone(h.api.S.doc.collection),preview=await previewDocument(h),lists=[...preview.querySelectorAll('.post-list')],visible=lists[1].querySelector('a');
 assert.equal(visible.getAttribute('href'),first.route);assert.equal(visible.querySelector('span').textContent,'Özel okuma başlığı');assert.equal(visible.querySelector('.cat').textContent,'Editör seçimi');assert.equal(preview.querySelector(`.post-list a[href="${second.route}"]`),null);assert.equal(preview.querySelector(`.post-list a[href="${excluded}"]`),null);assert.equal(lists[1].previousElementSibling.textContent.startsWith('Özel seçki'),true);assert.deepEqual(h.api.S.doc.collection,draft,'Preview must not mutate collection');
 await h.click('[data-action="publish"]');assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/makaleler/').payload.collection,draft);
});
await check('Archive preview appends new published entries deterministically and keeps drafts private',async()=>{
 const h=await connected(),base=structuredClone(seed.find(d=>d.kind==='article'));
 for(const [slug,published] of [['z-yeni',true],['a-yeni',true],['taslak-yeni',false]]){const d={...structuredClone(base),id:slug,route:`/makaleler/${slug}/`,title:`${slug} başlığı | SEO`};h.db.tables.cms_documents.push({id:d.id,route:d.route,kind:d.kind,draft:d,revision:1,published_revision:published?1:null,archived:false});if(published)h.db.tables.cms_published.push({route:d.route,kind:d.kind,title:d.title,payload:d});}
 await h.api.refreshRows();h.api.openEditor('/makaleler/');await h.click('[data-tab="collection"]');h.change('[data-collection-category-label="0"]','Yeni yayınlar');let preview=await previewDocument(h),links=[...preview.querySelector('.post-list').querySelectorAll('a')].map(a=>a.getAttribute('href'));assert.deepEqual(links.slice(-2),['/makaleler/a-yeni/','/makaleler/z-yeni/']);assert.equal(preview.querySelector('.post-list a[href="/makaleler/taslak-yeni/"]'),null);
 h.toggle('[data-collection-auto]',false);preview=await previewDocument(h);assert.equal(preview.querySelector('.post-list a[href="/makaleler/a-yeni/"]'),null);
 h.change('[data-collection-add-route="1"]','/makaleler/taslak-yeni/','change');await h.click(collectionAction('item-add',1));assert.ok(h.api.S.doc.collection.categories[1].items.some(i=>i.route==='/makaleler/taslak-yeni/'));preview=await previewDocument(h);assert.equal(preview.querySelector('.post-list a[href="/makaleler/taslak-yeni/"]'),null);
});
await check('Collection keyboard sorting and cross-category moves keep the same authored entry',async()=>{
 const h=await offline();h.api.openEditor('/makaleler/');await h.click('[data-tab="collection"]');const first=structuredClone(h.api.S.advancedDefaults.collection.categories[0].items[0]);const event=new h.window.Event('keydown');Object.assign(event,{altKey:true,key:'ArrowDown'});h.$('[data-collection-drag-item="0:0"]').dispatchEvent(event);await flush();assert.equal(h.api.S.doc.collection.categories[0].items[1].route,first.route);
 h.change('[data-collection-destination="0:1"]','2','change');await flush();assert.deepEqual(h.api.S.doc.collection.categories[2].items.at(-1),first);h.toggle('[data-collection-category-visible="2"]',false);const preview=await previewDocument(h);assert.equal(preview.querySelector(`.post-list a[href="${first.route}"]`),null);
});
await check('Page preview uses published global navigation; global preview uses the published home',async()=>{
 const h=await connected(),globalRow=h.db.tables.cms_documents.find(r=>r.kind==='global'),homeRow=h.db.tables.cms_documents.find(r=>r.route==='/'),liveGlobal=h.db.tables.cms_published.find(r=>r.kind==='global'),liveHome=h.db.tables.cms_published.find(r=>r.route==='/');
 const model=deriveNavigation(renderedTemplate(liveGlobal.payload));liveGlobal.payload.navigation=structuredClone(model);liveGlobal.payload.navigation.primary[0].label='Yayındaki menü';globalRow.draft.navigation=structuredClone(model);globalRow.draft.navigation.primary[0].label='Taslak menü';
 const h1=catalog[homeRow.draft.template].fields.find(f=>f.label==='Ana başlık');liveHome.payload.values[h1.id]='Yayındaki ana sayfa';homeRow.draft.values[h1.id]='Taslak ana sayfa';await h.api.refreshRows();
 h.api.openEditor('/kitaplar/');let preview=await previewDocument(h);assert.equal(preview.querySelector('.nav-links a').textContent,'Yayındaki menü');assert.equal(preview.body.textContent.includes('Taslak menü'),false);
 h.api.navigate('global');preview=await previewDocument(h);assert.equal(preview.querySelector('.nav-links a').textContent,'Taslak menü');assert.ok(preview.querySelector('h1').textContent.includes('Yayındaki ana sayfa'));assert.equal(preview.querySelector('h1').textContent.includes('Taslak ana sayfa'),false);
 const draft=h.api.S.doc,visitorDoc=new DOMParser().parseFromString(templates[liveHome.payload.template],'text/html'),shared=new DOMParser().parseFromString(templates[draft.template],'text/html');composeContent(visitorDoc,liveHome.payload,catalog[liveHome.payload.template],{sharedDocument:shared,sharedPayload:draft,sharedDefinition:catalog._global,canonicalOrigin:'https://example.org'});
 const navigationState=document=>[...document.querySelectorAll('header.site a')].map(link=>({text:link.textContent,href:link.getAttribute('href'),target:link.getAttribute('target'),rel:link.getAttribute('rel'),current:link.getAttribute('aria-current'),expanded:link.getAttribute('aria-expanded'),className:link.className}));
 assert.deepEqual(navigationState(preview),navigationState(visitorDoc),'Preview and visitor pipeline must retain identical navigation content, targets and current state');
 const previewButtons=[...preview.querySelectorAll('header.site button')];assert.ok(previewButtons.length);
 assert.ok(previewButtons.every(button=>button.hasAttribute('disabled')&&button.getAttribute('tabindex')==='-1'),'Header controls are intentionally disabled only in preview');
});
await check('Repeaters keep hidden content editable and support actual drag ordering with preview parity',async()=>{
 const h=await offline();h.api.openEditor('/kitaplar/');const section=h.api.S.doc.sections.find(s=>s.groups.length),group=section.groups[0];h.api.S.section=section.id;h.api.editor();const itemField=`[data-reorder-item="${group.id}|0"] [data-bind]`,field=h.$(itemField),binding=JSON.parse(field.dataset.bind);assert.equal(binding.scope,'item');h.change(itemField,'Gizli kitap başlığı');const hiddenId=group.items[0].id;h.toggle(`[data-item-visible="${group.id}|0"]`,false);assert.equal(group.items[0].hidden,true);assert.ok(h.$(`[data-reorder-item="${group.id}|0"]`),'Hidden item must stay editable');let preview=await previewDocument(h);assert.equal(preview.body.textContent.includes('Gizli kitap başlığı'),false);
 h.toggle(`[data-item-visible="${group.id}|0"]`,true);const transfer={setData(){},effectAllowed:''};h.$(`[data-drag-item="${group.id}|0"]`).ondragstart({dataTransfer:transfer});h.$(`[data-reorder-item="${group.id}|2"]`).ondrop({preventDefault(){}});assert.equal(group.items[2].id,hiddenId);preview=await previewDocument(h);assert.ok(preview.body.textContent.includes('Gizli kitap başlığı'));assert.equal(h.api.S.dirty,true);
});
await check('SEO indexing policy can be changed, saved and previewed without changing publication',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');await h.click('[data-tab="seo"]');h.change('[data-meta="robots"]','noindex');assert.equal(h.api.S.doc.robots,'noindex');let preview=await previewDocument(h);assert.match(preview.querySelector('meta[name="robots"]').content,/^noindex,/);await h.click('[data-action="save"]');assert.equal(h.db.tables.cms_documents.find(r=>r.route==='/kitaplar/').draft.robots,'noindex');assert.notEqual(h.db.tables.cms_published.find(r=>r.route==='/kitaplar/').payload.robots,'noindex');h.change('[data-meta="robots"]','index');preview=await previewDocument(h);assert.match(preview.querySelector('meta[name="robots"]').content,/^index,/);
});

await check('Logout is available in both account locations and preserves cancelled or failed drafts',async()=>{
 const h=await connected();h.api.openEditor('/kitaplar/');assert.equal(h.$$('[data-action="logout"]').length,2);assert.ok(h.$('.topbar [data-action="logout"]'));assert.ok(h.$('.sidebar-foot [data-action="logout"]'));
 const input=h.$(h.textSelector());h.change(h.textSelector(),input.value+' kaydedilmedi');const doc=h.api.S.doc;h.setConfirm(false);await h.click('.topbar [data-action="logout"]');assert.equal(h.api.S.doc,doc);assert.equal(h.api.S.dirty,true);assert.equal(h.db.calls.some(c=>c.action==='signOut'),false);
 h.setConfirm(true);h.db.client.auth.signOut=async()=>({error:{message:'Bağlantı kesildi'}});await h.click('.sidebar-foot [data-action="logout"]');assert.equal(h.api.S.doc,doc);assert.equal(h.api.S.member.role,'owner');assert.equal(h.api.S.dirty,true);assert.match(h.$('#toasts').textContent,/Çıkış yapılamadı/);assert.ok(h.$('.topbar [data-action="logout"]'));
 let options;h.db.client.auth.signOut=async value=>(options=value,{error:null});h.api.setMenu(true);assert.equal(h.document.body.style.overflow,'hidden');await h.click('.sidebar-foot [data-action="logout"]');assert.equal(options.scope,'local');assert.equal(h.api.S.member,null);assert.equal(h.api.S.doc,null);assert.equal(h.api.S.dirty,false);assert.equal(h.document.body.style.overflow,'');assert.ok(h.$('#login-form'));
});
await check('Books open directly on their list and additions work after every book is removed',async()=>{
 const h=await connected();h.api.navigate('books');const def=h.api.S.catalog[h.api.S.doc.template],section=h.api.S.doc.sections.find(s=>s.id===h.api.S.section),group=section.groups.find(g=>def.groups.find(d=>d.id===g.id)?.label==='Kitaplar');assert.ok(group);assert.ok(h.$('[data-action="add-book"]'));assert.equal(h.$$('.book-item').length,group.items.length);assert.equal(h.$('.book-summary h4').textContent,'Kurşun Geçirmez Kafa Yapısı');assert.equal(h.$$('.book-row [data-item-remove]').length,group.items.length);
 const originalPublished=structuredClone(h.db.tables.cms_published.find(r=>r.route==='/kitaplar/').payload);
 while(group.items.length)await h.click(`[data-item-remove="${group.id}|0"]`);assert.equal(h.$$('.book-item').length,0);assert.ok(h.$('.book-library .empty-state'));assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/kitaplar/').payload,originalPublished);
 await h.click('[data-action="add-book"]');assert.equal(group.items.length,1);const added=group.items[0],detail=h.$(`[data-book-editor="${added.id}"]`);assert.ok(detail.open);assert.equal(added.hidden,true);const base=def.groups.find(g=>g.id===group.id).items.find(i=>i.id===added.source),fields=def.fields.filter(f=>base.fields.includes(f.id));assert.equal(fields.filter(f=>f.type==='url').every(f=>added.values[f.id]===''),true);assert.equal(fields.filter(f=>f.type==='image').every(f=>added.values[f.id]===''),true);
 const title=fields.find(f=>/başlı[kğ]/iu.test(f.label)),titleInput=[...detail.querySelectorAll('[data-bind]')].find(el=>JSON.parse(el.dataset.bind).field===title.id);h.change('#'+titleInput.id,'Yeni yazar kitabı');h.toggle(`[data-item-visible="${group.id}|0"]`,true);assert.equal(group.items[0].hidden,false);assert.equal(h.$('.book-summary h4').textContent,'Yeni yazar kitabı');await h.click('[data-action="save"]');assert.equal(h.db.tables.cms_documents.find(r=>r.route==='/kitaplar/').draft.sections.find(s=>s.id===section.id).groups.find(g=>g.id===group.id).items[0].values[title.id],'Yeni yazar kitabı');assert.deepEqual(h.db.tables.cms_published.find(r=>r.route==='/kitaplar/').payload,originalPublished);
});
await check('Removing a book updates its reading-guide row and preserves unrelated custom rows',async()=>{
 const h=await connected();h.api.navigate('books');const doc=h.api.S.doc,def=h.api.S.catalog[doc.template],section=doc.sections.find(s=>s.id===h.api.S.section),group=section.groups[0],guide=section.groups[1],guideDef=def.groups.find(g=>g.id===guide.id),custom=structuredClone(guide.items[0]);custom.id='custom-guide';for(const id of guideDef.items.find(i=>i.id===custom.source).fields)if(def.fields.find(f=>f.id===id)?.type==='text')custom.values[id]='Bağımsız rehber';guide.items.push(custom);
 const count=guide.items.length;await h.click(`[data-item-copy="${group.id}|0"]`);await h.click(`[data-item-remove="${group.id}|1"]`);assert.equal(guide.items.length,count,'Removing a duplicate must keep the surviving book guide');await h.click(`[data-item-remove="${group.id}|0"]`);assert.equal(guide.items.length,count-1);assert.ok(guide.items.some(i=>i.id==='custom-guide'));assert.match(h.confirmations.at(-1),/Okuma rehberindeki/);await h.click('[data-action="publish"]');const published=h.db.tables.cms_published.find(r=>r.route==='/kitaplar/').payload;assert.equal(published.sections.find(s=>s.id===section.id).groups.find(g=>g.id===group.id).items.length,3);assert.equal(published.sections.find(s=>s.id===section.id).groups.find(g=>g.id===guide.id).items.length,count-1);
});


await check('User creation previews the generated password and retains it in the result dialog',async()=>{
 const h=await connected();h.db.client.auth.getSession=async()=>({data:{session:{access_token:'owner-token'}}});let requests=0;
 h.setFetch(async(url,options)=>{requests++;assert.equal(url,'/api/cms/users');assert.equal(options.headers.Authorization,'Bearer owner-token');const body=JSON.parse(options.body);assert.equal(body.email,'new@example.org');assert.equal(body.role,'admin');assert.match(body.temporaryPassword,/^Zy!4[a-f0-9]{32}$/);return {ok:true,json:async()=>({ok:true,email:'new@example.org',temporaryPassword:'Zy!4temporary-secret'})};});
 await h.api.teamPage();await h.api.action('create-user');assert.match(h.$('[name="temporaryPassword"]').value,/^Zy!4[a-f0-9]{32}$/);await h.submit('#create-user-form',{email:'new@example.org',role:'admin'});
 assert.equal(requests,1);assert.equal(h.$('#created-user-password').value,'Zy!4temporary-secret');assert.ok(!JSON.stringify(h.api.S).includes('temporary-secret'));assert.equal(h.db.calls.filter(c=>c.type==='function').length,0);
 h.api.closeDialog();assert.equal(h.$('#created-user-password'),null);
});
await check('Failed user creation preserves fields and displays a persistent error',async()=>{
 const h=await connected();h.db.client.auth.getSession=async()=>({data:{session:{access_token:'owner-token'}}});h.setFetch(async()=>({ok:false,json:async()=>({error:'Bu hesap zaten var.'})}));
 await h.api.teamPage();await h.api.action('create-user');await h.submit('#create-user-form',{email:'existing@example.org',role:'editor'});
 assert.match(h.$('#create-user-error').textContent,/zaten var/);assert.equal(h.$('#create-user-form input[name="email"]').value,'existing@example.org');assert.equal(h.api.S.busy,false);assert.equal(h.$('#create-user-form [type="submit"]').disabled,false);
});
await check('Deletion requires the exact email and hides controls for owners',async()=>{
 const id='c9298a2a-15dd-4e0e-8229-527c123b3ef4';
 const h=await connected('owner',{cms_members:[{user_id:'owner-id',email:'owner@example.org',role:'owner',active:true},{user_id:id,email:'delete@example.org',role:'editor',active:true}]});
 h.db.client.auth.getSession=async()=>({data:{session:{access_token:'owner-token'}}});let requests=0;
 h.setFetch(async(url,options)=>{requests++;assert.equal(options.method,'DELETE');assert.equal(JSON.parse(options.body).userId,id);return {ok:true,json:async()=>({ok:true})};});
 await h.api.teamPage();assert.equal(h.$('[data-delete-member="owner-id"]'),null);await h.click(`[data-delete-member="${id}"]`);
 await h.submit('#delete-member-form',{email:'wrong@example.org'});assert.equal(requests,0);assert.match(h.$('#delete-member-error').textContent,/eşleşmiyor/);
 await h.submit('#delete-member-form',{email:'delete@example.org'});assert.equal(requests,1);assert.equal(h.$('#delete-member-form'),null);
});
await check('First-login gate blocks navigation and private content loading even on a new session',async()=>{
 const h=await connected('admin',{cms_members:[{user_id:'owner-id',email:'pending@example.org',role:'admin',active:true,must_change_password:true}]});const before=h.db.calls.length;
 await h.api.enter();assert.ok(h.$('#first-password-form'));assert.equal(h.api.S.rows.length,0);assert.equal(h.db.calls.slice(before).filter(c=>c.table==='cms_documents'||c.table==='cms_media').length,0);
 h.api.navigate('pages');assert.ok(h.$('#first-password-form'));assert.equal(h.$('[data-action="save"]'),null);assert.equal(h.$('#modal'),null);
 await h.submit('#first-password-form',{current:'temporary-pass',password:'temporary-pass',confirm:'temporary-pass'});assert.match(h.$('#first-password-error').textContent,/farklı/);assert.equal(h.db.calls.filter(c=>c.action==='updateUser').length,0);
});
await check('Only the server-confirmed password change unlocks the first-login screen',async()=>{
 const h=await connected('editor',{cms_members:[{user_id:'owner-id',email:'pending@example.org',role:'editor',active:true,must_change_password:true}]});await h.api.enter();
 h.db.client.auth.updateUser=async()=>({error:{code:'weak_password'}});await h.submit('#first-password-form',{current:'temporary-pass',password:'new-strong-pass',confirm:'new-strong-pass'});assert.ok(h.$('#first-password-form'));assert.equal(h.api.S.member.must_change_password,true);
 h.db.client.auth.updateUser=async values=>{assert.equal(values.current_password,'temporary-pass');h.db.tables.cms_members[0].must_change_password=false;return {error:null};};
 await h.submit('#first-password-form',{current:'temporary-pass',password:'new-strong-pass',confirm:'new-strong-pass'});assert.equal(h.$('#first-password-form'),null);assert.equal(h.api.S.member.must_change_password,false);assert.ok(h.api.S.rows.length>0);
});

console.log(`RESULT ${passed} passed, ${failed} failed (DOM + local stubs; no live Supabase or browser QA)`);
if(failed)process.exitCode=1;
