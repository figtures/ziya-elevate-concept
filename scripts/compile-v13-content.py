"""Compile only supplied v13 templates, preserving existing CMS node identities.

Protocol: read {templates, baselineCatalog, baselineSeeds} JSON from stdin and
write {templates, catalog, seeds} JSON to stdout. This module never writes site
files or executes the original whole-site catalog compiler.
"""
from pathlib import Path
from urllib.parse import urlsplit
import hashlib
import json
import re
import sys

from lxml import html
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SKIP = {'script', 'style', 'svg', 'use', 'path', 'source'}
LABELS = {
    'h1': 'Ana başlık', 'h2': 'Bölüm başlığı', 'h3': 'Alt başlık',
    'p': 'Açıklama', 'span': 'Metin', 'a': 'Bağlantı metni',
    'li': 'Liste maddesi', 'td': 'Tablo hücresi', 'th': 'Sütun başlığı',
    'button': 'Buton metni', 'small': 'Kısa bilgi', 'figcaption': 'Görsel açıklaması',
    'label': 'Alan etiketi', 'strong': 'Vurgu', 'summary': 'Açılır başlık',
    'dt': 'Program bilgi başlığı', 'dd': 'Program bilgisi',
}
ATTRS = {
    'src': 'Dosya', 'data-src': 'Video dosyası',
    'data-mobile-src': 'Mobil video dosyası', 'poster': 'Video kapak görseli',
    'alt': 'Alternatif metin', 'href': 'Bağlantı adresi',
    'placeholder': 'Alan ipucu', 'data-talk': 'YouTube video kimliği',
    'data-video-id': 'Açılış video kimliği',
    'data-clip-start': 'İlk klip başlangıcı (sn)',
    'data-clip-end': 'İlk klip bitişi (sn)',
    'data-start-at': 'Video başlangıcı (sn)',
}
REPEAT = {
    'book-editorial-list': 'Kitaplar', 'talk-archive': 'Konuşma kayıtları',
    'editorial-rows': 'Maddeler', 'step-sequence': 'Adımlar',
    'topic-links': 'Çalışma alanları', 'program-catalog': 'Eğitim programları',
    'keynote-topics': 'Keynote konuları', 'post-list': 'Yazı bağlantıları',
    'faq': 'Sorular ve cevaplar', 'depth-table': 'Tablo satırları',
    'nav-links': 'Menü bağlantıları',
}


def compact(value, length=65):
    return ' '.join(value.split())[:length]


def local_social_image(value, config, social_images):
    parsed = urlsplit(value)
    site_origins = {
        urlsplit(config.get(key, '')).netloc
        for key in ['canonicalOrigin', 'siteOrigin']
    } - {''}
    if (parsed.path in social_images and not parsed.query and not parsed.fragment
            and (not parsed.netloc or (parsed.scheme == 'https' and parsed.netloc in site_origins))):
        return parsed.path
    return value


def assign_missing_ids(document, route):
    prefix = hashlib.sha1(route.encode()).hexdigest()[:8]
    elements = [element for element in document.iter() if isinstance(element.tag, str)]
    existing = [element.get('data-cms-node') for element in elements if element.get('data-cms-node')]
    if len(existing) != len(set(existing)):
        raise ValueError(f'{route}: input contains duplicate data-cms-node identities')
    used = set(existing)
    counter = 0
    for element in elements:
        if element.get('data-cms-node'):
            continue
        while f'{prefix}-v13-generated-{counter}' in used:
            counter += 1
        identity = f'{prefix}-v13-generated-{counter}'
        element.set('data-cms-node', identity)
        used.add(identity)
        counter += 1


def normalize_media(document):
    # lxml's HTML4 parser can nest img under the HTML5 void source element.
    for source in document.xpath('//picture/source'):
        for child in reversed(list(source)):
            source.addnext(child)
    for image in document.xpath('//img[@src]'):
        src = image.get('src', '')
        asset = ROOT / 'website' / src.lstrip('/')
        if src.startswith('/assets/') and asset.is_file() and (not image.get('width') or not image.get('height')):
            try:
                with Image.open(asset) as opened:
                    width, height = opened.size
                image.set('width', str(width))
                image.set('height', str(height))
            except (OSError, ValueError):
                pass


def compile_document(source, route, baseline_catalog, baseline_seed, config, social_images):
    document = html.document_fromstring(source)
    normalize_media(document)
    assign_missing_ids(document, route)
    scopes = document.xpath('//body/header|//body/footer' if route == '_global' else '//body/section')
    fields, sections, groups, values = [], [], [], {}
    baseline_fields = {field['id']: field for field in baseline_catalog.get('fields', [])}
    for section in scopes:
        section_id = section.get('data-cms-node')
        headings = section.xpath('.//h1|.//h2')
        title = ('Üst menü' if section.tag == 'header' else 'Alt bilgi' if section.tag == 'footer'
                 else compact(headings[0].text_content()) if headings else 'İçerik')
        section.set('data-cms-section', section_id)
        sections.append({'id': section_id, 'label': title, 'hero': bool(section.xpath('.//h1')), 'tag': section.tag})
        chosen = []
        for element in section.iter():
            if not isinstance(element.tag, str):
                continue
            classes = element.get('class', '').split()
            match = next((value for key, value in REPEAT.items() if key in classes), None)
            parent = element.getparent()
            if (element.tag == 'ul' and parent is not None
                    and set(parent.get('class', '').split()) & {'footer-group', 'footer-programs'}):
                match = 'Alt bilgi bağlantıları'
            if 'footer-social' in classes:
                match = 'Sosyal medya bağlantıları'
            if match and not any(ancestor in chosen for ancestor in element.iterancestors()):
                container = element
                if element.tag == 'table':
                    bodies = element.xpath('./tbody')
                    container = bodies[0] if bodies else element
                children = [child for child in container if isinstance(child.tag, str) and child.tag not in ('thead', 'script')]
                if children:
                    chosen.append(element)
                    groups.append({
                        'id': container.get('data-cms-node'), 'section': section_id, 'label': match,
                        'items': [{'id': child.get('data-cms-node'), 'label': compact(child.text_content(), 55)} for child in children],
                    })
        for element in section.iter():
            if (not isinstance(element.tag, str) or element.tag in SKIP
                    or any(ancestor.tag in SKIP for ancestor in element.iterancestors())):
                continue
            ancestry = [element, *element.iterancestors()]
            if any(ancestor.get('id') in ['quiz', 'result'] for ancestor in ancestry):
                continue
            identity = element.get('data-cms-node')
            labeled = next((ancestor for ancestor in ancestry if ancestor.tag in LABELS), element)
            label = 'Ana başlık' if any(ancestor.tag == 'h1' for ancestor in ancestry) else LABELS.get(labeled.tag, 'Metin')

            def field(target, value, field_label, kind='text', node=identity):
                field_id = node + ':' + target
                values[field_id] = value
                definition = {
                    **baseline_fields.get(field_id, {}),
                    'id': field_id, 'node': node, 'target': target,
                    'label': field_label, 'type': kind, 'section': section_id,
                }
                if target == 'text' and node == identity:
                    classes = set(element.get('class', '').split())
                    if (route.startswith('/makaleler/') and 'hero-note' in classes
                            and any(ancestor.tag == 'article' or 'reading-body' in ancestor.get('class', '').split() for ancestor in element.iterancestors())
                            and re.search(r'(?:Yayın|Son güncelleme)\s*:', value)):
                        definition.update(semantic='publication-dates', label='Yayın ve güncelleme bilgisi')
                    elif (route.startswith('/notlar/') and 'kicker' in classes
                            and any('page-hero' in ancestor.get('class', '').split() for ancestor in element.iterancestors())):
                        definition.update(semantic='note-publication-date', label='Seri ve yayın bilgisi')
                fields.append(definition)

            if element.text and element.text.strip() and element.get('aria-hidden') != 'true':
                field('text', element.text, label, 'long' if len(element.text) > 110 else 'text')
            for child in element:
                if child.tail and child.tail.strip() and isinstance(child.tag, str):
                    field('tail', child.tail, label, 'long' if len(child.tail) > 110 else 'text', child.get('data-cms-node'))
            for attribute, attribute_label in ATTRS.items():
                if element.get(attribute) is None:
                    continue
                if attribute == 'href' and element.tag != 'a':
                    continue
                if attribute == 'src' and element.tag not in ['img', 'video']:
                    continue
                if attribute in ['data-src', 'data-mobile-src'] and element.tag != 'video':
                    continue
                kind = ('image' if (attribute in ['src', 'poster'] and element.tag != 'video') or attribute == 'poster'
                        else 'video' if attribute in ['src', 'data-src', 'data-mobile-src']
                        else 'number' if attribute in ['data-clip-start', 'data-clip-end', 'data-start-at']
                        else 'url' if attribute == 'href' else 'text')
                field('@' + attribute, element.get(attribute), attribute_label, kind)
            if element.tag in ['img', 'video']:
                position = re.search(r'object-position\s*:\s*([^;]+)', element.get('style', ''))
                field('focal', position.group(1) if position else 'center center', 'Kadraj (ör. center 35%)')
    for group in groups:
        for item in group['items']:
            element = document.xpath('//*[@data-cms-node=$identity]', identity=item['id'])[0]
            descendants = {child.get('data-cms-node') for child in element.iter() if isinstance(child.tag, str)}
            item['fields'] = [field['id'] for field in fields if field['node'] in descendants and field['id'] != item['id'] + ':tail']
    meta = document.xpath('//meta[@name="description"]/@content')
    titles = document.xpath('//title/text()')
    og = document.xpath('//meta[@property="og:image"]/@content')
    og_alt = document.xpath('//meta[@property="og:image:alt"]/@content')
    kind = ('article' if route.startswith('/makaleler/') and route != '/makaleler/'
            else 'note' if route.startswith('/notlar/') else 'global' if route == '_global'
            else 'test' if route == '/testler/kafa-yapisi-testi/' else 'page')
    payload = {
        **baseline_seed,
        'id': route, 'route': '/_global/' if route == '_global' else route,
        'template': route, 'kind': kind, 'title': titles[0] if titles else 'Menü ve alt bilgi',
        'description': meta[0] if meta else '',
        'ogImage': local_social_image(og[0] if og else '', config, social_images),
        'values': values, 'sections': [],
    }
    payload.update({'ogImageAlt': og_alt[0][:420] if og_alt else '', 'ogImageAltFor': payload['ogImage']})
    for section in sections:
        payload['sections'].append({
            'id': section['id'], 'source': section['id'], 'hidden': False, 'values': {},
            'groups': [{
                'id': group['id'],
                'items': [{'id': item['id'], 'source': item['id'], 'values': {}} for item in group['items']],
            } for group in groups if group['section'] == section['id']],
        })
    definition = {
        **baseline_catalog, 'id': route, 'kind': kind, 'title': payload['title'],
        'fields': fields, 'sections': sections, 'groups': groups,
    }
    return '<!DOCTYPE html>\n' + html.tostring(document, encoding='unicode'), definition, payload


def main():
    data = json.load(sys.stdin)
    supplied_templates = data.get('templates', {})
    baseline_catalog = data.get('baselineCatalog', {})
    baseline_seeds = {payload['id']: payload for payload in data.get('baselineSeeds', [])}
    config = json.loads((ROOT / 'cms/config.json').read_text())
    social_images = json.loads((ROOT / 'cms/social-images.json').read_text())
    result = {'templates': {}, 'catalog': {}, 'seeds': []}
    for route, source in supplied_templates.items():
        template, definition, payload = compile_document(
            source, route, baseline_catalog.get(route, {}), baseline_seeds.get(route, {}), config, social_images,
        )
        result['templates'][route] = template
        result['catalog'][route] = definition
        result['seeds'].append(payload)
    json.dump(result, sys.stdout, ensure_ascii=False, separators=(',', ':'))
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
