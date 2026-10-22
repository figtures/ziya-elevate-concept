import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {animateVisibility} from '../src/interactions/disclosure-motion.mjs';

const mainSource=fs.readFileSync('website/assets/main.js','utf8');
const cmsSource=fs.readFileSync('public/assets/cms-navigation.js','utf8');
assert.equal(mainSource,fs.readFileSync('public/assets/main.js','utf8'),'Both public main scripts must match');
assert.equal(cmsSource,fs.readFileSync('website/assets/cms-navigation.js','utf8'),'Both CMS navigation scripts must match');

function fixture(markup,{mobile=true,reduced=false}={}){
 const {document,window}=parseHTML(`<html lang="tr"><body>${markup}</body></html>`);
 let now=0,nextTimer=0,focused=null;const timers=new Map(),animations=[];
 const setTimeout=(fn,delay=0)=>{const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id;};
 const clearTimeout=id=>timers.delete(id);
 const media=initial=>{const listeners=new Set();return {matches:initial,addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),set(value){this.matches=value;for(const fn of [...listeners])fn({matches:value});}};};
 const mobileMedia=media(mobile),reducedMedia=media(reduced);
 const matchMedia=query=>query.includes('max-width')?mobileMedia:reducedMedia;
 window.matchMedia=matchMedia;
 window.getComputedStyle=()=>({opacity:'1',transform:'none',paddingTop:'8px',paddingBottom:'8px',marginTop:'4px',marginBottom:'4px'});
 Object.defineProperty(document,'activeElement',{get:()=>focused});
 for(const element of document.querySelectorAll('*')){
  element.inert=false;element.focus=()=>{focused=element;};element.getClientRects=()=>[{}];element.getBoundingClientRect=()=>({height:180,width:200});
  element.animate=(frames,options)=>{
   let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
   const timer=setTimeout(resolve,options.duration);
   const record={element,frames,options,finished,cancel(){clearTimeout(timer);reject(new Error('cancelled'));}};
   animations.push(record);return record;
  };
 }
 const fakeWindow={scrollY:0,matchMedia,ZiyaMotion:{animateVisibility},addEventListener(){}};
 const context={document,window:fakeWindow,matchMedia,setTimeout,clearTimeout,console};
 const advance=async milliseconds=>{
  const end=now+milliseconds;
  for(;;){const due=[...timers.entries()].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;now=due[1].at;timers.delete(due[0]);due[1].fn();await Promise.resolve();await Promise.resolve();}
  now=end;await Promise.resolve();await Promise.resolve();
 };
 const key=(element,value)=>{const event=new window.Event('keydown',{bubbles:true,cancelable:true});event.key=value;element.dispatchEvent(event);return event;};
 return {document,animations,mobile:mobileMedia,reduced:reducedMedia,advance,key,run:source=>vm.runInNewContext(source,context),get focused(){return focused;}};
}
const mobileMarkup=`<header class="site"><button class="hamb" aria-expanded="false"><svg><use></use></svg><span class="menu-toggle-label">Menü</span></button><nav class="main-navigation"><a href="/basari/">Başarı</a><a href="/satis/">Satış</a></nav><button data-close-menu hidden></button></header><main>Main</main><aside>Already inert</aside><footer>Footer</footer>`;
function mobileFixture(options){const f=fixture(mobileMarkup,options);f.document.querySelector('aside').inert=true;f.run(mainSource);return f;}
let checks=0;async function check(name,run){await run();checks++;console.log('PASS '+name);}
function assertReleased(f){assert.equal(f.document.body.classList.contains('menu-open'),false);assert.equal(f.document.querySelector('header').classList.contains('menu-expanded'),false);assert.equal(f.document.querySelector('main').inert,false);assert.equal(f.document.querySelector('aside').inert,true,'Original inert state is restored');}

await check('mobile close keeps page inert and scroll-locked for the entire 240 ms exit',async()=>{
 const f=mobileFixture(),d=f.document,toggle=d.querySelector('.hamb'),backdrop=d.querySelector('[data-close-menu]');
 assertReleased(f);assert.equal(d.querySelector('.main-navigation').inert,true);
 toggle.click();await f.advance(340);assert.equal(f.focused,d.querySelector('nav a'));assert.equal(d.querySelector('main').inert,true);
 f.key(d,'Escape');assert.equal(f.focused,toggle);assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(d.querySelector('.main-navigation').inert,true);
 assert.equal(backdrop.hidden,false);assert.equal(backdrop.inert,true);assert.equal(f.animations.at(-1).options.duration,240);
 await f.advance(239);assert.equal(d.body.classList.contains('menu-open'),true);assert.equal(d.querySelector('main').inert,true);assert.equal(backdrop.hidden,false);
 await f.advance(1);assertReleased(f);assert.equal(backdrop.hidden,true);
});
await check('rapid mobile reopen cancels stale cleanup and retains background protection',async()=>{
 const f=mobileFixture(),d=f.document,toggle=d.querySelector('.hamb');toggle.click();await f.advance(340);toggle.click();await f.advance(120);toggle.click();await f.advance(400);
 assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.equal(d.body.classList.contains('menu-open'),true);assert.equal(d.querySelector('main').inert,true);assert.equal(d.querySelector('[data-close-menu]').hidden,false);
 d.querySelector('nav a').click();await f.advance(240);assertReleased(f);assert.equal(f.focused,toggle);
});
await check('desktop breakpoint immediately releases open and closing mobile menus',async()=>{
 for(const closing of [false,true]){const f=mobileFixture(),d=f.document;d.querySelector('.hamb').click();await f.advance(340);if(closing)d.querySelector('.hamb').click();f.mobile.set(false);assertReleased(f);assert.equal(d.querySelector('.main-navigation').inert,false);assert.equal(d.querySelector('[data-close-menu]').hidden,true);await f.advance(400);assertReleased(f);}
});
await check('reduced motion closes instantly and can finish an in-progress exit',async()=>{
 const reduced=mobileFixture({reduced:true});reduced.document.querySelector('.hamb').click();reduced.document.querySelector('.hamb').click();assertReleased(reduced);assert.equal(reduced.animations.length,0);
 const f=mobileFixture();f.document.querySelector('.hamb').click();await f.advance(340);f.document.querySelector('.hamb').click();await f.advance(80);f.reduced.set(true);assertReleased(f);assert.equal(f.document.querySelector('[data-close-menu]').hidden,true);await f.advance(400);assertReleased(f);
});

const cmsMarkup=`<header><nav><ul>${[1,2].map(i=>`<li><button class="cms-submenu-toggle" aria-controls="submenu-${i}" aria-expanded="false">Menu ${i}</button><ul id="submenu-${i}" class="cms-submenu"><li><a href="/a/">First</a></li><li><a href="/b/">Last</a></li></ul></li>`).join('')}</ul></nav></header><main>Outside</main>`;
await check('animated CMS dropdowns reverse safely and preserve keyboard/outside dismissal',async()=>{
 const f=fixture(cmsMarkup,{mobile:false}),d=f.document;f.run(cmsSource);const [first,second]=d.querySelectorAll('.cms-submenu-toggle'),[one,two]=d.querySelectorAll('.cms-submenu');
 assert.equal(one.hidden,true);f.key(first,'ArrowDown');assert.equal(f.focused,one.querySelector('a'));await f.advance(340);assert.equal(one.hidden,false);
 f.key(one,'End');assert.equal(f.focused,one.querySelectorAll('a')[1]);f.key(one,'Home');assert.equal(f.focused,one.querySelector('a'));
 const event=f.key(one,'Escape');assert.equal(event.defaultPrevented,true);assert.equal(f.focused,first);assert.equal(first.getAttribute('aria-expanded'),'false');assert.equal(one.hidden,false);assert.equal(one.inert,true);
 await f.advance(120);first.click();await f.advance(400);assert.equal(one.hidden,false);assert.equal(one.inert,false);assert.equal(first.getAttribute('aria-expanded'),'true');
 second.click();assert.equal(first.getAttribute('aria-expanded'),'false');assert.equal(second.getAttribute('aria-expanded'),'true');assert.equal(one.inert,true);assert.equal(one.hidden,false);await f.advance(340);assert.equal(one.hidden,true);assert.equal(two.hidden,false);
 d.querySelector('main').click();assert.equal(two.hidden,false);await f.advance(240);assert.equal(two.hidden,true);
});
await check('CMS mobile submenus animate layout height and reset immediately at breakpoints',async()=>{
 const f=fixture(cmsMarkup),d=f.document;f.run(cmsSource);const button=d.querySelector('.cms-submenu-toggle'),menu=d.querySelector('.cms-submenu');
 button.click();assert.equal(f.animations.at(-1).frames[0].height,'0px');assert.equal(f.animations.at(-1).frames[1].height,'180px');await f.advance(340);
 button.click();await f.advance(239);assert.equal(menu.hidden,false);await f.advance(1);assert.equal(menu.hidden,true);
 button.click();f.mobile.set(false);assert.equal(menu.hidden,true);assert.equal(button.getAttribute('aria-expanded'),'false');await f.advance(400);assert.equal(menu.hidden,true);
});
console.log(`${checks} public navigation lifecycle checks passed (actual scripts with controlled timers and Web Animations).`);
