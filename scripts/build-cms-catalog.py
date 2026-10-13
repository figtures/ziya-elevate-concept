"""Compile safe field bindings from approved website HTML; never overwrite that source."""
from pathlib import Path
from lxml import html,etree
import json,re,hashlib,subprocess
from PIL import Image
from urllib.parse import urlsplit
root=Path(__file__).resolve().parents[1];templates={};catalog={};seeds=[]
config=json.loads((root/'cms/config.json').read_text())
social_images=json.loads((root/'cms/social-images.json').read_text())
site_origins={urlsplit(config.get(key,'')).netloc for key in ['canonicalOrigin','siteOrigin']} - {''}
def local_social_image(value):
 parsed=urlsplit(value)
 if parsed.path in social_images and not parsed.query and not parsed.fragment and (not parsed.netloc or (parsed.scheme=='https' and parsed.netloc in site_origins)):
  return parsed.path
 return value
SKIP={'script','style','svg','use','path','source'}
# Text values are bound to existing text nodes, not interpreted as HTML.
LABELS={'h1':'Ana başlık','h2':'Bölüm başlığı','h3':'Alt başlık','p':'Açıklama','span':'Metin','a':'Bağlantı metni','li':'Liste maddesi','td':'Tablo hücresi','th':'Sütun başlığı','button':'Buton metni','small':'Kısa bilgi','figcaption':'Görsel açıklaması','label':'Alan etiketi','strong':'Vurgu','summary':'Açılır başlık'}
ATTRS={'src':'Dosya','poster':'Video kapak görseli','alt':'Alternatif metin','href':'Bağlantı adresi','placeholder':'Alan ipucu','data-talk':'YouTube video kimliği','data-video-id':'Açılış video kimliği','data-clip-start':'İlk klip başlangıcı (sn)','data-clip-end':'İlk klip bitişi (sn)','data-start-at':'Video başlangıcı (sn)'}
REPEAT={'book-editorial-list':'Kitaplar','talk-archive':'Konuşma kayıtları','editorial-rows':'Maddeler','step-sequence':'Adımlar','topic-links':'Çalışma alanları','program-catalog':'Eğitim programları','keynote-topics':'Keynote konuları','post-list':'Yazı bağlantıları','faq':'Sorular ve cevaplar','depth-table':'Tablo satırları','nav-links':'Menü bağlantıları'}
def compact(s,n=65):return ' '.join(s.split())[:n]
def compile_doc(doc,route,scopes):
 # lxml's HTML4 parser nests img below the HTML5 void source element. Normalize
 # before assigning bindings so the hero poster remains editable like the browser DOM.
 for source in doc.xpath('//picture/source'):
  for child in reversed(list(source)):source.addnext(child)
 # Reserve each local image's intrinsic ratio without changing the authored crop.
 for image in doc.xpath('//img[@src]'):
  src=image.get('src','');asset=root/'website'/src.lstrip('/')
  if src.startswith('/assets/') and asset.is_file() and (not image.get('width') or not image.get('height')):
   try:
    with Image.open(asset) as im:width,height=im.size
    image.set('width',str(width));image.set('height',str(height))
   except (OSError,ValueError):pass
 prefix=hashlib.sha1(route.encode()).hexdigest()[:8];fields=[];sections=[];groups=[];values={};counter=0
 for e in doc.iter():
  if isinstance(e.tag,str):e.set('data-cms-node',f'{prefix}-{counter}');counter+=1
 for section in scopes:
  sid=section.get('data-cms-node');heads=section.xpath('.//h1|.//h2');title='Üst menü' if section.tag=='header' else 'Alt bilgi' if section.tag=='footer' else compact(heads[0].text_content()) if heads else 'İçerik'
  section.set('data-cms-section',sid);sections.append({'id':sid,'label':title,'hero':bool(section.xpath('.//h1')),'tag':section.tag})
  # Only outer repeaters; nested authored material remains editable fields.
  chosen=[]
  for e in section.iter():
   if not isinstance(e.tag,str):continue
   match=next((v for k,v in REPEAT.items() if k in e.get('class','').split()),None)
   # Footer links are lists, not an uneditable block or a second article archive.
   if e.tag=='ul' and e.getparent() is not None and set(e.getparent().get('class','').split()) & {'footer-group','footer-programs'}:match='Alt bilgi bağlantıları'
   if 'footer-social' in e.get('class','').split():match='Sosyal medya bağlantıları'
   if match and not any(a in chosen for a in e.iterancestors()):
    container=e
    if e.tag=='table':
     bodies=e.xpath('./tbody');container=bodies[0] if bodies else e
    children=[x for x in container if isinstance(x.tag,str) and x.tag not in ('thead','script')]
    if len(children)>0:
     chosen.append(e);groups.append({'id':container.get('data-cms-node'),'section':sid,'label':match,'items':[{'id':x.get('data-cms-node'),'label':compact(x.text_content(),55)} for x in children]})
  for e in section.iter():
   if not isinstance(e.tag,str) or e.tag in SKIP or any(a.tag in SKIP for a in e.iterancestors()):continue
   eid=e.get('data-cms-node');ancestor=next((x for x in [e,*e.iterancestors()] if x.tag in LABELS),e);label='Ana başlık' if any(x.tag=='h1' for x in [e,*e.iterancestors()]) else LABELS.get(ancestor.tag,'Metin')
   # Do not let generic fields rewrite live quiz controls/configuration.
   if any(x.get('id') in ['quiz','result'] for x in [e,*e.iterancestors()]):continue
   def field(target,value,label,kind='text',node=eid):
    fid=node+':'+target;values[fid]=value;definition={'id':fid,'node':node,'target':target,'label':label,'type':kind,'section':sid}
    # These are publication bylines, not dates inside the authored research.
    # New documents must reset them without deleting historical body copy.
    if target=='text' and node==eid:
     classes=set(e.get('class','').split())
     if route.startswith('/makaleler/') and 'hero-note' in classes and any(a.tag=='article' or 'reading-body' in a.get('class','').split() for a in e.iterancestors()) and re.search(r'(?:Yayın|Son güncelleme)\s*:',value):
      definition.update(semantic='publication-dates',label='Yayın ve güncelleme bilgisi')
     elif route.startswith('/notlar/') and 'kicker' in classes and any('page-hero' in a.get('class','').split() for a in e.iterancestors()):
      definition.update(semantic='note-publication-date',label='Seri ve yayın bilgisi')
    fields.append(definition)
   if e.text and e.text.strip() and e.get('aria-hidden')!='true':field('text',e.text,label,'long' if len(e.text)>110 else 'text')
   for child in e:
    if child.tail and child.tail.strip() and isinstance(child.tag,str):field('tail',child.tail,label,'long' if len(child.tail)>110 else 'text',child.get('data-cms-node'))
   for attr,label2 in ATTRS.items():
    if e.get(attr) is None:continue
    if attr=='href' and e.tag!='a':continue
    if attr=='src' and e.tag not in ['img','video']:continue
    kind='image' if attr in ['src','poster'] and e.tag!='video' or attr=='poster' else 'video' if attr=='src' else 'number' if attr in ['data-clip-start','data-clip-end','data-start-at'] else 'url' if attr=='href' else 'text'
    field('@'+attr,e.get(attr),label2,kind)
   if e.tag in ['img','video']:
    pos=re.search(r'object-position\s*:\s*([^;]+)',e.get('style',''))
    field('focal',pos.group(1) if pos else 'center center','Kadraj (ör. center 35%)')
 for g in groups:
  for item in g['items']:
   el=doc.xpath('//*[@data-cms-node=$n]',n=item['id'])[0];nodes={e.get('data-cms-node') for e in el.iter() if isinstance(e.tag,str)}
   item['fields']=[f['id'] for f in fields if f['node'] in nodes]
   # Tail on the item's own root belongs to its parent, not to the item.
   item['fields']=[x for x in item['fields'] if x!=item['id']+':tail']
 meta=doc.xpath('//meta[@name="description"]/@content');title=doc.xpath('//title/text()');og=doc.xpath('//meta[@property="og:image"]/@content');ogalt=doc.xpath('//meta[@property="og:image:alt"]/@content')
 kind='article' if route.startswith('/makaleler/') and route!='/makaleler/' else 'note' if route.startswith('/notlar/') else 'global' if route=='_global' else 'test' if route=='/testler/kafa-yapisi-testi/' else 'page'
 payload={'id':route,'route':'/_global/' if route=='_global' else route,'template':route,'kind':kind,'title':title[0] if title else 'Menü ve alt bilgi','description':meta[0] if meta else '', 'ogImage':og[0] if og else '', 'values':values,'sections':[]}
 payload['ogImage']=local_social_image(payload['ogImage'])
 payload.update({'ogImageAlt':ogalt[0][:420] if ogalt else '', 'ogImageAltFor':payload['ogImage']})
 for s in sections:
  payload['sections'].append({'id':s['id'],'source':s['id'],'hidden':False,'values':{},'groups':[{'id':g['id'],'items':[{'id':i['id'],'source':i['id'],'values':{}} for i in g['items']]} for g in groups if g['section']==s['id']]})
 catalog[route]={'id':route,'kind':kind,'title':payload['title'],'fields':fields,'sections':sections,'groups':groups};seeds.append(payload);templates[route]='<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode')
 return payload
for path in sorted((root/'website').rglob('*.html')):
 doc=html.fromstring(path.read_text());route='/'+str(path.parent.relative_to(root/'website')).replace('.','').strip('/')+'/'
 route=re.sub('/+','/',route)
 if not doc.xpath('//header'):continue
 compile_doc(doc,route,doc.xpath('//body/section'))
home=html.fromstring((root/'website/index.html').read_text());home.xpath('//title')[0].text='Menü ve alt bilgi';compile_doc(home,'_global',home.xpath('//body/header|//body/footer'))
testdoc=html.fromstring((root/'website/testler/kafa-yapisi-testi/index.html').read_text());js=next(x.text for x in testdoc.xpath('//script') if x.text and 'window.TEST_DEF =' in x.text)
test=json.loads(subprocess.check_output(['node','-e','const vm=require("node:vm");const fs=require("node:fs");const s={window:{}};vm.runInNewContext(fs.readFileSync(0,"utf8"),s,{timeout:1000});process.stdout.write(JSON.stringify(s.window.TEST_DEF));'],input=js,text=True))
next(x for x in seeds if x['kind']=='test')['test']=test
(root/'cms/catalog.json').write_text(json.dumps(catalog,ensure_ascii=False));(root/'cms/templates.json').write_text(json.dumps(templates,ensure_ascii=False));(root/'cms/seed.json').write_text(json.dumps(seeds,ensure_ascii=False))
media={}
for p in (root/'website').rglob('*.html'):
 d=html.fromstring(p.read_text())
 for e in d.xpath('//img[@src]|//video[@src]'):
  u=e.get('src');extension=u.rsplit('.',1)[-1];media[u]={'url':u,'alt':e.get('alt',''),'mime':'video/'+('webm' if extension=='webm' else 'mp4') if e.tag=='video' else 'image/'+('jpeg' if extension in ['jpg','jpeg'] else extension),'source':'site'}
  if e.tag=='video' and e.get('poster'):
   u=e.get('poster');extension=u.rsplit('.',1)[-1]
   if u not in media:media[u]={'url':u,'alt':'Video kapak görseli','mime':'image/'+('jpeg' if extension in ['jpg','jpeg'] else extension),'source':'site'}
for url,details in social_images.items():
 media[url]={'url':url,'alt':details['alt'],'mime':details['type'],'width':details['width'],'height':details['height'],'source':'site'}
(root/'cms/media-seed.json').write_text(json.dumps(list(media.values()),ensure_ascii=False))
print(f'{len(seeds)-1} pages + shared navigation; {sum(len(c["fields"]) for c in catalog.values())} editable fields, {sum(len(c["groups"]) for c in catalog.values())} repeaters; original 20-question test preserved.')
