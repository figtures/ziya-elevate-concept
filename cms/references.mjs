import {navigationURL} from './navigation.mjs';

const text=(value,min,max)=>typeof value==='string'&&value.trim().length>=min&&value.length<=max;
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const mediaURL=value=>{const url=navigationURL(value);return url.startsWith('/')||url.startsWith('https:')?url:'';};

export function seedReferences(logos){
 return {enabled:true,eyebrow:'Markalar, kurumlar ve sahneler',title:'Referanslar',duration:65,
  logos:logos.map(({id,name,src,width,height})=>({id,name,src,width,height,url:'',enabled:true}))};
}

export function validateReferences(model){
 if(!object(model))return ['Referans ayarları geçersiz.'];
 const errors=[];const ids=new Set();
 if(Object.keys(model).some(k=>!['enabled','eyebrow','title','duration','logos'].includes(k)))errors.push('Referans ayarlarında desteklenmeyen alan var.');
 if(typeof model.enabled!=='boolean'||!text(model.eyebrow,0,160)||!text(model.title,1,200))errors.push('Referans başlığı veya görünürlüğü geçersiz.');
 if(!Number.isFinite(model.duration)||model.duration<10||model.duration>240)errors.push('Kayma süresi 10–240 saniye arasında olmalı.');
 if(!Array.isArray(model.logos)||model.logos.length>100)return [...errors,'En fazla 100 referans eklenebilir.'];
 for(const logo of model.logos){
  if(!object(logo)){errors.push('Logo kaydı geçersiz.');continue;}
  if(Object.keys(logo).some(k=>!['id','name','src','width','height','url','enabled'].includes(k)))errors.push('Logo kaydında desteklenmeyen alan var.');
  if(!text(logo.id,1,80)||!/^[a-zA-Z0-9_-]+$/.test(logo.id)||ids.has(logo.id))errors.push('Logo kimlikleri benzersiz olmalı.');ids.add(logo.id);
  if(!text(logo.name,1,160)||(logo.src?!mediaURL(logo.src):logo.enabled)||typeof logo.src!=='string'||(logo.url&&!navigationURL(logo.url))||typeof logo.url!=='string')errors.push('Logo adı, görseli veya bağlantısı geçersiz.');
  if(typeof logo.enabled!=='boolean'||![logo.width,logo.height].every(n=>Number.isFinite(n)&&n>0&&n<=16000))errors.push('Logo görünürlüğü veya ölçüleri geçersiz.');
 }
 return [...new Set(errors)];
}

/** SSR fallback stays readable with JavaScript off; the React island enhances it. */
export function applyReferences(doc,payload){
 doc.querySelector('#referanslar')?.remove();
 const model=payload.references;
 if(payload.route!=='/'||!model||validateReferences(model).length||!model.enabled)return;
 const logos=model.logos.filter(logo=>logo.enabled);if(!logos.length)return;
 const hero=doc.querySelector('.editorial-home-hero');if(!hero)return;
 const el=(tag,className,content)=>{const node=doc.createElement(tag);if(className)node.className=className;if(content!==undefined)node.textContent=content;return node;};
 const section=el('section','ed-section ed-references');section.id='referanslar';section.setAttribute('aria-labelledby','referanslar-baslik');section.setAttribute('data-motion-section','');
 const wrap=el('div','wrap');const heading=el('div','reference-heading');heading.setAttribute('data-motion-item','');
 if(model.eyebrow)heading.append(el('p','eyebrow',model.eyebrow));
 const title=el('h2','',model.title);title.id='referanslar-baslik';heading.append(title);wrap.append(heading);
 const slider=el('div','reference-slider-fallback');slider.setAttribute('data-reference-slider','');slider.setAttribute('data-duration',String(model.duration));slider.setAttribute('aria-label',model.title);
 const list=el('ul','reference-logos');list.setAttribute('aria-label',model.title);
 for(const logo of logos){
  const li=el('li','reference-logo');const img=el('img');img.setAttribute('src',logo.src);img.setAttribute('alt',logo.name);img.setAttribute('width',String(Math.round(logo.width)));img.setAttribute('height',String(Math.round(logo.height)));img.setAttribute('loading','lazy');img.setAttribute('decoding','async');
  if(logo.url){const a=el('a');a.setAttribute('href',logo.url);if(logo.url.startsWith('https:'))a.setAttribute('rel','noopener noreferrer');a.append(img);li.append(a);}else li.append(img);
  list.append(li);
 }
 slider.append(list);wrap.append(slider);section.append(wrap);hero.after(section);
 if(!doc.querySelector('link[data-reference-style]')){const css=el('link');css.setAttribute('rel','stylesheet');css.setAttribute('href','/assets/reference-slider.css');css.setAttribute('data-reference-style','');css.setAttribute('data-island-style','');doc.head.append(css);}
 if(!doc.querySelector('script[data-reference-script]')){const script=el('script');script.setAttribute('src','/assets/reference-slider.js');script.setAttribute('defer','');script.setAttribute('data-reference-script','');doc.body.append(script);}
}
