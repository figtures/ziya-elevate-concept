import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';

// One self-hosted DOM bundle serves both authored templates and CMS responses.
const result = await build({entryPoints:['src/motion/editorial-motion.mjs'],bundle:true,
  format:'iife',target:['es2020'],minify:true,write:false,legalComments:'inline',
  banner:{js:'/* Editorial scroll choreography · Framer Motion DOM engine. Source: src/motion/editorial-motion.mjs */'}});
for (const directory of ['website','public']) {
  await writeFile(`${directory}/assets/editorial-motion.js`,result.outputFiles[0].contents);
}
console.log(`Framer Motion bundle: ${Math.round(result.outputFiles[0].contents.length/1024)} kB`);
