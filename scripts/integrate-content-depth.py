"""Place V12 content inside the approved v6 editorial structure.

No V12 section/layout is imported. Home keeps exactly its six sections.
One-time migration from 0d8bd0a; dist remains the editable canonical output.
"""
from pathlib import Path
from copy import deepcopy
from urllib.parse import urljoin,urlsplit,urlunsplit,parse_qs
from lxml import html,etree
import re,json

ROOT=Path(__file__).resolve().parents[1];DIST=ROOT/'dist';SOURCE=ROOT/'content/v12'
def F(s):return html.fragment_fromstring(s)
def C(d,name):return d.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," '+name+' ")]')
def text(e):return ' '.join(e.text_content().split())
def settext(e,s):
    for child in list(e):e.remove(child)
    e.text=s
def ban(s):
    for a,b in [('icerik-merkezi','kaynaklar'),('Kafa Yapısı Bilgi Merkezi','Kafa Yapısı Araştırmaları'),('İçerik Merkezi','Yazılar ve Kaynaklar'),('Başarı Merkezi','Başarı Rehberi'),('Kafa Yapısı Merkezi','Kafa Yapısı Rehberi'),('Satış Merkezi','Satış Rehberi'),('Liderlik Merkezi','Liderlik Rehberi'),('Bu merkezdeki','Bu rehberlerdeki'),('bu merkezde','bu rehberde'),('Bu merkez','Bu yaklaşım'),('bu merkez','bu yaklaşım'),('Merkezi','Rehberi'),('merkezi','rehberi'),('Merkez','Rehber'),('merkez','rehber'),("Kitap Hub'ında",'Kitabın sayfasında'),("Kitap Hub'ı",'Kitabı keşfet'),('IP sayfası','İmza sistem')]:s=s.replace(a,b)
    return s.replace('çağrı rehberi satış ekibinde','telefonla satış ekibinde')
def load(route,source=False):return html.parse(str((SOURCE if source else DIST)/route/'index.html'))
def save(route,doc):
    body=doc.find('body');body.set('data-content-depth','v12')
    head=doc.find('head')
    if not head.xpath('./link[contains(@href,"content-depth.css")]'):etree.SubElement(head,'link',rel='stylesheet',href='/assets/content-depth.css')
    s=ban(html.tostring(doc,encoding='unicode',doctype='<!DOCTYPE html>'))
    for a,b in [('viewbox=','viewBox='),('<lineargradient','<linearGradient'),('</lineargradient','</linearGradient')]:s=s.replace(a,b)
    (DIST/route/'index.html').write_text(s)
def clean(e,route):
    e=deepcopy(e)
    for n in list(e.iter()):
        if not isinstance(n.tag,str):continue
        for attr in list(n.attrib):
            if attr in ['id','class','style','width','height'] or attr.startswith('data-'):n.attrib.pop(attr,None)
        if n.tag=='h1':n.tag='h3'
        if n.tag=='h2':n.tag='h3'
        if n.tag=='a':
            raw=n.get('href','');u=urlsplit(urljoin('https://v12.ziyasakiryilmaz.pages.dev/'+route,raw))
            if u.netloc=='v12.ziyasakiryilmaz.pages.dev':
                p=u.path
                if not Path(p).suffix and p!='/':p=p.rstrip('/')+'/'
                if p=='/iletisim/':
                    q=parse_qs(u.query).get('konu',[''])[0]
                    if q=='tani' or q.startswith('kurumsal-'):q='kurumsal'
                    n.set('href','/iletisim/'+('?konu='+q if q else '')+'#talep-formu')
                elif '/testler/' in p and 'kafa-yapisi-testi' not in p:
                    n.set('href','/iletisim/?konu=kurumsal#talep-formu');settext(n,'Ekip değerlendirmesini görüşelim')
                else:n.set('href',urlunsplit(('','',p,u.query,u.fragment)))
        if n.tag=='table':n.set('class','depth-table')
    return html.fromstring(ban(html.tostring(e,encoding='unicode')))
def icon(name='plus'):
    return F(f'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/assets/icons.svg#{name}"></use></svg>')
def fold(title,nodes,route):
    d=F('<details class="content-detail"><summary><span></span></summary><div class="depth-body"></div></details>')
    d[0][0].text=title;d[0].append(icon());d[1].extend(clean(n,route) for n in nodes)
    return d
def rows(container,items):
    for e in list(container):container.remove(e)
    for i,(title,body) in enumerate(items):
        n=F('<div class="editorial-row" data-motion-item><span class="row-number"></span><h3></h3><p></p></div>')
        n[0].text=f'{i+1:02d}';n[1].text=title;n[2].text=ban(body);container.append(n)
def source_section(doc,needle):return next(s for s in doc.xpath('//body/section') if any(needle in n.text_content() for n in s.xpath('.//h2')))
def wrap(section):return section.xpath('./div[contains(concat(" ",@class," ")," wrap ")]')[0]
def findsection(doc,name):return C(doc,name)[0]
def article_cards(s):return [(text(c.xpath('.//h3')[0]),' '.join(text(p) for p in c.xpath('./p'))) for c in C(s,'card') if c.xpath('.//h3')]
def section_body(s):
    # Only source writing, no page chrome, decorative stages or footage.
    return s.xpath('.//div[contains(concat(" ",@class," ")," prose ")]/*')
def move_anchor(doc,value,target):
    for e in doc.xpath('//*[@id="'+value+'"]'):
        if 'anchor-alias' in e.get('class',''):e.getparent().remove(e)
        else:e.attrib.pop('id',None)
    target.set('id',value)

# HOME: no added sections, stories, galleries or catalogues. One quiet resource line.
d=load('');program=findsection(d,'ed-programs');w=wrap(program)
w.append(F('<nav class="continuation-links" aria-label="Okumaya ve keşfetmeye devam et"><span>Keşfetmeye devam</span><a href="/kitaplar/">Kitaplar ↗</a><a href="/makaleler/">Yazılar ↗</a><a href="/testler/kafa-yapisi-testi/">Kafa Yapısı Testi ↗</a></nav>'))
save('',d)

# BOOKS: the existing book list, all four titles, with source descriptions.
r='kitaplar';d=load(r);s=load(r,True);catalog=C(d,'book-editorial-list')[0]
templates=list(catalog);sourcebooks=C(s,'book');catalog.clear();catalog.set('class','book-editorial-list')
for i,b in enumerate(sourcebooks):
    title=text(b.xpath('.//h3')[0]);p=b.xpath('.//p')[0];a=b.xpath('.//a')[0]
    item=deepcopy(templates[0 if i==0 else i-1]);cover=item[0]
    if i==0:
        cover.clear();cover.set('class','book-cover');cover.append(F('<div class="typographic-book" aria-label="Kurşun Geçirmez Kafa Yapısı kitabı"><span>ZİYA ŞAKİR YILMAZ</span><strong>KURŞUN<br>GEÇİRMEZ<br>KAFA YAPISI</strong><small>EKİM 2026</small></div>'))
    copy=item[1];copy.xpath('./p[@class="eyebrow"]')[0].text=text(C(b,'yr')[0]);settext(copy.xpath('./h2')[0],title)
    settext(copy.xpath('./p[not(@class="eyebrow")]')[0],ban(text(p)))
    link=copy.xpath('./a')[0];original=clean(a,r);link.set('href',original.get('href'));settext(link[0],text(original))
    if i==3:move_anchor(d,'ilk-72-saat',item)
    catalog.append(item)
chain=source_section(s,'Her kitap bir sistemin parçası')
wrap(findsection(d,'ed-books')).append(fold('Kitapların fikir zinciri',chain.xpath('.//p|.//table'),r))
save(r,d)

# KEYNOTE: same four expandable topic rows; original audience/benefits and all four films.
r='konusmaci';d=load(r);s=load(r,True)
source_topics=next(n for n in C(s,'mt-3') if n.xpath('./h2[contains(.,"Dört keynote")]'))
durations=['45–60 dakika','45–90 dakika','60–90 dakika','45–60 dakika']
for i,(detail,card) in enumerate(zip(C(d,'keynote-topics')[0].xpath('./details'),C(source_topics,'card'))):
    box=C(detail,'topic-detail')[0];cta=deepcopy(box.xpath('./a')[0]);box.clear();box.set('class','topic-detail')
    eyebrow=etree.SubElement(box,'p',{'class':'eyebrow'});eyebrow.text=durations[i]
    box.extend(clean(p,r) for p in card.xpath('./p'));box.append(cta)
    detail[0].set('aria-label',text(detail[0])+' · '+durations[i])
process=next(n for n in C(s,'mt-3') if n.xpath('./h2[contains(.,"Üç adım")]'))
dark=findsection(d,'ed-dark');rows(C(dark,'editorial-rows')[0],article_cards(process))
why=next(n for n in C(s,'q-card') if n.xpath('./h3[contains(.,"Yaşadığını anlatıyor")]'))
C(dark,'ed-heading')[0].append(fold('Sahadan gelen deneyim',why.xpath('./p'),r))
archive=C(d,'talk-archive')[0];last=deepcopy(archive[-1]);last.set('href','https://www.youtube.com/watch?v=4UikrLPd5-U')
last.xpath('./img')[0].set('src','/assets/tedx-erciyes-thumb.jpg');last.xpath('./img')[0].set('alt','Ziya Şakir Yılmaz · TEDxErciyesKoleji')
last.xpath('./span')[0].text='TEDxErciyesKoleji';settext(last.xpath('./h3')[0],'Bir Hayal Hikayesi');archive.append(last)
archive.set('class','talk-archive four-talks')
save(r,d)

# TOPIC PAGES: narrative beside the existing introduction, resources in the existing reading area.
for r in ['basari','kafa-yapisi','satis','liderlik']:
    d=load(r);s=load(r,True);sections=d.xpath('//body/section')
    first=sections[1];headings=C(first,'ed-heading');target=headings[0] if headings else wrap(first)
    source_prose=next(n for n in C(s,'prose') if n.xpath('.//p'))
    title={'basari':'Başarıyı nasıl tanımlıyorum?','kafa-yapisi':'Kafa yapısı neden değiştirilebilir?','satis':'Satışa bakışım ve sahadan bir hikâye','liderlik':'Liderliğe bakışım ve yolculuğum'}[r]
    target.append(fold(title,list(source_prose),r))
    reading=findsection(d,'ed-reading');rw=wrap(reading)
    original_post=C(s,'post-list')[0];existing=C(reading,'reading-selection')[0][-1]
    for n in list(existing):existing.remove(n)
    links=original_post.xpath('./a')
    for link in links[:3]:
        a=clean(link,r);a.set('class','reading-link');existing.append(a)
    if len(links)>3:existing.append(fold('Diğer rehberler',links[3:]+original_post.xpath('following-sibling::a|following-sibling::details'),r))
    mapsection=source_section(s,'kümeleri')
    mapnodes=[]
    for card in C(mapsection,'card'):mapnodes.extend(card.xpath('./h3|./p'))
    for stat in C(s,'stat-card'):mapnodes.append(stat)
    rw.append(fold('Bu alandaki sekiz başlık',mapnodes,r))
    faq=C(s,'faq')
    if faq:
        nodes=[]
        for q in faq[0].xpath('./details'):
            h=F('<h3></h3>');h.text=text(q.xpath('./summary')[0]);nodes.append(h);nodes.extend(q.xpath('./div'))
        rw.append(fold('Sık sorulan sorular',nodes,r))
    save(r,d)

# SIGNATURE SYSTEMS: replace concise model text, reveal deeper principles in context.
r='basari-muhendisligi';d=load(r);s=load(r,True);secs=d.xpath('//body/section')
C(secs[1],'manifesto-layout')[0][-1].append(fold('Mühendis gözüyle başarı',section_body(source_section(s,'Mühendis gözüyle')),r))
rows(C(secs[2],'editorial-rows')[0],article_cards(source_section(s,'Beş Aşamalı Süreç')))
concepts=source_section(s,'Kitabın omurgası');stack=F('<div class="depth-stack"><p class="eyebrow">Kitabın altı temel kavramı</p></div>')
for card in C(concepts,'card'):stack.append(fold(text(card.xpath('./h3')[0]),card.xpath('./p'),r))
wrap(secs[3]).append(stack);save(r,d)

r='kursun-gecirmez-kafa-yapisi';d=load(r);s=load(r,True);secs=d.xpath('//body/section')
C(secs[1],'manifesto-layout')[0][-1].append(fold('Neden “kurşun geçirmez”?',section_body(source_section(s,'Neden')),r))
rows(C(secs[2],'editorial-rows')[0],article_cards(source_section(s,'Beş Zırh Katmanı')))
plan=s.xpath('//*[@id="oyun-plani"]')[0];plansec=secs[4];move_anchor(d,'oyun-plani',plansec)
head=C(plansec,'ed-heading')[0];settext(head.xpath('./h2')[0],'7 günden 66 güne: Oyun Planı')
planparas=plan.xpath('./div/div[1]/p');settext(head.xpath('./p[@class="ed-description"]')[0],text(planparas[0]))
nodes=planparas[1:]+C(plan,'stat-card')
depth=fold('Yolculuk nasıl ilerliyor?',nodes,r)
form=deepcopy(plan.xpath('.//form')[0]);action=form.get('data-brevo');form.attrib.clear();form.set('class','depth-signup');form.set('method','post');form.set('action',action);form.set('target','_blank');form.set('rel','noopener')
for n in form.iter():n.attrib.pop('style',None)
form.xpath('./input')[0].set('name','EMAIL');form.xpath('./button')[0].set('class','ed-button');form.append(F('<input type="hidden" name="locale" value="tr">'))
depth[1].append(form);head.append(depth)
faqs=C(s,'faq')[0];faqnodes=[]
for q in faqs.xpath('./details'):
    h=F('<h3></h3>');h.text=text(q.xpath('./summary')[0]);faqnodes.append(h);faqnodes.extend(q.xpath('./div'))
head.append(fold('Sık sorulan sorular',faqnodes,r));save(r,d)

# CORPORATE: keep the split intro / four topic rows / collaboration / invitation rhythm.
for r in ['kurumsal/satis-egitimi','kurumsal/liderlik-egitimi','kurumsal/kafa-yapisi-atolyesi']:
    d=load(r);s=load(r,True);secs=d.xpath('//body/section');prose=C(s,'prose')[0]
    chapters=[];current=[]
    for n in list(prose):
        if 'kicker' in n.get('class',''):
            if current:chapters.append(current)
            current=[]
        current.append(n)
    if current:chapters.append(current)
    def chapter(i):return [n for n in chapters[i] if n.tag not in ['h2'] and 'kicker' not in n.get('class','')]
    first=C(secs[1],'ed-heading')[0]
    first.append(fold('Ekibiniz hangi noktada?',chapter(0)+chapter(1),r))
    # Exact five-stage curriculum is one deliberate, optional expansion.
    darkhead=C(secs[2],'ed-heading')[0];darkhead.append(fold('Programın beş adımı',chapter(3),r))
    darkhead.append(fold('Çalışma yaklaşımı',chapter(2),r))
    processlist=next(n for n in chapter(4) if n.tag=='ol');items=[]
    for li in processlist:
        b=li.xpath('./b|./strong');title=text(b[0]).rstrip('.') if b else text(li).split('.')[0]
        desc=text(li);desc=desc[len(text(b[0])):].strip() if b else desc
        items.append((title,desc))
    rows(C(secs[3],'editorial-rows')[0],items)
    w=wrap(secs[3]);w.append(fold('Çalışmanın sonunda elinizde ne kalır?',chapter(5),r))
    w.append(fold('Sahadan bir uygulama',chapter(6),r))
    w.append(fold('Ziya Şakir Yılmaz’ın deneyimi',chapter(7),r))
    save(r,d)

# TRAINING: retain the catalog, place source specifics inside its three existing rows.
r='egitimler';d=load(r);s=load(r,True)
for item,panel in zip(C(d,'program-catalog')[0],C(s,'ip-panel')):
    dest=item[-1];settext(dest.xpath('./p')[0],text(panel.xpath('./div[1]/p')[0]))
    more=panel.xpath('./div[1]/ul')+C(panel,'stat-card')
    dest.append(fold('Format ve uygulama',more,r))
sourceindividual=s.xpath('//*[@id="bireysel"]')[0]
ind=d.xpath('//*[@id="bireysel"]')[0];settext(C(ind,'ed-description')[0],text(sourceindividual.xpath('.//p')[0]))
C(ind,'individual-program')[0][-1].append(F('<a class="ed-link" href="/bulten/">Program duyurularını takip et</a>'));save(r,d)

# MENTORING: original two profiles and exact operating model, no extra sections.
r='mentorluk';d=load(r);s=load(r,True);profiles=C(s,'card')
rows(C(findsection(d,'ed-mentor'),'editorial-rows')[0],article_cards(s))
dark=findsection(d,'ed-dark');capsule=C(s,'capsule')[0]
copy=clean(capsule,r)
txt=text(copy).replace('Nasıl İşler?','').strip()
txt=txt.replace('iki Skor testini (Kafa Yapısı + alanına göre Satış ya da Liderlik)','Kafa Yapısı Testi’ni')
p=F('<p></p>');p.text=txt
wrap(dark).append(fold('Başvuru, görüşmeler ve takip',[p],r))
note=F('<p>Kontenjan dolduğunda başvurular bekleme listesine alınır.</p>');wrap(dark).append(note);note.set('class','depth-note')
save(r,d)

# BIOGRAPHY: maintain portrait composition; longer history and dated metrics expand here.
r='ziya-sakir-yilmaz';d=load(r);s=load(r,True);bio=findsection(d,'ed-bio')
sourcebio=source_section(s,'Sahadan gelen');nodes=[n for n in sourcebio.xpath('.//div[contains(concat(" ",@class," ")," prose ")]/p') if not text(n).startswith('Yayın notu:')]
C(bio,'bio-spread')[0][-1].append(fold('Hikâyenin tamamı',nodes,r))
journey=source_section(s,'Yolculuk');dark=findsection(d,'ed-dark')
rows(C(dark,'editorial-rows')[0],article_cards(journey))
last=d.xpath('//body/section')[-2];press=source_section(s,'Basın kiti')
wrap(last).append(fold('Basın ve etkinlik dosyaları',press.xpath('.//p|.//a'),r))
digital=s.xpath('//*[@id="dijital-etki"]')[0]
digitnodes=digital.xpath('./div/p')
for card in C(digital,'card'):digitnodes.extend(card.xpath('./h3|./p'))
f=fold('Dijital etki · Eylül 2026',digitnodes,r);move_anchor(d,'dijital-etki',f);wrap(last).append(f)
save(r,d)

# Remove stale target anchors from folded source fragments; all original v6 anchors survive.
# Add only Books to the approved desktop menu, maintaining its existing styling.
for path in DIST.rglob('*.html'):
    doc=html.parse(str(path));nav=doc.xpath('//header//ul[@class="nav-links"]')
    if not nav:continue
    if not nav[0].xpath('.//a[@href="/kitaplar/"]'):
        li=F('<li><a href="/kitaplar/">Kitaplar</a></li>');nav[0].insert(2,li)
        if path==DIST/'kitaplar/index.html':li[0].set('aria-current','page')
    raw=ban(html.tostring(doc,encoding='unicode',doctype='<!DOCTYPE html>')).replace('viewbox=','viewBox=')
    path.write_text(raw)
p=ROOT/'scripts/header.html';raw=p.read_text();raw=raw.replace('<li><a href="/#alanlar">','<li><a href="/kitaplar/">Kitaplar</a></li><li><a href="/#alanlar">');p.write_text(raw)
print('Integrated authored content in 14 relevant detail pages; homepage keeps its six-section rhythm.')
