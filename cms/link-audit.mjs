/** Advisory navigation coverage. This is not a whole-site crawl or a publish gate. */
import {indexableRoute} from './seo.mjs';

const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
const visible = node => !node.closest('[hidden],[aria-hidden="true"],template');
const ignored = path => /^\/(?:assets|admin|api)(?:\/|$)/.test(path) || /\.[a-z0-9]{1,8}$/i.test(path);
function localRoute(href, origin) {
  if (!href || href.startsWith('#') || /[\\\u0000-\u0020]/.test(href) || href.startsWith('//')) return null;
  // Relative fragments, email/phone links and external destinations are not CMS routes.
  if (!href.startsWith('/') && !href.startsWith('https://')) return null;
  let url;
  try { url = new URL(href, origin || 'https://cms-audit.invalid'); } catch { return null; }
  if (url.username || url.password || url.protocol !== 'https:') return null;
  if (!href.startsWith('/') && (!origin || url.origin !== origin)) return null;
  const path = url.pathname;
  if (ignored(path)) return null;
  return path.endsWith('/') ? path : path + '/';
}

/**
 * doc is the rendered global DOM; only header/footer are scanned when present.
 * entries are published content rows, never drafts. "unlinked" means no direct
 * global navigation entry, not an orphan: other page content can link there.
 * Articles/notes are covered through their respective linked archive routes.
 */
export function auditContentLinks(doc, entries, {origin} = {}) {
  const published = (Array.isArray(entries) ? entries : []).filter(row => row &&
    ['page','article','note','test'].includes(row.kind) && indexableRoute(row.route) &&
    (!row.status || row.status === 'published'));
  const byRoute = new Map(published.map(row => [row.route,row]));
  if (!origin) {
    const canonical = doc?.querySelector?.('link[rel="canonical"]')?.getAttribute('href');
    try { origin = new URL(canonical).origin; } catch { /* Relative links still work. */ }
  }
  const globalRoots = [...(doc?.querySelectorAll?.('header.site,footer.site,body > header,body > footer') || [])];
  const roots = globalRoots.length ? globalRoots : [doc];
  const anchors = new Set(roots.flatMap(root => [...(root?.querySelectorAll?.('a[href]') || [])]));
  const linked = new Set(), broken = new Map();
  for (const a of anchors) {
    if (!visible(a)) continue;
    const href = clean(a.getAttribute('href')), route = localRoute(href, origin);
    if (!route) continue;
    if (!byRoute.has(route)) {
      const reason = indexableRoute(route) ? 'missing-published-route' : 'invalid-content-route';
      if (!broken.has(href)) broken.set(href,{href,route,label:clean(a.textContent),reason});
    } else linked.add(route);
  }
  const covered = row => linked.has(row.route) || row.kind === 'article' && linked.has('/makaleler/') ||
    row.kind === 'note' && linked.has('/hayattan-notlar/');
  return {
    brokenInternal:[...broken.values()],
    unlinked:published.filter(row => !covered(row)).map(({route,kind,title}) => ({route,kind,title:clean(title)})),
    linkedRoutes:[...linked],
  };
}
