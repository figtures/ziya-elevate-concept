import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {applyContent} from '../cms/render.mjs';
import {applyNavigation,deriveNavigation,validateNavigation,auditNavigation} from '../cms/navigation.mjs';
import {renderNavigationEditor,wireNavigationEditor} from '../cms/admin-navigation.mjs';

const read=name=>JSON.parse(fs.readFileSync(`cms/${name}.json`,'utf8'));
const seed=read('seed'),catalog=read('catalog'),templates=read('templates');
const payload=structuredClone(seed.find(page=>page.kind==='global'));
const render=()=>{const {document}=parseHTML(templates[payload.template]);applyContent(document,payload,catalog[payload.template],{global:true});return document;};
const doc=render(),initial=deriveNavigation(doc),originalPrimary=[...doc.querySelectorAll('body > header .nav-links a')].map(a=>[a.textContent,a.getAttribute('href')]);
assert.deepEqual(validateNavigation(initial),[]);
assert.equal(initial.primary.length,7);assert.equal(initial.mobileSecondary.length,4);assert.equal(initial.audience.length,2);assert.equal(initial.footer.length,4);
assert.deepEqual(initial.social.map(item=>[item.label,item.href]),[
 ['LinkedIn','https://tr.linkedin.com/in/ziyayilmaz'],['Instagram','https://www.instagram.com/ziyasakir/'],
 ['YouTube','https://www.youtube.com/@ZiyaSakirYlmaz'],['Kitapyurdu','https://www.kitapyurdu.com/yazar/ziya-sakir-yilmaz/203025.html']
],'All authored social and bookshop links remain manageable');
applyNavigation(doc,initial);
assert.deepEqual([...doc.querySelectorAll('body > header .nav-links a')].map(a=>[a.textContent,a.getAttribute('href')]),originalPrimary,'Default structure preserves authored labels and URLs');
assert.equal(doc.querySelector('.footer-navigation').children.length,4,'Default footer keeps brand and three groups');
assert.equal(doc.querySelector('.footer-programs h2').textContent,initial.footer[3].title);
assert.equal(doc.querySelector('body > header').className,render().querySelector('body > header').className,'Header classes retained');
const legacyDoc=render();legacyDoc.querySelector('.nav-links a').textContent='Düzenlenmiş başlık';legacyDoc.querySelector('.footer-group h2').textContent='Düzenlenmiş grup';
assert.equal(deriveNavigation(legacyDoc).primary[0].label,'Düzenlenmiş başlık');assert.equal(deriveNavigation(legacyDoc).footer[0].title,'Düzenlenmiş grup');

const nav=structuredClone(initial),child={id:'child-a',label:'Makale arşivi',href:'/makaleler/',newTab:false,hidden:false};
nav.primary.reverse();nav.primary[0].children=[child,{...child,id:'child-b',hidden:true}];nav.primary[1].hidden=true;nav.primary[2].newTab=true;nav.primary[2].href='https://example.com/';
nav.mobileSecondary.splice(1,1);nav.audience.reverse();nav.social[0].hidden=true;nav.footer.reverse();nav.footer[1].hidden=true;nav.footer[2].title='Özel seçki';nav.footer[2].items.reverse();
nav.primary[3].label='<img src=x onerror=alert(1)>';
const changed=render();assert.deepEqual(applyNavigation(changed,nav),[]);
assert.equal(changed.querySelector('.nav-links > li > a').textContent,nav.primary[0].label);
assert.equal(changed.querySelectorAll('.nav-links > li').length,6);
assert.equal(changed.querySelectorAll('.cms-submenu a').length,1);
assert.equal(changed.querySelector('.cms-submenu a').getAttribute('href'),'/makaleler/');
const external=changed.querySelector('.nav-links a[href="https://example.com/"]');assert.equal(external.target,'_blank');assert.equal(external.getAttribute('rel'),'noopener noreferrer');
assert.equal(changed.querySelector('.nav-links img'),null,'Injected label is literal text');
assert.equal(changed.querySelector('.nav-links').textContent.includes('<img src=x onerror=alert(1)>'),true);
assert.equal(changed.querySelectorAll('.menu-secondary a').length,3);assert.equal(changed.querySelectorAll('.footer-social a').length,initial.social.length-1);
assert.equal(changed.querySelector(`.footer-social a[href="${initial.social[0].href}"]`),null,'Hidden social link is removed');
assert.equal(changed.querySelector('.menu-audience a').textContent,nav.audience[0].label);
assert.equal(changed.querySelector('.footer-group h2').textContent,'Özel seçki');
assert.equal(changed.querySelector('.footer-group a').textContent,nav.footer[2].items[0].label);
assert.equal(changed.querySelectorAll('link[data-cms-navigation]').length,1);
applyNavigation(changed,nav);assert.equal(changed.querySelectorAll('link[data-cms-navigation]').length,1);assert.equal(changed.querySelectorAll('script[data-cms-navigation]').length,1);

const invalidMutations=[
  n=>n.primary[0].href='javascript:alert(1)',n=>n.primary[0].href='//evil.example',n=>n.primary[0].href='/\\evil.example',
  n=>n.primary[0].href='https://user:pass@evil.example',n=>n.primary[0].href='https://example.com/\n',
  n=>n.primary[0].label='',n=>n.primary[0].label='Başarı merkezi',n=>n.primary[0].id='bad"]',n=>n.primary[0].hidden='false',
  n=>n.primary[0].children=[{...child,children:[{...child,id:'grandchild'}]}],
  n=>n.audience[0].children=[child],n=>n.primary[1].id=n.primary[0].id,n=>n.footer[0].placement='script',n=>n.primary[0].onclick='alert(1)',
  n=>n.footer=Array.from({length:9},(_,i)=>({...n.footer[0],id:'footer-max-'+i})),n=>n.primary=Array.from({length:21},(_,i)=>({...child,id:'limit-'+i})),
  n=>n.version=2,n=>n.mobileSecondary=null
];
for(const mutate of invalidMutations){const invalid=structuredClone(initial);mutate(invalid);assert(validateNavigation(invalid).length);const before=changed.querySelector('header').outerHTML;assert(applyNavigation(changed,invalid).length);assert.equal(changed.querySelector('header').outerHTML,before,'Invalid model cannot partly replace a working menu');}
const audit=structuredClone(initial);audit.primary[0].href='/unlisted/';audit.primary[1].hidden=true;const pages=seed.map(page=>({...page,published_revision:1}));assert(auditNavigation(audit,pages).some(w=>w.id===audit.primary[0].id));assert(!auditNavigation(audit,pages).some(w=>w.id===audit.primary[1].id));

// Render the real editor and exercise its actual controls against immutable callbacks.
const editor=parseHTML('<html><body><main id="editor"></main></body></html>').document,container=editor.querySelector('#editor');
let current=structuredClone(initial),changes=0;
const mount=()=>{container.innerHTML=renderNavigationEditor(current,{pages});wireNavigationEditor(container,{navigation:current,pages,confirmRemove:()=>true,onChange:(next,{rerender})=>{current=next;changes++;if(rerender)mount();}});};
mount();const edit=(selector,value,event='input')=>{const el=container.querySelector(selector);if(el.tagName==='SELECT')Object.defineProperty(el,'value',{value,configurable:true});else el.value=value;el.dispatchEvent(new editor.defaultView.Event(event));};
edit('[data-navigation-bind="primary.0.label"]','Yeni menü metni');assert.equal(current.primary[0].label,'Yeni menü metni');assert.equal(initial.primary[0].label,originalPrimary[0][0]);
const click=(action,path)=>container.querySelector(`[data-navigation-action="${action}"][data-navigation-path="${path}"]`).click();
click('down','primary.0');assert.equal(current.primary[1].label,'Yeni menü metni');
click('add','primary.0.children');assert.equal(current.primary[0].children.length,1);
edit('[data-navigation-page="primary.0.children.0"]','/makaleler/','change');assert.equal(current.primary[0].children[0].href,'/makaleler/');assert.notEqual(current.primary[0].children[0].label,'Yeni bağlantı');
click('copy','primary.0');assert.equal(current.primary.length,8);assert.notEqual(current.primary[0].id,current.primary[1].id);assert.notEqual(current.primary[0].children[0].id,current.primary[1].children[0].id);
click('remove','primary.1');assert.equal(current.primary.length,7);
click('add-group','footer');assert.equal(current.footer.length,5);click('add','footer.4.items');assert.equal(current.footer[4].items.length,1);
const hidden=container.querySelector('[data-navigation-bind="footer.4.hidden"]');hidden.checked=true;hidden.dispatchEvent(new editor.defaultView.Event('change'));assert.equal(current.footer[4].hidden,true);
assert.deepEqual(validateNavigation(current),[]);
const disabled=parseHTML('<main>'+renderNavigationEditor(current,{pages,disabled:true})+'</main>').document;assert.equal([...disabled.querySelectorAll('input,select,button')].every(el=>el.hasAttribute('disabled')),true);

// Progressive enhancement: links remain present without JavaScript; keyboard toggles work with it.
const live=render();applyNavigation(live,nav);
let focused=null;Object.defineProperty(live,'activeElement',{get:()=>focused});
for(const element of live.querySelectorAll('button,a'))element.focus=()=>{focused=element;};
vm.runInNewContext(fs.readFileSync('public/assets/cms-navigation.js','utf8'),{document:live});
const toggle=live.querySelector('.cms-submenu-toggle'),submenu=live.querySelector('.cms-submenu');assert.equal(submenu.hidden,true);toggle.click();assert.equal(submenu.hidden,false);assert.equal(toggle.getAttribute('aria-expanded'),'true');
const key=(element,value)=>{const event=new live.defaultView.Event('keydown',{bubbles:true,cancelable:true});event.key=value;element.dispatchEvent(event);};
key(toggle,'ArrowDown');assert.equal(focused,submenu.querySelector('a'));key(submenu,'Escape');assert.equal(submenu.hidden,true);assert.equal(focused,toggle);
toggle.click();live.body.click();assert.equal(submenu.hidden,true);
console.log(`PASS: authored navigation retained, nested/reordered/hidden menus and footer groups render, ${invalidMutations.length} malicious or invalid models rejected atomically, ${changes} admin changes applied, keyboard submenu lifecycle verified.`);
