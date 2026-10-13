// Lucide is the single source of interface icon geometry. No browser React runtime.
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {dirname,join} from 'node:path';
import {ArrowUpRight,ArrowRight,ArrowLeft,ArrowDown,ArrowUp,BookOpen,Check,
 ChevronDown,ChevronUp,Clock3,Download,Files,House,Image,LogOut,Mail,Menu,
 MessageCircle,Mouse,Pause,Play,Plus,ScanFace,Search,Settings,Users,X} from 'lucide-react';

const icons={
 'arrow-up-right':ArrowUpRight,'arrow-right':ArrowRight,'arrow-left':ArrowLeft,
 'arrow-down':ArrowDown,'arrow-up':ArrowUp,'book-open':BookOpen,check:Check,
 'chevron-down':ChevronDown,'chevron-up':ChevronUp,'clock-3':Clock3,download:Download,
 files:Files,house:House,image:Image,'log-out':LogOut,mail:Mail,menu:Menu,
 'message-circle':MessageCircle,mouse:Mouse,pause:Pause,play:Play,plus:Plus,
 'scan-face':ScanFace,search:Search,settings:Settings,users:Users,x:X
};
const require=createRequire(import.meta.url);
const packagePath=require.resolve('lucide-react/package.json');
const metadata=JSON.parse(await readFile(packagePath,'utf8'));
const license=await readFile(join(dirname(packagePath),'LICENSE'),'utf8');
const nodes=Object.fromEntries(Object.entries(icons).map(([id,Component])=>{
 const svg=renderToStaticMarkup(createElement(Component,{'aria-hidden':true}));
 const body=svg.replace(/^<svg\b[^>]*>/,'').replace(/<\/svg>$/,'');
 if(!body||body===svg)throw new Error('Lucide SVG generation failed: '+id);
 return [id,body];
}));
const sprite=`<!-- Generated from lucide-react ${metadata.version}. ${license.replaceAll('--','—')} -->\n`+
 '<svg xmlns="http://www.w3.org/2000/svg">'+Object.entries(nodes).map(([id,body])=>
 `<symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`).join('')+'</svg>\n';
for(const target of ['website/assets','public/assets']){
 await writeFile(target+'/icons.svg',sprite);
 await writeFile(target+'/lucide-license.txt',license);
}
await writeFile('cms/icon-nodes.json',JSON.stringify(nodes)+'\n');
console.log(`Lucide ${metadata.version}: ${Object.keys(nodes).length} library icons generated.`);
