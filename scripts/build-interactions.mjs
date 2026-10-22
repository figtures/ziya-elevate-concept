import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';

const result=await build({entryPoints:['src/interactions/public-interactions.mjs'],bundle:true,format:'iife',target:['es2020'],minify:true,write:false,outdir:'interaction-build',entryNames:'interaction-motion',legalComments:'inline',banner:{js:'/* Interruptible disclosure motion. Source: src/interactions/public-interactions.mjs */'}});
for(const output of result.outputFiles){
 const filename=output.path.endsWith('.css')?'interaction-motion.css':'interaction-motion.js';
 for(const directory of ['website','public'])await writeFile(`${directory}/assets/${filename}`,output.contents);
 console.log(`${filename}: ${Math.round(output.contents.length/1024)} kB`);
}
