"""Restore the author's current V12 copy without replacing working media/forms/tests.

Run on the editorial release; snapshots are retained for the preservation gate.
"""
from pathlib import Path
from copy import deepcopy
from urllib.parse import urlsplit, urlunsplit, urljoin, parse_qs
from lxml import html, etree
import re, json, shutil

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
SOURCE=ROOT/'content/v12'
ROUTES=['','basari','kafa-yapisi','satis','liderlik','basari-muhendisligi',
 'kursun-gecirmez-kafa-yapisi','kitaplar','konusmaci','egitimler','mentorluk',
 'ziya-sakir-yilmaz','kurumsal/satis-egitimi','kurumsal/liderlik-egitimi',
 'kurumsal/kafa-yapisi-atolyesi']
def cls(e,c):return c in e.get('class','').split()
def addcls(e,c):e.set('class',(e.get('class','')+' '+c).strip())
def fragment(s):return html.fragment_fromstring(s)
def ban(s):
    replacements=[('icerik-merkezi','kaynaklar'),('Kafa Yapısı Bilgi Merkezi','Kafa Yapısı Araştırmaları'),
      ('İçerik Merkezi','Yazılar & Kaynaklar'),('Başarı Merkezi','Başarı Rehberi'),
      ('Kafa Yapısı Merkezi','Kafa Yapısı Rehberi'),('Satış Merkezi','Satış Rehberi'),
      ('Liderlik Merkezi','Liderlik Rehberi'),('Bu merkezdeki','Bu rehberlerdeki'),('bu merkezde','bu rehberde'),('Bu merkez','Bu yaklaşım'),('bu merkez','bu yaklaşım'),
      ('Merkezi','Rehberi'),('merkezi','rehberi'),('Merkez','Rehber'),('merkez','rehber'),
      ("Kitap Hub'ında",'Kitabın sayfasında'),("Kitap Hub'ı",'Kitabı keşfet'),('IP sayfası','İmza sistem')]
    for a,b in replacements:s=s.replace(a,b)
    return s
def normalize(e,route):
    base='https://v12.ziyasakiryilmaz.pages.dev/'+route
    for n in list(e.iter()):
        if not isinstance(n.tag,str):continue
        for attr in ['href','src','poster','data-src']:
            v=n.get(attr)
            if not v or v.startswith(('#','data:','mailto:','tel:')):continue
            u=urlsplit(urljoin(base,v))
            if u.netloc!='v12.ziyasakiryilmaz.pages.dev':continue
            path=u.path
            if not Path(path).suffix and path!='/':path=path.rstrip('/')+'/'
            if path=='/assets/klip-uluslararasi.mp4':path='/assets/klip-uluslararasi-restored-1080.mp4'
            n.set(attr,urlunsplit(('', '',path,u.query,u.fragment)))
        if n.get('style'):
            n.set('style',re.sub(r'url\([\x22\x27]?(?:\.\./)?assets/([^\x22\x27)]+)[\x22\x27]?\)',r'url(/assets/\1)',n.get('style')))
        if n.tag=='a':
            href=n.get('href','');u=urlsplit(href)
            if u.path=='/iletisim/':
                q=parse_qs(u.query).get('konu',[''])[0]
                if q=='tani' or q.startswith('kurumsal-'):q='kurumsal'
                n.set('href','/iletisim/'+('?konu='+q if q else '')+'#talep-formu')
            if '/testler/' in href and any(t in href for t in ['basari-muhendisligi-skoru','satis-yetkinlik-skoru','liderlik-yetkinlik-skoru','liderlik-etki-skoru']):
                n.set('data-retired-test','')
                for child in list(n):n.remove(child)
                if route.startswith('kurumsal/'):
                    n.set('href','/iletisim/?konu=kurumsal#talep-formu');n.text='Ekip ölçümünü görüşelim →'
                else:
                    target='satis' if 'satis-' in href else 'liderlik' if 'liderlik-' in href else 'basari-muhendisligi'
                    n.set('href','/'+target+'/');n.text={'satis':'Satış yaklaşımını keşfet →','liderlik':'Liderlik yaklaşımını keşfet →','basari-muhendisligi':'Beş aşamalı model →'}[target]
        if n.tag=='img':n.set('loading','lazy');n.set('decoding','async')
        if n.tag=='video':n.set('preload','none');n.set('controls','');n.set('playsinline','');n.set('muted','')
        if n.tag=='iframe':n.set('loading','lazy')
    # Local links are relative to the extensionless V12 page, not its directory.
    return html.fromstring(ban(html.tostring(e,encoding='unicode')))

inventory=[]
for route in ROUTES:
    path=DIST/route/'index.html'; doc=html.parse(str(path)); body=doc.find('body')
    source=html.parse(str(SOURCE/route/'index.html')); sb=source.find('body')
    hero=body.xpath('./section')[0]; oldids=[e.get('id') for s in body.xpath('./section')[1:] for e in s.iter() if e.get('id')]
    for s in body.xpath('./section')[1:]:body.remove(s)
    sh=sb.xpath('./section')[0]
    if route:
        # Keep the functioning first-screen video and its pause control.
        for c in list(hero):
            if not cls(c,'hero-vid') and not cls(c,'video-toggle'):hero.remove(c)
        copy=deepcopy(sh.xpath('./div[contains(concat(" ",@class," ")," wrap ")]')[0])
        copy.set('class','wrap source-hero-copy')
        for n in copy.xpath('.//*[contains(concat(" ",@class," ")," portrait ")]'):n.getparent().remove(n)
        copy=normalize(copy,route);hero.insert(1,copy)
        # The portrait and author caption reappear with the biography below.
    else:
        p=hero.xpath('.//*[contains(@class,"hero-summary")]')[0]
        p.text=sh.xpath('.//p[contains(@class,"hero-sub")]')[0].text_content()
        hero.xpath('.//*[contains(@class,"hero-bottom-line")]/a')[0].set('href','#hikaye')
    new=[]
    for e in list(sb):
        if e is sh or e.tag not in ['section','div']:continue
        if e.tag=='div' and not cls(e,'trustbar'):continue
        item=normalize(deepcopy(e),route)
        if item.tag=='div':item.tag='section'
        addcls(item,'source-section');item.set('data-motion-section','')
        # Inactive tests are not advertised as working public tests.
        if not route and item.xpath('.//h2[contains(.,"Ölçmediğin")]'):
            for a in item.xpath('.//*[@data-retired-test]'):a.getparent().remove(a)
            for card in item.xpath('.//*[contains(concat(" ",@class," ")," card ")]'):
                if not card.xpath('.//a[contains(@href,"kafa-yapisi-testi")]') and '/testler/kafa-yapisi-testi' not in card.get('href',''):
                    card.getparent().remove(card)
            for p in item.xpath('.//p[contains(.,"Dört ayrı test")]'):
                for child in list(p):p.remove(child)
                p.text='Kurşun Geçirmez Kafa Yapısı Testi: 20 soru, 5 zırh katmanı. Kendi profilini gör, ilk adımını belirle.'
            addcls(item,'single-test-section')
            left=item.xpath('.//*[contains(concat(" ",@class," ")," stagger ")]')[0]
            left.insert(0,fragment('<div class="test-introduction"><p class="eyebrow">Kendinle tanış</p><h3>Dayanıklılığın nerede güçlü?</h3><p>İç ses kontrolü, reddedilme bağışıklığı, başarısızlık protokolü, belirsizlik toleransı ve toparlanma hızı. Beş katmandaki durumunu gör; kendi oyun planının ilk adımını at.</p></div>'))
            for n in left.xpath('.//a'):
                n.set('class','btn btn-primary test-start')
                for dot in n.xpath('.//*[contains(@class,"play-dot")]'):dot.getparent().remove(dot)
                for label in n.xpath('.//span[@class="d"]'):label.text='20 soru · Yaklaşık 3 dakika · Ücretsiz'
        # Never restore the V12 demo form that showed success without sending.
        for form in item.xpath('.//form[@data-newsletter]'):
            action=form.get('data-brevo')
            if action:
                form.set('action',action);form.set('method','post');form.set('target','_blank');form.set('rel','noopener')
                form.attrib.pop('data-success',None)
                email=form.xpath('.//input[@type="email"]')[0];email.set('name','EMAIL')
                form.append(fragment('<input type="hidden" name="locale" value="tr">'))
            else:
                parent=form.getparent();parent.replace(form,fragment('<a class="btn btn-primary" href="/iletisim/?konu=konusmaci#talep-formu">Keynote olarak davet etmek istiyorum →</a>'))
                parent.attrib.pop('hidden',None)
        for b in item.xpath('.//*[@data-invite-open]'):
            a=fragment('<a class="btn btn-primary" href="/iletisim/?konu=konusmaci#talep-formu">Keynote olarak davet etmek istiyorum</a>')
            b.getparent().replace(b,a)
            bparent=a.getparent();bparent.addnext(fragment('<p class="hero-note">Yanıt genelde 2 iş günü içinde.</p>'))
        for duplicate in item.xpath('.//*[@id="davet-form"]'):duplicate.getparent().remove(duplicate)
        # Preserve every model step in the DOM; avoid a multi-screen scroll trap.
        for n in item.xpath('.//*[contains(concat(" ",@class," ")," seq-step ") or contains(concat(" ",@class," ")," obj-step ") or contains(concat(" ",@class," ")," seq-dots ") or contains(concat(" ",@class," ")," obj-progress ")]'):
            n.getparent().remove(n)
        for n in item.xpath('.//*[contains(concat(" ",@class," ")," blueprint ")]'):n.getparent().remove(n)
        for n in item.xpath('.//button[@data-sound-toggle]'):
            n.getparent().remove(n) # Native video sound/transport controls are retained.
        for n in item.xpath('.//*[contains(@class,"cards-4") or contains(@class,"books")]'):
            n.attrib.pop('style',None)
        for n in item.xpath('.//h2|.//h3'):
            n.attrib.pop('style',None)
        # Exclude an internal author-to-publisher instruction, not biography copy.
        for n in item.xpath('.//*[contains(concat(" ",@class," ")," pill-note ")]'):
            if 'yayına' in n.text_content().lower() or 'kontrol' in n.text_content().lower():n.getparent().remove(n)
        new.append(item)
    # Break the corporate manuscript into navigable chapters without reducing it.
    if route.startswith('kurumsal/'):
        for item in new:
            containers=item.xpath('./div[contains(concat(" ",@class," ")," prose ")]')
            if not containers:continue
            old=containers[0];old.set('class','wrap program-reading');old.attrib.pop('style',None)
            nodes=list(old);old.clear();old.set('class','wrap program-reading')
            nav=fragment('<nav class="program-index" aria-label="Program bölümleri"><p class="eyebrow">Programı keşfet</p></nav>')
            content=fragment('<div class="program-chapters"></div>');chapter=None;i=0
            for n in nodes:
                if cls(n,'kicker'):
                    i+=1;chapter=etree.SubElement(content,'article',{'class':'program-chapter','id':f'program-{i}'})
                    a=etree.SubElement(nav,'a',href=f'#program-{i}');a.text=n.text_content()
                if chapter is None:chapter=etree.SubElement(content,'article',{'class':'program-chapter'})
                chapter.append(n)
            old.append(nav);old.append(content)
    # Named entry points preserve existing incoming links.
    if not route:
        for item in new:
            if cls(item,'bridge-scene'):item.set('id','sahneden-hayata')
            if item.xpath('.//*[contains(concat(" ",@class," ")," gates ")]'):item.set('id','alanlar')
    if route=='ziya-sakir-yilmaz':
        for item in new:
            if item.xpath('.//h2[contains(.,"Sahadan gelen")]'):
                wrap=item.xpath('./div')[0];addcls(wrap,'biography-spread')
                wrap.insert(0,fragment('<figure class="author-portrait"><img src="/assets/ziya-portre.jpg" alt="Ziya Şakir Yılmaz; resmî TEDx konuşmacı portresi" loading="lazy"><figcaption>Ziya Şakir Yılmaz · Yazar · Eğitmen · Konuşmacı · Mentor</figcaption></figure>'))
    index=body.index(hero)+1
    for item in new:body.insert(index,item);index+=1
    # Aliases from the previous release; never overwrite authored section IDs.
    existing={e.get('id') for e in body.iter() if e.get('id')}
    for value in oldids:
        if value not in existing and new:
            new[0].insert(0,fragment(f'<span id="{value}" class="anchor-alias" aria-hidden="true"></span>'));existing.add(value)
    for item in new:
        for n in item.xpath('.//h2|.//h3|.//figure|.//*[contains(concat(" ",@class," ")," card ") or contains(concat(" ",@class," ")," book ") or contains(concat(" ",@class," ")," bridge-beat ") or contains(concat(" ",@class," ")," seq-item ") or contains(concat(" ",@class," ")," program-chapter ")]'):
            n.set('data-motion-item','')
    body.set('data-restored','v12')
    text=ban(html.tostring(doc,encoding='unicode',doctype='<!DOCTYPE html>'))
    # HTML parser lowercases inline SVG names; restore their case-sensitive spellings.
    for a,b in [('viewbox=','viewBox='),('<lineargradient','<linearGradient'),('</lineargradient','</linearGradient')]:text=text.replace(a,b)
    path.write_text(text)
    inventory.append({'route':'/'+route,'source':'https://v12.ziyasakiryilmaz.pages.dev/'+route,'sections':len(new),'headings':[n.text_content() for item in new for n in item.xpath('.//h2|.//h3')]})
(ROOT/'content/v12-restoration.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
print(f'Restored {len(ROUTES)} core routes from current V12.')
