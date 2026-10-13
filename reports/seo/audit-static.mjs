import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {gzipSync} from 'node:zlib';
import {buildSync} from 'esbuild';
import {parseHTML} from 'linkedom';
const require=createRequire(import.meta.url);
const result=buildSync({entryPoints:['cms/server.ts'],bundle:true,write:false,platform:'node',format:'cjs',packages:'external'});
const module={exports:{}};
vm.runInNewContext(result.outputFiles[0].text,{module,exports:module.exports,require,URL,AbortSignal,console,fetch});
const {render,seed}=module.exports;
const rows=[],assets=new Map();
const val=(doc,selector,attr='content')=>doc.querySelector(selector)?.getAttribute(attr)||'';
const walk=(value,types)=>{if(!value||typeof value!=='object')return;if(value['@type'])types.push(value);Object.values(value).forEach(v=>Array.isArray(v)?v.forEach(t=>walk(t,types)):walk(v,types));};
const localFile=url=>{try{const u=new URL(url,'https://ziyasakiryilmaz.com');if(u.host!=='ziyasakiryilmaz.com')return null;return path.join('public',decodeURIComponent(u.pathname));}catch{return null;}};
for(const payload of seed.filter(p=>p.kind!=='global')){
 const html=render(payload,seed.find(p=>p.kind==='global'));const {document:d}=parseHTML(html);
 const schemas=[],schemaErrors=[];d.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{walk(JSON.parse(s.textContent),schemas);}catch{schemaErrors.push('invalid-json');}});
 const scripts=[...d.querySelectorAll('script[src]')].map(e=>e.getAttribute('src')),styles=[...d.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.getAttribute('href'));
 let jsGzip=0,cssGzip=0;for(const [type,urls] of [['js',scripts],['css',styles]])for(const url of urls){const f=localFile(url);if(f&&fs.existsSync(f)){const bytes=fs.readFileSync(f);assets.set(url.split('?')[0],{type,bytes:bytes.length,gzip:gzipSync(bytes).length});if(type==='js')jsGzip+=gzipSync(bytes).length;else cssGzip+=gzipSync(bytes).length;}}
 const images=[...d.querySelectorAll('img')].map(e=>({src:e.getAttribute('src'),alt:e.getAttribute('alt'),width:e.getAttribute('width'),height:e.getAttribute('height'),loading:e.getAttribute('loading'),srcset:e.getAttribute('srcset'),parent:e.parentElement?.className||''}));
 const headings=[...d.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(e=>({level:+e.tagName.slice(1),text:e.textContent.trim()}));const skips=headings.filter((e,i)=>i&&e.level>headings[i-1].level+1);
 const canonical=val(d,'link[rel="canonical"]','href');const schemaURLs=[];for(const node of schemas)for(const key of ['url','@id','mainEntityOfPage'])if(typeof node[key]==='string'&&node[key].startsWith('https://ziyasakiryilmaz.com'))schemaURLs.push(node[key]);
 const row={route:payload.route,kind:payload.kind,title:d.title,description:val(d,'meta[name="description"]'),canonical,ogURL:val(d,'meta[property="og:url"]'),ogTitle:val(d,'meta[property="og:title"]'),ogDescription:val(d,'meta[property="og:description"]'),ogImage:val(d,'meta[property="og:image"]'),ogType:val(d,'meta[property="og:type"]'),ogSiteName:val(d,'meta[property="og:site_name"]'),twitterTitle:val(d,'meta[name="twitter:title"]'),twitterDescription:val(d,'meta[name="twitter:description"]'),lang:d.documentElement.lang,h1Count:d.querySelectorAll('h1').length,h1:d.querySelector('h1')?.textContent.trim(),mainCount:d.querySelectorAll('main,[role="main"]').length,schemaTypes:[...new Set(schemas.map(s=>s['@type']))],schemaErrors,schemaURLs,dates:schemas.filter(s=>s.datePublished||s.dateModified||s.uploadDate).map(s=>({type:s['@type'],name:s.name||s.headline,datePublished:s.datePublished,dateModified:s.dateModified,uploadDate:s.uploadDate})),headingSkips:skips,images,scripts,styles,jsGzip,cssGzip,htmlBytes:Buffer.byteLength(html)};
 rows.push(row);
}
const duplicate=(key)=>Object.entries(rows.reduce((a,r)=>{(a[r[key]]||=[]).push(r.route);return a;},{})).filter(([v,rs])=>v&&rs.length>1).map(([value,routes])=>({value,routes}));
const report={kind:'static-SSR-audit-NOT-Lighthouse',at:new Date().toISOString(),routes:rows.length,counts:{missingDescription:rows.filter(r=>!r.description).length,missingOgSiteName:rows.filter(r=>!r.ogSiteName).length,missingTwitterTitle:rows.filter(r=>!r.twitterTitle).length,missingTwitterDescription:rows.filter(r=>!r.twitterDescription).length,missingMain:rows.filter(r=>!r.mainCount).length,wrongH1:rows.filter(r=>r.h1Count!==1).length,headingSkips:rows.filter(r=>r.headingSkips.length).length,missingAlt:rows.reduce((n,r)=>n+r.images.filter(i=>i.alt===null).length,0),noImageDimensions:rows.reduce((n,r)=>n+r.images.filter(i=>!i.width||!i.height).length,0),noSrcset:rows.reduce((n,r)=>n+r.images.filter(i=>!i.srcset).length,0),maxJsGzip:Math.max(...rows.map(r=>r.jsGzip)),maxCssGzip:Math.max(...rows.map(r=>r.cssGzip))},duplicates:{titles:duplicate('title'),descriptions:duplicate('description')},assets:[...assets].map(([url,x])=>({url,...x})),rows};
fs.mkdirSync('reports/seo',{recursive:true});const output=process.argv[2]||'reports/seo/static-baseline.json';fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,routes:report.routes,counts:report.counts,duplicates:report.duplicates},null,2));
