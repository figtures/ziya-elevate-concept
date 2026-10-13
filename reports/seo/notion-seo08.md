Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080b8891aee0e50eba1ab as of 2026-10-04T10:20:38.856Z:
<page url="https://app.notion.com/p/3e51fd693ee080b8891aee0e50eba1ab">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-08 — Social Graph (Meta, LinkedIn, X)"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## Meta Sharing Debugger & crawler davranışı
Araç: [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)
Ritüel (her prod deploy material meta değişikliği):
1. Paste canonical URL
2. Scrape Again (cache bust)
3. Warning/error = 0 (redirect chain, 403, missing og:image)
4. Screenshot arşiv (release klasörü)
Yaygın hatalar:
- 302 og:url → canonical değil
- og:image 403 (hotlink protection)
- Redirect loop www/apex
- charset/HTML entity broken title
Crawler user-agents (SEO-03 Allow):
- Facebookexternalhit
- meta-externalagent (yeni aile — policy güncel tut)
---
## Paylaşım URL envanteri (top 10+)
Projede sabit liste (SEO-02 inventory subset):
1. Homepage
2. Pricing / product hub
3. Top blog (trafik)
4. Landing campaign URL
5. Locale home (/tr/, /en/)
6. Careers veya about (LinkedIn share sık)
7. Case study
8. Docs getting started
9. Legal (nadiren share — yine de og complete)
10. Release notes / news
Her biri: Debugger + LinkedIn Inspector + X preview PASS.
---
## SEO-08 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>og minimum set</td>
<td>Tüm shareable indexable</td>
</tr>
<tr>
<td>og:url</td>
<td>Canonical match</td>
</tr>
<tr>
<td>Image spec</td>
<td>LinkedIn 1200×627 uyum</td>
</tr>
<tr>
<td>twitter:card</td>
<td>summary_large_image</td>
</tr>
<tr>
<td>Crawlers</td>
<td>robots Allow</td>
</tr>
<tr>
<td>SSR meta</td>
<td>curl görünür (SEO-04)</td>
</tr>
<tr>
<td>Top 10 debug</td>
<td>Clean post-deploy</td>
</tr>
<tr>
<td>RFC</td>
<td>Global template onaylı</td>
</tr>
</table>
Gate FAIL → SEO-09'a geçme (launch perspective).
---
## Test & teyit
- [ ] Top 10 share URL debugger clean
- [ ] curl og:image → 200
- [ ] og:url = link rel=canonical
- [ ] Locale page og:locale doğru
- [ ] Deploy scrape arşivi
---
## Anti-pattern (reddet)
- og:image relative path
- Paywall arkasında og:image
- Default og:title "Home" tüm site
- twitter:card summary (küçük kart) marketing sites default
- Debugger scrape atlanması
- og:url staging domain
- Cache forever eski görsel deploy sonrası
- Only JSON-LD, no og tags
- 5MB+ uncompressed PNG og
---
## Handoff & referans
Önceki: [SEO-07 Core Web Vitals](https://www.notion.so/3e51fd693ee0801ba516d2d9ef2fb99e)
Sonraki: [SEO-09 Measurement & Incidents](https://www.notion.so/3e51fd693ee080809ea0cfbd09fa6bff)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Meta Sharing Best Practices: [https://developers.facebook.com/docs/sharing/webmasters/](https://developers.facebook.com/docs/sharing/webmasters/)<br>Meta Debugger: [https://developers.facebook.com/tools/debug/](https://developers.facebook.com/tools/debug/)<br>LinkedIn Post Inspector: [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)<br>LinkedIn image help: [https://www.linkedin.com/help/linkedin/answer/a521928](https://www.linkedin.com/help/linkedin/answer/a521928)<br>X Cards: [https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)<br>Open Graph protocol: [https://ogp.me/](https://ogp.me/)
## Görsel policy (og:image / twitter:image)
<table header-row="true">
<tr>
<td>Platform</td>
<td>Boyut</td>
<td>Not</td>
</tr>
<tr>
<td>LinkedIn</td>
<td>1200×627 min</td>
<td>≤5MB, JPG/PNG</td>
</tr>
<tr>
<td>Meta/Facebook</td>
<td>1200×630 öneri</td>
<td>Debugger crop</td>
</tr>
<tr>
<td>X</td>
<td>summary_large_image</td>
<td>2:1 öneri; min boyut guideline</td>
</tr>
<tr>
<td>Genel</td>
<td>≤5MB</td>
<td>Ayrı asset; LCP hero ile karıştırma</td>
</tr>
</table>
Kurallar:
- Relative URL yasak
- Query token auth yasak
- SVG og:image — platform desteği sınırlı; PNG/JPG tercih
- CDN cache purge deploy checklist
- Default fallback image (homepage) — broken image yasak
- Locale sayfalar: locale-uygun görsel/metin
SEO-07: og asset optimize; LCP hero ayrı dosya olabilir.
---
## X (Twitter) Cards
Zorunlu:
- twitter:card = summary_large_image 
- twitter:title, twitter:description (og mirror veya explicit)
- twitter:image (og:image ile aynı URL çoğu projede)
Opsiyonel:
- twitter:site @handle
- twitter:creator
Validator: X Card Validator / post preview test.
Not: twitter:label1/data deprecated patterns kullanma.
---
## LinkedIn
- Post Inspector: [https://www.linkedin.com/post-inspector/](https://www.linkedin.com/post-inspector/)
- Share URL = og:url canonical
- Article share: og:type article + published metadata
- Company page share vs personal — aynı URL meta
Help: LinkedIn share image specifications (1200×627).
Deploy sonrası: top 10 URL manuel inspector scrape.
> Social graph meta (Open Graph + X/Twitter Cards), paylaşım önizlemesini belirler: başlık, açıklama, görsel, URL. Google sıralama sinyali değildir; marka CTR, PR ve paid/organic sosyal trafik kalitesi için Staff Engineer seviyesinde zorunludur. Meta, LinkedIn ve X farklı crawler ve cache davranışı gösterir.
## Kapsam (bu sayfa)
SEO-08: og:\* ve twitter:\* tag seti, görsel spesifikasyonları, platform debugger ritüeli, deploy sonrası scrape, top share URL listesi. Title/description kaynağı SEO-05; canonical og:url SEO-02; initial HTML SEO-04; görsel boyut SEO-07; Organization sameAs SEO-06.
Ön koşul: SEO-07 PASS.
Şirket sabiti: (paylaşım sayfalarında footer tutarlılığı).
## Staff Engineer ilkeleri (Meta / LinkedIn / X / Google)
- og:url = indexable canonical URL (param/session yok).
- og:image mutlak HTTPS; auth wall arkasında değil; 200 OK; Cache-Control uygun.
- Global template değişimi RFC (SEO-01 Social impact).
- LinkedIn: 1200×627 (\~1.91:1), ≤5MB — farklı crop X/Meta'da test et.
- twitter:card summary_large_image; twitter:image og:image ile hizalı (duplicate tutarlı).
- Meta Sharing Debugger scrape — deploy sonrası zorunlu; cache invalidation.
- SPA: og tags initial HTML'de (SEO-04); JS-only meta = boş preview.
- robots: Facebookexternalhit, Twitterbot, LinkedInBot Allow (SEO-03).
- WhatsApp/Slack/iMessage çoğunlukla og kullanır — tek pipeline.
- Google arama snippet ≠ og; yine de title/description çelişkisi marka güvenini düşürür.
---
## Open Graph (tüm paylaşılabilir URL'ler)
Zorunlu minimum:
<table header-row="true">
<tr>
<td>Tag</td>
<td>Kural</td>
</tr>
<tr>
<td>og:title</td>
<td>SEO-05 title ile uyumlu veya transcreate (RFC)</td>
</tr>
<tr>
<td>og:description</td>
<td>Unique; keyword dump yok</td>
</tr>
<tr>
<td>og:url</td>
<td>Canonical absolute</td>
</tr>
<tr>
<td>og:type</td>
<td>website, article, product vb. doğru</td>
</tr>
<tr>
<td>og:image</td>
<td>Absolute HTTPS; boyut platform tablosu</td>
</tr>
<tr>
<td>og:locale</td>
<td>tr_TR, en_US — hreflang ile uyum</td>
</tr>
<tr>
<td>og:site_name</td>
<td>Marka</td>
</tr>
</table>
Önerilen (doğruysa):
- og\:image\:width / og\:image\:height
- og\:image\:alt (erişilebilirlik)
- article:published_time (blog)
- og\:locale\:alternate
Test (curl):<br>curl -sL URL \| grep -E 'property="og:\|name="twitter:'
Beklenti: en az 4 og + twitter card tags source HTML'de.
</content>
</page>
