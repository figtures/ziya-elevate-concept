import {auditNavigation, validateNavigation} from './navigation.mjs';

const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sections = [['primary','Ana menü','Masaüstü ve mobil ana menü. Her bağlantının altında bir alt menü oluşturabilirsiniz.'],['mobileSecondary','Mobil keşif bağlantıları','Mobil menünün altındaki ek bağlantılar.'],['audience','Mobil yönlendirmeler','Kendim için ve kurumum için gibi hızlı seçimler.'],['social','Sosyal medya','Alt bilgideki sosyal hesap bağlantıları.']];
const get = (object,path) => path.split('.').reduce((value,key)=>value?.[key],object);
const set = (object,path,value) => { const keys=path.split('.'),key=keys.pop(); get(object,keys.join('.'))[key]=value; };
const pageTitle = page => (page.draft?.title || page.title || page.route).split('|')[0].trim();
const uid = () => `nav-${globalThis.crypto?.randomUUID?.() || Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)}`;
const newItem = () => ({id:uid(),label:'Yeni bağlantı',href:'/',hidden:false,newTab:false});
const button = (label,action,path,disabled=false) => `<button type="button" class="button quiet small" data-navigation-action="${action}" data-navigation-path="${esc(path)}" ${disabled?'disabled':''}>${label}</button>`;

/** The host owns dirty/save/publish. This editor only changes the navigation value. */
export function renderNavigationEditor(nav, {pages = [], disabled = false} = {}) {
  if (!nav) return '<div class="empty-state">Menü yapısı hazırlanıyor.</div>';
  const available = pages.filter(page=>page.kind!=='global'&&!page.archived);
  const options = '<option value="">Sayfa seçin…</option>'+available.map(page=>`<option value="${esc(page.route)}">${esc(pageTitle(page))}${Object.hasOwn(page,'published_revision')&&!page.published_revision?' · Taslak':''}</option>`).join('');
  const field = (label,body) => `<label class="field"><span class="field-label">${label}</span>${body}</label>`;
  const input = (path,value,extra='') => `<input type="text" data-navigation-bind="${esc(path)}" value="${esc(value)}" ${extra} ${disabled?'disabled':''}>`;
  const check = (path,checked,label) => `<label class="check-field"><input type="checkbox" data-navigation-bind="${esc(path)}" ${checked?'checked':''} ${disabled?'disabled':''}> ${label}</label>`;
  const itemList = (items,path,children=false) => `<div class="cms-nav-items" data-navigation-list="${esc(path)}">${items.map((item,i)=>{
    const itemPath=`${path}.${i}`;
    return `<details class="repeat-item cms-nav-item" data-navigation-item="${esc(itemPath)}"><summary class="repeat-head"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(item.label)}</b><small>${item.hidden?'Gizli':item.newTab?'Yeni sekme':'Görünür'}</small></summary><div class="repeat-body"><div class="item-actions">${button('Yukarı','up',itemPath,disabled||i===0)}${button('Aşağı','down',itemPath,disabled||i===items.length-1)}${button('Çoğalt','copy',itemPath,disabled)}${button('Kaldır','remove',itemPath,disabled)}</div><div class="field-grid">${field('Menü metni',input(itemPath+'.label',item.label,'maxlength="160"'))}${field('Siteden sayfa seç',`<select data-navigation-page="${esc(itemPath)}" ${disabled?'disabled':''}>${options}</select>`)}${field('Bağlantı adresi',input(itemPath+'.href',item.href,'maxlength="2048"'))}<div class="field">${check(itemPath+'.hidden',item.hidden,'Menüde gizle')}${check(itemPath+'.newTab',item.newTab,'Yeni sekmede aç')}</div></div>${children?`<div class="cms-nav-children"><div class="section-head"><h4>Alt menü</h4>${button('Alt bağlantı ekle','add',itemPath+'.children',disabled||(item.children?.length||0)>=20)}</div>${itemList(item.children||[],itemPath+'.children')}</div>`:''}</div></details>`;
  }).join('')||'<p class="help">Henüz bağlantı yok. Yeni bağlantı ekleyebilirsiniz.</p>'}</div>`;
  const errors=validateNavigation(nav),warnings=auditNavigation(nav,pages);
  return `<div class="navigation-editor"><section class="panel"><div class="panel-body"><p>Bağlantıları düzenleyin, sayfa seçin ve sırasını belirleyin. Değişiklikler <b>Yayınla</b> işleminden sonra tüm sayfalara yansır.</p><div data-navigation-feedback aria-live="polite">${feedback(errors,warnings)}</div></div></section>${sections.map(([key,title,description])=>`<section class="section-card"><div class="section-head"><div><h2>${title}</h2><p>${description}</p></div>${button('Bağlantı ekle','add',key,disabled||nav[key].length>=(key==='primary'?20:40))}</div>${itemList(nav[key],key,key==='primary')}</section>`).join('')}<section class="section-card"><div class="section-head"><div><h2>Alt bilgi grupları</h2><p>Başlıkları, grupların konumunu, bağlantıları ve sıralamasını yönetebilirsiniz.</p></div>${button('Grup ekle','add-group','footer',disabled||nav.footer.length>=8)}</div>${nav.footer.map((group,i)=>`<details class="repeat-item" data-navigation-group="${i}"><summary class="repeat-head"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(group.title)}</b><small>${group.hidden?'Gizli':group.placement==='programs'?'Yatay sıra':'Sütun'}</small></summary><div class="repeat-body"><div class="item-actions">${button('Yukarı','up','footer.'+i,disabled||i===0)}${button('Aşağı','down','footer.'+i,disabled||i===nav.footer.length-1)}${button('Grubu kaldır','remove','footer.'+i,disabled)}</div><div class="field-grid">${field('Grup başlığı',input('footer.'+i+'.title',group.title,'maxlength="160"'))}${field('Yerleşim',`<select data-navigation-bind="footer.${i}.placement" ${disabled?'disabled':''}><option value="columns" ${group.placement==='columns'?'selected':''}>Alt bilgi sütunu</option><option value="programs" ${group.placement==='programs'?'selected':''}>Sütunların altında yatay sıra</option></select>`)}${check('footer.'+i+'.hidden',group.hidden,'Grubu gizle')}</div>${itemList(group.items,'footer.'+i+'.items')}${button('Bağlantı ekle','add','footer.'+i+'.items',disabled||group.items.length>=40)}</div></details>`).join('')}</section></div>`;
}

function feedback(errors,warnings) {
  return errors.length?`<div class="status-banner" data-tone="warning"><ul>${errors.map(error=>`<li>${esc(error)}</li>`).join('')}</ul></div>`:warnings.length?`<details><summary>${warnings.length} bağlantıyı kontrol edin</summary><ul>${warnings.map(warning=>`<li>${esc(warning.message)}</li>`).join('')}</ul></details>`:'<p class="help">Menü yapısı ve bağlantıları kontrol edildi.</p>';
}

export function wireNavigationEditor(container, {navigation, pages = [], onChange, disabled = false, confirmRemove = message => globalThis.confirm(message)} = {}) {
  if (!container || !navigation || typeof onChange!=='function' || disabled) return;
  let current = structuredClone(navigation);
  const commit = (next, rerender) => {
    current=next;
    if (!rerender) {
      const element=container.querySelector('[data-navigation-feedback]');
      if (element) element.innerHTML=feedback(validateNavigation(current),auditNavigation(current,pages));
    }
    onChange(structuredClone(current),{rerender});
  };
  for (const control of container.querySelectorAll('[data-navigation-bind]')) {
    control.addEventListener(control.type==='checkbox'||control.tagName==='SELECT'?'change':'input',()=>{
      const next=structuredClone(current); set(next,control.dataset.navigationBind,control.type==='checkbox'?control.checked:control.value); commit(next,false);
    });
  }
  for (const control of container.querySelectorAll('[data-navigation-page]')) control.addEventListener('change',()=>{
    const page=pages.find(page=>page.route===control.value); if (!page) return;
    const next=structuredClone(current),item=get(next,control.dataset.navigationPage); item.href=page.route;
    if (!item.label || item.label==='Yeni bağlantı') item.label=pageTitle(page).slice(0,160);
    commit(next,true);
  });
  for (const control of container.querySelectorAll('[data-navigation-action]')) control.addEventListener('click',()=>{
    const action=control.dataset.navigationAction,path=control.dataset.navigationPath,next=structuredClone(current);
    if (action==='add-group') { if(next.footer.length>=8)return;next.footer.push({id:uid(),title:'Yeni grup',placement:'columns',hidden:false,items:[]}); }
    else if (action==='add') {
      let list=get(next,path);
      if (!list && path.endsWith('.children')) { set(next,path,[]);list=get(next,path); }
      const limit=path==='primary'||path.endsWith('.children')?20:40;
      if (!Array.isArray(list)||list.length>=limit) return;
      list.push(newItem());
    } else {
      const parts=path.split('.'),index=Number(parts.pop()),list=get(next,parts.join('.'));
      if (!Array.isArray(list)||!list[index]) return;
      if (action==='up'||action==='down') {
        const other=index+(action==='up'?-1:1);if(other<0||other>=list.length)return;
        [list[index],list[other]]=[list[other],list[index]];
      } else if(action==='copy') {
        const limit=parts.join('.')==='primary'||parts.at(-1)==='children'?20:40;if(list.length>=limit)return;
        const item=structuredClone(list[index]);item.id=uid();item.label=(item.label+' (kopya)').slice(0,160);
        for(const child of item.children||[])child.id=uid();list.splice(index+1,0,item);
      } else if(action==='remove') {
        if(!confirmRemove('Bu bağlantı veya grubu menüden kaldırmak istiyor musunuz? Sayfanın kendisi silinmez.'))return;
        list.splice(index,1);
      } else return;
    }
    commit(next,true);
  });
}
