// Preserve the authored cascade while serving one content-addressed stylesheet.
import {readFile,writeFile,mkdir,readdir,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {transform} from 'esbuild';
import {parseHTML} from 'linkedom';

async function* pages(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    const path=dir+'/'+e.name;
    if(e.isDirectory())yield* pages(path);
    else if(e.name.endsWith('.html'))yield path;
  }
}
const groups=new Map();
for await(const path of pages('website')){
  const {document}=parseHTML(await readFile(path,'utf8'));
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')];
  if(!links.length)continue;
  const inputs=links.map(l=>(l.getAttribute('href')||'').split('?')[0]);
  if(inputs.some(p=>!/^\/assets\/[\w-]+\.css$/.test(p)))throw Error('Unsupported stylesheet: '+path);
  if(links.some(l=>l.hasAttribute('media')||l.hasAttribute('disabled')))throw Error('Conditional stylesheet: '+path);
  const first=links[0],last=links.at(-1);
  for(let n=first;n&&n!==last;n=n.nextSibling)if(n.nodeName==='STYLE')throw Error('Inline cascade boundary: '+path);
  groups.set(JSON.stringify(inputs),inputs);
}
const manifest={},retained=new Set();
for(const [key,inputs] of groups){
  const raw=(await Promise.all(inputs.map(p=>readFile('website'+p,'utf8')))).join('\n');
  const {code}=await transform(raw,{loader:'css',minify:true,target:['chrome109','safari16','firefox115'],legalComments:'inline'});
  const hash=createHash('sha256').update(code).digest('hex').slice(0,16);
  const name='site-'+hash+'.css';retained.add(name);
  for(const root of ['website','public']){
    await mkdir(root+'/assets/bundles',{recursive:true});
    await writeFile(root+'/assets/bundles/'+name,code);
  }
  manifest[key]={href:'/assets/bundles/'+name,inputs,sourceBytes:Buffer.byteLength(raw),bytes:Buffer.byteLength(code)};
}
for(const root of ['website','public'])for(const name of await readdir(root+'/assets/bundles')){
  if(/^site-[a-f0-9]{16}\.css$/.test(name)&&!retained.has(name))await rm(root+'/assets/bundles/'+name);
}
await writeFile('cms/styles.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared '+groups.size+' stylesheet bundles with the original cascade order.');
