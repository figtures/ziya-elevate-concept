import {safeURL} from './render.mjs';

export const TESTIMONIAL_DEFAULTS={enabled:true,eyebrow:'Deneyimler',title:'Sahneden kalan izler',description:'',items:[]};
const text=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
export function normalizeTestimonials(value){
 const source=value&&typeof value==='object'?value:{};
 return {enabled:source.enabled!==false,eyebrow:text(source.eyebrow??TESTIMONIAL_DEFAULTS.eyebrow,100),title:text(source.title??TESTIMONIAL_DEFAULTS.title,200),description:text(source.description,600),items:(Array.isArray(source.items)?source.items:[]).slice(0,50).filter(item=>item&&typeof item==='object'&&!Array.isArray(item)).map((item,index)=>({id:text(item.id,100)||'testimonial-'+index,name:text(item.name,120),role:text(item.role,160),company:text(item.company,160),avatar:safeURL(item.avatar,true),quote:text(item.quote,800),status:item.status==='approved'?'approved':'draft',enabled:item.enabled!==false,approvedAt:text(item.approvedAt,40)}))};
}
export function validateTestimonials(value,route='/'){
 if(value===undefined)return[];
 const errors=[];
 if(route!=='/')errors.push('Yorumlar yalnız ana sayfada düzenlenebilir.');
 if(!value||typeof value!=='object'||Array.isArray(value))return [...errors,'Yorum bölümü geçersiz.'];
 if(typeof value.enabled!=='boolean'||!Array.isArray(value.items)||value.items.length>50)errors.push('Yorum görünürlüğü veya madde sayısı geçersiz.');
 for(const [key,max] of [['eyebrow',100],['title',200],['description',600]])if(value[key]!==undefined&&(typeof value[key]!=='string'||value[key].length>max))errors.push('Yorum başlığı veya açıklaması çok uzun.');
 if(Object.keys(value).some(key=>!['enabled','eyebrow','title','description','items'].includes(key)))errors.push('Yorum ayarlarında desteklenmeyen alan var.');
 const ids=new Set();
 for(const item of (Array.isArray(value.items)?value.items:[])){
  if(!item||typeof item!=='object'){errors.push('Yorum bilgisi geçersiz.');continue;}
  if(Object.keys(item).some(key=>!['id','name','role','company','avatar','quote','status','enabled','approvedAt'].includes(key)))errors.push('Yorum kaydında desteklenmeyen alan var.');
  if(typeof item.id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)||ids.has(item.id))errors.push('Yorum kimliği geçersiz veya yineleniyor.');ids.add(item.id);
  for(const [key,max] of [['name',120],['role',160],['company',160],['quote',800],['avatar',2048],['approvedAt',40]])if(item[key]!==undefined&&(typeof item[key]!=='string'||item[key].length>max))errors.push('Yorum alanı geçersiz veya çok uzun.');
  if(!['draft','approved'].includes(item.status)||typeof item.enabled!=='boolean')errors.push('Yorum durumu geçersiz.');
  if(item.status==='approved'&&(!item.name?.trim()||!item.quote?.trim()))errors.push('Onaylı yorum için ad ve yorum metni zorunlu.');
  if(item.avatar&&!safeURL(item.avatar,true))errors.push('Yorum fotoğrafı için geçerli HTTPS veya site içi adres girin.');
 }
 return [...new Set(errors)];
}
export function publicTestimonials(value){const normalized=normalizeTestimonials(value);return {...normalized,items:normalized.enabled?normalized.items.filter(item=>item.enabled&&item.status==='approved'&&item.name&&item.quote):[]};}

/** Only approved quotes enter visitor HTML. Drafts are rendered solely in the authenticated preview. */
export function applyTestimonials(document,payload,{preview=false}={}){
 document.querySelector('[data-testimonials-section]')?.remove();
 if(payload?.route!=='/')return document;
 const config=normalizeTestimonials(payload.testimonials);
 const items=preview?config.items:publicTestimonials(config).items;
 if((!config.enabled&&!preview)||!items.length)return document;
 const anchor=document.querySelector('#alanlar');if(!anchor)return document;
 const el=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value)node.textContent=value;return node;};
 const section=el('section','ed-section ed-testimonials');section.id='deneyimler';section.setAttribute('data-testimonials-section','');section.setAttribute('data-motion-section','');section.setAttribute('aria-labelledby','deneyimler-baslik');
 const wrap=el('div','wrap'),head=el('div','ed-heading');head.setAttribute('data-motion-item','');
 if(config.eyebrow)head.append(el('p','eyebrow',config.eyebrow));const title=el('h2','',config.title||'Deneyimler');title.id='deneyimler-baslik';head.append(title);
 if(config.description)head.append(el('p','ed-description',config.description));wrap.append(head);
 if(preview&&!config.enabled)wrap.append(el('p','testimonial-draft-note','Önizleme: Bu bölüm yayında gizli.'));
 const grid=el('div','testimonial-list');
 for(const item of items){const card=el('figure','testimonial-card');card.setAttribute('data-motion-item','');
  if(preview&&(item.status!=='approved'||!item.enabled)){card.setAttribute('data-testimonial-draft','');card.append(el('p','testimonial-draft-note',item.status!=='approved'?'METİN ÖNERİSİ · KİŞİ ONAYI BEKLENİYOR':'ÖNİZLEME · YAYINDA GİZLİ'));}
  card.append(el('blockquote','',item.quote||'Yorum metni henüz eklenmedi.'));const author=el('figcaption','testimonial-author');
  if(item.avatar){const image=el('img','testimonial-avatar');image.setAttribute('src',item.avatar);image.setAttribute('alt','');image.setAttribute('loading','lazy');image.setAttribute('decoding','async');image.setAttribute('width','56');image.setAttribute('height','56');author.append(image);}
  const byline=el('div','testimonial-byline');byline.append(el('strong','',item.name||'Ad soyad'));if(item.role||item.company)byline.append(el('span','',[item.role,item.company].filter(Boolean).join(' · ')));author.append(byline);card.append(author);grid.append(card);
 }
 wrap.append(grid);section.append(wrap);anchor.before(section);
 if(!document.querySelector('link[data-testimonials-styles]')){const css=document.createElement('link');css.rel='stylesheet';css.href='/assets/testimonials.css';css.setAttribute('data-testimonials-styles','');css.setAttribute('data-island-style','');document.head.append(css);}
 return document;
}
