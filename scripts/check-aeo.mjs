import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { applyContent } from '../cms/render.mjs';
import { applyAEO, collectAnswerUnits, visibleText, VERIFIED_SOURCES, AEO_VERSION } from '../cms/aeo.mjs';
const seed=JSON.parse(readFileSync(new URL('../cms/seed.json',import.meta.url),'utf8'));
const templates=JSON.parse(readFileSync(new URL('../cms/templates.json',import.meta.url),'utf8'));
const catalog=JSON.parse(readFileSync(new URL('../cms/catalog.json',import.meta.url),'utf8'));
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
const docs=[];
for (const payload of seed.filter(p=>p.kind!=='global')) {
 const doc=parseHTML(templates[payload.template]).document;
 applyContent(doc,payload,catalog[payload.template]);
 const articleBefore=visibleText(doc.querySelector('article.prose'));
 const priorIDs=[...doc.querySelectorAll('[id]')].map(n=>n.id);
 const originalSectionCount=doc.querySelectorAll('body>section').length;
 applyAEO(doc,payload);
 check(visibleText(doc.querySelector('article.prose'))===articleBefore,payload.route+' article wording preserved');
 check(priorIDs.every(id=>doc.getElementById(id)),payload.route+' existing deep links preserved');
 check(doc.querySelectorAll('body>section').length===originalSectionCount,payload.route+' section flow preserved');
 const ids=[...doc.querySelectorAll('[id]')].map(n=>n.id);
 check(ids.length===new Set(ids).size,payload.route+' unique fragment IDs');
 const toc=doc.querySelector('.reading-toc');
 if(payload.kind==='article') {
   check(Boolean(toc?.getAttribute('aria-label')),payload.route+' named navigation');
   const chapters=[...doc.querySelectorAll('article.prose .reading-chapter')].filter(n=>!n.closest('[hidden],[aria-hidden="true"]'));
   const links=[...toc.querySelectorAll('a[href^="#"]')];
   check(links.length===chapters.length,payload.route+' complete TOC');
   for (const link of links) {
     const target=doc.getElementById(link.getAttribute('href').slice(1));
     check(Boolean(target),payload.route+' valid TOC target');
     check(visibleText(target.querySelector('h2,h3'))===visibleText(link),payload.route+' CMS heading parity');
   }
   check(doc.querySelectorAll('[data-answer-unit="direct"]').length===1,payload.route+' existing direct answer linked');
 }
 const units=collectAnswerUnits(doc,payload.route);
 check(units.every(u=>u.answer&&u.question&&doc.getElementById(u.id)),payload.route+' visible independent answers');
 const serialized=doc.toString();applyAEO(doc,payload);
 check(doc.toString()===serialized,payload.route+' idempotent enhancement');
 docs.push({route:payload.route,kind:payload.kind,answerUnits:units.length,directAnswers:units.filter(u=>u.kind==='direct').length,sourceLinks:doc.querySelectorAll('a[data-source-id]').length,tocLinks:toc?.querySelectorAll('a[href^="#"]').length||0,sources:[...new Set([...doc.querySelectorAll('a[data-source-id]')].map(n=>n.getAttribute('data-source-id')))]});
}
// Original notes already identify the author in imported JSON-LD. Expose the same fact to readers.
for (const payload of seed.filter(p=>p.kind==='note')) {
 const source=parseHTML(readFileSync(new URL('../website'+payload.route+'index.html',import.meta.url),'utf8')).document;
 const byline=source.querySelector('article .note-byline [rel~="author"]');
 check(byline?.getAttribute('href')==='/ziya-sakir-yilmaz/','note source has author profile link: '+payload.route);
 check(visibleText(byline)==='Ziya Şakir Yılmaz','note byline matches original attributed author: '+payload.route);
 const sourceData=[...source.querySelectorAll('script[type="application/ld+json"]')].map(n=>n.textContent).join(' ');
 check(sourceData.includes('https://ziyasakiryilmaz.com/ziya-sakir-yilmaz#person'),'note byline is backed by imported attribution: '+payload.route);
}
// CMS edits, visibility, section insertion/reordering, duplicate question, and malicious text.
const p=seed.find(p=>p.route==='/makaleler/b2b-satis/');
const doc=parseHTML(templates[p.template]).document;
applyContent(doc,p,catalog[p.template]);applyAEO(doc,p);
const chapter=doc.querySelector('article.prose .reading-chapter'), retainedID=chapter.id;
chapter.querySelector('h2').textContent='Yeni başlık: <img onerror="bad"> & anlam';
const hidden=doc.querySelectorAll('article.prose .reading-chapter')[1];hidden.hidden=true;
const added=doc.createElement('div');added.className='reading-chapter';added.innerHTML='<h2>Yeni bölüm</h2><p>Yeni görünür içerik.</p>';
chapter.before(added);
applyAEO(doc,p);
check(chapter.id===retainedID,'CMS title edit keeps a bookmarked ID');
check([...doc.querySelectorAll('.reading-toc a')].some(a=>a.textContent==='Yeni başlık: <img onerror="bad"> & anlam'),'CMS title appears as text');
check(!doc.querySelector('.reading-toc img'),'CMS heading cannot inject markup');
check(![...doc.querySelectorAll('.reading-toc a')].some(a=>a.getAttribute('href')==='#'+hidden.id),'hidden chapters disappear from TOC');
check(doc.querySelector('.reading-toc a[href^="#"]').getAttribute('href')==='#'+added.id,'new first chapter becomes first TOC item');
const fixture=parseHTML('<html><head></head><body><article class="prose"><div class="capsule"><span class="cap-tag">30 Saniyede Cevap</span> Özgün yanıt.</div><p>Harkin 2016 araştırması.</p><p>Harkin başka çalışmasından söz ediyor.</p><p hidden>Harkin 2016 gizli.</p><p><a href="https://example.com/editor-choice">Harkin</a> 2016 araştırması.</p><p>2016 araştırması. <span>Harkin</span></p><div class="faq"><details data-cms-node="q1"><summary>Aynı soru?</summary><div class="a">Birinci yanıt.</div></details><details data-cms-node="q2"><summary>Aynı soru?</summary><div class="a">İkinci yanıt.</div></details></div></article></body></html>').document;
applyAEO(fixture,{kind:'article',route:'/makaleler/yeni/'});
check(fixture.querySelectorAll('a[data-source-id="harkin-2016"]').length===2,'only exact author/year visible citation contexts linked');
check(fixture.querySelector('a[href="https://example.com/editor-choice"]')?.textContent==='Harkin','editor citation link preserved');
check(fixture.querySelector('[hidden]').querySelectorAll('a').length===0,'no hidden citation enhancement');
check(fixture.querySelectorAll('details')[0].id!==fixture.querySelectorAll('details')[1].id,'duplicated question has separate stable IDs');
const questionID=fixture.querySelector('details').id;
fixture.querySelector('summary').textContent='Güncellenen soru?';applyAEO(fixture,{kind:'article',route:'/makaleler/yeni/'});
check(fixture.querySelector('details').id===questionID,'CMS question edit keeps stable answer ID');
const summary={version:AEO_VERSION,checkedAt:new Date().toISOString(),checks,routes:docs.length,articles:docs.filter(d=>d.kind==='article').length,directAnswers:docs.reduce((n,d)=>n+d.directAnswers,0),answerUnits:docs.reduce((n,d)=>n+d.answerUnits,0),sourceLinks:docs.reduce((n,d)=>n+d.sourceLinks,0),articlesWithSourceLinks:docs.filter(d=>d.kind==='article'&&d.sourceLinks).length,bibliographicRecords:VERIFIED_SOURCES.length,limitations:['Checks run against final CMS DOM, not browser layout or live crawler rendering.','Source records validate identity of named scholarly works; they do not certify all prose or quantitative claims.','No human review dates, transcripts, third-party authority, or AI citations were invented.'],routesDetail:docs};
if(process.argv.includes('--report'))writeFileSync(new URL('../reports/geo/aeo-check.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,routesDetail:undefined},null,2));
