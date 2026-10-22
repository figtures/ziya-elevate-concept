/** React DOM interaction smoke checks. No browser rendering or live CMS access. */
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';

const directory=await mkdtemp(join(tmpdir(),'ziya-testimonials-'));
const outfile=join(directory,'check.cjs');
const source=`
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const {window,document}=parseHTML('<!doctype html><html><head></head><body><div id="app"></div><button id="outside">Outside</button></body></html>');
Object.assign(globalThis,{window,document,HTMLElement:window.HTMLElement,Element:window.Element,SVGElement:window.SVGElement,IS_REACT_ACT_ENVIRONMENT:true});
Object.defineProperty(globalThis,'navigator',{value:{userAgent:'local-dom-check'},configurable:true});
window.matchMedia=()=>({matches:true,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}});
globalThis.requestAnimationFrame=window.requestAnimationFrame=fn=>setTimeout(()=>fn(performance.now()),1);
globalThis.cancelAnimationFrame=window.cancelAnimationFrame=clearTimeout;
globalThis.getComputedStyle=window.getComputedStyle=el=>({getPropertyValue:name=>el.style.getPropertyValue(name),transform:el.style.transform||'none'});
Object.defineProperty(window.HTMLElement.prototype,'clientWidth',{configurable:true,get(){return 360;}});
Object.defineProperty(window.HTMLElement.prototype,'offsetHeight',{configurable:true,get(){return 340;}});
const observations=new Set();
globalThis.ResizeObserver=class{constructor(){this.nodes=new Set();}observe(node){this.nodes.add(node);observations.add(node);}disconnect(){this.nodes.forEach(node=>observations.delete(node));this.nodes.clear();}};
(async()=>{
 const React=await import('react');
 const {createRoot}=await import('react-dom/client');
 const {StaggerTestimonials}=await import('./components/ui/stagger-testimonials.tsx');
 const root=createRoot(document.getElementById('app'));
 const original=[{id:'a',name:'Birinci Kişi',quote:'Birinci öneri',draft:true},{id:'b',name:'İkinci Kişi',quote:'İkinci öneri',draft:true},{id:'c',name:'Üçüncü Kişi',quote:'Üçüncü öneri',draft:true}];
 let items=original;
 const render=async next=>{items=next;await React.act(async()=>{root.render(React.createElement(StaggerTestimonials,{items}));});};
 const current=()=>document.querySelector('[data-active="true"]');
 const name=()=>current()?.querySelector('strong')?.textContent;
 const click=async label=>React.act(async()=>{document.querySelector('button[aria-label="'+label+'"]').dispatchEvent(new window.Event('click',{bubbles:true}));});
 const key=async(target,value,modifiers={})=>React.act(async()=>{const event=new window.Event('keydown',{bubbles:true,cancelable:true});Object.assign(event,{key:value,...modifiers});target.dispatchEvent(event);});
 await render(items);
 assert.equal(name(),'Birinci Kişi');assert.equal(document.querySelectorAll('[aria-hidden="false"][data-active]').length,1);
 assert.equal(document.querySelector('.stagger-testimonials').dataset.reducedMotion,'true');
 await click('Sonraki yorum');assert.equal(name(),'İkinci Kişi');
 await click('Önceki yorum');assert.equal(name(),'Birinci Kişi');
 await click('Önceki yorum');assert.equal(name(),'Üçüncü Kişi');
 await click('Sonraki yorum');assert.equal(name(),'Birinci Kişi');
 console.log('PASS next/previous controls wrap and expose one active card');
 await key(document.querySelector('.stagger-testimonials'),'ArrowRight');assert.equal(name(),'İkinci Kişi');
 await key(document.getElementById('outside'),'ArrowRight');assert.equal(name(),'İkinci Kişi');
 await key(document.querySelector('.stagger-testimonials'),'ArrowLeft',{ctrlKey:true});assert.equal(name(),'İkinci Kişi');
 console.log('PASS keyboard navigation is scoped and preserves modified keys');
 await render([original[2],{...original[1],quote:'Güncellenen öneri'},original[0]]);
 assert.equal(name(),'İkinci Kişi');assert.equal(current().querySelector('blockquote').textContent,'Güncellenen öneri');
 assert.equal(document.querySelector('.stagger-testimonials-counter strong').textContent,'02');
 console.log('PASS editing/reordering preserves selection by stable CMS identity');
 await render([]);assert.equal(document.querySelector('.stagger-testimonials'),null);
 await render([original[0]]);assert.equal(name(),'Birinci Kişi');
 assert(observations.has(document.querySelector('.stagger-testimonials')),'viewport observer reattaches after refilling');
 assert([...document.querySelectorAll('.stagger-testimonials-controls button')].every(button=>button.disabled));
 await render(original);assert.equal(name(),'İkinci Kişi');await click('Sonraki yorum');assert.equal(name(),'Üçüncü Kişi');
 console.log('PASS empty/refilled and single-item collections retain usable controls');
 await React.act(async()=>root.unmount());assert.equal(observations.size,0);
 console.log('PASS reduced-motion rendering and observer cleanup; visual animation remains browser-unverified');
 // End this isolated DOM process after unmount; shared Motion scheduling is not a browser leak test.
 setImmediate(()=>process.exit(0));
})().catch(error=>{console.error(error);process.exit(1);});
`;
try{
 await build({stdin:{contents:source,resolveDir:process.cwd(),sourcefile:'stagger-check.tsx',loader:'tsx'},bundle:true,platform:'node',format:'cjs',target:'node22',outfile,define:{'process.env.NODE_ENV':'"development"'},logLevel:'silent'});
 const result=spawnSync(process.execPath,[outfile],{encoding:'utf8',timeout:20000});
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 if(result.error)throw result.error;if(result.status!==0)process.exitCode=result.status||1;
}finally{await rm(directory,{recursive:true,force:true});}
