import {config,publishedIndex} from '../../cms/server';
import {canonicalOrigin,indexableContent} from '../../cms/seo.mjs';
export async function GET(){
 try {
  const rows=await publishedIndex();
  const origin=canonicalOrigin((config as any).canonicalOrigin);
  const esc=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  const routes=[...new Set(rows.filter(indexableContent).map((p:any)=>p.route))].sort() as string[];
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'+routes.map(route=>'<url><loc>'+esc(origin+route)+'</loc>'+(['/konusmaci/','/en/speaker/'].includes(route)&&routes.includes('/en/speaker/')?['tr','en','x-default'].map(lang=>'<xhtml:link rel="alternate" hreflang="'+lang+'" href="'+esc(origin+(lang==='en'?'/en/speaker/':'/konusmaci/'))+'"/>').join(''):'')+'</url>').join('')+'</urlset>',{headers:{'Content-Type':'application/xml; charset=utf-8'}});
 } catch { return new Response('Unavailable',{status:503}); }
}
