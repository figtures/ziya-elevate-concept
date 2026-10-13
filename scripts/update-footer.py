"""Apply the shared footer without rewriting page content or scripts."""
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
WEBSITE = ROOT / 'website'
TEMPLATE = (ROOT / 'scripts/footer.html').read_text().strip()
HEADER = re.compile(r'<header\b[^>]*>', re.I)
FOOTER = re.compile(r'<footer\b[^>]*>.*?</footer\s*>', re.I | re.S)
FOOTER_CSS = re.compile(r'''\bhref\s*=\s*(["'])/assets/site-footer\.css(?:\?[^"']*)?\1''', re.I)
CSS_LINK = '<link rel="stylesheet" href="/assets/site-footer.css">'


def apply_footer(original):
    """Keep redirects untouched and preserve all non-footer markup verbatim."""
    if not HEADER.search(original):
        return None
    if not FOOTER.search(original):
        raise ValueError('A content page is missing its shared footer.')
    if not re.search(r'</head\s*>', original, re.I):
        raise ValueError('A content page is missing its head closing tag.')
    updated = FOOTER.sub(lambda _: TEMPLATE, original, count=1)
    updated = re.sub(
        r'<link\b[^>]*>\s*',
        lambda match: '' if FOOTER_CSS.search(match.group()) else match.group(),
        updated,
        flags=re.I,
    )
    return re.sub(r'</head\s*>', lambda _: CSS_LINK + '\n</head>', updated, count=1, flags=re.I)


if __name__ == '__main__':
    count = 0
    for page in sorted(WEBSITE.rglob('*.html')):
        original = page.read_text()
        updated = apply_footer(original)
        if updated is None:
            continue
        if updated != original:
            page.write_text(updated)
        count += 1
    print(f'Updated the shared footer on {count} content pages; headerless redirects skipped.')
