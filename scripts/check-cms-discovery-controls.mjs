import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {buildSync} from 'esbuild';
import {parseHTML} from 'linkedom';
import {applySEO,indexableContent,canonicalOrigin} from '../cms/seo.mjs';
import {generateDiscovery} from '../cms/discovery.mjs';
import {auditContentLinks} from '../cms/link-audit.mjs';

const seed=JSON.parse(fs.readFileSync('cms/seed.json'));
const templates=JSON.parse(fs.readFileSync('cms/templates.json'));
const config=JSON.parse(fs.readFileSync('cms/config.json'));
const origin=canonicalOrigin(config.canonicalOrigin);
let checks=0;
function check(name,fn){fn();checks++;}
const publicPage=seed.find(p=>p.route==='/kitaplar/');
const hiddenPage={...publicPage,robots:'noindex'};
const rendered=parseHTML(templates[publicPage.template]).document;
applySEO(rendered,hiddenPage,origin);
check('CMS noindex overrides authored index policy',()=>assert.equal(rendered.querySelector('meta[name="robots"]').content,'noindex, follow, max-image-preview:large'));
applySEO(rendered,publicPage,origin);
check('absent CMS field preserves legacy explicit policy',()=>assert.match(rendered.querySelector('meta[name="robots"]').content,/^noindex/));
applySEO(rendered,{...publicPage,robots:'index'},origin);
check('explicit CMS index restores indexing',()=>assert.equal(rendered.querySelector('meta[name="robots"]').content,'index, follow, max-image-preview:large'));
const uppercase=rendered.createElement('meta');uppercase.name='ROBOTS';uppercase.content='noindex';rendered.head.append(uppercase);
applySEO(rendered,{...publicPage,robots:'index'},origin);
check('explicit policy deduplicates case-insensitive robot tags',()=>assert.equal([...rendered.querySelectorAll('meta[name]')].filter(n=>n.name.toLowerCase()==='robots').length,1));
for(const patch of [{robots:'noindex'},{robots:'nofollow, noindex'},{robots:'none'},{noindex:true},{noindex:'true'},{status:'draft'},{status:'archived'},{kind:'global'},{route:'/admin/'}])check('nonindexable content omitted '+JSON.stringify(patch),()=>assert.equal(indexableContent({...publicPage,...patch}),false));
for(const patch of [{},{robots:'index'},{noindex:false},{noindex:'false'}])check('indexable content available '+JSON.stringify(patch),()=>assert.equal(indexableContent({...publicPage,...patch}),true));
const rows=seed.map(p=>p.route===publicPage.route?hiddenPage:p);
check('discovery omits noindex and retains other public routes',()=>{
 const result=generateDiscovery(rows,{enabled:true,origin});
 assert(!result.urls.includes(origin+publicPage.route));assert(result.urls.includes(origin+'/makaleler/'));
});

function bundle(file,globals={}){
 const output=buildSync({entryPoints:[file],bundle:true,write:false,platform:'node',format:'cjs',packages:'external'}).outputFiles[0].text;
 const module={exports:{}};
 vm.runInNewContext(output,{module,exports:module.exports,require:createRequire(import.meta.url),URL,Request,Response,AbortSignal,TextEncoder,crypto,console,...globals});
 return module.exports;
}
const requests=[];
const fetch=async input=>{
 const url=new URL(input);requests.push(url);
 if(url.searchParams.get('select')==='payload'){
  const route=url.searchParams.get('route').replace(/^eq\./,'');
  const payload=rows.find(row=>row.route===route);
  return Response.json(payload?[{payload}]:[]);
 }
 return Response.json(rows.map(({route,kind,title,robots,noindex})=>({route,kind,title,robots,noindex})));
};
const sitemap=await bundle('app/sitemap.xml/route.ts',{fetch}).GET();
const xml=await sitemap.text();
check('actual sitemap route excludes noindex payload',()=>{assert.equal(sitemap.status,200);assert(!xml.includes('<loc>'+origin+publicPage.route+'</loc>'));assert(xml.includes('<loc>'+origin+'/makaleler/</loc>'));assert.equal((xml.match(/<loc>/g)||[]).length,seed.filter(p=>p.kind!=='global').length-1);});
check('published feed requests indexing fields',()=>assert(requests.some(url=>url.searchParams.get('select')?.includes('robots:payload->>robots'))));
const discovery=await bundle('app/llms.txt/route.ts',{fetch}).GET(new Request(origin+'/llms.txt'));
const body=await discovery.text();
check('actual llms route excludes noindex payload',()=>{assert.equal(discovery.status,200);assert(!body.includes('('+origin+publicPage.route+')'));assert(body.includes('('+origin+'/makaleler/)'));});
const page=await bundle('app/[[...slug]]/route.ts',{fetch}).GET(new Request(origin+publicPage.route));
const pageDOM=parseHTML(await page.text()).document;
check('actual SSR still serves noindex page with instruction in head',()=>{assert.equal(page.status,200);assert.equal(pageDOM.querySelector('meta[name="robots"]').content,'noindex, follow, max-image-preview:large');assert(pageDOM.querySelector('h1').textContent.trim());assert.equal(pageDOM.querySelector('link[rel="canonical"]').href,origin+publicPage.route);});
const robots=await bundle('app/robots.txt/route.ts').GET();
const robotsText=await robots.text();
check('noindex pages remain crawlable',()=>assert(!robotsText.includes('Disallow: '+publicPage.route)));

const fixture=parseHTML(`<html><head><link rel="canonical" href="${origin}/"></head><body>
<header class="site"><a href="/">Ana sayfa</a><a href="/makaleler/?category=satis#liste">Makaleler</a>
<a href="/hayattan-notlar/">Notlar</a><a href="${origin}/kitaplar/#books">Kitaplar</a>
<a href="/missing/?q=1#part">Eksik</a><a href="/missing/?q=1#part">Tekrar</a>
<a href="#menu">Menü</a><a href="mailto:test@example.org">E-posta</a><a href="tel:+900000">Telefon</a>
<a href="https://external.example.org/test/">Dış bağlantı</a><a href="/assets/brochure.pdf">Broşür</a>
<a href="/admin/">Panel</a><a href="/hidden-broken/" hidden>Gizli</a>
</header><main><a href="/mentorluk/">Gövde bağlantısı</a></main><footer><a href="/iletisim">İletişim</a></footer></body></html>`).document;
const audit=auditContentLinks(fixture,seed);
check('missing internal links are deduplicated; queries/fragments preserved as detail',()=>assert.deepEqual(audit.brokenInternal,[{href:'/missing/?q=1#part',route:'/missing/',label:'Eksik',reason:'missing-published-route'}]));
check('existing internal routes normalize query hash and trailing slash',()=>{assert(audit.linkedRoutes.includes('/kitaplar/'));assert(audit.linkedRoutes.includes('/iletisim/'));});
check('articles and notes covered by archives',()=>assert(!audit.unlinked.some(row=>['article','note'].includes(row.kind))));
check('content links do not hide missing direct navigation entries',()=>assert(audit.unlinked.some(row=>row.route==='/mentorluk/')));
check('hidden links do not count as reachability',()=>{const a=fixture.createElement('a');a.href='/mentorluk/';a.hidden=true;fixture.querySelector('header').append(a);assert(auditContentLinks(fixture,seed).unlinked.some(row=>row.route==='/mentorluk/'));});
check('noindex controls discoverability separately from navigation',()=>assert(!auditContentLinks(fixture,rows).unlinked.some(row=>row.route===publicPage.route)));
check('unpublished rows do not create advisory orphan warnings',()=>assert(!auditContentLinks(fixture,[{route:'/draft/',kind:'page',title:'Draft',status:'draft'}]).unlinked.length));
console.log(JSON.stringify({status:'PASS',checks,scope:'CMS indexing helper, actual sitemap/llms/SSR routes with isolated published-feed fixtures, navigation advisory link audit'},null,2));
