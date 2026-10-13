Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080b8bc62d8fc29813eef as of 2026-10-04T10:20:25.415Z:
<page url="https://app.notion.com/p/3e51fd693ee080b8bc62d8fc29813eef">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-05 — On-Page, SERP & International"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## International on-page
SEO-02 hreflang URL yapısı ile birlikte:
<table header-row="true">
<tr>
<td>Öğe</td>
<td>Locale başına</td>
</tr>
<tr>
<td>html lang</td>
<td>tr, en-GB, vb.</td>
</tr>
<tr>
<td>title</td>
<td>Çevrilmiş / transcreated</td>
</tr>
<tr>
<td>meta description</td>
<td>Native kalite</td>
</tr>
<tr>
<td>H1/body</td>
<td>Locale uygun</td>
</tr>
<tr>
<td>hreflang link</td>
<td>Reciprocal (SEO-02)</td>
</tr>
<tr>
<td>og:locale</td>
<td>SEO-08</td>
</tr>
</table>
global footer; locale-specific telefon/adres varsa:
- Görünür sayfada doğru
- Organization schema contactPoint (SEO-06)
x-default: genelde global EN veya locale picker — SEO-02 kararı.
Test: hreflang + title/description crawl export; 3 locale × 5 URL spot.
---
## Sayfa düzeyi meta robots & alternates
- noindex,indexable inventory çelişkisi yasak (SEO-02/03)
- max-snippet, max-image-preview (bilinçli; varsayılan genelde OK)
- rel=prev/next veya view-all (pagination SEO-02)
- link rel=alternate hreflang + canonical self
---
## SEO-05 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Title policy</td>
<td>Yazılı + brand suffix</td>
</tr>
<tr>
<td>Duplicate title/desc</td>
<td>0 (indexable crawl)</td>
</tr>
<tr>
<td>H1</td>
<td>Tek; gizli yok</td>
</tr>
<tr>
<td>Locale meta</td>
<td>hreflang URL’lerde uyumlu</td>
</tr>
<tr>
<td>[contact@figtures.com](mailto:contact@figtures.com)</td>
<td>Footer/NAP tutarlı</td>
</tr>
<tr>
<td>Snippet bait</td>
<td>Review yok</td>
</tr>
<tr>
<td>CMS parity</td>
<td>Sample 10 URL PASS</td>
</tr>
</table>
Gate FAIL → SEO-06’ya geçme.
---
## Test & teyit
- [ ] Screaming Frog: duplicate titles/descriptions = 0 (indexable)
- [ ] Pixel-width title/meta sample (top 20 URL)
- [ ] CMS field = rendered HTML (10 URL)
- [ ] hreflang locale title farklılığı doğru
- [ ] SERP policy ihlali yok (manual QA)
---
## Anti-pattern (reddet)
- Site-wide identical title
- Meta description = keyword comma list
- Multiple H1 veya logo as H1 everywhere without page H1
- hreflang aynı title tüm dillerde İngilizce
- Title stuffing \| buy cheap X X X X
- Automated AI meta without human review (YMYL)
- Hidden text blocks for “SEO paragraphs”
---
## Handoff & referans
Önceki: [SEO-04 Rendering, SPA & Prerender](https://www.notion.so/3e51fd693ee08029afacfd9271e061c5)
Sonraki: [SEO-06 Structured Data Pipeline](https://www.notion.so/3e51fd693ee080f080d7fcb37d6a5893)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google title links: [https://developers.google.com/search/docs/appearance/title-link](https://developers.google.com/search/docs/appearance/title-link)<br>Google snippets: [https://developers.google.com/search/docs/appearance/snippet](https://developers.google.com/search/docs/appearance/snippet)<br>Google hreflang: [https://developers.google.com/search/docs/specialty/international/localized-versions](https://developers.google.com/search/docs/specialty/international/localized-versions)<br>Google spam policies: [https://developers.google.com/search/docs/essentials/spam-policies](https://developers.google.com/search/docs/essentials/spam-policies)
## Meta description
<table header-row="true">
<tr>
<td>Kural</td>
<td>Detay</td>
</tr>
<tr>
<td>Unique</td>
<td>Duplicate = 0 indexable</td>
</tr>
<tr>
<td>Uzunluk</td>
<td>\~150–160 char referans; pixel test</td>
</tr>
<tr>
<td>İçerik</td>
<td>Özet + fayda; keyword list değil</td>
</tr>
<tr>
<td>CTA</td>
<td>Uygun sayfalarda (demo, teklif)</td>
</tr>
<tr>
<td>Boş</td>
<td>Bilinçli boş bırakma nadir; Google otomatik snippet seçer</td>
</tr>
</table>
Boilerplate yasak: “Welcome to our website…” tüm sayfalarda.
CMS override test: rendered meta name=description content eşleşmesi.
---
## H1 ve heading hiyerarşisi
- **Bir H1** — sayfa konusu; title ile uyumlu ama birebir kopya değil.
- H2 → H3 mantıksal; seviye atlama (H1→H3) yok.
- Gizli H1 (opacity 0, off-screen) yasak.
- Ürün/karşılaştırma intent: tablo ve listeler erişilebilir HTML (SERP table opportunity — spam değil, gerçek veri).
- Image alt: açıklayıcı; keyword dump yok.
Accessibility = SEO: heading order screen reader ile aynı.
---
## SERP & snippet stratejisi (policy-safe)
<table header-row="true">
<tr>
<td>Intent</td>
<td>On-page format</td>
</tr>
<tr>
<td>Karşılaştırma</td>
<td>HTML table, pros/cons</td>
</tr>
<tr>
<td>How-to</td>
<td>Numaralı adımlar, kısa paragraflar</td>
</tr>
<tr>
<td>Definition</td>
<td>İlk paragraf net tanım</td>
</tr>
<tr>
<td>FAQ</td>
<td>Görünür S&C (FAQPage schema SEO-06 ile parity)</td>
</tr>
</table>
Yasak / riskli:
- Gizli içerikle snippet manipülasyonu
- Yanıltıcı fiyat/stok (YMYL)
- Review star HTML without real reviews
- Clickbait title/content mismatch
Google helpful content / spam policies — Figtures Legal YMYL review.
> On-page SEO, arama motoruna ve kullanıcıya aynı sayfada tutarlı sinyal verir: title, snippet (meta description), başlık hiyerarşisi, dil/locale ve SERP’te görünen içerik kalitesi. Google snippet’i otomatik rewrite edebilir; yine de unique, intent-aligned meta üretmek Staff Engineer standardıdır.
## Kapsam (bu sayfa)
SEO-05: Title & meta description politikası, H1–H6, SERP/snippet stratejisi (policy-safe), international on-page (hreflang eşleşmesi, localized meta), html lang, NAP/contact tutarlılığı. Rendering SEO-04; hreflang URL policy SEO-02; structured data SEO-06; og:title/description SEO-08 ile parity.
Ön koşul: SEO-04 PASS (meta initial HTML / SSR).
Şirket sabiti (global); locale telefon schema contactPoint (SEO-06).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- Title pixel-width \> karakter sayısı (SERPs \~600px desktop; mobil daha kısa). Truncate noktasında anlam kaybı test et.
- Her indexable URL unique title + unique meta description; duplicate = crawl waste + CTR kaybı.
- Keyword stuffing (title/meta/H1) spam sinyali; intent + okunabilirlik.
- Tek H1; görsel gizleme (clip/screen-reader-only primary keyword) yasak.
- hreflang URL’lerde localized title/description; çeviri kalitesi native review.
- Google snippet bait (gizli FAQ, misleading promise) policy ihlali riski.
- og:title / twitter:title genelde title ile uyumlu veya A/B test RFC (SEO-08); çelişki sosyal CTR düşürür.
- Meta description CTA: dürüst; guarantee iddiası YMYL’de Legal.
---
## Title tag politikası
Zorunlu kurallar:
<table header-row="true">
<tr>
<td>Kural</td>
<td>Detay</td>
</tr>
<tr>
<td>Unique</td>
<td>Indexable sette duplicate = 0</td>
</tr>
<tr>
<td>Intent</td>
<td>Primary query + sayfa görevi</td>
</tr>
<tr>
<td>Brand</td>
<td>Suffix veya prefix — tek policy (ör. Sayfa</td>
</tr>
<tr>
<td>Uzunluk</td>
<td>Hedef \~50–60 char referans; pixel test zorunlu</td>
</tr>
<tr>
<td>Separator</td>
<td>Pipe veya dash — tutarlı</td>
</tr>
<tr>
<td>CMS</td>
<td>UI alanı = rendered title (SEO-01 DoD)</td>
</tr>
<tr>
<td>Pagination</td>
<td>Sayfa 2+: “Page 2” veya benzeri ayırt edici</td>
</tr>
</table>
Şablon örnekleri:
- Homepage: Marka — Value proposition (kısa)
- Product: Ürün adı — Kategori \| Marka
- Blog: Başlık \| Blog \| Marka
Test:
- Screaming Frog / Sitebulb: Page Titles → duplicates
- SERP simulator veya manual pixel measure (bold chars farkı)
Google: title rewrite olabilir; aşırı uzun/boilerplate title rewrite oranı artar.
</content>
</page>
