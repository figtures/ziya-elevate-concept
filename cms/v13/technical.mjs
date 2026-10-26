const PRODUCTION_HOSTS=new Set(['ziyasakiryilmaz.com','www.ziyasakiryilmaz.com']);

/** Canonicals describe identity; the actual request host decides preview indexing. */
export function isV13PreviewOrigin(requestOrigin,canonicalOrigin){
 if(!requestOrigin)return false; // A compiler/authoring preview has no HTTP request.
 try{
  const request=new URL(requestOrigin),host=request.hostname.toLowerCase();
  if(PRODUCTION_HOSTS.has(host))return false;
  if(/(?:^|\.)(?:workers\.dev|pages\.dev|chatgpt\.site|localhost)$/.test(host)||host==='127.0.0.1'||host==='[::1]')return true;
  return !canonicalOrigin||request.origin!==new URL(canonicalOrigin).origin;
 }catch{return true;}
}

const languageStyles=`
header.signature-header .v13-language-switch{display:flex;align-items:center;justify-content:flex-end;flex:none;gap:2px;white-space:nowrap;color:#eee9dc;font:600 .8125rem/1.2 var(--font-b);letter-spacing:.035em}
header.signature-header .v13-language-switch a{display:inline-flex;align-items:center;justify-content:center;min-width:28px;min-height:44px;padding:0 2px;color:#c5c9d2;text-decoration:none;transition:color .2s}
header.signature-header .v13-language-switch a[aria-current],header.signature-header .v13-language-switch a:hover{color:#fffefa}
header.signature-header .v13-language-switch a[aria-current]{text-decoration:underline;text-underline-offset:5px;text-decoration-color:#dfd1b5}
header.signature-header .v13-language-switch span{color:#b2b8c3;font-weight:400}
header.signature-header .v13-language-switch a:focus-visible{outline:2px solid #dfd1b5;outline-offset:2px;border-radius:5px}
header.signature-header .mobile-nav-footer>.v13-language-switch{align-self:flex-end}
@media(min-width:1281px){body[data-editorial] header.signature-header .nav[data-v13-language-ready]{gap:20px}body[data-editorial] header.signature-header .nav[data-v13-language-ready] .nav-links{gap:18px}}
@media(max-width:700px){body[data-editorial] header.signature-header .nav[data-v13-language-ready]{gap:8px}body[data-editorial] header.signature-header .nav[data-v13-language-ready] .nav-cta{gap:8px}body[data-editorial] header.signature-header .nav[data-v13-language-ready] .hamb{width:44px;min-width:44px;padding:10px}body[data-editorial] header.signature-header .nav[data-v13-language-ready] .menu-toggle-label{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}header.signature-header .v13-language-switch{font-size:.75rem;gap:0}header.signature-header .v13-language-switch a{min-width:25px}}
@media(prefers-reduced-motion:reduce){header.signature-header .v13-language-switch a{transition:none}}
`;

function languageSwitch(document,english,placement){
 const nav=document.createElement('nav');nav.className='v13-language-switch';nav.setAttribute('data-v13-language',placement);nav.setAttribute('aria-label',english?'Language':'Dil seçimi');
 for(const [index,[locale,label,href]] of [['tr','TR','/'],['en','EN','/en/speaker/']].entries()){
  if(index){const separator=document.createElement('span');separator.textContent='|';separator.setAttribute('aria-hidden','true');nav.append(separator);}
  const link=document.createElement('a');link.textContent=label;link.setAttribute('href',href);link.setAttribute('hreflang',locale);link.setAttribute('lang',locale);link.setAttribute('aria-label',locale==='tr'?'Türkçe':'English');
  if((english?'en':'tr')===locale)link.setAttribute('aria-current','true');nav.append(link);
 }
 return nav;
}

function applyLanguageLinks(document,payload){
 const header=document.querySelector('header.signature-header');if(!header)return;
 const english=payload?.route==='/en/speaker/'||document.documentElement.lang==='en';
 header.querySelectorAll('[data-v13-language]').forEach(node=>node.remove());
 const actions=header.querySelector('.nav-cta'),menuFooter=header.querySelector('.mobile-nav-footer');
 if(actions){actions.append(languageSwitch(document,english,'header'));header.querySelector('.nav')?.setAttribute('data-v13-language-ready','');}
 if(menuFooter)menuFooter.append(languageSwitch(document,english,'mobile-menu'));
 if(!document.head.querySelector('[data-v13-language-styles]')){const style=document.createElement('style');style.setAttribute('data-v13-language-styles','');style.textContent=languageStyles;document.head.append(style);}
}

function applyPressLink(document,payload){
 const footer=document.querySelector('footer.site-footer,footer.site');if(!footer||footer.querySelector('a[href="/basin/"]'))return;
 const list=footer.querySelector('.footer-group[aria-labelledby="footer-work-title"] ul')||footer.querySelector('.footer-group ul');if(!list)return;
 const item=document.createElement('li'),link=document.createElement('a');link.setAttribute('href','/basin/');link.textContent=payload?.route==='/en/speaker/'?'Press / Media Kit':'Basın / Medya Kiti';link.setAttribute('hreflang','tr');link.setAttribute('data-v13-press-link','');item.append(link);list.append(item);
}

export function applyV13Robots(document,{requestOrigin,canonicalOrigin}={}){
 const preview=isV13PreviewOrigin(requestOrigin,canonicalOrigin);
 const policies=[...document.head.querySelectorAll('meta[name]')].filter(node=>node.getAttribute('name').toLowerCase()==='robots');
 if(preview){
  if(!policies.length){const meta=document.createElement('meta');meta.setAttribute('name','robots');meta.setAttribute('data-v13-preview-created','');document.head.append(meta);policies.push(meta);}
  for(const meta of policies){if(!meta.hasAttribute('data-v13-preview-robots'))meta.setAttribute('data-v13-original-robots',meta.getAttribute('content')||'');meta.setAttribute('data-v13-preview-robots','');meta.setAttribute('content','noindex, nofollow');}
 }else if(requestOrigin){
  // Only undo our own request-specific override; preserve editorial noindex.
  for(const meta of policies.filter(node=>node.hasAttribute('data-v13-preview-robots'))){if(meta.hasAttribute('data-v13-preview-created'))meta.remove();else{meta.setAttribute('content',meta.getAttribute('data-v13-original-robots')||'index, follow');meta.removeAttribute('data-v13-preview-robots');meta.removeAttribute('data-v13-original-robots');}}
 }
 return document;
}

/** Call after shared navigation, locale, and SEO composition. No hero mutations. */
export function applyV13Technical(document,payload,options={}){
 applyLanguageLinks(document,payload);applyPressLink(document,payload);applyV13Robots(document,options);return document;
}
