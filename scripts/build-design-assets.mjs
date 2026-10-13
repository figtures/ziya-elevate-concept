import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const assets = path.join(root, 'dist/assets');
const icons = ['play','pause','menu','x','message-circle','mouse','download','plus','scan-face','arrow-up-right','arrow-down'];
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const symbols = [];
for (const name of icons) {
  const {default:nodes} = await import(pathToFileURL(path.join(root, 'node_modules/lucide/dist/esm/icons', name+'.mjs')));
  symbols.push(`<symbol id="${name}" viewBox="0 0 24 24">`+nodes.map(([tag,attributes]) => `<${tag} ${Object.entries(attributes).map(([k,v])=>`${k}="${escape(v)}"`).join(' ')}/>`).join('')+'</symbol>');
}
writeFileSync(path.join(assets,'icons.svg'),'<svg xmlns="http://www.w3.org/2000/svg">'+symbols.join('')+'</svg>');
mkdirSync(path.join(assets,'licenses'),{recursive:true});
copyFileSync(path.join(root,'node_modules/lucide/LICENSE'),path.join(assets,'licenses/lucide.txt'));
mkdirSync(path.join(assets,'fonts'),{recursive:true});
let css='/* Self-hosted variable fonts; Latin Extended includes Turkish glyphs. */\n';
for (const name of ['manrope','inter']) {
  const pkg=path.join(root,'node_modules/@fontsource-variable',name);
  const original=readFileSync(path.join(pkg,'index.css'),'utf8');
  for (const block of original.match(/\/\*[^*]+\*\/[\s\S]*?\}/g) || []) {
    if (!new RegExp(`${name}-latin(?:-ext)?-wght-normal`).test(block)) continue;
    const file=block.match(/files\/([^)]*)/)[1];
    copyFileSync(path.join(pkg,'files',file),path.join(assets,'fonts',file));
    css+=block.replace('./files/','/assets/fonts/')+'\n';
  }
  copyFileSync(path.join(pkg,'LICENSE'),path.join(assets,'licenses',name+'.txt'));
}
writeFileSync(path.join(assets,'fonts.css'),css);
console.log('Built eleven Lucide symbols and four self-hosted Turkish-compatible font files.');
