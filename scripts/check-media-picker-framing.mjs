/** End-to-end admin DOM contract checks; all content and media are local fixtures. */
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {parseHTML,DOMParser} from 'linkedom';
import * as dependencies from './admin-test-dependencies.mjs';
import {socialCropRect} from '../cms/admin-media-export.mjs';
const json=name=>JSON.parse(fs.readFileSync(new URL('../cms/'+name+'.json',import.meta.url),'utf8'));
const catalog=json('catalog'),seed=json('seed'),media=json('media-seed'),templates=json('templates'),iconNodes=json('icon-nodes');
const source=fs.readFileSync(new URL('../cms/admin.mjs',import.meta.url),'utf8');
const exposed=['S','boot','openEditor','editor','editFieldMedia','mediaPicker','closeDialog','targetFor'];
const instrumented=source.replace(/^import .*;\n/gm,'').replace(/\nboot\(\);\s*$/,'\nglobalThis.api={'+exposed.join(',')+'};');
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
async function setup(){
 const {window,document}=parseHTML('<!doctype html><html><head></head><body><div id="app"></div><div id="toasts"></div></body></html>');
 window.HTMLElement.prototype.pause=function(){};window.HTMLElement.prototype.load=function(){};
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){const option=this.querySelector('option[selected]')||this.querySelector('option');return option?(option.getAttribute('value')??option.textContent):'';},set(value){for(const option of this.querySelectorAll('option')){if((option.getAttribute('value')??option.textContent)===String(value))option.setAttribute('selected','');else option.removeAttribute('selected');}}});
 const context={...dependencies,document,window,DOMParser,URL,URLSearchParams,structuredClone,crypto:webcrypto,iconNodes,location:{origin:'https://example.org',hash:''},navigator:{clipboard:{writeText:async()=>{}}},console,setTimeout:()=>0,clearTimeout:()=>{},confirm:()=>true,requestAnimationFrame:fn=>fn(),cancelAnimationFrame:()=>{},matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),fetch:async url=>String(url).startsWith('/api/cms/template')?{ok:true,text:async()=>templates[new URL('https://example.org'+url).searchParams.get('id')]}:{ok:true,json:async()=>({config:{enabled:false},catalog:structuredClone(catalog),seed:structuredClone(seed),media:structuredClone(media)})}};
 vm.createContext(context);vm.runInContext(instrumented,context,{filename:'cms/admin.mjs'});await context.api.boot();
 const $=selector=>document.querySelector(selector),$$=selector=>[...document.querySelectorAll(selector)];
 const event=(node,type)=>node.dispatchEvent(new window.Event(type,{bubbles:true,cancelable:true}));
 const click=async selector=>{const el=typeof selector==='string'?$(selector):selector;assert(el,'Missing '+selector);assert(!el.disabled,'Disabled '+selector);if(el.onclick)await el.onclick({target:el,preventDefault(){}});else event(el,'click');await flush();};
 const range=(key,value)=>{const input=$('[data-frame-range="'+key+'"]');input.value=String(value);event(input,'input');};
 const load=()=>{const image=$('[data-frame-media]');assert(image);Object.defineProperties(image,{naturalWidth:{configurable:true,value:1920},naturalHeight:{configurable:true,value:1080}});event(image,'load');};
 const openField=(route,fieldId)=>{context.api.openEditor(route);const f=context.api.S.catalog[context.api.S.doc.template].fields.find(f=>f.id===fieldId);assert(f);const section=context.api.S.doc.sections.find(s=>s.source===f.section);context.api.S.section=section.id;context.api.editor();const button=$$('[data-pick]').find(el=>JSON.parse(el.dataset.pick).field===fieldId);assert(button);return {field:f,ctx:JSON.parse(button.dataset.pick),button,section};};
 return {api:context.api,document,window,$,$$,event,click,range,load,openField};
}
let groups=0;
async function check(name,fn){await fn();groups++;console.log('PASS '+name);}
await check('archive selection opens a ratio-aware crop step before mutating the draft',async()=>{
 const h=await setup(),f=h.openField('/','42099b4a-187:@src'),before=JSON.stringify(h.api.S.doc);
 await h.click(f.button);assert(h.$('#picker-grid'));const selected=h.$('[data-select-media]');const url=selected.dataset.selectMedia;await h.click(selected);
 assert(h.$('[data-media-frame-editor]'));assert.equal(JSON.stringify(h.api.S.doc),before);assert.equal(h.$('[data-frame-apply]').disabled,true);
 assert.equal(h.$('[data-frame-stage]').style.aspectRatio,'1232 / 550');h.load();h.range('x',31);h.range('y',18);h.range('zoom',1.5);await h.click('[data-frame-viewport="mobile"]');h.range('x',74);h.range('y',12);h.range('zoom',1.2);await h.click('[data-frame-apply]');
 const values=h.api.targetFor(f.ctx),frame=JSON.parse(values[f.field.id+':frame']);assert.equal(values[f.field.id],url);assert.equal(frame.desktop.y,18);assert.equal(frame.mobile.x,74);assert.equal(h.api.S.doc.values[f.field.id+':frame'],undefined);assert(h.api.S.dirty);assert.equal(h.$('#modal'),null);
 const {document}=parseHTML(templates[h.api.S.doc.template]);dependencies.applyContent(document,h.api.S.doc,catalog[h.api.S.doc.template]);const image=document.querySelector('[data-cms-node="'+f.field.node+'"]');assert.equal(image.dataset.mediaFramed,'true');assert.equal(image.style.getPropertyValue('--media-frame-y'),'18%');assert.equal(image.style.getPropertyValue('--media-frame-mobile-x'),'74%');
 assert.equal(JSON.stringify(seed.find(item=>item.id==='/').sections),JSON.stringify(h.api.S.rows.find(item=>item.id==='/').draft.sections),'Editing must not mutate the stored row');
});
await check('cancel preserves the draft and edit-existing restores saved independent crop settings',async()=>{
 const h=await setup(),f=h.openField('/','42099b4a-187:@src');await h.api.editFieldMedia(f.ctx,true);h.load();h.range('x',23);await h.click('[data-frame-apply]');const before=JSON.stringify(h.api.S.doc);
 await h.api.editFieldMedia(f.ctx,true);h.load();assert.equal(h.$('[data-frame-range="x"]').value,'23');h.range('x',89);await h.click('[data-frame-cancel]');assert.equal(JSON.stringify(h.api.S.doc),before);
 await h.api.editFieldMedia(f.ctx,true);h.load();await h.click('[data-frame-original]');assert.equal(h.api.targetFor(f.ctx)[f.field.id+':frame'],'');
});
await check('manual source replacement prevents stale crop application and archived content cannot open framing',async()=>{
 const h=await setup(),f=h.openField('/','42099b4a-187:@src');await h.api.editFieldMedia(f.ctx,true);h.load();h.range('zoom',2);await h.click('[data-frame-apply]');
 const input=h.$$('[data-bind]').find(el=>JSON.parse(el.dataset.bind).field===f.field.id);input.value='/assets/replacement.jpg';input.oninput();
 const {document}=parseHTML(templates[h.api.S.doc.template]);dependencies.applyContent(document,h.api.S.doc,catalog[h.api.S.doc.template]);assert.equal(document.querySelector('[data-cms-node="'+f.field.node+'"]').hasAttribute('data-media-framed'),false);
 const before=JSON.stringify(h.api.S.doc);h.api.S.row.archived=true;await h.api.editFieldMedia(f.ctx,true);assert.equal(h.$('#modal'),null);assert.equal(JSON.stringify(h.api.S.doc),before);
});
await check('repeated book placements retain independent frame state',async()=>{
 const h=await setup();h.api.openEditor('/kitaplar/');const def=h.api.S.catalog['/kitaplar/'];const groupDefinition=def.groups.find(g=>g.label==='Kitaplar'),section=h.api.S.doc.sections.find(s=>s.groups.some(g=>g.id===groupDefinition.id)),group=section.groups.find(g=>g.id===groupDefinition.id);h.api.S.section=section.id;h.api.editor();
 const first=group.items.find(item=>def.fields.some(f=>f.type==='image'&&groupDefinition.items.find(base=>base.id===item.source)?.fields.includes(f.id)));assert(first);const duplicate=structuredClone(first);duplicate.id='test-copy';group.items.push(duplicate);
 const base=groupDefinition.items.find(item=>item.id===first.source),field=def.fields.find(f=>f.type==='image'&&base.fields.includes(f.id));const ctx={scope:'item',section:section.id,group:group.id,item:first.id,field:field.id};
 await h.api.editFieldMedia(ctx,true);h.load();h.range('y',7);await h.click('[data-frame-apply]');assert.equal(JSON.parse(first.values[field.id+':frame']).desktop.y,7);assert.equal(duplicate.values[field.id+':frame'],undefined);
 await h.api.editFieldMedia({...ctx,item:duplicate.id},true);h.load();h.range('y',91);await h.click('[data-frame-apply]');assert.equal(JSON.parse(first.values[field.id+':frame']).desktop.y,7);assert.equal(JSON.parse(duplicate.values[field.id+':frame']).desktop.y,91);
});
await check('social export crop math remains bounded and follows the editor anchors',async()=>{
 for(const [width,height] of [[1920,1080],[800,1600],[1200,630]])for(const x of [0,50,100])for(const y of [0,50,100])for(const zoom of [1,1.5,3]){
  const rect=socialCropRect(width,height,{x,y,zoom});assert(rect.x>=0&&rect.y>=0);assert(rect.x+rect.width<=width+.000001);assert(rect.y+rect.height<=height+.000001);assert(Math.abs(rect.width/rect.height-1200/630)<.000001);
  if(x===0)assert.equal(rect.x,0);if(y===0)assert.equal(rect.y,0);
 }
});
console.log(groups+' media picker framing integration groups passed; browser decoding and visual playback remain unverified.');
