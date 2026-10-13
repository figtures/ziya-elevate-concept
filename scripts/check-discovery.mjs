import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {generateDiscovery, discoveryOrigin, discoveryResponse} from '../cms/discovery.mjs';

const seed=JSON.parse(readFileSync(new URL('../cms/seed.json',import.meta.url))), origin='https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site';
const options={enabled:true,origin};
let checks=0;
function check(name, fn){fn();checks++;}
check('disabled by default',()=>assert.equal(generateDiscovery(seed,{origin}),null));
check('empty data is not a successful empty artifact',()=>assert.throws(()=>generateDiscovery([],options),/EMPTY_INDEX/));
for(const value of [undefined,'http://ziyasakiryilmaz.com','https://user:secret@ziyasakiryilmaz.com','https://ziyasakiryilmaz.com/path/','https://ziyasakiryilmaz.com/?q=1','https://ziyasakiryilmaz.com/#x','https://localhost','https://127.0.0.1','https://[::1]','https://brand.local','https://brand.example','https://brand.invalid','https://ziyasakiryilmaz.com:8443','https://ziyasakiryilmaz.com\n'])check('invalid/private origin rejected',()=>assert.throws(()=>discoveryOrigin(value),/PUBLIC_ORIGIN_REQUIRED/));
const first=generateDiscovery(seed,options);
check('public origin exact',()=>assert.equal(discoveryOrigin(origin),origin));
check('stable regardless of feed order',()=>assert.equal(generateDiscovery([...seed].reverse(),options).body,first.body));
check('all URLs known public content',()=>{for(const url of first.urls)assert(seed.some(p=>origin+p.route===url));assert.equal(new Set(first.urls).size,first.urls.length);assert(!first.body.includes('/admin/')&&!first.body.includes('/api/')&&!first.body.includes('ziyasakiryilmaz.com'));});
check('curated archives, no article dump',()=>{assert(first.urls.includes(origin+'/makaleler/'));assert(first.urls.includes(origin+'/hayattan-notlar/'));assert(!first.urls.some(url=>url.includes('/makaleler/')&&url!==origin+'/makaleler/'));});
check('UTF8 NFC, no BOM, within byte budget',()=>{assert.equal(first.body,first.body.normalize('NFC'));assert(!first.body.startsWith('\uFEFF'));assert.equal(new TextDecoder('utf-8',{fatal:true}).decode(new TextEncoder().encode(first.body)),first.body);assert(first.body.includes('Şakir Yılmaz'));assert(first.bytes<51200);});
check('unpublished removal immediate',()=>assert(!generateDiscovery(seed.filter(p=>p.route!=='/kitaplar/'),options).urls.includes(origin+'/kitaplar/')));
for(const patch of [{noindex:true},{robots:'nofollow, noindex'},{status:'draft'},{status:'archived'}])check('excluded content',()=>{const rows=seed.map(p=>p.route==='/kitaplar/'?{...p,...patch}:p);assert(!generateDiscovery(rows,options).urls.includes(origin+'/kitaplar/'));});
check('duplicates only when consistent',()=>{assert.equal(generateDiscovery([...seed,seed.find(p=>p.route==='/')],options).body,first.body);assert.throws(()=>generateDiscovery([...seed,{route:'/',kind:'page',title:'Other'}],options),/DUPLICATE_ROUTE_CONFLICT/);});
check('title is escaped, never instructions/new links via Markdown',()=>{const rows=seed.map(p=>p.route==='/kitaplar/'?{...p,title:'<b>Kitap [x](https://bad.example)</b>\n## Injected'}:p);const result=generateDiscovery(rows,options);assert(!result.body.includes('<b>'));assert(!result.body.includes('\n## Injected'));assert(result.body.includes('Kitap \\[x\\]'));assert.equal(result.urls.length,first.urls.length);});
check('arbitrary private/malicious rows not surfaced',()=>{const injected=['/admin/','/api/cms/','/_global/','//bad.example/','https://bad.example/','/kitaplar/?private=1','/testler/liderlik-yetkinlik-skoru/'].map(route=>({route,kind:'page',title:'Injected'}));assert.equal(generateDiscovery([...seed,...injected],options).body,first.body);});
check('budget fails rather than silently truncating',()=>{assert.throws(()=>generateDiscovery(seed,{...options,maxBytes:100}),/SIZE_BUDGET/);assert.throws(()=>generateDiscovery(seed,{...options,maxURLs:1}),/URL_BUDGET/);assert.throws(()=>generateDiscovery(seed,{...options,maxURLs:201}),/INVALID_BUDGET/);});
const response=await discoveryResponse(seed,options,new Request(origin+'/llms.txt'));
check('200 plaintext response with content hash',()=>{assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'text/plain; charset=utf-8');assert.match(response.headers.get('etag'),/^"[a-f0-9]{64}"$/);assert.equal(response.headers.get('cache-control'),'public, max-age=0, must-revalidate');});
assert.equal(await response.text(),first.body);checks++;
for(const tag of [response.headers.get('etag'),'W/'+response.headers.get('etag'),'*']){
 const cached=await discoveryResponse(seed,options,new Request(origin+'/llms.txt',{headers:{'If-None-Match':tag}}));
 assert.equal(cached.status,304);assert.equal(await cached.text(),'');checks++;
}
const head=await discoveryResponse(seed,options,new Request(origin+'/llms.txt',{method:'HEAD'}));assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('etag'),response.headers.get('etag'));checks++;
const changed=await discoveryResponse(seed.filter(p=>p.route!=='/kitaplar/'),options,new Request(origin+'/llms.txt',{headers:{'If-None-Match':response.headers.get('etag')}}));assert.equal(changed.status,200);assert.notEqual(changed.headers.get('etag'),response.headers.get('etag'));checks++;
const disabled=await discoveryResponse(seed,{origin,enabled:false});assert.equal(disabled.status,404);assert.equal(disabled.headers.get('cache-control'),'no-store');checks++;
console.log(JSON.stringify({status:'PASS',checks,selectedUrls:first.urls.length,bytes:first.bytes,testScope:'local generator and Fetch Response contract; real HTTP URL checks are separate'},null,2));

// Explicit post-deploy read-only audit. No preview server, browser, credentials or hidden-token URLs.
if(process.argv.includes('--live')) {
 const config=JSON.parse(readFileSync(new URL('../cms/config.json',import.meta.url)));
 const liveOrigin=discoveryOrigin(config.canonicalOrigin);
 const expected=generateDiscovery(seed,{enabled:config.publicDiscoveryEnabled,origin:liveOrigin});
 assert(expected,'Public discovery must be enabled before running the HTTP audit');
 const startedAt=new Date().toISOString(),results=[];
 async function read(url,headers={}) {
  const response=await fetch(url,{redirect:'manual',headers,signal:AbortSignal.timeout(15000)});
  return {response,body:await response.text()};
 }
 const index=await read(liveOrigin+'/llms.txt');
 assert.equal(index.response.status,200,'llms.txt must return a direct 200');
 assert.match(index.response.headers.get('content-type')||'',/^text\/plain\s*;\s*charset=utf-8$/i);
 const links=[...index.body.matchAll(/^\- \[[^\n]+\]\((https:\/\/[^)]+)\)$/gm)].map(m=>m[1]);
 assert(links.length>0&&links.length<=200);
 assert(new TextEncoder().encode(index.body).length<=102400);
 assert.equal(new Set(links).size,links.length);
 // Every link must be one of the curated routes; dynamically published titles may differ from seed.
 const allowed=new Set(expected.urls);
 for(const url of links)assert(allowed.has(url),'Unexpected published discovery URL: '+url);
 let next=0;
 await Promise.all(Array.from({length:Math.min(4,links.length)},async()=>{
  while(next<links.length){
   const url=links[next++],result={url,status:null,checks:[],errors:[]};
   try{
    const {response,body}=await read(url);result.status=response.status;
    if(response.status!==200)result.errors.push('not_direct_200');
    if(!/^text\/html(?:;|$)/i.test(response.headers.get('content-type')||''))result.errors.push('not_html');
    if(/\bnoindex\b/i.test(response.headers.get('x-robots-tag')||''))result.errors.push('header_noindex');
    const {document}=parseHTML(body);
    const canonical=document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    if(canonical!==url)result.errors.push('not_self_canonical');
    if([...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')].some(el=>/\bnoindex\b/i.test(el.getAttribute('content')||'')))result.errors.push('meta_noindex');
    if(!document.querySelector('h1')?.textContent.trim())result.errors.push('missing_ssr_h1');
    result.checks=['direct_200','html','self_canonical','no_noindex','ssr_h1'];
   }catch(error){result.errors.push(String(error.message));}
   results.push(result);
  }
 }));
 const bot=await read(liveOrigin+'/llms.txt',{'User-Agent':'OAI-SearchBot/1.4'});
 const botParity=bot.response.status===200&&bot.body===index.body;
 const etag=index.response.headers.get('etag');
 const conditional=etag?await read(liveOrigin+'/llms.txt',{'If-None-Match':etag}):null;
 const conditionalPassed=conditional?.response.status===304&&conditional.body==='';
 const record={startedAt,completedAt:new Date().toISOString(),origin:liveOrigin,status:results.every(r=>!r.errors.length)&&botParity&&conditionalPassed?'PASS':'FAIL',scope:'Anonymous HTTP from one executor network; user-agent spoof checks output parity only, not vendor-IP verification',selectedUrls:links.length,bytes:new TextEncoder().encode(index.body).length,botParity,conditionalPassed,results:results.sort((a,b)=>a.url.localeCompare(b.url))};
 mkdirSync(new URL('../reports/public-audit/',import.meta.url),{recursive:true});
 writeFileSync(new URL('../reports/public-audit/discovery-http.json',import.meta.url),JSON.stringify(record,null,2)+'\n');
 console.log(JSON.stringify({...record,results:undefined},null,2));
 assert.equal(record.status,'PASS','See reports/public-audit/discovery-http.json for live discovery errors');
}
