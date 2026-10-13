(() => {
  const header=document.querySelector('body > header');
  if(!header)return;
  const pairs=[...header.querySelectorAll('.cms-submenu-toggle')].map(button=>({button,menu:document.getElementById(button.getAttribute('aria-controls'))})).filter(pair=>pair.menu);
  const close=({button,menu},focus=false)=>{button.setAttribute('aria-expanded','false');menu.hidden=true;if(focus)button.focus();};
  const open=pair=>{pairs.forEach(other=>{if(other!==pair)close(other);});pair.button.setAttribute('aria-expanded','true');pair.menu.hidden=false;};
  for(const pair of pairs){
    close(pair);
    pair.button.addEventListener('click',()=>pair.menu.hidden?open(pair):close(pair));
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
  document.addEventListener('click',event=>pairs.forEach(pair=>{if(!pair.button.parentElement.contains(event.target))close(pair);}));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')pairs.forEach(pair=>{if(!pair.menu.hidden)close(pair,pair.button.parentElement.contains(document.activeElement));});});
  header.classList.add('cms-navigation-ready');
})();
