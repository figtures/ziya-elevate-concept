import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';

const result = await build({
  entryPoints: ['src/references/reference-slider.tsx'],
  bundle: true, format: 'iife', target: ['es2020'], minify: true, write: false,
  outdir: 'reference-build', entryNames: 'reference-slider', legalComments: 'inline',
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: '/* Reference logos · React / Motion. Source: src/references/reference-slider.tsx */' },
});
for (const output of result.outputFiles) {
  const filename = output.path.endsWith('.css') ? 'reference-slider.css' : 'reference-slider.js';
  for (const directory of ['website', 'public']) await writeFile(`${directory}/assets/${filename}`, output.contents);
  console.log(`${filename}: ${Math.round(output.contents.length / 1024)} kB`);
}
