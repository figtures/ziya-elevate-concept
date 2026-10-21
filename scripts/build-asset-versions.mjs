import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const names=['main.js','66-gun-plan.js','refinements.js','test-engine.js','tedx-hero.js','editorial-motion.js','cms-contact.js','cms-navigation.js','cms-navigation.css','reference-slider.js','reference-slider.css','testimonials.css'];
const versions={};
for(const name of names){const path='/assets/'+name;versions[path]=createHash('sha256').update(await readFile('public'+path)).digest('hex').slice(0,12);}
await writeFile('cms/asset-versions.json',JSON.stringify(versions)+'\n');
const admin=await readFile('cms/admin.html','utf8');
await writeFile('cms/admin.html',admin.replace(/\/assets\/cms-navigation\.css(?:\?v=[a-f0-9]+)?/g,'/assets/cms-navigation.css?v='+versions['/assets/cms-navigation.css']));
