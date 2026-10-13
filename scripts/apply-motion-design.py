"""Apply the client's scroll/glass design across the existing Turkish content.
Content and forms are retained. Each route receives a reproducible art direction.
"""
from pathlib import Path
from lxml import html, etree
import hashlib,json,re

ROOT=Path('dist')
def el(markup): return html.fragment_fromstring(markup)
def cls(node, name): node.set('class', ' '.join(dict.fromkeys((node.get('class','')+' '+name).split())))
def plain(node): return ' '.join(node.text_content().split())

themes={
 'basari':('Başarı','201 168 110','blueprint',['Keşif','Tasarım','İnşa']),
 'kafa':('Kafa Yapısı','154 189 181','orbit',['Fark et','Güçlen','Dönüş']),
 'satis':('Satış','215 151 115','diagonal',['Değer','Güven','Etki']),
 'liderlik':('Liderlik','177 192 207','panorama',['Standart','Kültür','Etki']),
 'kitap':('Kitaplar','198 171 129','library',['Fikir','Sistem','Uygulama']),
 'not':('Hayattan Notlar','189 164 178','journal',['Düşün','Uygula','Çoğalt']),
 'ziya':('Ziya Şakir Yılmaz','205 178 131','portrait',['Yazar','Eğitmen','Konuşmacı']),
 'egitim':('Birlikte Çalışalım','160 181 200','studio',['Bireysel','Kurumsal','Sahnede']),
 'bilgi':('Başarı Mühendisliği','180 179 161','editorial',['Araştır','Öğren','Uygula'])
}
explicit={'kurumsal/satis-egitimi':'satis','kurumsal/liderlik-egitimi':'liderlik','kurumsal/kafa-yapisi-atolyesi':'kafa','basari':'basari','basari-muhendisligi':'basari','kafa-yapisi':'kafa','kursun-gecirmez-kafa-yapisi':'kitap','satis':'satis','liderlik':'liderlik','kitaplar':'kitap','konusmaci':'ziya','ziya-sakir-yilmaz':'ziya','iletisim':'egitim','mentorluk':'egitim','egitimler':'egitim','buradan-basla':'egitim','hayattan-notlar':'not','bulten':'not','testler':'kafa','testler/kafa-yapisi-testi':'kafa'}
button='<button type="button" class="video-toggle" aria-label="Arka plan videosunu duraklat"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/icons.svg#pause"></use></svg><span class="control-label">Videoyu duraklat</span></button>'
manifest=[]
for path in sorted(ROOT.rglob('index.html')):
 doc=html.fromstring(path.read_text());body=doc.find('body');head=doc.find('head')
 if not doc.xpath('//section'):continue
 route=path.parent.relative_to(ROOT).as_posix();route='' if route=='.' else route
 if body.get('data-glass-design'):continue
 body.set('data-glass-design','2026-10');body.set('data-page',route or 'ana-sayfa')
 group=explicit.get(route)
 if not group:
  txt=' '.join(doc.xpath('//h1//text()')).lower()
  group='not' if route.startswith('notlar/') else 'satis' if any(x in txt for x in ['satış','itiraz','b2b','kapanış']) else 'liderlik' if any(x in txt for x in ['lider','delegasyon','geri bildirim']) else 'kafa' if any(x in txt for x in ['kafa','mindset','zihinsel','reddedilme']) else 'basari' if route.startswith('makaleler/') else 'bilgi'
 topic,accent,layout,words=themes[group]
 if route.startswith('makaleler/'):
  layout=['editorial','offset','focus'][int(hashlib.sha1(route.encode()).hexdigest()[:2],16)%3]
 elif route.startswith('notlar/'):layout='journal'
 elif route.startswith('kurumsal/'):layout='workshop'
 elif route=='arastirmalar':layout='blueprint'
 elif route=='sozluk':layout='offset'
 elif route=='iletisim':layout='contact'
 elif route=='testler/kafa-yapisi-testi':layout='assessment'
 body.set('data-theme',group);body.set('data-layout',layout);body.set('style',(body.get('style','')+';--theme-rgb:'+accent).lstrip(';'))
 head.append(el('<link rel="stylesheet" href="/assets/glass-motion.css">'))
 body.append(el('<script src="/assets/glass-motion.js" defer></script>'))
 sections=doc.xpath('//section')
 if route=='bulten':
  first=sections[0];first.attrib.pop('style',None)
  new=el('<section class="page-hero" id="icerik" tabindex="-1"><div class="wrap"><span class="kicker">Mühendislik Notları</span><h1>Bir fikir.<br>Yeni bir bakış.</h1><p class="lead">Başarının mühendisliği, her hafta kutunda.</p></div></section>')
  first.attrib.pop('id',None);first.addprevious(new);sections=doc.xpath('//section')
 hero=sections[0]
 # Wrap article subsections so long guides remain animated throughout reading.
 for article in doc.xpath('//article[contains(concat(" ",normalize-space(@class)," ")," prose ")]'):
  current=None
  for child in list(article):
   if child.tag=='h2':
    current=etree.Element('div',{'class':'reading-chapter','data-motion-item':'','id':'bolum-'+str(len(article.xpath('./div[contains(@class,"reading-chapter")]'))+1)})
    article.insert(article.index(child),current)
   if current is not None and child is not current:current.append(child)
 for idx,s in enumerate(sections):
  s.set('data-motion-section','');s.set('data-section-number',f'{idx+1:02}')
  if idx and not s.get('id'):s.set('id',f'icerik-bolumu-{idx}')
  if idx and not s.xpath('./div[contains(@class,"motion-light")]'):
   s.insert(0,el('<div class="motion-light" aria-hidden="true"></div>'))
  for node in s.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," reveal ")]'):
   cls(node,'visible')
  for node in s.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," wrap ")]/*'):
   if node.tag not in ['script','style'] and not node.xpath('ancestor::form'):node.set('data-motion-item','')
 for groupnode in doc.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," cards-4 ") or contains(concat(" ",normalize-space(@class)," ")," gates ") or contains(concat(" ",normalize-space(@class)," ")," books ") or contains(concat(" ",normalize-space(@class)," ")," grid-2 ")]'):
  for i,c in enumerate(groupnode):
   if c.tag not in ['script','style']:c.set('data-motion-item','');c.set('data-motion-order',str(i%4))
 # Home keeps its one-time TEDx introduction and the new native playlist.
 if route:
  cls(hero,'page-hero creative-hero cinematic-page');hero.attrib.pop('style',None)
  hero.set('data-art-direction',layout)
  for blue in hero.xpath('./div[contains(@class,"blueprint")]'):hero.remove(blue)
  media=hero.xpath('./div[contains(@class,"hero-vid")]')
  source='klip-uluslararasi-restored-1080.mp4' if group=='liderlik' else 'hero-loop-restored-1440.mp4'
  poster='klip-uluslararasi-restored-poster.jpg' if group=='liderlik' else 'hero-restored-poster.jpg'
  if not media:
   hero.insert(0,el(f'<div class="hero-vid" aria-hidden="true"><video src="/assets/{source}" poster="/assets/{poster}" muted autoplay loop playsinline preload="auto" data-cinematic></video></div>'))
  for video in hero.xpath('.//video'):
   video.set('data-cinematic','');video.set('preload','auto')
   # Different points in the original stage montage introduce each page.
   video.set('data-start-at',str(round((int(hashlib.sha1(route.encode()).hexdigest()[:4],16)%85)/10,1) if group!='liderlik' else 0))
  if not hero.xpath('./button[contains(@class,"video-toggle")]'):hero.append(el(button))
  wrap=hero.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," wrap ")]')[0]
  cls(wrap,'creative-content')
  for heading in wrap.xpath('.//h1'):heading.attrib.pop('style',None)
  # Maintain original split portrait/book compositions; other pages use a distinct editorial split.
  if 'split' not in wrap.get('class','').split():
   copy=etree.Element('div',{'class':'creative-copy','data-motion-item':''})
   for child in list(wrap):copy.append(child)
   wrap.append(copy)
  else:
   if len(wrap):cls(wrap[0],'creative-copy')
   if len(wrap)>1:cls(wrap[1],'creative-art')
  identity=etree.Element('aside',{'class':'hero-glass-art','aria-label':topic+' odağı','data-motion-item':''})
  small=etree.SubElement(identity,'span',{'class':'art-eyebrow'});small.text=topic
  if route.startswith('makaleler/'):
   cls(identity,'article-map')
   p=etree.SubElement(identity,'p',{'class':'art-title'});p.text='Bu rehberde'
   chapters=doc.xpath('//article//div[contains(@class,"reading-chapter")]')
   for i,ch in enumerate(chapters[:3]):
    a=etree.SubElement(identity,'a',{'href':'#'+ch.get('id')});num=etree.SubElement(a,'span');num.text=f'{i+1:02}'
    text=etree.SubElement(a,'b');text.text=plain(ch.xpath('.//h2')[0])
  elif route.startswith('notlar/'):
   cls(identity,'journal-art');num=etree.SubElement(identity,'span',{'class':'journal-number'});num.text=route.rsplit('-',1)[-1]
   p=etree.SubElement(identity,'p');p.text='Hayattan bir not.'
  elif route=='kitaplar':
   cls(identity,'book-art');identity.append(el('<img src="/assets/kapak-bm.webp" alt="Başarı Mühendisliği kitabı" width="293" height="416">'))
  else:
   rings=etree.SubElement(identity,'div',{'class':'glass-sculpture','aria-hidden':'true'})
   for i in range(3):etree.SubElement(rings,'i',{'style':f'--ring:{i}'})
   p=etree.SubElement(identity,'p',{'class':'art-title'});p.text=words[0]+'.'
   tags=etree.SubElement(identity,'div',{'class':'art-words'})
   for w in words[1:]:b=etree.SubElement(tags,'span');b.text=w
  if 'split' not in wrap.get('class','').split():wrap.append(identity)
  else:
   # Preserve real portrait or the existing book; use glass around that content.
   cls(wrap,'original-art')
  if len(sections)>1:
   nextsection=sections[1];target=nextsection.get('id')
   jump=el(f'<a class="creative-scroll" href="#{target}"><span>Keşfetmek için kaydır</span><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><use href="/assets/icons.svg#mouse"></use></svg></a>');hero.append(jump)
  manifest.append({'route':'/'+route+'/','theme':group,'composition':layout,'video':source,'title':plain(hero.xpath('.//h1')[0])})
 path.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode'))
Path('page-art-directions.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(f'{len(manifest)} subpages art-directed; all content sections wired for continuous scroll motion.')
