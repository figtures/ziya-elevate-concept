/** Anonymous HTTP verification; this is not a browser or Lighthouse substitute.
 * Usage: node scripts/check-live-seo.mjs [output-name]
 * BASE_URL may point at the deployed public site. No cookie or authorization is used.
 */
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createHash} from 'node:crypto';
import {parseHTML} from 'linkedom';
const run=promisify(execFile);
const base=new URL(process.env.BASE_URL||'https://ziya-sakir-yilmaz-keynote.dev-busraaktas.chatgpt.site').origin;
const label=(process.argv[2]||'live-baseline').replace(/[^a-z0-9-]/gi,'-');
const seed=JSON.parse(await fs.readFile('cms/seed.json','utf8'));
const routes=seed.filter(p=>p.kind!=='global').map(p=>p.route).sort();
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'ziya-live-'));
const output='reports/public-audit';await fs.mkdir(output,{recursive:true});
const allowedHeaders=new Set(['content-type','content-length','content-encoding','cache-control','x-robots-tag','location','content-security-policy','x-content-type-options','referrer-policy','strict-transport-security','server','cf-cache-status','retry-after']);
let count=0;
async function http(url,{agent='ZiyaSiteAudit/1.0',follow=true,head=false}={}){
 const id=++count,h=path.join(temp,id+'.headers'),b=path.join(temp,id+'.body');
 const args=['-sS','--max-time','40','--max-redirs','5','-A',agent,'-D',h,'-o',b,'-w','%{json}'];
 if(follow)args.push('-L');if(head)args.push('-I');args.push(url);
 const started=new Date().toISOString();
 try{
  const {stdout}=await run('curl',args,{maxBuffer:2*1024*1024});const data=JSON.parse(stdout);
  const headersRaw=await fs.readFile(h,'utf8');const blocks=headersRaw.split(/\r?\n\r?\n/).filter(x=>/^HTTP\//.test(x));
  const headers={};for(const line of (blocks.at(-1)||'').split(/\r?\n/).slice(1)){
   const i=line.indexOf(':');if(i<0)continue;const key=line.slice(0,i).toLowerCase();if(allowedHeaders.has(key))headers[key]=line.slice(i+1).trim();
  }
  const body=head?'':await fs.readFile(b,'utf8');
  return {url,status:data.http_code,finalUrl:data.url_effective,redirects:data.num_redirects,headers,started,seconds:data.time_total,ttfbSeconds:data.time_starttransfer,bytes:data.size_download,body};
 }catch(e){return {url,started,status:0,error:String(e.message).slice(0,600),body:''};}
}
async function pooled(items,fn,size=8){let i=0;const result=Array(items.length);await Promise.all(Array.from({length:Math.min(size,items.length)},async()=>{while(i<items.length){const at=i++;result[at]=await fn(items[at]);}}));return result;}
const strip=r=>{const {body,...safe}=r;return safe;};
const issues=[];const issue=(route,code,detail,severity='error')=>issues.push({route,code,detail,severity});
const assetUrls=new Set();
const pages=await pooled(routes,async route=>{
 const r=await http(base+route),d=parseHTML(r.body).document;
 const val=(sel,attr='content')=>d.querySelector(sel)?.getAttribute(attr)||'';
 const canonical=val('link[rel="canonical"]','href');
 const robots=[val('meta[name="robots"]'),val('meta[name="googlebot"]'),r.headers?.['x-robots-tag']||''].filter(Boolean).join('; ');
 const titles=[...d.querySelectorAll('title')].map(e=>e.textContent);
 const descriptions=[...d.querySelectorAll('meta[name="description"]')].map(e=>e.content);
 const h1=[...d.querySelectorAll('h1')].map(e=>e.textContent.replace(/\s+/g,' ').trim());
 const ld=[...d.querySelectorAll('script[type="application/ld+json"]')];let schemaTypes=[],schemaError='',graph=[];
 try{graph=ld.flatMap(e=>{const j=JSON.parse(e.textContent);return j['@graph']||[j];});schemaTypes=graph.flatMap(x=>x['@type']||[]);}catch(e){schemaError=e.message;}
 const schemaIDs=[];const walk=node=>{if(!node||typeof node!=='object')return;if(typeof node['@id']==='string')schemaIDs.push(node['@id']);for(const v of Object.values(node))if(typeof v==='object')Array.isArray(v)?v.forEach(walk):walk(v);};graph.forEach(walk);
 const links=[...d.querySelectorAll('a[href]')].map(e=>e.getAttribute('href'));
 const images=[...d.querySelectorAll('img')];
 for(const e of d.querySelectorAll('img[src],script[src],link[rel="stylesheet"][href],video[poster],source[src]')){
  const source=e.getAttribute(e.tagName==='LINK'?'href':e.tagName==='VIDEO'?'poster':'src');
  if(source&&!source.startsWith('data:')){try{const u=new URL(source,base+route);if(u.origin===base)assetUrls.add(u.href);}catch{}}
 }
 const sameSiteLinks=links.flatMap(href=>{try{const u=new URL(href,base+route);return u.origin===base?[u.pathname]:[];}catch{return[];}});
 const ogImage=val('meta[property="og:image"]'),ogUrl=val('meta[property="og:url"]');
 if(ogImage){try{if(new URL(ogImage).origin===base)assetUrls.add(ogImage);else issue(route,'og-image-other-origin',ogImage,'warning');}catch{issue(route,'invalid-og-image',ogImage);}}
 if(ogUrl!==base+route)issue(route,'og-url-mismatch',ogUrl,'warning');
 if(schemaIDs.some(id=>!id.startsWith(base+'/')))issue(route,'schema-id-other-origin',schemaIDs.filter(id=>!id.startsWith(base+'/')).join(', '),'warning');
 const webpage=graph.find(n=>[n['@type']].flat().includes('WebPage'));if(webpage?.url!==base+route)issue(route,'schema-page-url-mismatch',webpage?.url||'','warning');
 const authors=[...d.querySelectorAll('[rel~="author"]')].map(n=>({name:n.textContent.trim(),url:n.getAttribute('href')}));
 const answerUnits=[...d.querySelectorAll('[data-answer-unit]')].map(n=>({id:n.id,kind:n.getAttribute('data-answer-unit')}));
 const citations=[...d.querySelectorAll('a[rel~="cite"]')].map(n=>({name:n.textContent.trim(),url:n.getAttribute('href'),sourceId:n.getAttribute('data-source-id')}));
 const schemaArticle=graph.find(n=>['Article','BlogPosting'].includes(n['@type']));
 if(route.startsWith('/notlar/')&&(!authors.length||!schemaArticle?.author))issue(route,'note-author-missing','Expected visible author and BlogPosting author');
 if(route.startsWith('/makaleler/')&&route!=='/makaleler/'&&!answerUnits.some(x=>x.kind==='direct'))issue(route,'direct-answer-missing','Expected authored direct answer');
 for(const unit of answerUnits)if(!unit.id)issue(route,'answer-anchor-missing',unit.kind);
 for(const a of d.querySelectorAll('.reading-toc a[href^="#"]'))if(!d.getElementById(a.getAttribute('href').slice(1)))issue(route,'broken-reading-toc',a.getAttribute('href'));
 if(r.status!==200)issue(route,'http-status',String(r.status));
 if(r.finalUrl&&new URL(r.finalUrl).origin!==base)issue(route,'unexpected-redirect',r.finalUrl);
 if(titles.length!==1||!titles[0])issue(route,'title-count',String(titles.length));
 if(descriptions.length!==1||!descriptions[0])issue(route,'description-count',String(descriptions.length));
 if(h1.length!==1)issue(route,'h1-count',String(h1.length));
 if(d.documentElement?.lang!=='tr')issue(route,'language',d.documentElement?.lang||'');
 if(!canonical)issue(route,'missing-canonical','');else if(canonical!==base+route)issue(route,'canonical-external-or-path-mismatch',canonical,'warning');
 if(/noindex|none/i.test(robots))issue(route,'indexing-blocked',robots);
 if(schemaError||!ld.length)issue(route,'schema',schemaError||'missing');
 const missingAlt=images.filter(x=>!x.hasAttribute('alt')).length;if(missingAlt)issue(route,'missing-image-alt',String(missingAlt));
 const page={...strip(r),title:titles[0]||'',description:descriptions[0]||'',canonical,robots,lang:d.documentElement?.lang||'',h1,schemaTypes,schemaIDs,schemaError,authors,answerUnits,citations,schemaArticleAuthor:schemaArticle?.author,ogImage,ogUrl,imageCount:images.length,missingAlt,sameSiteLinks:[...new Set(sameSiteLinks)],bodySha256:createHash('sha256').update(r.body).digest('hex')};
 process.stdout.write('.');return page;
});
process.stdout.write('\n');
for(const key of ['title','description']){const seen=new Map();for(const p of pages){if(!p[key])continue;const list=seen.get(p[key])||[];list.push(new URL(p.url).pathname);seen.set(p[key],list);}for(const [value,list]of seen)if(list.length>1)issue(list.join(', '),'duplicate-'+key,value);}
const resources=await pooled(['/robots.txt','/sitemap.xml','/llms.txt','/admin/','/admin/kurulum.sql','/api/cms/catalog','/api/cms/template?id=%2F','/definitely-missing-audit-20261012/','/_global/','/testler/basari-muhendisligi-skoru/','/testler/satis-yetkinlik-skoru/','/testler/liderlik-yetkinlik-skoru/','/makaleler'],async route=>{
 const r=await http(base+route,{follow:false});
 const excerpt=['/robots.txt','/sitemap.xml','/llms.txt'].includes(route)?r.body:undefined;
 return {...strip(r),bodyExcerpt:excerpt,bytes:r.bytes};
});
for(const r of resources){const pathname=new URL(r.url).pathname;
 if(['/robots.txt','/sitemap.xml','/admin/'].includes(pathname)&&r.status!==200)issue(pathname,'required-resource-status',String(r.status));
 if((pathname.startsWith('/admin')||pathname.startsWith('/api/'))&&!/noindex/i.test(r.headers?.['x-robots-tag']||''))issue(pathname,'missing-private-resource-noindex','X-Robots-Tag not present','warning');
 if(['/definitely-missing-audit-20261012/','/_global/'].includes(pathname)&&r.status!==404)issue(pathname,'expected-404',String(r.status));
 if(/\/testler\/.*-skoru\//.test(pathname)&&!(r.status===308&&r.headers?.location===base+'/testler/kafa-yapisi-testi/'))issue(pathname,'retired-test-redirect',JSON.stringify({status:r.status,location:r.headers?.location}));
 if(pathname==='/makaleler'&&!(r.status===308&&new URL(r.headers?.location||'/',base).href===base+'/makaleler/'))issue(pathname,'trailing-slash-redirect',JSON.stringify({status:r.status,location:r.headers?.location}));
}
const sitemap=resources.find(r=>new URL(r.url).pathname==='/sitemap.xml');
const sitemapLocations=[...(sitemap?.bodyExcerpt||'').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(sitemapLocations.length!==routes.length)issue('/sitemap.xml','sitemap-route-count',String(sitemapLocations.length));
if(sitemapLocations.some(url=>!url.startsWith(base+'/')))issue('/sitemap.xml','sitemap-other-origin','One or more sitemap URLs use another origin','warning');
const agents={
 Googlebot:'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
 Bingbot:'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
 'OAI-SearchBot':'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot',
 'ChatGPT-User':'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot',
 'PerplexityBot':'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)',
 'Claude-SearchBot':'Claude-SearchBot/1.0 (+https://www.anthropic.com/claude-searchbot)'
};
const bots=await pooled(Object.entries(agents),async([name,agent])=>{const r=await http(base+'/',{agent});const d=parseHTML(r.body).document;return{name,agent,...strip(r),title:d.title,h1:d.querySelector('h1')?.textContent||'',canonical:d.querySelector('link[rel="canonical"]')?.getAttribute('href')||'',sameBodyAsAnonymous:pages.find(p=>p.url===base+'/')?.bodySha256===createHash('sha256').update(r.body).digest('hex')};},3);
for(const b of bots)if(b.status!==200||!b.h1)issue('/', 'bot-agent-response',b.name+': '+b.status);
const assets=await pooled([...assetUrls],async url=>strip(await http(url,{head:true})),5);
for(const a of assets)if(a.status!==200)issue(new URL(a.url).pathname,'asset-status',String(a.status));
const foreign=await pooled(['https://ziyasakiryilmaz.com/','https://www.ziyasakiryilmaz.com/','https://ziyasakiryilmaz.com/robots.txt','https://ziyasakiryilmaz.com/sitemap.xml'],async url=>{const r=await http(url),d=parseHTML(r.body).document;return{...strip(r),title:d.title,canonical:d.querySelector('link[rel="canonical"]')?.getAttribute('href')||'',bodySample:r.body.slice(0,500)};},2);
const report={timestamp:new Date().toISOString(),base,scope:'Real anonymous HTTP requests with no cookies, auth or bypass. User-agent header probes are not verified bot IP requests. HTTP timings are not browser Core Web Vitals.',pages,resources,sitemapLocations,bots,assets,foreign,issues,summary:{routes:pages.length,successfulPages:pages.filter(p=>p.status===200).length,assets:assets.length,successfulAssets:assets.filter(p=>p.status===200).length,errors:issues.filter(p=>p.severity==='error').length,warnings:issues.filter(p=>p.severity==='warning').length}};
await fs.writeFile(output+'/'+label+'.json',JSON.stringify(report,null,2)+'\n');await fs.rm(temp,{recursive:true,force:true});
console.log(JSON.stringify(report.summary));console.log(output+'/'+label+'.json');
