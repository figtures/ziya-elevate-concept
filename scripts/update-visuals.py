from pathlib import Path
from lxml import html

ROOT=Path(__file__).resolve().parents[1]/'dist'
def icon(name):
    return html.fragment_fromstring(f'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#{name}"></use></svg>')
def set_icon(element,name,text=None):
    for child in list(element):element.remove(child)
    element.text=None
    element.append(icon(name))
    if text:
        label=html.Element('span');label.set('class','control-label');label.text=text;element.append(label)
def has(cls):return "contains(concat(' ',normalize-space(@class),' '),' "+cls+" ')"

for p in ROOT.rglob('*.html'):
    doc=html.fromstring(p.read_text())
    if not doc.xpath('//link[contains(@href,"style.css")]'):continue
    head=doc.find('head')
    for link in head.xpath('./link[contains(@href,"fonts.googleapis.com") or contains(@href,"fonts.gstatic.com")]'):head.remove(link)
    if not head.xpath('./link[@href="/assets/fonts.css"]'):
        head.append(html.fragment_fromstring('<link rel="stylesheet" href="/assets/fonts.css">'))
        head.append(html.fragment_fromstring('<link rel="preload" href="/assets/fonts/manrope-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>'))
        head.append(html.fragment_fromstring('<link rel="preload" href="/assets/fonts/manrope-latin-ext-wght-normal.woff2" as="font" type="font/woff2" crossorigin>'))
    for e in doc.xpath('//a|//button'):
        for child in e.iter():
            if child.tag in ('script','style','use'):continue
            if child.text:child.text=child.text.translate(str.maketrans('','','→↗←↓')).strip()
            if child.tail:child.tail=child.tail.translate(str.maketrans('','','→↗←↓'))
    for e in doc.xpath('//*['+has('hamb')+']'):set_icon(e,'menu')
    for e in doc.xpath('//*['+has('ask-ziya')+']'):set_icon(e,'message-circle',"Ziya’ya sor")
    for e in doc.xpath('//*['+has('video-toggle')+']'):set_icon(e,'pause','Videoyu duraklat')
    for e in doc.xpath('//*[@data-talk]'):set_icon(e,'play','TEDx konuşmasını izle')
    for e in doc.xpath('//*['+has('talk-close')+']'):set_icon(e,'x')
    for e in doc.xpath('//*['+has('hero-scroll')+']'):set_icon(e,'mouse','Dört alanı keşfet')
    for e in doc.xpath('//*[@id="downloadReport"]'):set_icon(e,'download','Kişisel raporumu indir')
    for e in doc.xpath('//*['+has('play-dot')+']'):
        if '▶' in e.text_content():set_icon(e,'play')
    for e in doc.xpath('//summary'):
        if not e.xpath('.//svg'):e.append(icon('plus'))
    for e in doc.xpath('//*[@font-family]'):e.set('font-family','Manrope Variable, sans-serif')
    p.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode'))

# The player updates icon state without introducing text glyphs again.
p=ROOT/'assets/refinements.js';s=p.read_text()
s=s.replace("button.textContent = video.paused ? '▶ Videoyu oynat' : 'Ⅱ Videoyu duraklat';", "button.querySelector('use')?.setAttribute('href', '/assets/icons.svg#' + (video.paused ? 'play' : 'pause'));\n    const text = button.querySelector('.control-label');\n    if (text) text.textContent = video.paused ? 'Videoyu oynat' : 'Videoyu duraklat';")
s=s.replace("document.querySelector('.hamb')?.setAttribute('aria-expanded', 'false');", "document.querySelector('.hamb')?.setAttribute('aria-expanded', 'false');document.querySelector('.hamb use')?.setAttribute('href','/assets/icons.svg#menu');")
p.write_text(s)
p=ROOT/'assets/main.js';s=p.read_text()
s=s.replace('hamb.setAttribute("aria-expanded", open ? "true" : "false");', 'hamb.setAttribute("aria-expanded", open ? "true" : "false");\n      hamb.setAttribute("aria-label", open ? "Menüyü kapat" : "Menüyü aç");\n      hamb.querySelector("use")?.setAttribute("href", "/assets/icons.svg#" + (open ? "x" : "menu"));')
s=s.replace('if (e.target.tagName === "A") { links.classList.remove("open"); hamb.setAttribute("aria-expanded", "false"); }','if (e.target.closest("a")) { links.classList.remove("open"); hamb.setAttribute("aria-expanded", "false"); hamb.setAttribute("aria-label", "Menüyü aç"); hamb.querySelector("use")?.setAttribute("href", "/assets/icons.svg#menu"); }')
p.write_text(s)
print('Applied Manrope/Inter font loading and Lucide icons across the Turkish site.')
