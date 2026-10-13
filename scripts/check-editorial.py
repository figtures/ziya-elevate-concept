"""Release contracts for the Turkish speaker site, beyond basic link validation."""
from pathlib import Path
from collections import Counter
from lxml import html
import re,json
root=Path(__file__).resolve().parents[1]/'website'
count=0
for path in root.rglob('*.html'):
    text=path.read_text();doc=html.fromstring(text)
    assert not re.search('merkez',text,re.I),f'Forbidden wording: {path}'
    if not doc.xpath('//header'):continue
    count+=1
    assert len(doc.xpath('//h1'))==1,f'Heading: {path}'
    ids=Counter(e.get('id') for e in doc.xpath('//*[@id]'))
    assert all(v==1 for v in ids.values()),f'Duplicate anchors: {path}'
    assert doc.xpath('//body/section[1]//video'),f'Video opening: {path}'
    assert not doc.xpath('//body/section[not(@data-motion-section)]'),f'Motion: {path}'
    assert not doc.xpath('//*[contains(@class,"glass-sculpture") or contains(@class,"hero-glass-art")]'),f'Legacy artwork: {path}'
    assert '\u0307' not in doc.xpath('//h1')[0].text_content(),f'Turkish casing: {path}'
    for script in doc.xpath('//script[@type="application/ld+json"]'):json.loads(script.text)
home=html.fromstring((root/'index.html').read_text())
form=html.fromstring((root/'iletisim/index.html').read_text())
expected=[('konusmaci','Keynote olarak davet etmek istiyorum'),('kurumsal','Kurumsal eğitim almak istiyorum'),('bireysel','Bireysel eğitim almak istiyorum'),('mentorluk','Mentorluk almak istiyorum')]
links=home.xpath('//aside[@class="hero-intentions"]//a');options=form.xpath('//*[@id="konu"]/option')
assert len(links)==4
for i,(value,label) in enumerate(expected):
    assert label in links[i].text_content()
    assert links[i].get('href')==f'/iletisim/?konu={value}#talep-formu'
    assert options[i].get('value')==value and options[i].text==label
model=html.fromstring((root/'basari/index.html').read_text())
assert model.xpath('//div[@class="step-sequence"]/article/h3/text()')==['Keşif','Tasarım','İnşa','Test','Bakım']
# Restore only the requested original proof strip within the approved home rhythm.
assert len(home.xpath('//body/section'))==7
assert home.xpath('//body/section/@class')==['hero editorial-home-hero','ed-section ed-proof','ed-section ed-intro','ed-section ed-topics','ed-section ed-dark','ed-section ed-programs','ed-section ed-closing']
books=html.fromstring((root/'kitaplar/index.html').read_text())
assert len(books.xpath('//div[@class="book-editorial-list"]/article'))==4
talks=html.fromstring((root/'konusmaci/index.html').read_text())
assert len(talks.xpath('//div[contains(@class,"talk-archive")]/a'))==4
for path in root.rglob('*.html'):
    doc=html.fromstring(path.read_text())
    if not doc.xpath('//header'):continue
    assert not doc.xpath('//link[contains(@href,"soft-editorial.css")]'),f'Rejected styling: {path}'
    assert not doc.xpath('//section[contains(@class,"source-section")]'),f'Imported layout: {path}'
    for detail in doc.xpath('//details[@class="content-detail"]'):
        assert len(' '.join(detail.xpath('./div')[0].text_content().split()))>15,f'Empty content expansion: {path}'
    for a in doc.xpath('//a[@href]'):
        assert not any(t in a.get('href') for t in ['basari-muhendisligi-skoru','satis-yetkinlik-skoru','liderlik-yetkinlik-skoru']),f'Retired public test: {path}'
print(f'PASS: {count} content routes, four exact booking intents, original five-stage model, video/motion coverage and editorial content constraints.')

assert home.xpath('//section[@id="rakamlarla"]//p[@data-counter]/text()') == ["600.000+", "84 ülke", "5× TEDx", "4 kitap", "30 yıl"]
