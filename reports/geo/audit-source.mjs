import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';

const root=process.cwd(), dir=path.join(root,'reports/geo');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const plain=s=>s.replace(/\s+/g,' ').trim();
const seed=JSON.parse(read('cms/seed.json'));
const entities=[], records=[];
for(const p of seed.filter(p=>p.kind!=='global')){
 const filename='website/'+(p.route==='/'?'':p.route.slice(1))+'index.html';
 const html=read(filename),{document:d}=parseHTML(html), schemas=[], parseErrors=[];
 for(const s of d.querySelectorAll('script[type="application/ld+json"]')){try{schemas.push(JSON.parse(s.textContent));}catch(e){parseErrors.push(e.message);}}
 const nodes=[];const walk=x=>{if(!x||typeof x!=='object')return;if(x['@type'])nodes.push(x);Object.values(x).forEach(v=>Array.isArray(v)?v.forEach(walk):walk(v));};schemas.forEach(walk);
 const body=d.body.cloneNode(true);body.querySelectorAll('script,style,header,footer,svg').forEach(n=>n.remove());const visible=plain(body.textContent);
 const faq=nodes.filter(n=>n['@type']==='Question').map(q=>({question:q.name,questionFound:visible.includes(plain(q.name||'')),answerFound:visible.includes(plain(q.acceptedAnswer?.text||''))}));
 const dates=nodes.filter(n=>n.datePublished||n.dateModified).map(n=>({type:n['@type'],published:n.datePublished||null,modified:n.dateModified||null}));
 const visibleDates=[...visible.matchAll(/(?:Yayın|Son güncelleme|Güncelleme)\s*:\s*\d{1,2}\s+\S+\s+\d{4}/g)].map(x=>x[0]);
 nodes.filter(n=>n['@type']==='Person'&&n.name==='Ziya Şakir Yılmaz').forEach(n=>entities.push({route:p.route,...n}));
 records.push({route:p.route,kind:p.kind,filename,sourceSha256:sha(html),title:d.title,description:d.querySelector('meta[name="description"]')?.content||null,canonical:d.querySelector('link[rel="canonical"]')?.href||null,lang:d.documentElement.lang,h1:[...d.querySelectorAll('h1')].map(x=>plain(x.textContent)),schemaTypes:[...new Set(nodes.map(n=>n['@type']))],parseErrors,faq,dates,visibleDates,articleAuthor:plain(d.querySelector('.author-card')?.textContent||''),schemaIds:nodes.map(n=>n['@id']).filter(Boolean),externalContentLinks:[...new Set([...body.querySelectorAll('a[href^="https:"]')].map(a=>a.href))],answerCapsules:d.querySelectorAll('.capsule').length,media:{videos:d.querySelectorAll('video').length,tracks:d.querySelectorAll('video track').length},missingAlt:[...d.querySelectorAll('img')].filter(n=>!n.hasAttribute('alt')).length});
}
const sources=[];const controls=[];const themes=[];
for(const name of ['hub',...Array.from({length:10},(_,i)=>`geo${String(i+1).padStart(2,'0')}`)]){
 const file=`notion-${name}.json`,s=JSON.parse(fs.readFileSync(path.join(dir,file),'utf8'));
 sources.push({id:name,url:s.url,title:s.title,lastEditedAt:s.page_last_edited_at,verification:s.verification,sha256:sha(s.text),characters:s.text.length,truncated:s.truncated??false,unknown_block_count:s.unknown_block_count??0,completeClosingPage:s.text.trim().endsWith('</page>'),snapshot:file});
 let heading='';for(const line of s.text.split('\n')){if(/^#{2,3} /.test(line)){heading=line.replace(/^#+ /,'');themes.push({gate:name.toUpperCase(),theme:heading});}if(line.startsWith('- [ ] '))controls.push({controlId:`${name.toUpperCase()}-${String(controls.filter(x=>x.gate===name.toUpperCase()).length+1).padStart(3,'0')}`,gate:name.toUpperCase(),theme:heading,requirement:line.slice(6),status:'BLOCKED',reason:name==='geo01'?'SEO dependencies, named owners, signed governance and evidence retention not confirmed':'GEO-01 not PASS; risk discovery only; no production gate assertion',sourceUrl:s.url});}
}
const output={auditDate:'2026-10-12',capturedAt:new Date().toISOString(),baselineCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),scope:'source HTML and CMS seed; not browser, HTTP, production or external validator',summary:{routes:records.length,articleRoutes:records.filter(r=>r.kind==='article').length,noteRoutes:records.filter(r=>r.kind==='note').length,schemaParseErrors:records.filter(r=>r.parseErrors.length).length,singleH1Routes:records.filter(r=>r.h1.length===1).length,faqCount:records.flatMap(r=>r.faq).length,faqQuestionsAbsent:records.flatMap(r=>r.faq).filter(q=>!q.questionFound).length,faqAnswerExactTextAbsent:records.flatMap(r=>r.faq).filter(q=>!q.answerFound).length,articleDates:records.filter(r=>r.kind==='article').map(r=>({route:r.route,schema:r.dates,visible:r.visibleDates})),allMediaDecorativeCaveat:'Background video without track is not proof of accessibility failure; informative talk video needs accurate transcript/caption audit',missingAlt:records.reduce((a,r)=>a+r.missingAlt,0),checklistControls:controls.length,notionPages:sources.length},records,entitySnapshots:entities};
fs.writeFileSync(path.join(dir,'source-baseline.json'),JSON.stringify(output,null,2)+'\n');
fs.writeFileSync(path.join(dir,'notion-source-index.json'),JSON.stringify(sources,null,2)+'\n');
fs.writeFileSync(path.join(dir,'requirements-matrix.json'),JSON.stringify({status:'DRAFT / risk discovery',scope:'All checkbox controls and heading themes from all 10 fetched child pages; exact source requirements preserved in private audit evidence',controls,themes},null,2)+'\n');
console.log(JSON.stringify({...output.summary,articleDates:output.summary.articleDates.slice(0,2)},null,2));
