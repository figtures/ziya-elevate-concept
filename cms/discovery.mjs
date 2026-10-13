/** Optional discovery index. It is not an AI ranking signal or a bot access policy. */
import {indexableContent} from './seo.mjs';

export const DISCOVERY_VERSION = '1.0.0';
export const DISCOVERY_GROUPS = [
  ['Başlangıç ve biyografi', ['/', '/buradan-basla/', '/ziya-sakir-yilmaz/']],
  ['Çalışma alanları', ['/basari/', '/basari-muhendisligi/', '/kafa-yapisi/', '/kursun-gecirmez-kafa-yapisi/', '/satis/', '/liderlik/']],
  ['Keynote, eğitim ve mentorluk', ['/konusmaci/', '/egitimler/', '/kurumsal/kafa-yapisi-atolyesi/', '/kurumsal/satis-egitimi/', '/kurumsal/liderlik-egitimi/', '/mentorluk/']],
  ['Kitaplar ve yazılar', ['/kitaplar/', '/makaleler/', '/hayattan-notlar/', '/sozluk/', '/arastirmalar/', '/bulten/']],
  ['Test ve iletişim', ['/testler/kafa-yapisi-testi/', '/iletisim/']],
];

/** No fallback to another host: the caller must explicitly enable its verified public origin. */
export function discoveryOrigin(value) {
  if (typeof value !== 'string' || /[\\\u0000-\u0020]/.test(value)) throw new Error('DISCOVERY_PUBLIC_ORIGIN_REQUIRED');
  let url;
  try { url = new URL(value); } catch { throw new Error('DISCOVERY_PUBLIC_ORIGIN_REQUIRED'); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.search || url.hash || url.pathname !== '/' ||
      !host.includes('.') || /(?:^|\.)(?:localhost|local|internal|test|invalid|example)$/.test(host) ||
      /^[\d.]+$/.test(host) || host.startsWith('[')) throw new Error('DISCOVERY_PUBLIC_ORIGIN_REQUIRED');
  return url.origin;
}

function cleanLabel(value) {
  return String(value ?? '').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().split('|')[0].trim().slice(0, 120);
}
const markdown = value => value.replace(/[\\`*_[\]<>]/g, '\\$&');
/** Rows come only from cms_published (or its shipped seed), never drafts or arbitrary URLs. */
export function generateDiscovery(rows, {enabled = false, origin, maxBytes = 102400, maxURLs = 200} = {}) {
  if (enabled !== true) return null;
  const base = discoveryOrigin(origin);
  if (!Array.isArray(rows)) throw new Error('DISCOVERY_PUBLISHED_ROWS_REQUIRED');
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > 102400 || !Number.isInteger(maxURLs) || maxURLs < 1 || maxURLs > 200) throw new Error('DISCOVERY_INVALID_BUDGET');
  const candidates = new Map();
  for (const row of rows.filter(indexableContent)) {
    const label = cleanLabel(row.title);
    if (!label) continue;
    if (candidates.has(row.route) && candidates.get(row.route) !== label) throw new Error('DISCOVERY_DUPLICATE_ROUTE_CONFLICT');
    candidates.set(row.route, label);
  }
  // This is a curated navigation map, not a sitemap dump. Article/note archives expose all publications.
  const sections = [], urls = [];
  for (const [heading, routes] of DISCOVERY_GROUPS) {
    const links = [];
    for (const route of routes) {
      if (!candidates.has(route)) continue;
      const url = base + route;
      urls.push(url);
      links.push(`- [${markdown(candidates.get(route))}](${url})`);
    }
    if (links.length) sections.push(`## ${heading}\n\n${links.join('\n')}`);
  }
  if (!urls.length) throw new Error('DISCOVERY_EMPTY_INDEX');
  if (urls.length > maxURLs) throw new Error('DISCOVERY_URL_BUDGET');
  const body = '# Ziya Şakir Yılmaz\n\n> Keynote, eğitim, mentorluk, kitaplar ve yazılar için Türkçe site rehberi.\n\n' +
    'Aşağıdaki bağlantılar yayımlanmış sayfalara gider. Makale ve notların tamamına ilgili arşivlerden ulaşılır.\n\n' + sections.join('\n\n') + '\n';
  const bytes = new TextEncoder().encode(body).byteLength;
  if (bytes > maxBytes) throw new Error('DISCOVERY_SIZE_BUDGET');
  return {body, urls, bytes, version:DISCOVERY_VERSION};
}

export async function discoveryResponse(rows, options, request) {
  const result = generateDiscovery(rows, options);
  if (!result) return new Response('Not found\n', {status:404, headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(result.body));
  const etag = '"' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('') + '"';
  const headers = {'Content-Type':'text/plain; charset=utf-8', 'Cache-Control':'public, max-age=0, must-revalidate', 'ETag':etag, 'X-Content-Type-Options':'nosniff'};
  const candidate = request?.headers?.get('if-none-match') || '';
  const unchanged = candidate.split(',').map(s=>s.trim().replace(/^W\//,'')).some(s=>s===etag || s==='*');
  return new Response(unchanged || request?.method === 'HEAD' ? null : result.body, {status:unchanged?304:200, headers});
}
