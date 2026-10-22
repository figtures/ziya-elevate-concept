import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';

const result=await build({entryPoints:['src/testimonials/testimonial-slider.tsx'],bundle:true,format:'iife',target:['es2020'],minify:true,write:false,legalComments:'inline',define:{'process.env.NODE_ENV':'"production"'},banner:{js:'/* CMS testimonials · React / Framer Motion / Lucide. Source: src/testimonials/testimonial-slider.tsx */'}});
for(const directory of ['website','public'])await writeFile(`${directory}/assets/testimonial-slider.js`,result.outputFiles[0].contents);
console.log(`testimonial-slider.js: ${Math.round(result.outputFiles[0].contents.length/1024)} kB`);
