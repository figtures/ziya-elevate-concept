/** Read-only DOM smoke tests. Run from the Site checkout: node /absolute/path/check-admin-dom.mjs */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { webcrypto } from 'node:crypto';
import * as dependencies from './admin-test-dependencies.mjs';

const root=process.cwd();
const require=createRequire(path.join(root,'package.json'));
const {parseHTML,DOMParser}=require('linkedom');
const {applyContent,validateDocument,safeURL}=await import(pathToFileURL(path.join(root,'cms/render.mjs')));
const readJSON=name=>JSON.parse(fs.readFileSync(path.join(root,'cms',name+'.json'),'utf8'));
const catalog=readJSON('catalog'),seed=readJSON('seed'),media=readJSON('media-seed'),templates=readJSON('templates'),iconNodes=readJSON('icon-nodes');
const original=fs.readFileSync(path.join(root,'cms/admin.mjs'),'utf8');
const instrumented=original.replace(/^import .*;\n/gm,'').replace(/\nboot\(\);\s*$/,
 '\nglobalThis.test={S,boot,navigate,openEditor,preview,editor,heading,loadHistory,leadsPage,teamPage,closeDialog,setClient:value=>client=value};');
assert.ok(instrumented.includes('globalThis.test='),'Could not instrument admin entrypoint');
const failures=[];
async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(error){failures.push(name);console.error('FAIL '+name+': '+error.message);}}
function setup(){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><div id="app"></div><div id="toasts"></div></body></html>');
 const context={...dependencies,document,window,DOMParser,URL,URLSearchParams,structuredClone,crypto:webcrypto,iconNodes,
  location:{origin:'https://example.org',hash:''},console,setTimeout:()=>0,clearTimeout:()=>{},
  confirm:()=>true,applyContent,validateDocument,safeURL,
  requestAnimationFrame:fn=>fn(),cancelAnimationFrame:()=>{},
  matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
  fetch:async url=>String(url).startsWith('/api/cms/template')
   ?{ok:true,text:async()=>templates[new URL('https://example.org'+url).searchParams.get('id')]}
   :{ok:true,json:async()=>({config:{enabled:false},catalog,seed,media})}
 };
 vm.createContext(context);vm.runInContext(instrumented,context,{filename:'cms/admin.mjs'});
 return {api:context.test,document,window};
}
const {api,document}=setup();
await check('offline boot loads all authored documents',async()=>{
 await api.boot();assert.equal(api.S.rows.length,seed.length);assert.equal(api.S.offline,true);
 assert.match(document.querySelector('h1').textContent,/İçeriğiniz/);
});
await check('every navigation destination renders offline',async()=>{
 for(const view of ['pages','articles','notes','collections','training','books','talks','test','global','media','leads','team','settings']){
  await api.navigate(view);assert.ok(document.querySelector('h1'),view+' missing heading');
  assert.ok(!document.querySelector('h1').textContent.includes('Panel yüklenemedi'),view+' failed');
 }
});
await check('all page section editors render and offline writes remain disabled',async()=>{
 let count=0;
 for(const row of api.S.rows){
  api.openEditor(row.id);
  for(const section of api.S.doc.sections){api.S.section=section.id;api.editor();count++;assert.ok(document.querySelector('.section-card'));}
  for(const button of document.querySelectorAll('[data-action="save"],[data-action="publish"],[data-action="unarchive"]'))assert.ok(button.disabled,'Offline write button enabled');
 }
 console.log('INFO rendered '+count+' section editors');
});
await check('shared navigation preview preserves footer position',async()=>{
 api.navigate('global');await api.preview();
 const frame=document.querySelector('#modal iframe');assert.ok(frame,'No preview iframe');
 const preview=new DOMParser().parseFromString(frame.srcdoc,'text/html');
 const children=[...preview.body.children];const header=preview.querySelector('body > header');const footer=preview.querySelector('body > footer');
 const main=preview.querySelector('body > main#main-content');
 assert.ok(header&&footer&&main?.querySelector('section'),'Incomplete semantic preview');
 assert.ok(children.indexOf(header)<children.indexOf(main),'Header moved after content');
 assert.ok(children.indexOf(footer)>children.indexOf(main),'Footer moved before content');
 api.closeDialog();
});
await check('document titles render as text, never as HTML',async()=>{
 api.openEditor('/kitaplar/');api.S.doc.title='<img src="https://example.org/evil.jpg" id="unsafe-title">';api.editor();
 assert.equal(document.querySelector('#unsafe-title'),null,'Title created an HTML node');
 assert.ok(document.querySelector('h1').textContent.includes('<img'),'Title was not represented as literal text');
});

// Deferred Supabase stub: no credentials, network, browser or external writes.
function deferredClient(){
 const pending=[];
 const client={from(table){
  const q={select(){return q;},eq(){return q;},order(){return q;},limit(){return q;},range(){return q;},
   then(resolve,reject){pending.push({table,resolve:value=>resolve({data:value,error:null}),reject});}};
  return q;
 }};
 return {client,pending};
}
const tick=()=>new Promise(resolve=>queueMicrotask(resolve));
await check('history response after navigation is discarded safely',async()=>{
 const {api}=setup();await api.boot();api.openEditor('/kitaplar/');api.S.offline=false;api.S.member={role:'owner'};
 api.S.tab='history';const {client,pending}=deferredClient();api.setClient(client);
 // editor triggers loadHistory; invoke directly to obtain a catchable promise.
 const history=api.loadHistory();await tick();assert.equal(pending[0]?.table,'cms_versions');
 api.navigate('settings');pending[0].resolve([]);await history;
});
await check('switching between async views does not strand a loading screen',async()=>{
 const {api,document}=setup();await api.boot();api.S.offline=false;api.S.member={role:'owner'};
 const {client,pending}=deferredClient();api.setClient(client);
 api.S.view='leads';const first=api.leadsPage();await tick();
 assert.equal(pending[0]?.table,'cms_leads');
 api.navigate('team');await tick();
 pending[0].resolve([]);await first;await tick();
 for(const request of pending.slice(1))request.resolve([]);
 await tick();await tick();
 if(api.S.view==='team'){
  assert.ok(pending.some(x=>x.table==='cms_members'),'Team read was skipped by shared busy guard');
  assert.ok(!document.querySelector('#team-body')?.textContent.includes('Yükleniyor'),'Team remains loading after resolution');
 }
});

if(failures.length){console.error(failures.length+' important regression(s): '+failures.join('; '));process.exitCode=1;}
else console.log('PASS all admin DOM smoke checks (not visual/browser QA)');
