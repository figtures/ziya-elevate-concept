Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee08029afacfd9271e061c5 as of 2026-10-04T10:20:21.699Z:
<page url="https://app.notion.com/p/3e51fd693ee08029afacfd9271e061c5">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-04 — Rendering, SPA & Prerender"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## Prerender & legacy SPA köprüleri
Seçenekler (RFC zorunlu):
<table header-row="true">
<tr>
<td>Yaklaşım</td>
<td>Artı</td>
<td>Eksi</td>
</tr>
<tr>
<td>Build-time prerender (Vite/NGINX static)</td>
<td>Hızlı</td>
<td>Dinamik path sınırı</td>
</tr>
<tr>
<td>On-demand prerender servisi</td>
<td>Eski SPA</td>
<td>Maliyet, cache invalidation</td>
</tr>
<tr>
<td>Dynamic rendering (bot UA)</td>
<td>Hızlı fix</td>
<td>Cloaking riski, bakım</td>
</tr>
</table>
Dynamic rendering yalnızca geçici; hedef SSR/SSG migration. Googlebot ve user HTML anlamlı fark ≤ tolerans (yapısal parity).
Cache: prerender cache purge deploy ile; stale title incident.
---
## Performans × render (SEO-07 bağlantısı)
- SSR TTFB budget; edge SSR/cache
- JS bundle: code split; money page critical CSS inline düşün
- Third-party script render block → LCP/INP (SEO-07 merge blocker)
- Hydration mismatch (React #418) → bozuk DOM, crawl farkı
---
## SEO-04 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Money page list</td>
<td>Yazılı + rendering mode</td>
</tr>
<tr>
<td>CSR-only</td>
<td>Money URL’de yok</td>
</tr>
<tr>
<td>curl/source</td>
<td>H1 + title initial HTML</td>
</tr>
<tr>
<td>GSC crawled page</td>
<td>Money sample eşleşiyor</td>
</tr>
<tr>
<td>CSS/JS robots</td>
<td>Allow</td>
</tr>
<tr>
<td>Route E2E meta</td>
<td>PASS</td>
</tr>
<tr>
<td>Inspection archive</td>
<td>Release klasörü</td>
</tr>
</table>
Gate FAIL → SEO-05’e geçme.
---
## Test & teyit
- [ ] View crawled page: H1 + ana kopya initial HTML’de
- [ ] Title flash yok (filmstrip veya E2E)
- [ ] Inspection screenshot arşivi
- [ ] Social bot HTML: og tags curl ile görünür (5 URL)
- [ ] Deep link hard refresh meta doğru
---
## Anti-pattern (reddet)
- “Google JS render ediyor” bahanesiyle CSR homepage
- Empty root div + client fetch all content
- Meta yalnızca useEffect içinde
- robots Disallow /\*.js
- Cloaking (farklı bot/user içerik)
- Hash URL index stratejisi
- Prerender listesi güncellenmiyor (yeni landing CSR)
---
## Handoff & referans
Önceki: [SEO-03 Crawl, Index, robots & Sitemap](https://www.notion.so/3e51fd693ee080798f52ce38f6716e92)
Sonraki: [SEO-05 On-Page, SERP & International](https://www.notion.so/3e51fd693ee080b8bc62d8fc29813eef)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google JS SEO: [https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)<br>Dynamic rendering: [https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering)<br>URL Inspection: [https://support.google.com/webmasters/answer/9012289](https://support.google.com/webmasters/answer/9012289)<br>Meta web crawlers: [https://developers.facebook.com/docs/sharing/webmasters/crawler](https://developers.facebook.com/docs/sharing/webmasters/crawler)<br>LinkedIn crawlers: [https://www.linkedin.com/help/linkedin/answer/a133545](https://www.linkedin.com/help/linkedin/answer/a133545)
<empty-block/>
## Initial HTML gereksinimleri (crawler + sosyal)
Zorunlu (money page):
<table header-row="true">
<tr>
<td>Öğe</td>
<td>Kural</td>
</tr>
<tr>
<td>title</td>
<td>Tek, intent doğru; shell’de final veya SSR</td>
</tr>
<tr>
<td>meta description</td>
<td>Unique (SEO-05)</td>
</tr>
<tr>
<td>link rel=canonical</td>
<td>Self veya policy (SEO-02)</td>
</tr>
<tr>
<td>H1</td>
<td>Tek, görünür; CSS hide yasak</td>
</tr>
<tr>
<td>Ana copy</td>
<td>≥ anlamlı paragraf veya ürün özeti HTML’de</td>
</tr>
<tr>
<td>nav links</td>
<td>Crawl path; JS-only menu yetersiz</td>
</tr>
<tr>
<td>hreflang</td>
<td>HTML head (varsa)</td>
</tr>
<tr>
<td>og:title, og:url, og:image</td>
<td>Server HTML (SEO-08)</td>
</tr>
<tr>
<td>JSON-LD</td>
<td>Tercihen SSR; CSR inject gecikmesi Rich Results riski</td>
</tr>
</table>
Test (dev tools kapalı — curl veya View Source):<br>curl -sL https://\{domain\}/path \| head -120
Beklenti: H1 metni ve title curl çıktısında; “Loading…” tek başına yasak.
---
## Google JavaScript SEO doğrulama
1. Search Console → URL Inspection → **Test live URL** / **View crawled page**
2. Crawled HTML vs browser DOM diff (H1, main text, internal links)
3. Render queue: yeni URL’ler günler sürebilir — launch’ta SSR tercih
4. Soft 404: 200 + boş shell → SEO-02 soft 404 policy
Arşiv: Her release’te money page’lerden Inspection screenshot (SEO-01 validation plan).
Kaynak: Google JavaScript SEO basics, dynamic rendering guidelines.
---
## Hydration & SPA route değişimi
<table header-row="true">
<tr>
<td>Risk</td>
<td>Önlem</td>
</tr>
<tr>
<td>Title flash</td>
<td>SSR title; React Helmet/ next/head sırası</td>
</tr>
<tr>
<td>Wrong default meta</td>
<td>Root layout fallback generic değil</td>
</tr>
<tr>
<td>Client-only canonical</td>
<td>SSR canonical + client sync</td>
</tr>
<tr>
<td>Hash routing (#/)</td>
<td>Indexable değil; path routing kullan</td>
</tr>
<tr>
<td>Lazy route chunk meta gecikmesi</td>
<td>Route-level SSR data fetch</td>
</tr>
</table>
E2E (Playwright/Cypress):
- / → /pricing navigation: assert document.title, meta description, canonical href
- Hard refresh deep link /pricing: aynı assert
Framework notları:
- Next.js App Router: metadata API export; client component’te meta yasak (indexable)
- React Router: data routers + SSR entry
- Vue: SSR + useHead
> Google JavaScript’i işler (Web Rendering Service) ancak gecikmeli ve kaynak sınırlıdır. Meta, X ve LinkedIn paylaşım botları çoğu senaryoda tam SPA hydrate beklemez — money page’lerde kritik SEO ve sosyal meta **ilk HTML yanıtında** olmalıdır.
## Kapsam (bu sayfa)
SEO-04: Rendering stratejisi (SSR/SSG/ISR/prerender), CSR-only yasağı money URL’lerde, initial HTML gereksinimleri, hydration SEO, GSC “View crawled page”, route/meta E2E. Crawl policy SEO-03; on-page copy SEO-05; JSON-LD DOM parity SEO-06; og:tags derinliği SEO-08.
Ön koşul: SEO-03 PASS (robots CSS/JS block yok).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- **CSR-only money page = teknik borç + SERP riski.** Google render edebilir; garanti değil, gecikmeli, hata payı yüksek.
- Initial HTML: title, meta description, canonical, H1, ana metin özü, kritik internal linkler — JS olmadan anlamlı.
- Title flash (default → gerçek title) = crawl ve kullanıcı güven kaybı; SSR veya shell’de doğru title.
- Soft navigation (SPA route change): document.title + meta + canonical güncellenmeli (E2E zorunlu).
- robots.txt CSS/JS Disallow → render çöker (SEO-03 cross-check).
- LinkedIn/Facebook/X botları: og:title, og:image, og:url statik HTML veya server-injected; lazy JS-only meta = boş preview.
- Infinite scroll “load more” içerik: Google scroll etmez; pagination veya view-all SSR link.
- Dynamic rendering (bot’a prerender, user’a CSR) son çare; tutarlılık ve cloaking algısı riski — Google guideline oku, RFC (SEO-01).
---
## Rendering modelleri (karar rehberi)
<table header-row="true">
<tr>
<td>Model</td>
<td>SEO uygunluk</td>
<td>Tipik kullanım</td>
</tr>
<tr>
<td>SSG</td>
<td>Mükemmel</td>
<td>Marketing, blog, docs</td>
</tr>
<tr>
<td>SSR</td>
<td>Mükemmel</td>
<td>Kişiselleştirilmiş ama indexable sayfalar</td>
</tr>
<tr>
<td>ISR/On-demand revalidate</td>
<td>İyi</td>
<td>Büyük katalog, kontrollü stale</td>
</tr>
<tr>
<td>CSR-only</td>
<td>Money page’de yasak</td>
<td>Authenticated app içi</td>
</tr>
<tr>
<td>Prerender (build/crawl)</td>
<td>İyi (liste sınırlı)</td>
<td>Legacy SPA geçiş</td>
</tr>
<tr>
<td>Dynamic rendering</td>
<td>Dikkatli</td>
<td>Geçici bridge only</td>
</tr>
</table>
default: Next.js/Nuxt vb. — **indexable route = server component veya getServerSideProps/getStaticProps eşdeğeri.**
---
## Money page & prerender minimum listesi
Projede yazılı liste (SEO-02 inventory ile aynı kaynak):
- / (homepage)
- Top N landing (GSC trafik veya conversion)
- /pricing, /plans, primary product hub
- /product/\* veya /services/\* hub sayfaları
- /docs/\* index ve getting-started
- Legal: privacy, terms, kvkk/cookies
- Locale home (/tr/, /en/) hreflang set (SEO-02)
Her URL için rendering mode kolonu: SSG \| SSR \| prerender \| **CSR forbidden**
N değeri: min 10 veya top 80% organic landing — EM + SEO onayı.
</content>
</page>
