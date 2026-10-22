(() => {
  const header=document.querySelector('body > header');
  if(!header)return;
  const motion=typeof window!=='undefined'?window.ZiyaMotion:null;
  const mobile=typeof matchMedia==='function'?matchMedia('(max-width: 1280px)'):null;
  const pairs=[...header.querySelectorAll('.cms-submenu-toggle')].map(button=>({button,menu:document.getElementById(button.getAttribute('aria-controls'))})).filter(pair=>pair.menu);
  const reveal=(menu,visible,instant=false)=>{if(motion)return motion.animateVisibility(menu,visible,{kind:mobile?.matches?'collapse':'dropdown',instant});menu.hidden=!visible;menu.inert=!visible;};
  const close=({button,menu},focus=false,instant=false)=>{button.setAttribute('aria-expanded','false');if(focus)button.focus();reveal(menu,false,instant);};
  const open=pair=>{pairs.forEach(other=>{if(other!==pair&&other.button.getAttribute('aria-expanded')==='true')close(other);});pair.button.setAttribute('aria-expanded','true');reveal(pair.menu,true);};
  for(const pair of pairs){
    close(pair,false,true);
    pair.button.addEventListener('click',()=>pair.button.getAttribute('aria-expanded')==='true'?close(pair):open(pair));
    pair.button.addEventListener('keydown',event=>{
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();open(pair);const links=pair.menu.querySelectorAll('a[href]');(event.key==='ArrowUp'?links[links.length-1]:links[0])?.focus();}
    });
    pair.menu.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();close(pair,true);return;}
      const links=[...pair.menu.querySelectorAll('a[href]')],i=links.indexOf(document.activeElement);
      if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?links.length-1:(i+(event.key==='ArrowDown'?1:-1)+links.length)%links.length;links[index]?.focus();}
    });
    pair.button.parentElement.addEventListener('focusout',event=>{if(!pair.button.parentElement.contains(event.relatedTarget))close(pair);});
  }
  document.addEventListener('click',event=>pairs.forEach(pair=>{if(pair.button.getAttribute('aria-expanded')==='true'&&!pair.button.parentElement.contains(event.target))close(pair);}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')pairs.forEach(pair=>{if(pair.button.getAttribute('aria-expanded')==='true')close(pair,pair.button.parentElement.contains(document.activeElement));});});
  mobile?.addEventListener('change',()=>pairs.forEach(pair=>close(pair,false,true)));
  header.classList.add('cms-navigation-ready');
})();
