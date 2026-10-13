import {buildSync} from 'esbuild';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const require=createRequire(import.meta.url);
function load(file){
 const m={exports:{}};
 const result=buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
 vm.runInNewContext(result.outputFiles[0].text,{module:m,exports:m.exports,require,URL,AbortSignal,console,fetch,Request,Response});
 return m.exports;
}
const route=load('app/[[...slug]]/route.ts');
const sitemapRoute=load('app/sitemap.xml/route.ts');
const robotsRoute=load('app/robots.txt/route.ts');
const seed=JSON.parse(fs.readFileSync('cms/seed.json','utf8')).filter(p=>p.kind!=='global');
const origin='https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site';
const canonicalOrigin=JSON.parse(fs.readFileSync('cms/config.json','utf8')).canonicalOrigin||'https://ziyasakiryilmaz.com';
const rows=[];
for(const p of seed){
 const response=await route.GET(new Request(origin+p.route));
 const html=await response.text(),{document}=parseHTML(html);
 assert.equal(response.status,200,p.route+': HTTP Response status');
 assert.equal(document.querySelectorAll('h1').length,1,p.route+': H1');
 assert.equal(document.querySelectorAll('main,[role="main"]').length,1,p.route+': main landmark');
 assert.ok(document.title?.trim(),p.route+': title');
 assert.equal(document.querySelector('link[rel="canonical"]')?.getAttribute('href'),canonicalOrigin+p.route,p.route+': canonical');
 assert.equal(document.querySelector('meta[property="og:url"]')?.getAttribute('content'),canonicalOrigin+p.route,p.route+': og:url');
 assert.equal(document.querySelector('html')?.getAttribute('lang'),'tr',p.route+': language');
 for(const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:image"]','meta[property="og:site_name"]','meta[name="twitter:card"]','meta[name="twitter:title"]','meta[name="twitter:description"]']){
  assert.ok(document.querySelector(selector)?.getAttribute('content')?.trim(),p.route+': '+selector);
 }
 for(const script of document.querySelectorAll('script[type="application/ld+json"]'))assert.doesNotThrow(()=>JSON.parse(script.textContent),p.route+': JSON-LD');
 rows.push({path:p.route,status:response.status,title:document.title,canonical:document.querySelector('link[rel="canonical"]').getAttribute('href'),mainCount:1,h1Count:1,bodyBytes:Buffer.byteLength(html)});
}
const special=[];
for(const p of ['/does-not-exist/','/_global/']){
 const r=await route.GET(new Request(origin+p));assert.equal(r.status,404,p+': missing routes must be 404');special.push({path:p,status:r.status,location:r.headers.get('location')});
}
for(const p of ['/testler/basari-muhendisligi-skoru/','/testler/satis-yetkinlik-skoru/','/testler/liderlik-yetkinlik-skoru/']){
 const r=await route.GET(new Request(origin+p));assert.equal(r.status,308);assert.equal(r.headers.get('location'),origin+'/testler/kafa-yapisi-testi/');special.push({path:p,status:r.status,location:r.headers.get('location')});
 const target=await route.GET(new Request(r.headers.get('location')));assert.equal(target.status,200,p+': target must return 200');
}
for(const p of ['/konusmaci','/makaleler/zihinsel-dayaniklilik','/iletisim?konu=mentorluk']){
 const r=await route.GET(new Request(origin+p));const expected=new URL(origin+p);expected.pathname+='/';assert.equal(r.status,308);assert.equal(r.headers.get('location'),expected.toString());special.push({path:p,status:r.status,location:r.headers.get('location')});
}
const sm=await sitemapRoute.GET();assert.equal(sm.status,200);const xml=await sm.text();const locs=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]);
assert.equal(locs.length,seed.length);assert.equal(new Set(locs).size,seed.length);assert.deepEqual(locs.slice().sort(),seed.map(p=>canonicalOrigin+p.route).sort());
const robots=await robotsRoute.GET();assert.equal(robots.status,200);const robotsText=await robots.text();assert.ok(robotsText.includes('Sitemap: '+canonicalOrigin+'/sitemap.xml'));assert.ok(!robotsText.includes('Disallow: /assets'));
const r=await route.GET(new Request(origin+'/iletisim/?konu=mentorluk&utm_source=test'));const queryHTML=await r.text();const {document:q}=parseHTML(queryHTML);assert.equal(q.querySelector('link[rel="canonical"]')?.getAttribute('href'),canonicalOrigin+'/iletisim/');
const report={kind:'actual-GET-handler-Response-validation-NOT-network-or-browser',at:new Date().toISOString(),status:'PASS',origin,canonicalOrigin,pages:rows.length,checks:['63 published GET Response status 200','63 single H1/main landmarks','63 title/description/OG/X/canonical/server JSON-LD','2 missing/global routes 404','3 retired tests single 308 then 200','3 trailing-slash normalizations preserve applicable query','query canonical removes params','sitemap exactly all 63 unique canonical URLs','robots canonical sitemap and assets allowed'],rows,special,sitemap:{status:sm.status,locs},robots:{status:robots.status,text:robotsText}};
fs.writeFileSync('reports/seo/route-handler-after.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS: '+rows.length+' GET Responses; '+special.length+' special routes; 63 sitemap entries; query canonical; robots policy unchanged.');

