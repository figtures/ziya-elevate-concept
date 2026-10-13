"""Apply the shared Turkish navigation to the existing static pages."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
template = (root / 'scripts/header.html').read_text().strip()
count = 0
for page in (root / 'website').rglob('*.html'):
    original = page.read_text()
    if not re.search(r'<header class="site[^\"]*">', original):
        continue
    route = '/' + str(page.parent.relative_to(root / 'website')).strip('./') + '/'
    header = template
    for path in ['basari', 'kafa-yapisi', 'satis', 'liderlik', 'konusmaci', 'egitimler', 'mentorluk', 'kitaplar', 'makaleler', 'ziya-sakir-yilmaz']:
        if route.startswith('/' + path + '/'):
            current = ' aria-current="page"' if route == '/' + path + '/' else ' aria-current="location"'
            header = header.replace(f'<a href="/{path}/">', f'<a href="/{path}/" class="active"{current}>')
    page.write_text(re.sub(r'<header class="site[^\"]*">.*?</header>', lambda _: header, original, count=1, flags=re.S))
    count += 1
print(f'Updated the shared header on {count} pages.')
