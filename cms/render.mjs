/** Safe, shared DOM renderer. Authored templates are trusted; CMS values are always text/typed attributes. */
import {applySocialImageMetadata,DEFAULT_CANONICAL_ORIGIN} from './seo.mjs';
import {applyResponsiveMedia} from './media.mjs';
import {validateNavigation} from './navigation.mjs';
import {validateCollection} from './collections.mjs';
import {validateExperience} from './experience.mjs';
import {validateTestimonials} from './testimonials.mjs';
import {validateReferences} from './references.mjs';
import {applyFieldMediaFrames,validateDocumentMediaFrames} from './media-framing.mjs';
export function safeURL(value, media = false) {
  const s=String(value||'').trim();
  if (s.startsWith('/') && !s.startsWith('//') && !/[\\\u0000-\u0020]/.test(s)) return s;
  if (!media && /^#[A-Za-z0-9_-]*$/.test(s)) return s;
  try {const u=new URL(s);if(u.protocol==='https:' || (!media && ['mailto:','tel:'].includes(u.protocol)))return s;}catch{}
  return '';
}
const find=(root,id)=>root.getAttribute?.('data-cms-node')===id?root:root.querySelector(`[data-cms-node="${id.replace(/[^a-zA-Z0-9-]/g,'')}"]`);
export function setField(root,field,value){
 const e=find(root,field.node);if(!e)return;let val=String(value??'');
 if(field.target==='text'){if(e.firstChild?.nodeType===3)e.firstChild.nodeValue=val;}
 else if(field.target==='tail'){if(e.nextSibling?.nodeType===3)e.nextSibling.nodeValue=val;}
 else if(field.target==='focal'){if(/^(?:center|left|right|top|bottom|\d+(?:\.\d+)?%)(?:\s+(?:center|left|right|top|bottom|\d+(?:\.\d+)?%))?$/.test(val))e.style.objectPosition=val;}
 else if(field.target.startsWith('@')){
  const key=field.target.slice(1);
  // Empty optional media/links must not resurrect the template's old book.
  if(!val.trim()&&key==='href'){e.removeAttribute('href');return;}
  if(!val.trim()&&key==='src'&&e.tagName==='IMG'){
   e.removeAttribute('src');e.removeAttribute('srcset');e.setAttribute('hidden','');
   if(e.parentElement?.tagName==='PICTURE')e.parentElement.querySelectorAll('source').forEach(s=>s.remove());
   return;
  }
  if(['src','poster','href'].includes(key)){val=safeURL(val,key!=='href');if(!val)return;}
  if(['data-talk','data-video-id'].includes(key)&&!/^[-\w]{11}$/.test(val))return;
  if(['data-clip-start','data-clip-end','data-start-at'].includes(key)&&(!Number.isFinite(+val)||+val<0||+val>36000))return;
  const previous=e.getAttribute(key);
  e.setAttribute(key,val);
  if(key==='src'&&e.tagName==='IMG')e.removeAttribute('hidden');
  // A replaced JPEG/PNG must not leave the original AVIF source hiding it.
  if(key==='src'&&e.tagName==='IMG'&&val!==previous){e.removeAttribute('srcset');e.removeAttribute('sizes');if(e.parentElement?.tagName==='PICTURE')e.parentElement.querySelectorAll('source').forEach(s=>s.remove());}
  if(e.tagName==='A'&&key==='href'&&/^https:/.test(val))e.setAttribute('rel','noopener noreferrer');
 }
}
function applyValues(root,definition,values){for(const f of definition.fields){if(Object.hasOwn(values||{},f.id))setField(root,f,values[f.id]);}applyFieldMediaFrames(root,definition,values);}
function uniquify(root,prefix){const map=new Map();[...(root.hasAttribute?.('id')?[root]:[]),...root.querySelectorAll('[id]')].forEach(n=>{map.set(n.id,prefix+'-'+n.id);n.id=prefix+'-'+n.id;});for(const n of root.querySelectorAll('[href],[aria-controls],[aria-labelledby]'))for(const attr of ['href','aria-controls','aria-labelledby']){const v=n.getAttribute(attr);if(v?.startsWith('#')&&map.has(v.slice(1)))n.setAttribute(attr,'#'+map.get(v.slice(1)));else if(map.has(v))n.setAttribute(attr,map.get(v));}}
export function applyContent(doc,payload,definition,{global=false}={}){
 applyValues(doc,definition,payload.values);
 const originalSections=new Map(definition.sections.map(s=>[s.id,find(doc,s.id)?.cloneNode(true)]));
 const oldSections=definition.sections.map(s=>find(doc,s.id)).filter(Boolean);
 if(!oldSections.length){applyResponsiveMedia(doc);return;}
 const parent=oldSections[0].parentNode;const marker=doc.createComment('cms-content');parent.insertBefore(marker,oldSections[0]);
 // Shared header/footer are separated by the page body and must stay in place.
 const rendered=[];
 for(const section of payload.sections||[]){
  const source=originalSections.get(section.source);if(!source)continue;
  if(section.hidden && !definition.sections.find(s=>s.id===section.source)?.hero)continue;
  const el=source.cloneNode(true);applyValues(el,definition,section.values);
  for(const group of section.groups||[]){
   const gd=definition.groups.find(g=>g.id===group.id);const container=find(el,group.id);if(!gd||!container)continue;
   const originals=new Map(gd.items.map(i=>[i.id,find(container,i.id)?.cloneNode(true)]));const nodes=[];
   for(const item of group.items||[]){if(item.hidden===true)continue;const orig=originals.get(item.source);if(!orig)continue;const node=orig.cloneNode(true);applyValues(node,definition,item.values);if(item.id!==item.source)uniquify(node,item.id.replace(/[^a-zA-Z0-9-]/g,''));nodes.push(node);}
   // Preserve table headers, if the original table did not have tbody.
   const headers=[...container.children].filter(x=>x.tagName==='THEAD');container.replaceChildren(...headers,...nodes);
  }
  if(section.id!==section.source)uniquify(el,section.id.replace(/[^a-zA-Z0-9-]/g,''));
  if(global){const target=oldSections.find(s=>s.tagName===el.tagName);target?.replaceWith(el);}else rendered.push(el);
 }
 if(!global){oldSections.forEach(s=>s.remove());marker.before(...rendered);}marker.remove();
 if(!global){
  doc.title=payload.title||doc.title;
  for(const [selector,value]of [['meta[name="description"]',payload.description],['meta[property="og:title"]',payload.title],['meta[name="twitter:title"]',payload.title],['meta[property="og:description"]',payload.description],['meta[name="twitter:description"]',payload.description],['meta[property="og:image"]',safeURL(payload.ogImage,true)],['meta[name="twitter:image"]',safeURL(payload.ogImage,true)]]){if(value!==undefined)doc.querySelector(selector)?.setAttribute('content',value);}
  applySocialImageMetadata(doc,payload);
  const canonical=DEFAULT_CANONICAL_ORIGIN+payload.route;doc.querySelector('link[rel="canonical"]')?.setAttribute('href',canonical);doc.querySelector('meta[property="og:url"]')?.setAttribute('content',canonical);
  const h1=doc.querySelector('h1')?.textContent;
  for(const s of doc.querySelectorAll('script[type="application/ld+json"]')){try{const schema=JSON.parse(s.textContent);const walk=x=>{if(!x||typeof x!=='object')return;if(['Article','BlogPosting','WebPage'].includes(x['@type'])){if(x.headline)x.headline=h1;if(x.name)x.name=h1;if(x.description)x.description=payload.description;if(x.url)x.url=canonical;}Object.values(x).forEach(v=>Array.isArray(v)?v.forEach(walk):walk(v));};walk(schema);s.textContent=JSON.stringify(schema).replaceAll('<','\\u003c');}catch{}}
  if(payload.test){const script=[...doc.querySelectorAll('script')].find(s=>s.textContent.includes('window.TEST_DEF ='));if(script)script.textContent='window.TEST_DEF = '+JSON.stringify(payload.test).replaceAll('<','\\u003c')+';';}
 }
 applyResponsiveMedia(doc);
}
export function validateDocument(payload,definition){
 const errors=[];if((payload.kind==='article'&&!/^\/makaleler\/[a-z0-9-]+\/$/.test(payload.route))||(payload.kind==='note'&&!/^\/notlar\/[a-z0-9-]+\/$/.test(payload.route)))errors.push('Yazı adresi ilgili makale veya not arşivi altında olmalı.');if(!payload.title?.trim())errors.push('Sayfa başlığı boş olamaz.');
 if(payload.robots!==undefined&&!['index','noindex'].includes(payload.robots))errors.push('Arama görünürlüğü geçersiz.');
 if(payload.navigation!==undefined){if(payload.kind!=='global')errors.push('Menü yapısı yalnız ortak içerikte düzenlenebilir.');errors.push(...validateNavigation(payload.navigation));}
 if(payload.collection!==undefined)errors.push(...validateCollection(payload.collection,payload.route));
 if(payload.experience!==undefined)errors.push(...validateExperience(payload.experience));
 if(payload.testimonials!==undefined)errors.push(...validateTestimonials(payload.testimonials,payload.route));
 if(payload.references!==undefined){if(payload.route!=='/')errors.push('Referanslar yalnız ana sayfada düzenlenebilir.');errors.push(...validateReferences(payload.references));}
 errors.push(...validateDocumentMediaFrames(payload,definition));
 for(const section of payload.sections||[])for(const group of section.groups||[])for(const item of group.items||[])if(item.hidden!==undefined&&typeof item.hidden!=='boolean')errors.push('Madde görünürlüğü geçersiz.');
 if(payload.ogImageAlt!==undefined&&(typeof payload.ogImageAlt!=='string'||payload.ogImageAlt.length>420))errors.push('Paylaşım görselinin açıklaması en fazla 420 karakter olmalı.');
 if(!/^\/(?:[a-z0-9_-]+\/)*$/.test(payload.route))errors.push('Adres küçük harf, rakam ve tirelerden oluşmalı; / ile bitmeli.');
 if(/merkez/i.test(JSON.stringify(payload)))errors.push('İçerikte “merkez / merkezi” kullanılamaz.');
 if(!Array.isArray(payload.sections)||payload.sections.length>40)errors.push('Bölüm yapısı geçersiz.');
 const allValues=[payload.values,...(payload.sections||[]).flatMap(s=>[s.values,...(s.groups||[]).flatMap(g=>(g.items||[]).map(i=>i.values))])];
 for(const values of allValues){for(const f of definition.fields){const value=values?.[f.id];if(value===undefined)continue;if(['url','image','video'].includes(f.type)&&value&&!safeURL(value,f.type!=='url'))errors.push(f.label+': geçerli HTTPS veya site içi adres girin.');if(['@data-talk','@data-video-id'].includes(f.target)&&!/^[-\w]{11}$/.test(String(value)))errors.push(f.label+': 11 karakterli YouTube kimliği girin.');if(f.type==='number'&&(String(value).trim()===''||!Number.isFinite(+value)||+value<0||+value>36000))errors.push(f.label+': 0–36000 arası saniye girin.');if(String(value).length>15000)errors.push(f.label+': en fazla 15000 karakter.');}}
 for(const section of payload.sections||[]){const values={...payload.values,...section.values};for(const f of definition.fields.filter(f=>f.section===section.source&&f.target==='@data-clip-start')){const end=values[f.node+':@data-clip-end'];if(end!==undefined&&Number(end)<=Number(values[f.id]))errors.push('Açılış klibinin bitişi başlangıcından sonra olmalı.');}}
 for(const hero of definition.sections.filter(s=>s.hero)){if(!(payload.sections||[]).some(s=>s.source===hero.id&&!s.hidden))errors.push('Video açılış bölümü korunmalı.');}
 if(payload.test){const t=payload.test;const keys=Object.keys(t.layers||{});if(keys.length!==5||t.questions?.length!==20)errors.push('Test 5 katman ve 20 soru içermeli.');for(const k of keys)if(t.questions.filter(q=>q.l===k).length!==4)errors.push('Her katmanda 4 soru bulunmalı.');for(const q of t.questions||[])if(!q.q?.trim()||!keys.includes(q.l)||q.o?.length!==4||q.o.some(o=>!o[0]?.trim()||!Number.isInteger(o[1])||o[1]<1||o[1]>4))errors.push('Test sorusu veya 1–4 puan aralığı geçersiz.');if(!t.verdicts?.length||t.verdicts.at(-1).min!==0||t.verdicts.some((v,i)=>!Number.isInteger(v.min)||v.min<0||v.min>100||(i>0&&v.min>=t.verdicts[i-1].min)))errors.push('Sonuç eşikleri azalan sırayla 0’a kadar tanımlanmalı.');}
 return [...new Set(errors)];
}
