Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee0801ba516d2d9ef2fb99e as of 2026-10-04T10:20:35.066Z:
<page url="https://app.notion.com/p/3e51fd693ee0801ba516d2d9ef2fb99e">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-07 — Core Web Vitals & Performance Budget"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## CLS optimizasyonu
- Reserve space ads/embeds/iframes
- width/height all img/video
- avoid inserting content above existing (cookie banners — animate or bottom)
- web fonts: size-adjust / fallback metric match
- SPA route change: skeleton same dimensions
---
## Süreç & ritüel
<table header-row="true">
<tr>
<td>Cadence</td>
<td>Aksiyon</td>
</tr>
<tr>
<td>Her PR</td>
<td>Lighthouse CI template URLs</td>
</tr>
<tr>
<td>Release</td>
<td>PSI before/after screenshot</td>
</tr>
<tr>
<td>Haftalık</td>
<td>GSC CWV report</td>
</tr>
<tr>
<td>Aylık</td>
<td>CrUX dashboard origin + key URLs</td>
</tr>
<tr>
<td>Incident</td>
<td>CWV Poor spike → SEO-09 runbook</td>
</tr>
</table>
Exception: Poor URL group money page — RFC (SEO-01): root cause, fix timeline, EM sign-off; production launch blocked until Good or accepted risk süresi.
---
## SEO-07 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Budget doc</td>
<td>Route ceilings yazılı</td>
</tr>
<tr>
<td>CrUX money pages</td>
<td>Poor grup yok veya imzalı RFC</td>
</tr>
<tr>
<td>Lab CI</td>
<td>Son main green</td>
</tr>
<tr>
<td>3rd party inventory</td>
<td>Allowlist güncel</td>
</tr>
<tr>
<td>LCP/INP/CLS</td>
<td>Spot PSI Good template set</td>
</tr>
<tr>
<td>Regress</td>
<td>Son release delta documented</td>
</tr>
</table>
Gate FAIL → SEO-08’e geçme (launch perspective).
---
## Test & teyit
- [ ] Money page CrUX “Poor” değil (veya imzalı exception)
- [ ] Lab regress yok (Lighthouse CI)
- [ ] LCP element audit 3 money URL
- [ ] CLS visual check mobile + desktop
- [ ] 3rd party count on homepage ≤ policy
---
## Anti-pattern (reddet)
- Lighthouse skoru tek ekran görüntüsü, field yok
- Lazy-load LCP hero
- 5MB uncompressed PNG hero
- Render-blocking 3rd party sync in head
- Cookie banner push without reserved height
- “CWV sonradan” launch sonrası
- Bundle budget sadece homepage; pricing CSR şişkin
- PSI desktop only, mobile Poor ignore
---
## Handoff & referans
Önceki: [SEO-06 Structured Data Pipeline](https://www.notion.so/3e51fd693ee080f080d7fcb37d6a5893)
Sonraki: [SEO-08 Social Graph (Meta, LinkedIn, X)](https://www.notion.so/3e51fd693ee080b8891aee0e50eba1ab)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
Google Web Vitals: [https://web.dev/vitals/](https://web.dev/vitals/)<br>CrUX: [https://developer.chrome.com/docs/crux](https://developer.chrome.com/docs/crux)<br>Search Console CWV: [https://support.google.com/webmasters/answer/9205520](https://support.google.com/webmasters/answer/9205520)<br>INP: [https://web.dev/inp/](https://web.dev/inp/)<br>Lighthouse CI: [https://github.com/GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)
## Performance budget (lab + CI)
Projeye yazılı sayılar (örnek şablon — EM onayı):
<table header-row="true">
<tr>
<td>Route class</td>
<td>JS (gzip)</td>
<td>LCP element</td>
<td>3rd party</td>
</tr>
<tr>
<td>Homepage</td>
<td>≤ 180 KB</td>
<td>hero image ≤ 200KB WebP</td>
<td>≤ 3 tag</td>
</tr>
<tr>
<td>Product/pricing</td>
<td>≤ 220 KB</td>
<td>above-fold minimal</td>
<td>chat deferred</td>
</tr>
<tr>
<td>Blog</td>
<td>≤ 150 KB</td>
<td>featured image sized</td>
<td>analytics async</td>
</tr>
</table>
Görsel policy:
- width/height HTML attributes veya aspect-ratio
- responsive srcset/sizes
- CDN transform; og image ayrı asset (SEO-08)
Font policy:
- Variable font veya subset woff2
- Preload yalnız critical woff2
- Icon font → SVG tercih
CI:
- Lighthouse CI veya PSI on PR preview — template URL list (SEO-04 money pages)
- Budget json fail = merge block
- Bundle analyzer PR comment (main chunks)
---
## LCP optimizasyonu (checklist)
- [ ] LCP element identifiable (DevTools)
- [ ] discoverable in initial HTML (not late JS)
- [ ] fetchpriority=high on LCP image (where valid)
- [ ] Preconnect CDN/origin
- [ ] No lazy on LCP image
- [ ] Server response \< 600ms TTFB hedef (internal SLA)
- [ ] Critical CSS inline veya early link
---
## INP & etkileşim
- Break long tasks \> 50ms (scheduler.yield, code split)
- Defer non-critical JS (requestIdleCallback pattern)
- Hydration cost (React) — server components / partial hydration
- Event handlers passive where possible
- Third-party: facade pattern (chat load on click)
INP debug: Chrome DevTools Performance → Interactions.
> Core Web Vitals (CWV), Google’ın field (gerçek kullanıcı) verisiyle ölçtüğü deneyim sinyalleridir. Lab (Lighthouse/PSI) regresyon yakalar; launch kararı CrUX field ve money page grupları ile verilir. Yavaş sayfa = crawl/render maliyeti + düşük engagement; sosyal paylaşım botları da büyük HTML/JS gecikmesinden etkilenir.
## Kapsam (bu sayfa)
SEO-07: LCP, INP, CLS eşikleri; performance budget (JS, görsel, font, 3rd party); CrUX/PSI ritüeli; merge/release gate; exception RFC (SEO-01). Render SEO-04; görsel og boyutları SEO-08.
Ön koşul: SEO-06 PASS.
Şirket sabiti:  (footer — CWV ile doğrudan ilgili değil; NAP tutarlılığı).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- **Field \> lab** launch için: CrUX 28-day p75; PSI tek seferlik değil trend.
- LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 — Good band (Google CWV).
- INP, FID yerine geçti — eski FID hedeflerini INP’ye taşı.
- Her route için JS budget; money page en sıkı.
- 3rd-party (analytics, chat, A/B) INP/LCP killer — allowlist + load strategy.
- Image: boyut, format (WebP/AVIF), priority fetch LCP hero, lazy below-fold.
- Font: subset, font-display swap/optional; CLS preload width/height.
- SSR TTFB budget (SEO-04); edge cache.
- Regresyon = P1 merge blocker; exception EM + SEO RFC.
- Meta/X/LinkedIn ranking CWV kullanmaz; 5MB og image ve yavaş TTFB preview fail (SEO-08).
---
## Metrikler (field — CrUX)
<table header-row="true">
<tr>
<td>Metrik</td>
<td>Good (p75)</td>
<td>İyileştirme odağı</td>
</tr>
<tr>
<td>LCP</td>
<td>≤ 2.5s</td>
<td>Hero image, TTFB, render block</td>
</tr>
<tr>
<td>INP</td>
<td>≤ 200ms</td>
<td>Long tasks, hydration, 3rd party</td>
</tr>
<tr>
<td>CLS</td>
<td>≤ 0.1</td>
<td>Images/embeds without size, font swap, inject banners</td>
</tr>
</table>
Ek izleme (SEO-09):
- TTFB, FCP lab
- Interaction to Next Paint dağılımı
- CrUX URL/group breakdown (origin + route pattern)
Kaynak: Google Web Vitals, CrUX API, Search Console Core Web Vitals report.
</content>
</page>
