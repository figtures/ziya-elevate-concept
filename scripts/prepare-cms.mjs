import {build} from 'esbuild';
import {readFile,readdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {seedSQL} from '../cms/installation.mjs';
import './build-icons.mjs';
import './build-styles.mjs';
await import('./build-motion.mjs');
await import('./build-interactions.mjs');
await import('./build-references.mjs');
await import('./build-testimonials.mjs');
await import('./build-asset-versions.mjs');
await build({entryPoints:['cms/admin.mjs'],bundle:true,format:'esm',target:['es2022'],minify:true,outfile:'public/admin/admin.js'});
const keys={};for(const type of ['js','css'])keys[type]=createHash('sha256').update(await readFile('public/admin/admin.'+type)).digest('hex').slice(0,12);
const frameCSSKey=createHash('sha256').update(await readFile('public/admin/media-frame.css')).digest('hex').slice(0,12);
let html=await readFile('cms/admin.html','utf8');html=html.replace(/media-frame\.css\?v=[^"']+/g,'media-frame.css?v='+frameCSSKey);html=html.replace(/admin\.(js|css)\?v=[^"']+/g,(_,type)=>'admin.'+type+'?v='+keys[type]);await writeFile('cms/admin.html',html);
const seed=JSON.parse(await readFile('cms/seed.json','utf8'));
await writeFile('supabase/seed.sql',seedSQL(seed));
const migrationFiles=(await readdir('supabase/migrations')).filter(name=>/^\d+_[a-z0-9_]+\.sql$/.test(name)).sort();
const schema=(await Promise.all(migrationFiles.map(name=>readFile('supabase/migrations/'+name,'utf8')))).join('\n');
await writeFile('cms/installation-schema.json',JSON.stringify(schema)+'\n');
await rm('public/admin/kurulum.sql',{force:true});
// Vite can retain a removed public asset in an existing output directory.
// It must never shadow the HTTP route that applies the installer headers.
await rm('dist/client/admin/kurulum.sql',{force:true});
await rm('dist/client/_headers',{force:true});
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));if(manifest.static)throw Error('Remove static hosting for server-rendered CMS.');
console.log('Admin bundle, cache keys and deterministic content seed prepared.');
