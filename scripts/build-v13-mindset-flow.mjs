/** Rebuild only the Kafa Yapısı template against its last published identities. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {parseHTML} from 'linkedom';
import {reviseMindsetFlow} from '../cms/v13/mindset-flow.mjs';

const route='/kafa-yapisi/';
const baselineCommit='95ff538b6251ca305fbea623507033008e1cd51f';
const baseline=file=>JSON.parse(execFileSync('git',['show',`${baselineCommit}:${file}`],{encoding:'utf8',maxBuffer:40*1024*1024}));
const beforeTemplates=baseline('cms/templates.json'),beforeCatalog=baseline('cms/catalog.json'),beforeSeeds=baseline('cms/seed.json');
const before=beforeSeeds.find(payload=>payload.id===route);
const document=parseHTML(beforeTemplates[route]).document;
reviseMindsetFlow(document);
const compiled=JSON.parse(execFileSync('python3',['scripts/compile-v13-content.py'],{
  input:JSON.stringify({templates:{[route]:document.toString()},baselineCatalog:{[route]:beforeCatalog[route]},baselineSeeds:[before]}),
  encoding:'utf8',maxBuffer:10*1024*1024,
}));
const after=compiled.seeds.find(payload=>payload.id===route);
// Disclosure summaries are phrasing content, but the admin section name stays
// meaningful after its visible reading heading becomes an accordion label.
const readingSection=compiled.catalog[route].sections.find(section=>section.id==='5f3f14fd-182');
if(readingSection)readingSection.label='Rehberler ve bilgi başlıkları';
const templates=JSON.parse(fs.readFileSync('cms/templates.json','utf8'));
const catalog=JSON.parse(fs.readFileSync('cms/catalog.json','utf8'));
const seeds=JSON.parse(fs.readFileSync('cms/seed.json','utf8'));
templates[route]=compiled.templates[route];catalog[route]=compiled.catalog[route];
seeds[seeds.findIndex(payload=>payload.id===route)]=after;
for(const [file,value] of [['cms/templates.json',templates],['cms/catalog.json',catalog],['cms/seed.json',seeds]])fs.writeFileSync(file,JSON.stringify(value));
fs.writeFileSync('cms/v13/mindset-flow-revision.json',JSON.stringify({
 version:'2026-10-26',baselineCommit,before,after,
 fields:{before:beforeCatalog[route].fields,after:compiled.catalog[route].fields},
}));
const source=parseHTML(compiled.templates[route]).document;
for(const element of source.querySelectorAll('*'))for(const attribute of [...element.attributes])if(attribute.name.startsWith('data-cms-'))element.removeAttribute(attribute.name);
fs.writeFileSync('website/kafa-yapisi/index.html',source.toString().replace(/[ \t]+$/gm,''));
fs.copyFileSync('website/assets/v13-mindset-flow.css','public/assets/v13-mindset-flow.css');
console.log(`Mindset flow: ${after.sections.length} sections and ${compiled.catalog[route].fields.length} editable fields; other pages unchanged.`);
