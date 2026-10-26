/** The ordering model belongs to the archive page, so a single publication is atomic. */
import {mediaFrameKey,parseMediaFrame,applyMediaFrame} from './media-framing.mjs';
import {containsDisallowedCenterTerm} from './content-language.mjs';
const ARCHIVES = new Map([['/makaleler/', '/makaleler/'], ['/hayattan-notlar/', '/notlar/']]);
const ID = /^[A-Za-z0-9_-]{1,100}$/;
const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const routeFor = (value, route) => typeof value === 'string' && value.length <= 200 && new RegExp('^' + ARCHIVES.get(route) + '[a-z0-9-]+/$').test(value);
export const isCollectionRoute = route => ARCHIVES.has(route);
function headingFor(list) {
  const sibling = list.previousElementSibling;
  return sibling && /^H[1-6]$/.test(sibling.tagName) ? sibling : null;
}
function headingLabel(heading) {
  if (!heading) return '';
  const copy = heading.cloneNode(true);
  for (const span of copy.querySelectorAll('span')) if (/^\s*\(\d+\s+rehber\)\s*$/.test(span.textContent)) span.remove();
  return clean(copy.textContent);
}
export function deriveCollection(document, route) {
  if (!isCollectionRoute(route)) return null;
  const seen = new Set();
  const categories = [...document.querySelectorAll('.post-list')].map((list, index) => {
    const id = list.getAttribute('data-collection-id') || list.getAttribute('data-cms-node') || 'category-' + index;
    return {id, source: list.getAttribute('data-collection-source') || list.getAttribute('data-cms-node') || id,
      label: headingLabel(headingFor(list)) || (route === '/makaleler/' ? 'Makaleler' : 'Hayattan notlar'), hidden:false,
      items: [...list.querySelectorAll('a[href]')].flatMap(a => {
        const href = a.getAttribute('href');
        if (!routeFor(href, route) || seen.has(href)) return [];
        seen.add(href);
        return [{route:href, label:clean(a.querySelector('span:not(.cat)')?.textContent || a.textContent), badge:clean(a.querySelector('.cat')?.textContent), hidden:false}];
      })};
  });
  return {version:1, appendNew:true, excluded:[], categories};
}
export function validateCollection(collection, route) {
  if (collection === undefined) return [];
  const errors = [], fail = message => errors.push(message);
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const text = (value,min,max) => typeof value === 'string' && value.trim().length >= min && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value) && !containsDisallowedCenterTerm(value);
  const keys = (value,allowed) => object(value) && Object.keys(value).every(k=>allowed.includes(k));
  if (!isCollectionRoute(route) || !keys(collection,['version','appendNew','excluded','categories']) || collection.version !== 1 || typeof collection.appendNew !== 'boolean' || !Array.isArray(collection.categories) || collection.categories.length < 1 || collection.categories.length > 20 || !Array.isArray(collection.excluded) || collection.excluded.length > 500) return ['Yazı sıralama ayarları geçersiz.'];
  const ids = new Set(), routes = new Set(), excluded = new Set(); let count = 0;
  for (const value of collection.excluded) {
    if (!routeFor(value, route) || excluded.has(value)) fail('Listeden çıkarılan yazı adresleri geçersiz veya yineleniyor.');
    excluded.add(value);
  }
  for (const category of collection.categories) {
    if (!keys(category,['id','source','label','hidden','items']) || typeof category.id !== 'string' || typeof category.source !== 'string' || !ID.test(category.id) || !ID.test(category.source) || ids.has(category.id) || !text(category.label,1,200) || typeof category.hidden !== 'boolean' || !Array.isArray(category.items)) {fail('Yazı kategorisi geçersiz.'); continue;}
    ids.add(category.id);
    for (const item of category.items) {
      count++;
      if (!keys(item,['route','label','badge','hidden']) || !routeFor(item.route,route) || routes.has(item.route) || excluded.has(item.route) || !text(item.label,1,300) || !text(item.badge,0,100) || typeof item.hidden !== 'boolean') fail('Yazı adresi, başlığı veya görünürlük ayarı geçersiz.');
      routes.add(item?.route);
    }
  }
  if (count > 500) fail('Bir yazı listesinde en fazla 500 yazı bulunabilir.');
  return [...new Set(errors)];
}
/** Render from the same model in SSR and the admin preview. Never mutate the saved model. */
export function applyCollection(document, collection, entries, route) {
  if (!isCollectionRoute(route)) return;
  const lists = [...document.querySelectorAll('.post-list')];
  if (!lists.length) return;
  const model = collection || deriveCollection(document,route);
  if (validateCollection(model,route).length) throw new Error('Yazı sıralama ayarları geçersiz.');
  const categories = model.categories.map(category=>({...category,items:category.items.map(item=>({...item}))}));
  const live = new Map((entries || []).filter(e=>routeFor(e.route,route)).map(e=>[e.route,e]));
  const seen = new Set([...model.excluded,...categories.flatMap(c=>c.items.map(i=>i.route))]);
  const appendTo = categories.find(c=>!c.hidden);
  if (model.appendNew && appendTo) {
    for (const entry of [...live.values()].sort((a,b)=>a.route.localeCompare(b.route,'en'))) {
      if (seen.has(entry.route)) continue;
      seen.add(entry.route);
      appendTo.items.push({route:entry.route,label:clean(entry.title).split('|')[0].trim() || entry.route,badge:route==='/makaleler/'?appendTo.label:'Not',hidden:false});
    }
  }
  const templates = new Map(lists.map(list=>[list.getAttribute('data-collection-id') || list.getAttribute('data-cms-node'),{list,heading:headingFor(list)}]));
  const first = lists[0], marker = document.createComment('cms-collection');
  (headingFor(first)||first).before(marker);
  const fallback = {list:first,heading:headingFor(first)};
  const rendered = [];
  for (const category of categories) {
    if (category.hidden) continue;
    const source = templates.get(category.source) || templates.get(category.id) || fallback;
    const list = source.list.cloneNode(false);
    list.removeAttribute('id'); list.removeAttribute('data-cms-node');
    list.setAttribute('data-collection-id',category.id);list.setAttribute('data-collection-source',category.source);
    const visible = category.items.filter(item=>!item.hidden && live.has(item.route));
    const heading = source.heading ? source.heading.cloneNode(true) : document.createElement('h2');
    heading.removeAttribute('id');heading.removeAttribute('data-cms-node');
    const count = heading.querySelector('span');
    const countTemplate = count && /^\s*\(\d+\s+rehber\)\s*$/.test(count.textContent) ? count.cloneNode(true) : null;
    heading.textContent = category.label;
    if (countTemplate) {countTemplate.removeAttribute('data-cms-node'); countTemplate.textContent='('+visible.length+' rehber)';heading.append(document.createTextNode(' '),countTemplate);}
    for (const item of visible) {
      const a = document.createElement('a');a.setAttribute('href',item.route);
      const label = document.createElement('span');label.textContent=item.label;
      const badge = document.createElement('span');badge.className='cat';badge.textContent=item.badge;
      a.append(label,badge);list.append(a);
    }
    rendered.push(heading,list);
  }
  for (const list of lists) {headingFor(list)?.remove();list.remove();}
  marker.replaceWith(...rendered);
}

/** Read the existing book repeater, so its editor remains the single source of
 * truth for the book archive and homepage. The caller supplies published data
 * for visitors; this function does not fetch or promote draft values. */
export function derivePublishedBooks(payload, definition) {
  if (!payload || payload.template !== '/kitaplar/' || !definition) return [];
  const definitions = new Map((definition.groups || []).filter(group => group.label === 'Kitaplar').map(group => [group.id, group]));
  const result = [];
  for (const section of payload.sections || []) {
    if (section.hidden === true) continue;
    for (const group of section.groups || []) {
      const groupDefinition = definitions.get(group.id);
      if (!groupDefinition || groupDefinition.section !== section.source) continue;
      for (const item of group.items || []) {
        if (item.hidden === true) continue;
        const source = groupDefinition.items.find(candidate => candidate.id === item.source);
        if (!source) continue;
        const fields = definition.fields.filter(field => source.fields.includes(field.id));
        const value = field => field ? (item.values?.[field.id] ?? section.values?.[field.id] ?? payload.values?.[field.id] ?? field.defaultValue ?? '') : '';
        const titleField = fields.find(field => /başlı[kğ]/iu.test(field.label));
        const imageField = fields.find(field => field.type === 'image' && field.target === '@src');
        const linkField = fields.find(field => field.type === 'url' && field.target === '@href');
        const altField = fields.find(field => field.node === imageField?.node && field.target === '@alt');
        const focalField = fields.find(field => field.node === imageField?.node && field.target === 'focal');
        const title = clean(value(titleField));
        if (!title) continue;
        const url = input => {
          const text = String(input || '').trim();
          if (text.startsWith('/') && !text.startsWith('//') && !/[\\\u0000-\u0020]/u.test(text)) return text;
          try { if (new URL(text).protocol === 'https:') return text; } catch {}
          return '';
        };
        const focal = String(value(focalField));
        const frameKey = imageField ? mediaFrameKey(imageField.id) : '';
        const frame = parseMediaFrame(item.values?.[frameKey] ?? section.values?.[frameKey] ?? payload.values?.[frameKey], url(value(imageField)));
        result.push({
          id: String(section.id) + ':' + String(item.id), title,
          cover: url(value(imageField)), alt: clean(value(altField)) || title + ' kitap kapağı',
          href: url(value(linkField)),
          focal: /^(?:center|left|right|top|bottom|\d+(?:\.\d+)?%)(?:\s+(?:center|left|right|top|bottom|\d+(?:\.\d+)?%))?$/u.test(focal) ? focal : '',
          frame,
        });
      }
    }
  }
  return result;
}

/** Populate the existing homepage shelf without introducing a second editable
 * book list. Explicit null means the archive is unpublished, while undefined
 * lets pre-integration/offline callers retain their authored fallback. */
export function applyHomeBooks(document, booksPayload, definition) {
  if (booksPayload === undefined) return;
  const shelves = [...document.querySelectorAll('.ed-home-books .home-book-shelf, .ed-home-books .home-book-grid')];
  if (!shelves.length) return;
  const books = derivePublishedBooks(booksPayload, definition);
  for (const shelf of shelves) {
    const section = shelf.closest('.ed-home-books');
    if (!books.length) { section?.remove(); continue; }
    const nodes = books.map(book => {
      const card = document.createElement('a');
      card.setAttribute('data-motion-item', '');
      card.setAttribute('data-book-id', book.id);
      if (book.href) {
        card.setAttribute('href', book.href);
        if (book.href.startsWith('https:')) card.setAttribute('rel', 'noopener noreferrer');
      }
      if (book.cover) {
        const cover = document.createElement('div'); cover.className = 'home-book-cover';
        const image = document.createElement('img');
        image.setAttribute('src', book.cover); image.setAttribute('alt', book.alt);
        image.setAttribute('loading', 'lazy'); image.setAttribute('decoding', 'async');
        if (book.focal) image.style.objectPosition = book.focal;
        cover.append(image); card.append(cover); if(book.frame)applyMediaFrame(image,book.frame);
      }
      const title = document.createElement('h3'); title.textContent = book.title; card.append(title);
      return card;
    });
    shelf.replaceChildren(...nodes);
    for (const note of section?.querySelectorAll('.depth-note') || []) {
      if (/^\s*\d+\s*KİTAP\b/u.test(note.textContent)) note.textContent = note.textContent.replace(/^\s*\d+(?=\s*KİTAP\b)/u, String(books.length));
    }
  }
}
