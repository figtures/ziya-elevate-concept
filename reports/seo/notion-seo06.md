Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080f080d7fcb37d6a5893 as of 2026-10-04T10:20:30.883Z:
<page url="https://app.notion.com/p/3e51fd693ee080f080d7fcb37d6a5893">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-06 — Structured Data Pipeline"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## DOM parity & rendering
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Fiyat schema</td>
<td>Kullanıcı görür fiyat</td>
</tr>
<tr>
<td>FAQ answer</td>
<td>DOM’da metin</td>
</tr>
<tr>
<td>Rating</td>
<td>Görünür review widget + policy</td>
</tr>
<tr>
<td>Product name</td>
<td>H1 veya product title</td>
</tr>
<tr>
<td>Breadcrumb</td>
<td>Nav link metinleri</td>
</tr>
</table>
View crawled page (GSC) + Rich Results Test HTML karşılaştır.
---
## SEO-06 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Page map</td>
<td>Tüm template’ler atanmış</td>
</tr>
<tr>
<td>Rich Results</td>
<td>Scope URL PASS</td>
</tr>
<tr>
<td>FAQPage</td>
<td>Görünür parity</td>
</tr>
<tr>
<td>aggregateRating</td>
<td>Yok veya policy+Legal</td>
</tr>
<tr>
<td>CHANGELOG</td>
<td>Son release kayıtlı</td>
</tr>
<tr>
<td>RFC</td>
<td>Schema type ekleme onaylı</td>
</tr>
</table>
Gate FAIL → SEO-07’ye geçme.
---
## Test & teyit
- [ ] Rich Results PASS (kapsam URL’ler)
- [ ] FAQPage soruları = görünür metin
- [ ] aggregateRating yok (review programı yoksa)
- [ ] BreadcrumbList URL audit (10 URL)
- [ ] PR CI schema validate green
---
## Anti-pattern (reddet)
- Sahte Review / 5 yıldız schema
- FAQ schema sayfada FAQ yok
- Keyword stuffing in description field
- JSON-LD only in console.log debug
- Conflicting Product types same page
- Markup price 0 placeholder
- Copied competitor schema blocks
- Client hydrate sonrası tek schema — crawler miss
---
## Handoff & referans
Önceki: [SEO-05 On-Page, SERP & International](https://www.notion.so/3e51fd693ee080b8bc62d8fc29813eef)
Sonraki: [SEO-07 Core Web Vitals & Performance Budget](https://www.notion.so/3e51fd693ee0801ba516d2d9ef2fb99e)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google structured data intro: [https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)<br>Rich Results Test: [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results)<br>Organization: [https://developers.google.com/search/docs/appearance/structured-data/organization](https://developers.google.com/search/docs/appearance/structured-data/organization)<br>FAQ: [https://developers.google.com/search/docs/appearance/structured-data/faqpage](https://developers.google.com/search/docs/appearance/structured-data/faqpage)<br>Breadcrumb: [https://developers.google.com/search/docs/appearance/structured-data/breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb)<br>Product: [https://developers.google.com/search/docs/appearance/structured-data/product](https://developers.google.com/search/docs/appearance/structured-data/product)
## Product / Service / Offer
- name, description DOM ile uyumlu
- image absolute HTTPS
- offers: price, priceCurrency, availability — stok/fiyat gerçek zamanlı değilse schema’da iddia etme
- sku/gtin varsa doğru
YMYL (finans, sağlık): Legal review schema metni.
---
## Article / BlogPosting
- headline (H1 ile uyumlu)
- author Person veya Organization
- datePublished, dateModified (gerçek)
- image min boyut guideline
- publisher Organization + logo
---
## FAQPage & BreadcrumbList
FAQPage:
- Her Question name = görünür soru metni
- acceptedAnswer text = görünür cevap
- Sayfada accordion/visible; CSS hidden block yasak
BreadcrumbList:
- position 1..n
- item @id veya url = canonical
- UI breadcrumb ile birebir (SEO-02)
---
## JSON-LD pipeline & CI
1. **Source of truth** — CMS field + code generator (typed)
2. **PR preview URL** — Rich Results Test API veya manual
3. **Required fields** — invalid = merge block
4. **Regression suite** — money page URL listesi (SEO-04)
5. **CHANGELOG** — schema lib version, breaking @type change
6. **Lint** — schema-dts veya custom validator; duplicate @id
Local test:<br>curl -sL URL \| grep -o 'application/ld+json' -A999 \| head
Google Search Console Enhancements → doğrulama hataları haftalık (SEO-09).
> Yapılandırılmış veri (JSON-LD tercih), Google’a sayfa anlamını makine-okur formda verir; Rich Results uygunluğu ve entity tutarlılığı sağlar. Schema, DOM’da görünmeyen iddia taşıyamaz — manual action riski.
## Kapsam (bu sayfa)
SEO-06: Page-class → schema map, JSON-LD üretim pipeline’ı, DOM parity, CI Rich Results Test, schema CHANGELOG, merge gate. On-page metin SEO-05; render SEO-04; breadcrumb UI SEO-02; sosyal graph SEO-08 (Open Graph ayrı katman).
Ön koşul: SEO-05 PASS.
Şirket sabiti:  sameAs sosyal profiller (SEO-08 ile uyumlu).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- JSON-LD tek tercih format (Google); microdata/RDFa legacy — karıştırma.
- Recommended property yalnızca doğruysa; yanlış Offer/Review → spam.
- FAQPage: yalnızca sayfada görünür S&C; gizli FAQ yasak.
- aggregateRating / Review yalnız gerçek review programı + Legal (YMYL).
- BreadcrumbList URL = inventory canonical (SEO-02).
- SSR veya server-injected JSON-LD; client-only late inject Rich Results timing riski (SEO-04).
- Schema değişikliği RFC (SEO-01); version CHANGELOG.
- Rich Results Test PASS merge blocker (scope URL’ler).
- Meta/LinkedIn/X ranking schema kullanmaz; Organization/sameAs entity tutarlılığı marka aramasına yardım eder.
---
## Page class → schema map (minimum)
<table header-row="true">
<tr>
<td>Page class</td>
<td>JSON-LD @type</td>
<td>Not</td>
</tr>
<tr>
<td>Home</td>
<td>Organization, WebSite</td>
<td>SearchAction yalnız gerçek site search</td>
</tr>
<tr>
<td>About/Contact</td>
<td>Organization</td>
<td>contactPoint, logo</td>
</tr>
<tr>
<td>Product</td>
<td>Product veya Service</td>
<td>Offer fiyat/stok doğruysa</td>
</tr>
<tr>
<td>Pricing</td>
<td>Service/Offer</td>
<td>YMYL dikkat</td>
</tr>
<tr>
<td>Blog post</td>
<td>BlogPosting / Article</td>
<td>author, datePublished, image</td>
</tr>
<tr>
<td>Docs</td>
<td>TechArticle</td>
<td></td>
</tr>
<tr>
<td>FAQ (görünür)</td>
<td>FAQPage</td>
<td>MainEntity Question/Answer</td>
</tr>
<tr>
<td>Breadcrumb UI</td>
<td>BreadcrumbList</td>
<td>itemListElement sıra</td>
</tr>
<tr>
<td>Job (varsa)</td>
<td>JobPosting</td>
<td>Indexing API uygunluğu ayrı</td>
</tr>
</table>
Bir sayfada @graph ile birden fazla node; çakışan duplicate Organization birleştir.
---
## Organization & WebSite (global)
Organization zorunlu alanlar (Google guidelines):
- name, url, logo (ImageObject URL 112+ min)
- email:
- sameAs: LinkedIn, X, Meta page URL’leri (doğrulanmış)
WebSite:
- url canonical homepage
- potentialAction SearchAction → /search?q=\{search_term_string\} yalnızca çalışan arama
Locale: ayrı Organization yok; contactPoint locale telefon (SEO-05).
</content>
</page>
