/** Metadata is rebuilt from the final CMS-rendered DOM, never stale template JSON-LD. */
import socialImages from './social-images.json' with { type: 'json' };
import siteConfig from './config.json' with { type: 'json' };
import { deploymentOrigin } from './domain.mjs';
export const DEFAULT_CANONICAL_ORIGIN = deploymentOrigin(siteConfig.canonicalOrigin || siteConfig.siteOrigin);
const LEGACY_ASSET_ORIGINS = new Set([
  'https://ziyasakiryilmaz.com', 'https://www.ziyasakiryilmaz.com',
  'https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site',
  ...(siteConfig.legacyOrigins || []), siteConfig.siteOrigin, siteConfig.canonicalOrigin,
].filter(Boolean).map(deploymentOrigin));
const RETIRED_ROUTES = new Set(['/testler/basari-muhendisligi-skoru/', '/testler/satis-yetkinlik-skoru/', '/testler/liderlik-yetkinlik-skoru/']);
export function canonicalOrigin(value) {
  try { const u = new URL(value); if (u.protocol === 'https:' && !u.username && !u.password) return u.origin; } catch {}
  return DEFAULT_CANONICAL_ORIGIN;
}
export function indexableRoute(route) {
  return typeof route === 'string' && /^\/(?:[a-z0-9_-]+\/)*$/.test(route) && !/^\/(?:admin|api|assets|_global)(?:\/|$)/.test(route) && !RETIRED_ROUTES.has(route);
}
/** Publication and indexing are separate: a noindex page remains accessible to visitors. */
export function indexableContent(row) {
  return Boolean(row && ['page','article','note','test'].includes(row.kind) && indexableRoute(row.route) &&
    row.noindex !== true && row.noindex !== 'true' && !/\b(?:noindex|none)\b/i.test(String(row.robots ?? '')) &&
    (!row.status || row.status === 'published'));
}

function applyRobotsPolicy(doc, payload) {
  const policies = [...doc.head.querySelectorAll('meta[name]')].filter(n => n.getAttribute('name').toLowerCase() === 'robots');
  const explicit = payload.robots === 'index' || payload.robots === 'noindex' || payload.noindex === true;
  if (explicit) {
    // An explicit CMS choice replaces any inherited template policy, including uppercase names.
    policies.forEach(n => n.remove());
    meta(doc, 'robots', (payload.robots === 'noindex' || payload.noindex === true ? 'noindex' : 'index') + ', follow, max-image-preview:large');
  } else if (!policies.length) meta(doc, 'robots', 'index, follow, max-image-preview:large');
}
function absoluteURL(value, origin) {
  const s = String(value || '').trim();
  if (!s || /[\\\u0000-\u0020]/.test(s) || s.startsWith('//')) return '';
  if (!s.startsWith('/') && !s.startsWith('https://')) return '';
  try { const u = new URL(s, origin); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
function imageURL(value, origin) {
  const href = absoluteURL(value, origin);
  if (!href) return '';
  const image = new URL(href);
  if (LEGACY_ASSET_ORIGINS.has(image.origin) && image.pathname.startsWith('/assets/')) return origin + image.pathname + image.search;
  return href;
}
function text(node) {
  if (!node) return '';
  const copy = node.cloneNode(true);
  copy.querySelectorAll('script,style,svg,[hidden],[aria-hidden="true"]').forEach(n => n.remove());
  copy.querySelectorAll('br').forEach(n => n.replaceWith(' '));
  return copy.textContent.replace(/\s+/g, ' ').trim();
}
const visible = node => Boolean(node && !node.closest('[hidden],[aria-hidden="true"],template'));
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
function upsert(doc, selector, tag, attrs, value) {
  const existing = [...doc.head.querySelectorAll(selector)];
  const node = existing.shift() || doc.createElement(tag);
  existing.forEach(n => n.remove());
  for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, val);
  if (value !== undefined) node.textContent = value;
  if (!node.parentNode) doc.head.append(node);
  return node;
}
function meta(doc, key, value, property = false) {
  const attr = property ? 'property' : 'name';
  return upsert(doc, `meta[${attr}="${key}"]`, 'meta', { [attr]: key, content: value });
}
/** Only exact, local generated assets have known geometry; external replacements never inherit it. */
function registeredSocialImage(image, origin) {
  if (!image) return null;
  const url = new URL(image);
  return url.origin === origin && !url.search && !url.hash ? socialImages[url.pathname] || null : null;
}
export function applySocialImageMetadata(doc, payload, configuredOrigin = DEFAULT_CANONICAL_ORIGIN) {
  const origin = canonicalOrigin(configuredOrigin);
  const requested = imageURL(payload.ogImage, origin);
  const image = requested || imageURL(doc.querySelector('.hero-vid img')?.getAttribute('src') || doc.querySelector('.hero-vid video')?.getAttribute('poster'), origin);
  const registered = registeredSocialImage(image, origin);
  // Alt text is associated with its image. Direct URL replacements and rejected URLs must not
  // borrow the description of a previously selected social card.
  const boundAlt = requested && (!payload.ogImageAltFor || imageURL(payload.ogImageAltFor, origin) === requested) ? clean(payload.ogImageAlt) : '';
  const shownImage = image && [...doc.querySelectorAll('img[src]')].find(n => imageURL(n.getAttribute('src'), origin) === image);
  const alt = (boundAlt || clean(registered?.alt) || clean(shownImage?.getAttribute('alt'))).slice(0, 420);
  for (const key of ['og:image','twitter:image']) {
    if (image) meta(doc, key, image, key.startsWith('og:'));
    else doc.head.querySelectorAll(`meta[${key.startsWith('og:') ? 'property' : 'name'}="${key}"]`).forEach(n => n.remove());
  }
  const properties = {};
  if (image && alt) properties.alt = alt;
  if (registered) for (const key of ['width','height','type']) if (registered[key]) properties[key] = String(registered[key]);
  for (const node of doc.head.querySelectorAll('meta[property^="og:image:"]')) {
    if (!Object.hasOwn(properties, node.getAttribute('property').slice('og:image:'.length))) node.remove();
  }
  if (!image || !alt) doc.head.querySelectorAll('meta[name="twitter:image:alt"]').forEach(n => n.remove());
  meta(doc, 'twitter:card', image ? 'summary_large_image' : 'summary');
  if (image && alt) meta(doc, 'twitter:image:alt', alt);
  for (const [key, value] of Object.entries(properties)) meta(doc, 'og:image:' + key, value, true);
  return { image, alt, registered };
}
const MONTHS = ['ocak','şubat','mart','nisan','mayıs','haziran','temmuz','ağustos','eylül','ekim','kasım','aralık'];
function parseDate(value) {
  const s = clean(value).toLocaleLowerCase('tr-TR');
  const match = s.match(/^(\d{1,2})\s+(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\s+(\d{4})$/);
  if (!match) return '';
  const day = +match[1], month = MONTHS.indexOf(match[2]) + 1, year = +match[3];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
}
function visibleDates(doc, kind) {
  const dates = {};
  for (const node of doc.querySelectorAll('article .hero-note, article time, .reading-body .hero-note')) {
    if (!visible(node)) continue;
    const copy = text(node);
    const published = copy.match(/Yayın\s*:\s*([^·]+)/i), modified = copy.match(/Son güncelleme\s*:\s*([^·]+)/i);
    if (published) dates.datePublished = parseDate(published[1]);
    if (modified) dates.dateModified = parseDate(modified[1]);
  }
  if (kind === 'note' && !dates.datePublished) {
    const kicker = text(doc.querySelector('.page-hero .kicker'));
    dates.datePublished = parseDate(kicker.split('·').at(-1));
  }
  if (dates.dateModified && dates.datePublished && dates.dateModified < dates.datePublished) delete dates.dateModified;
  return Object.fromEntries(Object.entries(dates).filter(([, v]) => v));
}
function visibleAuthor(doc, origin, brand, personID) {
  // Editors may replace a byline. The site's publisher is not automatically the author.
  let link = [...doc.querySelectorAll('article [rel~="author"], [data-article-author]')].find(visible);
  let name = text(link), href = link?.getAttribute('href');
  if (!name) {
    link = [...doc.querySelectorAll('article a[href="/ziya-sakir-yilmaz/"]')].filter(visible).find(a => a.parentElement?.querySelector('b,strong'));
    name = text(link?.parentElement?.querySelector('b,strong')); href = link?.getAttribute('href');
    // A changed guest name must not inherit Ziya's profile URL from the legacy author-card layout.
    if (name !== brand) href = '';
  }
  if (!name) return null;
  const url = absoluteURL(href, origin);
  if (name === brand && url === origin + '/ziya-sakir-yilmaz/') return {'@id':personID};
  return {'@type':'Person',name,...(url ? {url} : {})};
}
function visibleCitations(doc, origin) {
  const used = new Set();
  return [...doc.querySelectorAll('article a[rel~="cite"][href]')].filter(visible).map(link => {
    const url = absoluteURL(link.getAttribute('href'),origin), name = clean(link.getAttribute('title')) || text(link);
    if (!url || !name || used.has(url)) return null;
    used.add(url);
    return {'@type':'CreativeWork',name,url};
  }).filter(Boolean);
}
function listEntity(url, key, name, items) {
  return items.length ? {'@type':'ItemList','@id':url + '#' + key,name,numberOfItems:items.length,itemListElement:items.map((item,i) => ({'@type':'ListItem',position:i+1,item}))} : null;
}
function breadcrumbs(doc, route, name, origin) {
  if (route === '/') return null;
  const entries = [], used = new Set();
  const add = (path, label) => {
    if (!indexableRoute(path) || !label || used.has(path)) return;
    used.add(path); entries.push({ '@type':'ListItem', position: entries.length + 1, name: label, item: origin + path });
  };
  const nav = doc.querySelector('.breadcrumb');
  if (nav && visible(nav)) for (const a of nav.querySelectorAll('a[href]')) add(a.getAttribute('href'), text(a));
  if (!entries.length) add('/', 'Ana Sayfa');
  if (entries.at(-1)?.item !== origin + route) add(route, name);
  else entries.at(-1).name = name;
  return { '@type':'BreadcrumbList', '@id':origin + route + '#breadcrumb', itemListElement:entries };
}
function bookList(doc, origin, url, personID) {
  const books = [...doc.querySelectorAll('.book-editorial-list > article')].filter(visible).map(card => {
    const name = text(card.querySelector('h2,h3'));
    if (!name) return null;
    const book = { '@type':'Book', name, inLanguage:'tr', author:{'@id':personID} };
    // The authored book comparison table supplies the co-author, not an old JSON-LD constant.
    const tableRow = [...doc.querySelectorAll('tr')].find(row => visible(row) && [...row.querySelectorAll('b,strong')].some(n => text(n) === name));
    const coauthor = text(tableRow).match(/\(([\p{L}][\p{L} .’'-]{1,98}) ile\)/u)?.[1]?.trim();
    if (coauthor) book.author = [{'@id':personID},{'@type':'Person',name:coauthor}];
    const description = [...card.querySelectorAll('p')].filter(n => !n.classList.contains('eyebrow')).map(text).filter(Boolean).join(' ');
    if (description) book.description = description;
    const image = imageURL(card.querySelector('img')?.getAttribute('src'), origin);
    if (image) book.image = image;
    const href = absoluteURL(card.querySelector('a[href]')?.getAttribute('href'), origin);
    if (href) book.url = href;
    // Month-only launch announcements and edition numbers are not publication dates.
    const label = text(card.querySelector('.eyebrow'));
    if (/^(?:19|20)\d{2}(?:\s*·|$)/.test(label)) book.datePublished = label.slice(0,4);
    return book;
  }).filter(Boolean);
  return listEntity(url,'books',text(doc.querySelector('h1')),books);
}
function talkList(doc, origin, url, personID) {
  const talks = [...doc.querySelectorAll('.talk-archive > a[href]')].filter(visible).map(card => {
    const name = text(card.querySelector('h2,h3')), href = absoluteURL(card.getAttribute('href'), origin);
    if (!name || !href) return null;
    // Exact upload dates are not in the authored page. Do not fabricate VideoObject eligibility.
    const talk = {'@type':'CreativeWork', name, url:href, inLanguage:'tr',creator:{'@id':personID}};
    const image = imageURL(card.querySelector('img')?.getAttribute('src'), origin);
    if (image) talk.image = image;
    return talk;
  }).filter(Boolean);
  return listEntity(url,'talks','Konuşmalar',talks);
}
function writingList(doc, origin, url, route) {
  if (!['/makaleler/','/hayattan-notlar/'].includes(route)) return null;
  const expected = route === '/makaleler/' ? '/makaleler/' : '/notlar/', used = new Set();
  const entries = [...doc.querySelectorAll('.post-list > a[href]')].filter(visible).map(a => {
    const href = a.getAttribute('href'), label = a.querySelector('span:not(.cat)') || a;
    if (!href.startsWith(expected) || href === expected || !indexableRoute(href) || used.has(href)) return null;
    const name = text(label); if (!name) return null;
    used.add(href);
    return {'@type':'WebPage',url:origin + href,name};
  }).filter(Boolean);
  return listEntity(url,'writing',text(doc.querySelector('h1')),entries);
}
function serviceEntity(doc, payload, origin, url, personID) {
  if (!['/konusmaci/','/en/speaker/','/mentorluk/','/kurumsal/satis-egitimi/','/kurumsal/liderlik-egitimi/','/kurumsal/kafa-yapisi-atolyesi/'].includes(payload.template)) return null;
  const hero = doc.querySelector('.page-hero');
  if (!visible(hero)) return null;
  const name = text(hero.querySelector('h1')), serviceType = text(hero.querySelector('.eyebrow'));
  if (!name || !serviceType) return null;
  const service = {'@type':'Service','@id':url + '#service',url,name,serviceType,provider:{'@id':personID},mainEntityOfPage:{'@id':url + '#webpage'}};
  const description = text(hero.querySelector('.lead'));
  if (description) service.description = description;
  const contact = [...hero.querySelectorAll('.hero-action a[href]')].filter(visible).map(a => {
    const raw = a.getAttribute('href');
    // Fragment links are resolved against this page, never the root of the site.
    return raw.startsWith('#') ? absoluteURL(url + raw, origin) : absoluteURL(raw, origin);
  }).find(href => {
    if (!href) return false;
    const target = new URL(href);
    if (target.origin !== origin) return false;
    if (target.pathname === '/iletisim/') return true;
    if (target.pathname !== payload.route || !target.hash) return false;
    let id; try { id = decodeURIComponent(target.hash.slice(1)); } catch { return false; }
    const section = doc.getElementById(id);
    const form = section?.matches('form#contactForm') ? section : section?.querySelector('#contactForm');
    return visible(form);
  });
  if (contact) service.availableChannel = {'@type':'ServiceChannel',serviceUrl:contact};
  return service;
}
function programList(doc, origin, url, personID) {
  const programs = [...doc.querySelectorAll('.program-catalog > article')].filter(visible).map(card => {
    const name = text(card.querySelector('h2,h3')), href = absoluteURL(card.querySelector('a[href]')?.getAttribute('href'),origin);
    if (!name || !href) return null;
    const program = {'@type':'Service',url:href,name,provider:{'@id':personID}};
    const description = text(card.querySelector('p:not(.eyebrow)')), audience = text(card.querySelector('.eyebrow'));
    if (description) program.description = description;
    if (audience) program.audience = {'@type':'Audience',audienceType:audience};
    return program;
  }).filter(Boolean);
  return listEntity(url,'programs',text(doc.querySelector('h1')),programs);
}
function faq(doc, url) {
  const questions = [];
  for (const detail of doc.querySelectorAll('.faq details')) {
    if (!visible(detail)) continue;
    const summary = detail.querySelector('summary'), name = text(summary), copy = detail.cloneNode(true);
    copy.querySelector('summary')?.remove();
    const answer = text(copy);
    if (name && answer) questions.push({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text:answer}});
  }
  // Expandable answers are available to visitors. This makes no rich-result eligibility claim.
  return questions.length ? {'@type':'FAQPage','@id':url + '#faq',mainEntity:questions} : null;
}
export function applySEO(doc, payload, configuredOrigin = DEFAULT_CANONICAL_ORIGIN) {
  if (payload.kind === 'global' || !indexableRoute(payload.route)) return doc;
  const origin = canonicalOrigin(configuredOrigin), route = payload.route, url = origin + route;
  const name = text(doc.querySelector('h1')) || clean(payload.title);
  const title = clean(payload.title) || name;
  const description = clean(payload.description);
  const brand = text(doc.querySelector('.ed-wordmark > span')) || text(doc.querySelector('.footer-wordmark > span')) || 'Ziya Şakir Yılmaz';
  const { image } = applySocialImageMetadata(doc, payload, origin);
  const isArticle = ['article','note'].includes(payload.kind);
  const language = route.startsWith('/en/') ? 'en' : 'tr';
  doc.documentElement.setAttribute('lang',language);
  upsert(doc, 'title', 'title', {}, title);
  meta(doc,'description',description);
  // Keep pages crawlable so crawlers can actually read an editor's noindex instruction.
  applyRobotsPolicy(doc, payload);
  upsert(doc, 'link[rel="canonical"]', 'link', {rel:'canonical',href:url});
  for (const [key, value] of Object.entries({title,description,url,type:isArticle?'article':'website',site_name:brand,locale:language === 'en' ? 'en_US' : 'tr_TR'})) meta(doc,'og:'+key,value,true);
  doc.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach(n => n.remove());
  if (['/konusmaci/','/en/speaker/'].includes(route)) {
    for (const [lang,path] of [['tr','/konusmaci/'],['en','/en/speaker/'],['x-default','/konusmaci/']]) {
      upsert(doc, `link[rel="alternate"][hreflang="${lang}"]`, 'link', {rel:'alternate',hreflang:lang,href:origin+path});
    }
  }
  for (const [key, value] of Object.entries({title,description,card:image?'summary_large_image':'summary'})) meta(doc,'twitter:'+key,value);
  // Replaced/duplicated sections and new routes must not inherit detached template entities.
  doc.querySelectorAll('script[type="application/ld+json"]').forEach(n => n.remove());
  const personID = origin + '/ziya-sakir-yilmaz/#person';
  const person = {'@type':'Person','@id':personID,name:brand,url:origin + '/ziya-sakir-yilmaz/'};
  const sameAs = [...new Set([...doc.querySelectorAll('.footer-social a[href]')].filter(visible).map(n=>absoluteURL(n.getAttribute('href'),origin)).filter(Boolean))];
  if (sameAs.length) person.sameAs = sameAs;
  if (route === '/ziya-sakir-yilmaz/') {
    const hero = doc.querySelector('.page-hero');
    if (visible(hero)) {
      const roles = text(hero.querySelector('.eyebrow')).split('·').map(clean).filter(Boolean);
      if (roles.length) person.jobTitle = roles;
      const bio = text(hero.querySelector('.lead'));
      if (bio) person.description = bio;
    }
  }
  const website = {'@type':'WebSite','@id':origin + '/#website',url:origin + '/',name:brand,inLanguage:['tr','en'],publisher:{'@id':personID}};
  const webpage = {'@type':route === '/ziya-sakir-yilmaz/' ? ['WebPage','ProfilePage'] : 'WebPage','@id':url + '#webpage',url,name,description,inLanguage:language,isPartOf:{'@id':website['@id']}};
  if (route === '/ziya-sakir-yilmaz/') webpage.mainEntity = {'@id':personID};
  if (image) webpage.primaryImageOfPage = {'@type':'ImageObject',url:image};
  const graph = [website,person,webpage], breadcrumb = breadcrumbs(doc,route,name,origin);
  if (breadcrumb) { graph.push(breadcrumb); webpage.breadcrumb = {'@id':breadcrumb['@id']}; }
  if (isArticle) {
    const author = visibleAuthor(doc,origin,brand,personID);
    const article = {'@type':payload.kind === 'note' ? 'BlogPosting' : 'Article','@id':url + '#article',url,headline:name,description,inLanguage:language,mainEntityOfPage:{'@id':webpage['@id']},publisher:{'@id':personID},...visibleDates(doc,payload.kind)};
    if (author) article.author = author;
    const citations = visibleCitations(doc,origin);
    if (citations.length) article.citation = citations;
    if (image) article.image = image;
    graph.push(article); webpage.mainEntity = {'@id':article['@id']};
    for (const [property,date] of Object.entries({'article:published_time':article.datePublished,'article:modified_time':article.dateModified})) {
      if (date) meta(doc,property,date,true); else doc.head.querySelectorAll(`meta[property="${property}"]`).forEach(n=>n.remove());
    }
  } else doc.head.querySelectorAll('meta[property="article:published_time"],meta[property="article:modified_time"]').forEach(n=>n.remove());
  const books = bookList(doc,origin,url,personID), talks = talkList(doc,origin,url,personID), questions = faq(doc,url);
  const writings = writingList(doc,origin,url,route), service = serviceEntity(doc,payload,origin,url,personID), programs = programList(doc,origin,url,personID);
  for (const entity of [books,talks,questions,writings,service,programs]) if (entity) graph.push(entity);
  if (books) webpage.mainEntity = {'@id':books['@id']};
  if (writings || programs) { webpage['@type'] = ['WebPage','CollectionPage']; webpage.mainEntity = {'@id':(writings || programs)['@id']}; }
  if (service) webpage.mainEntity = {'@id':service['@id']};
  if (talks) webpage.mentions = [{'@id':talks['@id']}];
  if (questions) webpage.hasPart = [{'@id':questions['@id']}];
  const script = doc.createElement('script'); script.type = 'application/ld+json'; script.setAttribute('data-cms-seo','');
  script.textContent = JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c').replaceAll('\u2028','\\u2028').replaceAll('\u2029','\\u2029');
  doc.head.append(script);
  return doc;
}
