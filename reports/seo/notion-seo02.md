Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080319f87eb3da92a162f as of 2026-10-04T10:20:00.415Z:
<page url="https://app.notion.com/p/3e51fd693ee080319f87eb3da92a162f">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-02 — Information Architecture & URL Policy"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## SEO-02 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>URL policy doc</td>
<td>Yazılı + ekip onayı</td>
</tr>
<tr>
<td>Inventory</td>
<td>Tüm indexable URL’ler listede</td>
</tr>
<tr>
<td>Duplicate host/path</td>
<td>www/slash/http audit temiz</td>
</tr>
<tr>
<td>hreflang</td>
<td>Reciprocal + x-default (varsa)</td>
</tr>
<tr>
<td>Facet policy</td>
<td>Uygulandı; sitemap temiz</td>
</tr>
<tr>
<td>Cannibalization map</td>
<td>Top 50 query owner atanmış</td>
</tr>
<tr>
<td>404/410</td>
<td>Dokümante</td>
</tr>
<tr>
<td>Breadcrumb</td>
<td>UI hiyerarşi tanımlı</td>
</tr>
<tr>
<td>RFC</td>
<td>URL şablon değişikliği kapalı</td>
</tr>
</table>
Gate FAIL → SEO-03’e geçme.
---
## Test & teyit komutları
- [ ] Inventory’de her indexable URL 200 veya bilinçli 301
- [ ] Duplicate path (slash/www/http) yok
- [ ] Breadcrumb UI = gelecek BreadcrumbList (SEO-06)
- [ ] Click depth to conversion ≤ 3
- [ ] rastgele 20 URL canonical self veya documented target
- [ ] Facet URL örneği noindex/canonical doğru
- [ ] og:url (SEO-08) = inventory canonical (spot 5 URL)
---
## Anti-pattern (reddet)
- Sınırsız facet indexleme
- Session ID’li indexable URL
- hreflang tek yönlü veya aynı URL’ye farklı lang
- 200 soft 404
- `example.com/page` ve `example.com/page/` ikisi de 200
- Tag cloud binlerce thin URL
- CMS “auto publish” inventory dışı
- Cross-locale duplicate without hreflang
- Canonical hedefi noindex veya redirect loop
---
## Handoff & referans
Önceki: [SEO-01 Program, RACI & RFC Gate](https://www.notion.so/3e51fd693ee080fe8173d913bfebee42)
Sonraki: [SEO-03 Crawl, Index, robots.txt & Sitemap](https://www.notion.so/3e51fd693ee080798f52ce38f6716e92)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google — URL yapısı: [https://developers.google.com/search/docs/crawling-indexing/url-structure](https://developers.google.com/search/docs/crawling-indexing/url-structure)<br>Google — Canonical: [https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)<br>Google — hreflang: [https://developers.google.com/search/docs/specialty/international/localized-versions](https://developers.google.com/search/docs/specialty/international/localized-versions)<br>Google — Pagination: [https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)<br>Meta — og\:url\: [https://developers.facebook.com/docs/sharing/webmasters/](https://developers.facebook.com/docs/sharing/webmasters/)<br>X Cards — URL attribution: [https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup)
Figtures internal · [contact@figtures.com](mailto:contact@figtures.com)
## hreflang (multi-market)
Uygula yalnızca gerçek locale alternates varsa; sahte hreflang spam sayılır.
Yapı seçenekleri:
<table header-row="true">
<tr>
<td>Model</td>
<td>Örnek</td>
<td>Not</td>
</tr>
<tr>
<td>Subfolder</td>
<td>`/en/`, `/tr/`</td>
<td>Figtures default tercih</td>
</tr>
<tr>
<td>Subdomain</td>
<td>`en.example.com`</td>
<td>GSC ayrı property</td>
</tr>
<tr>
<td>ccTLD</td>
<td>`example.co.uk`</td>
<td>Legal/NAP ayrı</td>
</tr>
</table>
Zorunlu:
- Her locale **farklı URL** (içerik çevrilmiş veya bilinçli eşdeğer)
- `link rel="alternate" hreflang="xx-YY"` + **reciprocal** (A→B ise B→A)
- `x-default` — genelde global landing veya locale picker
- Canonical self per locale; cross-locale canonical yasak (hreflang cluster bozar)
Doğrulama:
- Screaming Frog hreflang report; hata = 0
- GSC International targeting (legacy) / locale report
- Manuel: 3 locale × 5 URL spot check
hreflang + og\:locale\:
- HTML `lang` attribute
- og:locale / og\:locale\:alternate (SEO-08)
- LinkedIn/X paylaşım locale-specific URL
---
## Parametre & faceted
<table header-row="true">
<tr>
<td>Pattern</td>
<td>Policy</td>
</tr>
<tr>
<td>`?sort=`, `?filter=`</td>
<td>canonical → path without params</td>
</tr>
<tr>
<td>`?page=2`</td>
<td>rel next/prev **veya** view-all canonical (inventory’de not)</td>
</tr>
<tr>
<td>`?utm_*`</td>
<td>ignore for canonical; analytics only</td>
</tr>
<tr>
<td>Session ID `?sid=`</td>
<td>strip; noindex if unavoidable</td>
</tr>
<tr>
<td>Facet kombinasyonları</td>
<td>noindex,follow veya canonical hub; **sitemap dışı**</td>
</tr>
<tr>
<td>Infinite calendar `/events/2024/01/...`</td>
<td>tek strateji: noindex past months veya hub canonical</td>
</tr>
<tr>
<td>Search `/search?q=`</td>
<td>noindex</td>
</tr>
<tr>
<td>API JSON `/api/`</td>
<td>Disallow robots (SEO-03); URL inventory dışı</td>
</tr>
</table>
Crawl trap önleme:
- Facet link sayısı cap; robots meta on low-value combos
- Internal search sonuçları indexlenmez
- “Next” pagination sonsuz döngü yok
---
## Cannibalization & query ownership
Spreadsheet: **query (or topic) → single owner URL**
<table header-row="true">
<tr>
<td>Durum</td>
<td>Aksiyon</td>
</tr>
<tr>
<td>İki URL aynı SERP intent</td>
<td>merge, 301, veya differentiate intent</td>
</tr>
<tr>
<td>Blog vs product aynı keyword</td>
<td>strateji kararı; canonical yalnızca duplicate için</td>
</tr>
<tr>
<td>Tag archive vs category</td>
<td>noindex tags veya canonical category</td>
</tr>
</table>
GSC Performance: filtre aynı query çok URL → owner ata; diğerlerini optimize/merge.
---
## 404, 410, soft 404
<table header-row="true">
<tr>
<td>Kod</td>
<td>Kullanım</td>
</tr>
<tr>
<td>404</td>
<td>Geçici bilinmeyen; custom sayfa; no soft-404 (200 boş)</td>
</tr>
<tr>
<td>410</td>
<td>Kalıcı kaldırma; sitemap’ten düş; GSC inspect</td>
</tr>
<tr>
<td>301</td>
<td>Taşınan içerik (SEO-10 registry)</td>
</tr>
</table>
Indexli URL 404 = incident RFC; 410 öncesi redirect alternatifleri değerlendir.
Policy doc: kim 404/410 açar; redirect registry güncelleme zorunlu.
## URL inventory (indexable envanter)
Her proje tek kaynak spreadsheet / Notion DB:
<table header-row="true">
<tr>
<td>Kolon</td>
<td>Açıklama</td>
</tr>
<tr>
<td>url</td>
<td>Tam canonical URL</td>
</tr>
<tr>
<td>intent</td>
<td>Primary keyword / user intent</td>
</tr>
<tr>
<td>owner</td>
<td>Content veya PM</td>
</tr>
<tr>
<td>index</td>
<td>index / noindex</td>
</tr>
<tr>
<td>canonical</td>
<td>self veya target URL</td>
</tr>
<tr>
<td>hreflang group</td>
<td>locale set id</td>
</tr>
<tr>
<td>template</td>
<td>CMS şablon adı</td>
</tr>
<tr>
<td>last_review</td>
<td>Tarih</td>
</tr>
</table>
Kurallar:
- Sitemap yalnızca inventory’de index=index satırları (SEO-03).
- Yeni route merge öncesi inventory diff (CI veya release checklist).
- Staging/preview URL’leri inventory’de **ayrı tab** — asla prod sitemap.
Test (örnek):
```plain text
curl -sI "https://{domain}/path" | egrep -i 'HTTP|location'
curl -sL "https://{domain}/path" | grep -i 'rel=.canonical'
```
---
## Canonical, duplicate & consolidation
<table header-row="true">
<tr>
<td>Senaryo</td>
<td>Policy</td>
</tr>
<tr>
<td>Aynı içerik iki path</td>
<td>301 veya canonical → owner</td>
</tr>
<tr>
<td>Parametre kopyası</td>
<td>canonical base</td>
</tr>
<tr>
<td>Print view `/print`</td>
<td>noindex + canonical</td>
</tr>
<tr>
<td>AMP (kullanılıyorsa)</td>
<td>canonical desktop</td>
</tr>
<tr>
<td>Pagination</td>
<td>view-all canonical **veya** rel=next/prev + self canonical her sayfa (tek strateji seç)</td>
</tr>
<tr>
<td>Cross-domain duplicate</td>
<td>canonical veya 301; syndication agreement</td>
</tr>
</table>
WWW / apex audit:
```plain text
curl -sI <http://example.com/> | head -5
curl -sI <https://www.example.com/> | head -5
```
Beklenti: tek 200 canonical; diğerleri 301 zincirsiz.
Slash audit: `/path` vs `/path/` — biri 301.
---
## Silo & hub-spoke
- **Pillar hub** `/{topic}/` — hedef intent, 1500+ kelime veya ürün grid.
- **Spokes** blog, docs, FAQ — hub’a ≥1 contextual link; hub’dan spoke’lara nav.
- Orphan sayfa yasak (internal inlink 0).
- **Click depth** conversion URL’e crawl BFS ≤3 (Screaming Frog / Sitebulb custom extraction).
- Footer/nav: indexable sayfa sayısını şişirme; faceted link nofollow veya JS-only tercih.
Breadcrumb UI:
- Home → Category → Page (tek H1 ile uyumlu)
- Mobil hamburger aynı hiyerarşi
- SEO-06: BreadcrumbList item URL = inventory canonical
Programatik SEO (binlerce URL):
- Quality threshold; thin doorways yasak
- Template uniqueness (title/H1/body varyasyon)
- RFC + inventory batch (SEO-01)
> Information Architecture (IA) ve URL Policy, arama motorlarının siteyi nasıl keşfedeceğini, hangi URL’lerin tek “hak sahibi” (canonical owner) olduğunu ve kullanıcı ile crawler’ın conversion path’ine nasıl ulaşacağını belirler. Kötü IA = duplicate index, crawl waste, cannibalization, yanlış hreflang cluster ve sosyal paylaşımda og:url / canonical uyumsuzluğu.
## Kapsam (bu sayfa)
SEO-02: URL şablonları, indexable envanter, canonical/www/slash/http politikası, hub-spoke silo, hreflang, parametre/facet/pagination, cannibalization haritası, 404/410. Crawl/robots/sitemap uygulaması SEO-03; on-page meta SEO-05; BreadcrumbList JSON-LD SEO-06; og:url tutarlılığı SEO-08.
Ön koşul: SEO-01 PASS (RACI + RFC — URL şablonu değişikliği RFC zorunlu).
Şirket sabiti: [contact@figtures.com](mailto:contact@figtures.com) (footer/NAP — locale telefon ayrı contactPoint olabilir).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- Tek arama intent → tek indexable URL; alternatifler canonical, noindex veya 301 ile netleştirilir (Google: duplicate content consolidation).
- URL yapısı “API yüzeyi” gibidir: geri almak pahalı — yeni route önce inventory + redirect planı (SEO-10).
- hreflang reciprocal değilse tüm cluster riski; x-default bilinçli seçilir (global homepage vs locale picker).
- Faceted/filter URL’ler “sınırsız uzay” üretir — varsayılan: canonical to clean URL veya noindex; sitemap’e girmemeli (SEO-03).
- Breadcrumb UI, HTML nav ve BreadcrumbList schema aynı hiyerarşiyi yansıtır (DOM parity SEO-06).
- og:url paylaşılan sayfanın canonical indexable URL’si olmalı (Meta/X/LinkedIn preview tutarlılığı SEO-08).
- HTTP ve HTTPS, www ve apex, slash ve slashless — tek tercih + 301; “200 duplicate” yasak.
---
## URL standardı (global)
Zorunlu kurallar (projeye yazılı policy doc):
<table header-row="true">
<tr>
<td>Kural</td>
<td>Uygulama</td>
</tr>
<tr>
<td>Case</td>
<td>Lowercase path; 301 uppercase → lowercase</td>
</tr>
<tr>
<td>Ayırıcı</td>
<td>Hyphen (-); underscore yasak (istisna: legacy RFC)</td>
</tr>
<tr>
<td>Slug</td>
<td>ASCII veya tek transliteration tablosu (TR karakterler)</td>
</tr>
<tr>
<td>Uzunluk</td>
<td>Pratik max \~75 karakter slug; anlamlı segmentler</td>
</tr>
<tr>
<td>Derinlik</td>
<td>≤4–5 path segment (conversion sayfaları daha sığ)</td>
</tr>
<tr>
<td>Trailing slash</td>
<td>Tek politika: slash **veya** slashless — CDN/nginx enforce</td>
</tr>
<tr>
<td>www</td>
<td>Tek canonical host; diğer yön 301</td>
</tr>
<tr>
<td>http</td>
<td>301 → https (HSTS production)</td>
</tr>
<tr>
<td>Uzantı</td>
<td>.html yok (istisna RFC); clean URLs</td>
</tr>
<tr>
<td>Underscore / ID</td>
<td>/product/12345 yerine slug tercih; ID yalnızca API</td>
</tr>
</table>
Örnek şablonlar:
- `/blog/{slug}/`
- `/{locale}/products/{category}/{slug}/`
- `/docs/{version}/{path}/` — version indexable mı? (genelde hayır → noindex veya tek “latest”)
Anti-pattern: tarih bazlı `/blog/2024/03/post` + `/blog/post` duplicate; query-only içerik `?id=`.
</content>
</page>
