Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee080809ea0cfbd09fa6bff as of 2026-10-04T10:20:42.963Z:
<page url="https://app.notion.com/p/3e51fd693ee080809ea0cfbd09fa6bff">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-09 — Measurement & Incidents"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## On-call & erişim
- GSC domain property: min 2 admin (SEO Lead + backup)
- GA4 property: read for on-call Eng
- Hosting/CDN logs: Eng on-call
- Incident owner isimleri yazılı (tatil yedek)
Hata sayfaları (404/5xx):
- Crawler-friendly HTML (no infinite redirect)
Post-incident review (PIR): 5 why, action items, RFC gerekirse.
---
## SEO-09 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Dashboard links</td>
<td>Erişim kanıtı</td>
</tr>
<tr>
<td>Weekly ritual</td>
<td>Son 2 hafta kayıt</td>
</tr>
<tr>
<td>Runbook</td>
<td>Ekip bilir</td>
</tr>
<tr>
<td>On-call</td>
<td>İsim + GSC erişim</td>
</tr>
<tr>
<td>Incident owner</td>
<td>Yazılı</td>
</tr>
</table>
Gate FAIL → SEO-10 launch gate risk.
---
## Test & teyit
- [ ] Dashboard URL’leri ve erişim kanıtı (screenshot veya rol list)
- [ ] Incident sahibi adı yazılı
- [ ] Sample weekly note mevcut
- [ ] GSC Performance 28d export alınabiliyor
---
## Anti-pattern (reddet)
- Yalnız GA4, GSC yok
- “Traffic dropped” veri olmadan
- Brand+non-brand karışık panic
- Consent banner kapalı iken conversion panic
- Incident without rollback plan
- GSC only URL-prefix when domain drift var
- Haftalık ritüel atlanması 4+ hafta
- Manual action ignore
---
## Handoff & referans
Önceki: [SEO-08 Social Graph](https://www.notion.so/3e51fd693ee080b8891aee0e50eba1ab)
Sonraki: [SEO-10 Launch, Migration & Redirect Registry](https://www.notion.so/3e51fd693ee08052ad3ccbf5fe5f01ea)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
GSC start: [https://support.google.com/webmasters/answer/9128669](https://support.google.com/webmasters/answer/9128669)<br>GSC Performance: [https://support.google.com/webmasters/answer/7576553](https://support.google.com/webmasters/answer/7576553)<br>GA4 organic: [https://support.google.com/analytics/answer/1296896](https://support.google.com/analytics/answer/1296896)<br>Manual actions: [https://support.google.com/webmasters/answer/9044175](https://support.google.com/webmasters/answer/9044175)<br>Consent Mode: [https://developers.google.com/tag-platform/security/guides/consent](https://developers.google.com/tag-platform/security/guides/consent)
## Haftalık SEO ritüel (≤60 dk)
Checklist (her Pazartesi veya sprint başı):
- [ ] GSC Performance WoW — brand / non-brand
- [ ] GSC Indexing — yeni “Crawled - not indexed” spike
- [ ] GSC Pages — 404, soft 404, redirect error
- [ ] Sitemap last read + hatalar (SEO-03)
- [ ] Manual actions / Security = none
- [ ] CWV report — yeni Poor URL (SEO-07)
- [ ] Top 10 query cannibalization glance (SEO-02 map)
- [ ] Deploy log ↔ trafik anomaly (release calendar)
Kayıt: haftalık Notion note — anomaly varsa incident ticket.
Aylık:
- CrUX trend
- Content/decay review top URLs
- hreflang errors (Screaming Frog export)
---
## Incident runbook (sinyal → aksiyon)
<table header-row="true">
<tr>
<td>Sinyal</td>
<td>İlk 30 dk</td>
<td>Derinlemesine</td>
</tr>
<tr>
<td>−30% clicks 7d WoW</td>
<td>Deploy? seasonality? GSC date scope</td>
<td>Query/page drilldown; algorithm chatter</td>
</tr>
<tr>
<td>Impressions up, clicks down</td>
<td>SERP rewrite, position drop</td>
<td>CTR by query; title change audit</td>
</tr>
<tr>
<td>Index drop</td>
<td>robots/noindex/canonical/sitemap</td>
<td>URL Inspection sample; staging leak</td>
</tr>
<tr>
<td>Coverage spike 404</td>
<td>redirect registry (SEO-10)</td>
<td>CDN/origin log</td>
</tr>
<tr>
<td>Manual action</td>
<td>Stop risky changes; Legal</td>
<td>Reconsideration request prep</td>
</tr>
<tr>
<td>CWV Poor spike</td>
<td>bisect deploy; 3rd party</td>
<td>LCP/INP slice</td>
</tr>
<tr>
<td>Sitemap error</td>
<td>generator bug</td>
<td>inventory diff</td>
</tr>
<tr>
<td>Social preview broken</td>
<td>Debugger scrape</td>
<td>og:url/image 403</td>
</tr>
<tr>
<td>Soft 404 surge</td>
<td>template bug</td>
<td>GSC “Soft 404” export</td>
</tr>
</table>
Severity:
- P0: manual action, site-wide noindex, money page index gone
- P1: −30% non-brand clicks, CWV Poor money group
- P2: single section, social preview top URL
Escalation: SEO Lead → EM → Legal (YMYL/P0).
> Ölçüm olmadan SEO operasyonu kör uçuştur. Google Search Console (GSC) arama performansının kaynağıdır; GA4 davranış ve conversion tamamlar. Incident runbook, trafik/index/CWV/social preview regresyonlarında dakika kaybını önler.
## Kapsam (bu sayfa)
SEO-09: Dashboard’lar, haftalık ritüel, incident triage, on-call, escalation, kanıt arşivi. Crawl/sitemap ritüeli SEO-03 ile örtüşür; CWV SEO-07; og debugger SEO-08; launch SEO-10.
Ön koşul: SEO-08 PASS.
Şirket sabiti:— 404/5xx sayfalarında görünür iletişim (crawl/support); schema Organization email (SEO-06).
## Staff Engineer ilkeleri (Google / GA4 / sosyal)
- GSC domain property tek truth (clicks, impressions, CTR, position).
- Brand vs non-brand ayrımı (regex/filter) — algoritma gürültüsünden ayrıştır.
- GA4: organic landing + conversion; Consent Mode v2 (EEA) — under-reporting bilinçli.
- GSC ↔ GA4 oturum farkı normal; trend birlikte okunur.
- Index drop önce teknik (robots, noindex, canonical, redirect) sonra içerik.
- Manual action / Security issues = P0; Legal dahil.
- CWV Poor spike → deploy bisect (SEO-07).
- Social preview kırılması: Meta Debugger / LinkedIn Inspector (SEO-08) — trafik düşüşü değil marka incident.
- Meta/X/LinkedIn ads analytics ayrı; organic SEO dashboard’a karıştırma without UTM hygiene.
- Her incident: timeline, hypothesis, evidence, rollback — RFC culture (SEO-01).
---
## Dashboard envanteri (projede doldur)
<table header-row="true">
<tr>
<td>Kaynak</td>
<td>Metrik / görünüm</td>
<td>Sahip</td>
</tr>
<tr>
<td>GSC Performance</td>
<td>clicks, impressions, CTR, position</td>
<td>SEO Lead</td>
</tr>
<tr>
<td>GSC Indexing</td>
<td>indexed, not indexed reasons</td>
<td>SEO Lead</td>
</tr>
<tr>
<td>GSC Pages / Sitemaps</td>
<td>coverage errors</td>
<td>Eng</td>
</tr>
<tr>
<td>GSC Core Web Vitals</td>
<td>field Poor URLs</td>
<td>Eng + SEO</td>
</tr>
<tr>
<td>GSC Manual actions</td>
<td>0 tolerance</td>
<td>SEO + Legal</td>
</tr>
<tr>
<td>GA4 Acquisition</td>
<td>Organic Search sessions</td>
<td>PM/Data</td>
</tr>
<tr>
<td>GA4 Landing pages</td>
<td>engagement, conversion</td>
<td>PM</td>
</tr>
<tr>
<td>CrUX Dashboard</td>
<td>origin p75 LCP/INP/CLS</td>
<td>Eng</td>
</tr>
<tr>
<td>PSI / Lighthouse CI</td>
<td>lab trend</td>
<td>Eng</td>
</tr>
</table>
URL’ler Notion’da linkli; erişim rol listesi (on-call dahil) yazılı.
Brand split örnek GSC query filter:
- Brand: marka adı, domain varyantları
- Non-brand: geri kalan — growth KPI
</content>
</page>
