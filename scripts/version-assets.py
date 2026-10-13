"""Version local styles/scripts so returning visitors receive the current UI."""
from hashlib import sha256
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from lxml import html

root=Path(__file__).resolve().parents[1]/'website'
for path in root.rglob('*.html'):
    doc=html.fromstring(path.read_text())
    for el in doc.xpath('//script[@src]|//link[@href]'):
        attr='src' if el.tag=='script' else 'href'
        url=urlsplit(el.get(attr))
        if not url.path.startswith('/assets/') or not url.path.endswith(('.css','.js')):continue
        file=root/url.path.lstrip('/')
        digest=sha256(file.read_bytes()).hexdigest()[:12]
        el.set(attr,urlunsplit(('','',url.path,'v='+digest,url.fragment)))
    path.write_text('<!DOCTYPE html>\n'+html.tostring(doc,encoding='unicode'))
