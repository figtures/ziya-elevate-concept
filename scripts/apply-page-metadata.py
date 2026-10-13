#!/usr/bin/env python3
"""Apply reviewed launch metadata to source heads; CMS remains the runtime authority.

Run after editing cms/metadata.json, then build-social-cards.py and
build-cms-catalog.py. This is deliberately not an automatic CMS overwrite.
"""
import json
import re
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
pages = json.loads((ROOT / 'cms/metadata.json').read_text())
config = json.loads((ROOT / 'cms/config.json').read_text())
origin = config['canonicalOrigin'].rstrip('/')
assert len(pages) == 63, 'Review route coverage before applying launch metadata'
for key in ('title', 'description'):
    assert len({value[key] for value in pages.values()}) == len(pages), key + ' duplicates'

def meta(head, key, value, property=False):
    attr = 'property' if property else 'name'
    pattern = r'<meta\b[^>]*\b' + attr + r'\s*=\s*[\"\x27]' + re.escape(key) + r'[\"\x27][^>]*>'
    tag = f'<meta {attr}="{key}" content="{escape(str(value), quote=True)}">'
    matches = list(re.finditer(pattern, head, re.I))
    if not matches:
        return head + '\n' + tag
    first = True
    def replace(match):
        nonlocal first
        if first:
            first = False
            return tag
        return ''
    return re.sub(pattern, replace, head, flags=re.I)

for route, record in pages.items():
    path = ROOT / 'website' / route.strip('/') / 'index.html'
    source = path.read_text()
    match = re.search(r'(<head\b[^>]*>)(.*?)(</head>)', source, re.S | re.I)
    assert match, route
    head = re.sub(r'<title\b[^>]*>.*?</title>', lambda m: '<title>' + escape(record['title']) + '</title>', match[2], flags=re.S | re.I)
    slug = route.strip('/').replace('/', '-') or 'home'
    image = origin + '/assets/og/' + slug + '.png'
    head = meta(head, 'description', record['description'])
    for key, value in {'title':record['title'], 'description':record['description'], 'url':origin + route,
                       'image':image, 'image:alt':record['imageAlt'], 'image:width':1200,
                       'image:height':630, 'image:type':'image/png'}.items():
        head = meta(head, 'og:' + key, value, property=True)
    for key, value in {'title':record['title'], 'description':record['description'],
                       'card':'summary_large_image', 'image':image, 'image:alt':record['imageAlt']}.items():
        head = meta(head, 'twitter:' + key, value)
    updated = source[:match.start(2)] + head + source[match.end(2):]
    assert updated.split('</head>', 1)[1] == source.split('</head>', 1)[1], 'Body changed: ' + route
    path.write_text(updated)
print(f'Updated {len(pages)} unique source heads; page bodies preserved.')
