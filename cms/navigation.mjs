/** Shared navigation model. Values are text and typed links, never HTML. */
const MAX_LABEL = 160;
const ID = /^[a-zA-Z0-9_-]{1,80}$/;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const forbidden = /(?:^|[^\p{L}])merkez(?:i)?(?:$|[^\p{L}])/iu;

export function navigationURL(value) {
  if (typeof value !== 'string' || !value || value.length > 2048 || /[\\\u0000-\u0020\u007f<>"`]/.test(value) || /%(?:00|09|0a|0d|5c)/i.test(value)) return '';
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  if (/^#[A-Za-z0-9_-]+$/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.username || url.password) return '';
    if (['https:', 'mailto:', 'tel:'].includes(url.protocol)) return value;
  } catch {}
  return '';
}

export function validateNavigation(nav) {
  const errors = [], ids = new Set();
  const fail = text => { if (!errors.includes(text)) errors.push(text); };
  const keys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
  const checkID = id => {
    if (typeof id !== 'string' || !ID.test(id) || ids.has(id)) fail('Menü öğelerinin kimlikleri geçerli ve benzersiz olmalı.');
    ids.add(id);
  };
  const label = text => typeof text === 'string' && text.trim().length > 0 && text.length <= MAX_LABEL && !forbidden.test(text);
  const items = (value, limit, allowChildren = false) => {
    if (!Array.isArray(value) || value.length > limit) { fail(`Menü listesi en fazla ${limit} öğe içerebilir.`); return; }
    for (const item of value) {
      if (!object(item)) { fail('Menü öğesi geçersiz.'); continue; }
      checkID(item.id);
      if (!keys(item, ['id','label','href','hidden','newTab','children'])) fail('Menü öğesinde desteklenmeyen alan var.');
      if (!label(item.label)) fail('Menü metinleri 1–160 karakter olmalı ve uygun ifadeler içermeli.');
      if (!navigationURL(item.href)) fail('Menü bağlantısı geçersiz. Site içi adres, HTTPS, e-posta veya telefon bağlantısı kullanın.');
      if (typeof item.hidden !== 'boolean' || typeof item.newTab !== 'boolean') fail('Menü görünürlüğü ve sekme ayarı geçersiz.');
      if (item.children !== undefined) {
        if (allowChildren) items(item.children, 20);
        else if (!Array.isArray(item.children) || item.children.length) fail('Alt menüler yalnızca ana menüde ve tek alt düzeyde kullanılabilir.');
      }
    }
  };
  if (!object(nav)) return ['Menü yapısı geçersiz.'];
  if (nav.version !== 1 || !keys(nav, ['version','primary','mobileSecondary','audience','social','footer'])) fail('Menü sürümü veya alanları geçersiz.');
  items(nav.primary, 20, true);
  for (const key of ['mobileSecondary','audience','social']) items(nav[key], 40);
  if (!Array.isArray(nav.footer) || nav.footer.length > 8) fail('Alt bilgi en fazla 8 bağlantı grubu içerebilir.');
  else for (const group of nav.footer) {
    if (!object(group)) { fail('Alt bilgi grubu geçersiz.'); continue; }
    checkID(group.id);
    if (!keys(group, ['id','title','placement','hidden','items'])) fail('Alt bilgi grubunda desteklenmeyen alan var.');
    if (!label(group.title)) fail('Alt bilgi grup başlığı 1–160 karakter olmalı ve uygun ifadeler içermeli.');
    if (!['columns','programs'].includes(group.placement) || typeof group.hidden !== 'boolean') fail('Alt bilgi grubu konumu veya görünürlüğü geçersiz.');
    items(group.items, 40);
  }
  return errors;
}

/** Derive after applyContent so legacy changes become the starting point. */
export function deriveNavigation(doc) {
  const header = doc.querySelector('body > header'), footer = doc.querySelector('body > footer');
  const extract = (container, prefix) => [...(container?.querySelectorAll('a[href]') || [])].map((a, i) => ({
    id: `${prefix}-${i + 1}`, label: a.textContent.trim(), href: a.getAttribute('href'),
    hidden: false, newTab: a.getAttribute('target') === '_blank'
  }));
  return {
    version: 1,
    primary: extract(header?.querySelector('.nav-links'), 'primary'),
    mobileSecondary: extract(header?.querySelector('.menu-secondary'), 'secondary'),
    audience: extract(header?.querySelector('.menu-audience'), 'audience'),
    social: extract(footer?.querySelector('.footer-social'), 'social'),
    footer: [...(footer?.querySelectorAll('.footer-group, .footer-programs') || [])].map((el, i) => ({
      id: `footer-${i + 1}`, title: el.querySelector('h2')?.textContent.trim() || 'Bağlantılar',
      placement: el.classList.contains('footer-programs') ? 'programs' : 'columns', hidden: false,
      items: extract(el, `footer-${i + 1}-item`)
    }))
  };
}

const icon = doc => {
  const svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [key,value] of Object.entries({class:'icon',viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':'1.8','stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false'})) svg.setAttribute(key,value);
  const use = doc.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href','/assets/icons.svg#chevron-down'); svg.append(use); return svg;
};

/** Invalid models never partly replace a working menu. Return errors for the caller. */
export function applyNavigation(doc, nav) {
  if (nav === undefined) return [];
  const errors = validateNavigation(nav);
  if (errors.length) return errors;
  const header = doc.querySelector('body > header'), footer = doc.querySelector('body > footer');
  const anchor = item => {
    const a = doc.createElement('a'); a.textContent = item.label; a.setAttribute('href', navigationURL(item.href));
    if (item.newTab) { a.setAttribute('target','_blank'); a.setAttribute('rel','noopener noreferrer'); }
    return a;
  };
  const fill = (container, items, list = false) => {
    if (!container) return;
    container.replaceChildren(...items.filter(item=>!item.hidden).map(item=>{
      const a = anchor(item);
      if (!list) return a;
      const li = doc.createElement('li'); li.append(a); return li;
    }));
  };
  const primary = header?.querySelector('.nav-links');
  if (primary) primary.replaceChildren(...nav.primary.filter(item=>!item.hidden).map(item=>{
    const li = doc.createElement('li'); li.append(anchor(item));
    const children = (item.children || []).filter(child=>!child.hidden);
    if (children.length) {
      li.className = 'cms-has-submenu';
      const toggle = doc.createElement('button'); toggle.type = 'button'; toggle.className = 'cms-submenu-toggle';
      toggle.setAttribute('aria-label', `${item.label}: alt menüyü aç`); toggle.setAttribute('aria-expanded','false');
      const id = `cms-submenu-${item.id}`;
      toggle.setAttribute('aria-controls',id); toggle.append(icon(doc));
      const ul = doc.createElement('ul'); ul.className = 'cms-submenu'; ul.id = id; ul.setAttribute('aria-label',`${item.label} alt menüsü`);
      // Visible in no-JS mode; the enhancement script collapses it after wiring controls.
      fill(ul, children, true); li.append(toggle,ul);
    }
    return li;
  }));
  fill(header?.querySelector('.menu-secondary'),nav.mobileSecondary);
  fill(header?.querySelector('.menu-audience'),nav.audience);
  fill(footer?.querySelector('.footer-social'),nav.social);
  if (footer) {
    const columns = footer.querySelector('.footer-navigation'), wrap = footer.querySelector('.wrap'), meta = footer.querySelector('.footer-meta');
    if (columns && wrap) {
      footer.querySelectorAll('.footer-group, .footer-programs').forEach(group=>group.remove());
      for (const group of nav.footer.filter(group=>!group.hidden)) {
        const element = doc.createElement('nav'); element.className = group.placement === 'programs' ? 'footer-programs' : 'footer-group';
        const heading = doc.createElement('h2'); heading.id = `cms-footer-title-${group.id}`; heading.textContent = group.title;
        element.setAttribute('aria-labelledby',heading.id);
        const ul = doc.createElement('ul'); fill(ul,group.items,true); element.append(heading,ul);
        if (group.placement === 'columns') columns.append(element); else wrap.insertBefore(element,meta || null);
      }
      columns.setAttribute('data-cms-footer-columns',String(nav.footer.filter(group=>!group.hidden&&group.placement==='columns').length));
    }
  }
  if (!doc.querySelector('link[data-cms-navigation]')) {
    const link = doc.createElement('link'); link.rel='stylesheet'; link.href='/assets/cms-navigation.css'; link.setAttribute('data-cms-navigation',''); doc.head.append(link);
  }
  if (!doc.querySelector('script[data-cms-navigation]')) {
    const script = doc.createElement('script'); script.src='/assets/cms-navigation.js'; script.defer=true; script.setAttribute('data-cms-navigation',''); doc.body.append(script);
  }
  return [];
}

/** Nonblocking editorial feedback; a link to a draft can still be staged. */
export function auditNavigation(nav, pages = []) {
  const known = new Map(pages.map(page=>[page.route,page]));
  const warnings = [];
  const walk = items => { for (const item of items || []) {
    if (item.hidden) continue;
    if (item.href?.startsWith('/') && !item.href.startsWith('//')) {
      const route = item.href.split(/[?#]/)[0].replace(/\/?$/,'/');
      const page = known.get(route);
      if (!page || page.archived) warnings.push({id:item.id,message:`“${item.label}” bağlantısının sayfası bulunamadı veya arşivde.`});
      else if (Object.hasOwn(page,'published_revision') && !page.published_revision) warnings.push({id:item.id,message:`“${item.label}” bağlantısının sayfası henüz yayında değil.`});
    }
    walk(item.children);
  }};
  walk(nav.primary); walk(nav.mobileSecondary); walk(nav.audience); walk(nav.social);
  for (const group of nav.footer || []) if (!group.hidden) walk(group.items);
  return warnings;
}
