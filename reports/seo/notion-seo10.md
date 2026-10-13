Here is the result of "fetch" for the Page with URL https://app.notion.com/p/3e51fd693ee08052ad3ccbf5fe5f01ea as of 2026-10-04T10:20:46.989Z:
<page url="https://app.notion.com/p/3e51fd693ee08052ad3ccbf5fe5f01ea">
<ancestor-path>
<parent-page url="https://app.notion.com/p/3e51fd693ee080a18f79f1ede4c42fcf" title="SEO — Klasik Arama Motoru Optimizasyonu · AI Prompt"/>
</ancestor-path>
<properties>
{"title":"SEO-10 — Launch, Migration & Redirect Registry"}
</properties>
<iconMetadata>null</iconMetadata>
<content>
## Post-launch (T+7 / T+30)
T+7:
- [ ] GSC Coverage / Indexing trend
- [ ] Performance vs pre-launch baseline (± tolerans)
- [ ] Redirect 404 log review
- [ ] CWV field check
- [ ] Manual action = none
T+30:
- [ ] Non-brand query recovery (migration)
- [ ] Registry audit — unused rules cleanup
- [ ] hreflang error = 0
- [ ] PIR doc (lessons learned)
Domain migration ek:
- Eski property GSC change of address (uygunsa)
- Backlink top referrers spot check
---
## Program release gate (SEO-10 sonrası — hepsi EVET)
- [ ] Adım SEO-01…SEO-09 her biri PASS + evidence paketi
- [ ] URL listesi + self canonical
- [ ] robots/sitemap production doğrulandı
- [ ] Kritik URL GSC Inspection Indexed (veya bilinçli noindex gerekçeli)
- [ ] Schema Rich Results PASS
- [ ] CWV Good veya imzalı RFC exception
- [ ] OGP + LinkedIn + X debugger top URL clean
- [ ] Redirect registry imzalı (migration varsa)
- [ ] RFC sign-off SEO + Eng + Legal (gerekiyorsa)
FAIL varsa: production’a çıkma. BLOCKED raporu: adım, test, reproduce, rollback.
---
## SEO-10 Gate checklist (PASS / FAIL / BLOCKED)
<table header-row="true">
<tr>
<td>Kontrol</td>
<td>PASS</td>
</tr>
<tr>
<td>Pre-launch crawl</td>
<td>Launch set clean</td>
</tr>
<tr>
<td>Redirect registry</td>
<td>İmzalı + CI sync</td>
</tr>
<tr>
<td>Rollback</td>
<td>Staging executed</td>
</tr>
<tr>
<td>Cutover checklist</td>
<td>Tamamlandı</td>
</tr>
<tr>
<td>T+7 review</td>
<td>Scheduled/done</td>
</tr>
<tr>
<td>Program gate</td>
<td>Tüm maddeler</td>
</tr>
</table>
---
## Anti-pattern (reddet)
- Launch without redirect map (URL change)
- 302 migration “sonra 301”
- Redirect chain 3+ hop
- Rollback “plan var” test yok
- Sitemap eski domain
- Cutover + content edit aynı pencere
- GSC property yokken domain go-live
- Registry sadece Eng’de, SEO imzasız
---
## Handoff & referans
Önceki: [SEO-09 Measurement & Incidents](https://www.notion.so/3e51fd693ee080809ea0cfbd09fa6bff)
Program hub: [https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f](https://www.notion.so/3e51fd693ee08073b480fd142fe88a9f)
AI orkestrasyon: [SEO — Klasik · AI Prompt](https://www.notion.so/SEO-Klasik-Arama-Motoru-Optimizasyonu-3e51fd693ee080a18f79f1ede4c42fcf)
Google redirects: [https://developers.google.com/search/docs/crawling-indexing/301-redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects)<br>Site move: [https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)<br>GSC URL Inspection: [https://support.google.com/webmasters/answer/9012289](https://support.google.com/webmasters/answer/9012289)
 Playbook tamamlandı: 01→10 sırayla PASS kanıtla.
## Pre-launch crawl (launch set)
Launch set = SEO-02 indexable inventory + migration from URL’leri.
Checklist:
- [ ] 4xx/5xx = 0 (launch set)
- [ ] Redirect chain ≤ 1 (Screaming Frog / curl -sI -L)
- [ ] Sitemap’te orphan / stale URL yok
- [ ] robots.txt prod final (SEO-03)
- [ ] Staging noindex sızıntısı yok
- [ ] Canonical self (sample 20)
- [ ] Rich Results PASS scope (SEO-06)
- [ ] CWV lab/field gate (SEO-07)
- [ ] og top 10 (SEO-08)
- [ ] Rollback script staging’de **test edildi** (kanıt log/ video)
Araçlar: Screaming Frog, Sitebulb, custom curl script, GSC export.
---
## Redirect registry (living doc)
Zorunlu kolonlar:
<table header-row="true">
<tr>
<td>from</td>
<td>to</td>
<td>code</td>
<td>owner</td>
<td>date</td>
<td>not</td>
</tr>
<tr>
<td>eski path</td>
<td>yeni canonical</td>
<td>301</td>
<td>Eng</td>
<td>YYYY-MM-DD</td>
<td>ticket/RFC</td>
</tr>
</table>
Kurallar:
- Tek kaynak Notion DB / sheet — code config ile sync CI test
- Wildcard redirect yalnız RFC + Legal
- Query string policy yazılı (strip vs preserve)
- Trailing slash policy (SEO-02)
- Registry SEO Lead + Eng imza launch öncesi
- Post-launch 404 log → registry gap ekle
Test örnek:<br>for u in from_list; do curl -sI "\$u" \| egrep -i 'HTTP\|location'; done
---
## Cutover runbook
T-24h (mümkünse):
- Content freeze
- Final redirect map freeze
- comms: SEO-09 on-call hazır
T-0:
- Deploy prod
- robots + sitemap verify
- DNS cutover (domain migration)
- CDN cache purge plan
T+0–2h:
- Smoke: top 20 URL 200/301
- GSC URL Inspection batch (money pages)
- Sitemap submit
- Meta Debugger scrape top 10
T+48h:
- GSC crawl stats izle
- 404/5xx log spike
- GA4 organic sanity (SEO-09)
Rollback tetik:
- Site-wide wrong redirect
- Prod noindex
- 5% money URL 5xx
> Launch ve migration, SEO riskinin en yoğun olduğu fazdır: URL değişimi, redirect hataları, index kaybı, sosyal preview kırılması ve ölçüm baseline kayması. Redirect registry yaşayan dokümandır; rollback staging’de **çalıştırılmış** olmalıdır (yazılı plan yetmez).
## Kapsam (bu sayfa)
SEO-10: Pre-launch crawl, cutover, redirect registry, post-launch T+7/T+30, program release gate (01–10 özet). Tüm önceki adımların birleşimi; yeni site, replatform, domain değişimi, büyük IA overhaul.
Ön koşul: SEO-01…SEO-09 PASS (veya bilinçli BLOCKED + EM kabulü yoksa launch yasak).
## Staff Engineer ilkeleri (Google / Meta / LinkedIn / X)
- Migration = RFC zorunlu (SEO-01): redirect table, rollback, validation plan min 10 URL.
- 301 kalıcı; chain max 1 hop; 302 migration geçici hata.
- Launch set: inventory (SEO-02) ile birebir; sitemap orphan yok (SEO-03).
- Cutover penceresi: DNS/CDN TTL, cache purge, robots/sitemap aynı deploy.
- GSC URL Inspection batch + sitemap resubmit (SEO-09).
- Meta Debugger / LinkedIn Inspector top URL post-cutover (SEO-08).
- Content freeze 24h mümkünse — redirect map drift önleme.
- Greenfield launch: baseline yok; inspection + monitoring extra kritik.
- FAIL herhangi program gate → production BLOCKED raporu (adım, test, reproduce, rollback).
---
## Launch türleri
<table header-row="true">
<tr>
<td>Tür</td>
<td>SEO odak</td>
</tr>
<tr>
<td>Greenfield</td>
<td>Indexation from zero; sitemap submit; no redirect</td>
</tr>
<tr>
<td>Replatform (aynı URL)</td>
<td>Render/schema/meta parity; CWV regress</td>
</tr>
<tr>
<td>URL change / IA</td>
<td>Redirect registry %100; cannibalization re-map</td>
</tr>
<tr>
<td>Domain migration</td>
<td>GSC property; hreflang; apex/www; 301 tüm eski host</td>
</tr>
<tr>
<td>Locale expansion</td>
<td>hreflang reciprocal; sitemap locale</td>
</tr>
</table>
Her tür için RFC template doldurulmuş olmalı (SEO-01).
<empty-block/>
</content>
</page>
