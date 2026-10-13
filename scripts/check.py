"""Release gate: imported multi-page routes, assets, anchors and Turkish UI."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import re, sys

ROOT=Path(__file__).resolve().parents[1]/'website'
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.links=[];self.ids=set();self.lang=None;self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='html':self.lang=attrs.get('lang')
        if 'id' in attrs:self.ids.add(attrs['id'])
        for key in ('href','src','poster','srcset'):
            if key in attrs:self.links.append((tag,key,attrs[key]))

pages={p:Page(p.read_text()) for p in ROOT.rglob('*.html')}
errors=[];checked=0
for path,page in pages.items():
    if page.lang!='tr':errors.append(f'Language: {path}')
    for tag,key,value in page.links:
        u=urlsplit(value)
        if u.netloc or u.scheme:continue
        target=ROOT/unquote(u.path).lstrip('/') if u.path.startswith('/') else path.parent/unquote(u.path)
        if not u.path:target=path
        if target.is_dir():target=target/'index.html'
        if not target.is_file():errors.append(f'Missing {value} in {path.relative_to(ROOT)}')
        elif u.fragment and target in pages and u.fragment not in pages[target].ids:errors.append(f'Anchor {value} in {path.relative_to(ROOT)}')
        checked+=1
    for resource in re.findall(r'url\([\x22\x27]?(/assets/[^)\x22\x27]+)',path.read_text()):
        if not (ROOT/resource.lstrip('/')).is_file():errors.append('CSS asset '+resource)
if (ROOT/'__qa.html').exists():errors.append('Remove the temporary QA fixture before publishing.')
print(f'{len(pages)} Turkish HTML pages; {checked} local links/assets checked.')
if errors:
    print('\n'.join(errors));sys.exit(1)
print('All routes, local assets and section anchors resolve.')
