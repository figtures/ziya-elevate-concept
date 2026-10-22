import styles from './styles.json' with {type:'json'};
import versions from './asset-versions.json' with {type:'json'};
export const versionedAsset=path=>versions[path]?path+'?v='+versions[path]:path;

// Run after CMS fields have been applied so saved media bindings remain stable.
export function applyResources(document){
  const links=[...document.querySelectorAll('link[rel="stylesheet"]')].filter(l=>!l.hasAttribute('data-island-style')&&!(l.getAttribute('href')||'').startsWith('/assets/cms-navigation.css'));
  const key=JSON.stringify(links.map(l=>(l.getAttribute('href')||'').split('?')[0]));
  const bundle=styles[key];
  if(bundle&&links.length){
    links[0].setAttribute('href',bundle.href);
    links.slice(1).forEach(l=>l.remove());
  }
  for(const video of document.querySelectorAll('video[data-hero-clip]')){
    const src=video.getAttribute('src');
    if(src){video.setAttribute('data-src',src);video.removeAttribute('src');}
    video.setAttribute('preload','none');
  }
  for(const link of document.querySelectorAll('link[rel="preconnect"]')){
    if(/^https:\/\/i\.ytimg\.com\/?$/.test(link.getAttribute('href')||''))link.remove();
  }
  // Install before the existing deferred interaction scripts, preserving the
  // trusted template and every positional CMS binding.
  if(!document.querySelector('script[data-interaction-motion]')){
    const script=document.createElement('script');script.setAttribute('src','/assets/interaction-motion.js');script.setAttribute('defer','');script.setAttribute('data-interaction-motion','');
    const first=document.querySelector('script[src]');if(first)first.before(script);else document.head.append(script);
  }
  for(const script of document.querySelectorAll('script[src]'))if((script.getAttribute('src')||'').split('?')[0]==='/assets/main.js')script.setAttribute('defer','');
  if(!document.querySelector('link[data-interaction-motion]')){
    const style=document.createElement('link');style.setAttribute('rel','stylesheet');style.setAttribute('href','/assets/interaction-motion.css');style.setAttribute('data-interaction-motion','');style.setAttribute('data-island-style','');document.head.append(style);
  }
  for(const el of document.querySelectorAll('script[src],link[rel="stylesheet"][href]')){
    const attr=el.tagName==='SCRIPT'?'src':'href';const path=(el.getAttribute(attr)||'').split('?')[0];
    if(versions[path])el.setAttribute(attr,versionedAsset(path));
  }
}
