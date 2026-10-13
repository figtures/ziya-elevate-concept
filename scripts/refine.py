"""Apply the client's October brief to the imported Turkish demo once."""
from pathlib import Path
from lxml import html, etree
import re

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
def has(cls): return "contains(concat(' ',normalize-space(@class),' '),' "+cls+" ')"
def cls(el, name): el.set('class',(el.get('class','')+' '+name).strip())
def frag(text):return html.fragment_fromstring(text)
def replace_content(el,text):
    for c in list(el):el.remove(c)
    el.text=text
def remove(el):el.getparent().remove(el)
def save(doc,path):path.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode',method='html'))

old_tests={'/testler/basari-muhendisligi-skoru':'/basari','/testler/satis-yetkinlik-skoru':'/satis','/testler/liderlik-yetkinlik-skoru':'/liderlik'}
area_names={'/basari':'Başarı Merkezi','/satis':'Satış Merkezi','/liderlik':'Liderlik Merkezi'}
for path in DIST.rglob('*.html'):
    route='/'+str(path.parent.relative_to(DIST)).replace('\\','/')
    if route in old_tests: continue
    doc=html.fromstring(path.read_text())
    doc.set('lang','tr')
    doc.find('head').append(frag('<link rel="stylesheet" href="/assets/refinements.css">'))
    doc.find('body').append(frag('<script src="/assets/refinements.js" defer></script>'))
    skip=frag('<a class="skip-link" href="#icerik">İçeriğe geç</a>')
    doc.find('body').insert(0,skip)
    first=doc.xpath('//body/section')
    if first:first[0].set('id','icerik');first[0].set('tabindex','-1')
    for a in doc.xpath('//a[@href]'):
        href=a.get('href')
        if href in old_tests:
            if any(c in a.get('class','').split() for c in ('card','video-thumb')):remove(a)
            else:a.set('href',old_tests[href]);replace_content(a,area_names[old_tests[href]]+' →')
        text=a.text_content().strip()
        if text in ('Testler','Testler (4 Skor)','Tüm Testler →','ÖNERİLEN TESTLE BAŞLA'):
            replace_content(a,'Kafa Yapısı Testi' if text!='ÖNERİLEN TESTLE BAŞLA' else 'KENDİNİ TEST ET')
            a.set('href','/testler/kafa-yapisi-testi')
    for f in doc.xpath('//form[@data-newsletter]'):
        action=f.get('data-brevo')
        if action:
            f.set('action',action);f.set('method','post');f.set('target','_blank')
            for inp in f.xpath('.//input[@type="email"]'):inp.set('name','EMAIL')
            f.append(frag('<input type="hidden" name="locale" value="tr">'))
            f.append(frag('<input type="hidden" name="email_address_check" value="">'))
        else:
            f.getparent().replace(f,frag('<a class="btn btn-primary" href="https://t.me/ziyasakiryilmaz" target="_blank" rel="noopener">Hayattan Notlar’a katıl →</a>'))
    for v in doc.xpath('//video'):
        v.set('muted','');v.set('playsinline','');v.set('loop','');v.set('autoplay','')
    for el in doc.xpath('//nav[@aria-label="breadcrumb"]'):el.set('aria-label','Sayfa yolu')
    source=html.tostring(doc,encoding='unicode')
    source=source.replace('Testler (4 Skor)','Kafa Yapısı Testi').replace('Testler; Kendini Ölç, Sistemini Kur','Kurşun Geçirmez Kafa Yapısı Testi')
    source=source.replace('Başlamadan önce iki Skor testini (Kafa Yapısı + alanına göre Satış ya da Liderlik) tamamlaman istenir','Başlamadan önce Kurşun Geçirmez Kafa Yapısı Testi’ni tamamlaman istenir')
    source=source.replace('Başarı Mühendisliği Skoru ile sistemini ölç.','Başarı Mühendisliği ile sistemini kur.')
    path.write_text('<!DOCTYPE html>\n'+source)

# Keep the client's exact visual identity and four-area structure; edit the home only.
path=DIST/'index.html';doc=html.fromstring(path.read_text());body=doc.find('body')
cls(body,'homepage')
sections=body.xpath('./section')
for i in (2,5,7,8,9,11,12,13):remove(sections[i])
hero=sections[0]
v=hero.xpath('.//video')[0]
v.set('src',v.get('data-src'));v.set('preload','auto');v.set('style','object-position:center 35%');v.set('data-cinematic','')
v.attrib.pop('data-hero-video',None);v.attrib.pop('data-src',None)
v.set('poster','/assets/hero-poster.jpg')
replace_content(hero.xpath('.//*['+has('hero-sub')+']')[0],'Başarı, tesadüfe bırakılmayacak kadar öğrenilebilir bir iştir.')
note=hero.xpath('.//*['+has('hero-note')+']')[0]
replace_content(note,'Ziya Şakir Yılmaz · Başarı Mühendisi · Yazar · Konuşmacı')
ctas=hero.xpath('.//*['+has('hero-ctas')+']')[0]
ctas.append(frag('<button class="btn btn-ghost" data-talk="u-p2y6JH3aA" type="button"><span aria-hidden="true">▶</span> TEDx konuşmasını izle</button>'))
hero.append(frag('<button type="button" class="video-toggle" aria-label="Arka plan videosunu duraklat"><span aria-hidden="true">Ⅱ</span> Videoyu duraklat</button>'))
hero.append(frag('<a href="#alanlar" class="hero-scroll">Dört alanı keşfet <span aria-hidden="true">↓</span></a>'))
sections[1].set('id','alanlar')
replace_content(sections[1].xpath('.//*['+has('kicker')+']')[0],'Birlikte çalışabileceğimiz dört alan')
for p in sections[1].xpath('.//a['+has('gate')+']/p'):remove(p)
for el in sections[1].xpath('.//p['+has('hero-note')+']'):remove(el)
# Four proof points remain above the four areas; the biography retains all source figures.
trust=doc.xpath('//*['+has('trust-grid')+']')[0]
for i,e in enumerate(list(trust)):
    if i not in (0,1,3,6):trust.remove(e)
# Two signature systems remain as in the demo.
replace_content(sections[3].xpath('.//p['+has('lead')+']')[0],'Başarı Mühendisliği™: hedefini, alışkanlıklarını ve sonuçlarını beş aşamada tasarla. Keşif, Tasarım, İnşa, Test, Bakım.')
for p in sections[3].xpath('.//p['+has('ip-bridge')+']'):remove(p)
for p in sections[4].xpath('.//p['+has('lead')+']'):
    replace_content(p,'Kurşun Geçirmez Kafa Yapısı™ ile iç sesini tanı, baskı altında yönünü koru. Kitabı keşfet; 20 soruluk testle kendinden başla.')
# Minimize executive biography on the home; keep it in the biography route.
replace_content(sections[6].xpath('.//p['+has('lead')+']')[0],'Önce ekibinizi dinliyoruz. Satış, liderlik ve kafa yapısı için sahaya uygulanabilir programlar tasarlıyoruz.')
for el in sections[6].xpath('.//div['+has('q-card')+']'):remove(el)
# The demo's existing international clip becomes an edge-to-edge stage moment.
speaker=sections[10]
speaker.clear();speaker.set('class','speaker-band cinematic-stage');speaker.set('id','hikaye')
speaker.append(frag('<div class="hero-vid" aria-hidden="true"><video src="/assets/klip-uluslararasi.mp4" poster="/assets/klip-uluslararasi.jpg" muted autoplay loop playsinline preload="metadata" data-cinematic></video></div>'))
speaker.append(frag('''<div class="wrap stage-content"><span class="kicker">Sahneden sahaya · Ziya Şakir Yılmaz</span><h2>Etkinliğinize<br>Ziya Şakir Yılmaz’ı<br><span class="accent">davet edin.</span></h2><p class="lead">Başarı · Kafa Yapısı · Satış · Liderlik</p><div class="hero-ctas"><a class="btn btn-primary" href="/iletisim?konu=konusmaci">Etkinliğim için görüşelim →</a><a class="btn btn-ghost" href="/konusmaci">Konuşmaları keşfet</a></div><p class="hero-note">5 TEDx · Kurumsal zirveler · Uluslararası etkinlikler</p></div>'''))
speaker.append(frag('<button type="button" class="video-toggle" aria-label="Arka plan videosunu duraklat">Ⅱ Videoyu duraklat</button>'))
sections[1].addnext(speaker)
doc.find('body').append(frag('''<dialog id="talkDialog" aria-labelledby="talkTitle"><div class="talk-top"><h2 id="talkTitle">Ziya Şakir Yılmaz · TEDxReset</h2><button type="button" class="talk-close" aria-label="Videoyu kapat">×</button></div><div id="talkPlayer"></div><a href="https://www.youtube.com/watch?v=u-p2y6JH3aA" target="_blank" rel="noopener">YouTube’da izle ↗</a></dialog>'''))
save(doc,path)

# Sales and leadership keep their own original Turkish text, with full-viewport footage.
for route in ('satis','liderlik','konusmaci'):
    path=DIST/route/'index.html';doc=html.fromstring(path.read_text())
    hero=doc.xpath('//section['+has('page-hero')+']')[0]
    cls(hero,'cinematic-page')
    video='hero-loop-v5.mp4' if route=='satis' else 'klip-uluslararasi.mp4'
    poster='hero-poster.jpg' if route=='satis' else 'klip-uluslararasi.jpg'
    hero.insert(0,frag(f'<div class="hero-vid" aria-hidden="true"><video src="/assets/{video}" poster="/assets/{poster}" muted autoplay loop playsinline preload="auto" data-cinematic></video></div>'))
    hero.append(frag('<button type="button" class="video-toggle" aria-label="Arka plan videosunu duraklat">Ⅱ Videoyu duraklat</button>'))
    wrap=hero.xpath('.//div['+has('wrap')+']')[0]
    url='/kurumsal/satis-egitimi' if route=='satis' else '/kurumsal/liderlik-egitimi' if route=='liderlik' else '/iletisim?konu=konusmaci'
    title='Satış ekibimi geliştir →' if route=='satis' else 'Liderlerimi geliştir →' if route=='liderlik' else 'Etkinliğime davet et →'
    wrap.append(frag(f'<div class="hero-ctas mt-2"><a class="btn btn-primary" href="{url}">{title}</a><a class="btn btn-ghost" href="#kesfet">İçerikleri keşfet ↓</a></div>'))
    sections=doc.xpath('//body/section');sections[1].set('id','kesfet')
    save(doc,path)

# A single test hub, retaining the real client-authored 20-question assessment.
path=DIST/'testler/index.html';doc=html.fromstring(path.read_text())
for meta in doc.xpath('//meta[@name="description" or @property="og:description" or @name="twitter:description"]'):meta.set('content','Kurşun Geçirmez Kafa Yapısı Testi: 20 soru, 5 katman, ücretsiz kişisel öz değerlendirme.')
hero=doc.xpath('//section['+has('page-hero')+']')[0]
replace_content(hero.xpath('.//h1')[0],'KAFA YAPIN KURŞUN GEÇİRMEZ Mİ?')
replace_content(hero.xpath('.//p['+has('lead')+']')[0],'20 soru, 5 katman, yaklaşık 3 dakika. Kayıt gerektirmeden kendi gelişim alanlarını keşfet.')
cards=doc.xpath('//*['+has('cards-4')+']')[0];cards.set('style','max-width:820px;margin:auto;grid-template-columns:1fr')
for el in doc.xpath('//*['+has('capsule')+']'):replace_content(el,'Seni en iyi anlatan cevapları seç. Sonucunda beş katmanını, güçlü yönünü ve ilk üç gelişim adımını göreceksin. Kişisel raporunu cihazına indirebilirsin.')
save(doc,path)
for route in old_tests:
    path=DIST/route.strip('/')/'index.html'
    path.write_text('<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/testler/kafa-yapisi-testi"><title>Kafa Yapısı Testi</title></head><body><a href="/testler/kafa-yapisi-testi">Kurşun Geçirmez Kafa Yapısı Testi’ne devam et</a></body></html>')

path=DIST/'testler/kafa-yapisi-testi/index.html';doc=html.fromstring(path.read_text())
f=doc.get_element_by_id('reportForm');f.getparent().replace(f,frag('<div class="report-actions"><button class="btn btn-primary" type="button" id="downloadReport">Kişisel raporumu indir ↓</button><p class="hero-note">Skorun, katmanların ve ilk üç adımın cihazına metin dosyası olarak indirilir.</p></div>'))
quiz=doc.get_element_by_id('quiz');quiz.append(frag('<button type="button" class="btn btn-ghost btn-sm" id="previousQuestion">← Önceki soru</button>'))
doc.get_element_by_id('qText').set('tabindex','-1');doc.get_element_by_id('qText').set('aria-live','polite')
doc.get_element_by_id('result').set('tabindex','-1')
save(doc,path)

# Contact handoff to the exact WhatsApp number already present in the client demo.
path=DIST/'iletisim/index.html';doc=html.fromstring(path.read_text())
for script in doc.xpath('//script[not(@src) and not(@type="application/ld+json")]'):remove(script)
f=doc.get_element_by_id('contactForm')
replace_content(f.xpath('.//button[@type="submit"]')[0],'WhatsApp mesajını hazırla →')
f.addnext(frag('<div id="contactPreview" class="q-card" hidden><h3>Mesajın hazır.</h3><p>WhatsApp’ta kontrol edip gönderebilirsin.</p><pre id="preparedMessage"></pre><a id="sendWhatsApp" class="btn btn-primary" target="_blank" rel="noopener">WhatsApp’ta devam et →</a></div>'))
for p in doc.xpath('//p[contains(text(),"Bu form yayında")]'):replace_content(p,'Form mesajını hazırlar; gönderimi WhatsApp’ta sen tamamlarsın. Bilgilerin bu sayfada kaydedilmez.')
save(doc,path)

# Remove the previous desktop-only playback and simulated newsletter success handlers.
p=DIST/'assets/main.js';js=p.read_text()
start=js.index('  /* Hero showreel');end=js.index('  /* Başarı Mühendisliği blueprint')
js=js[:start]+'  var noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;\n'+js[end:]
start=js.index('  /* Bülten/66 Gün');js=js[:start]+'})();\n'
js=js.replace('if (e.target.tagName === "A") links.classList.remove("open");','if (e.target.tagName === "A") { links.classList.remove("open"); hamb.setAttribute("aria-expanded", "false"); }')
p.write_text(js)
print('Applied Turkish-demo refinement to 65 pages.')
