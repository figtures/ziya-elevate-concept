"""Reproducible scope crosswalk. Assessment is explicit, not inherited gate blocking."""
import re, json, html, hashlib
from pathlib import Path
from collections import Counter

ROOT=Path(__file__).resolve().parents[2]
R=ROOT/'reports'
geo=json.loads((R/'geo/requirements-matrix.json').read_text())['controls']
rows={c['controlId']:{'controlId':c['controlId'],'program':'GEO','gate':c['gate'],'theme':c['theme'],'requirement':c['requirement'],'sourceUrl':c['sourceUrl']} for c in geo}
source_index=[]
seo_ids={}
for path in sorted((R/'seo').glob('notion-seo[0-9][0-9].md')):
    raw=path.read_text(); gate=path.stem[-5:].upper()
    normalized=raw.replace('<br>','\n').replace('\\[','[').replace('\\]',']').replace('\\|','|')
    url=re.search(r'<page url="([^"]+)"',raw).group(1)
    checks=re.findall(r'^\s*- \[[ xX]\] (.+)$',normalized,re.M)
    gate_rows=[]
    for match in re.finditer(r'^## SEO-\d+ Gate checklist[^\n]*\n(.*?)(?=\n## |</content>|\Z)',normalized,re.S|re.M):
        block=match.group(1)
        for row in re.findall(r'<tr>(.*?)</tr>',block,re.S):
            cols=[html.unescape(re.sub('<[^>]+>','',v)).strip() for v in re.findall(r'<td>(.*?)</td>',row,re.S)]
            if len(cols)>1 and cols[0]!='Kontrol':gate_rows.append(' — '.join(cols))
        if not '<tr>' in block:
            for line in block.splitlines():
                if line.startswith('|') and 'Kontrol' not in line and not re.match(r'^\|[-\s|]+$',line):
                    cols=[s.strip() for s in line.strip('|').split('|')];gate_rows.append(' — '.join(cols))
    seo_ids[gate]=[]
    for kind,items in [('C',checks),('G',gate_rows)]:
        for number,requirement in enumerate(items,1):
            cid=f'{gate}-{kind}{number:03}'
            rows[cid]={'controlId':cid,'program':'SEO','gate':gate,'theme':'checkbox' if kind=='C' else 'gate table','requirement':requirement,'sourceUrl':url}
            seo_ids[gate].append(cid)
    source_index.append({'program':'SEO','gate':gate,'sourceUrl':url,'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'checkboxCount':len(checks),'gateRowCount':len(gate_rows),'allSectionHeadings':re.findall(r'^#{2,4} (.+)$',normalized,re.M)})
for path in sorted((R/'geo').glob('notion-geo[0-9][0-9].json')):
    item=json.loads(path.read_text());gate=path.stem[-5:].upper()
    source_index.append({'program':'GEO','gate':gate,'sourceUrl':item['id'],'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'checkboxCount':sum(c['gate']==gate for c in geo),'allSectionHeadings':re.findall(r'^#{2,4} (.+)$',item['text'],re.M)})

TECH='technical';EXT='external_measurement';HUM='editorial_operations';NA='not_applicable'
E={
 'seo':['cms/seo.mjs','scripts/check-seo.mjs','reports/schema-public-2026-10-12.md'],
 'aeo':['cms/aeo.mjs','scripts/check-aeo.mjs','reports/geo/aeo-check.json'],
 'nav':['scripts/check-navigation.mjs','scripts/check-editorial.py'],
 'http':['scripts/check-live-seo.mjs','reports/public-audit/live-baseline.json'],
 'llms':['cms/discovery.mjs','scripts/check-discovery.mjs','reports/geo-public-2026-10-12.md'],
 'perf':['scripts/check-hero-sequence.mjs','reports/performance-2026-10-12.md','reports/public-audit/lighthouse-attempts.json'],
 'auth':['scripts/check-cms-security.mjs','reports/cms-security-2026-10-12.md'],
 'plan':['reports/geo-playbook-audit-2026-10-12.md','reports/geo/topic-ownership-draft.json','reports/geo/prompt-lab-dataset-draft.json'],
 'source':['reports/geo/entity-inventory-draft.json','reports/geo/notion-source-index.json'],
}
def ids(gate, values):
    return [f'{gate}-{int(n):03}' for n in values.split()]
def mark(keys,category,status,note,evidence=()):
    for key in keys:
        assert key in rows,key
        rows[key].update(category=category,status=status,assessment=note,evidence=[f for k in evidence for f in E.get(k,[k])])
def g(gate,values,*args):mark(ids(gate,values),*args)
def sc(gate,values,*args):mark([f'{gate}-C{int(n):03}' for n in values.split()],*args)
def sg(gate,values,*args):mark([f'{gate}-G{int(n):03}' for n in values.split()],*args)

# Every GEO control receives an explicit row. Compound requirements retain their unverified part.
for gate in [f'GEO{i:02}' for i in range(1,11)]:
    mark([k for k in rows if k.startswith(gate+'-')],HUM,'OPEN',
         'Bu işletim kaydı henüz gerçek sorumlu, tarih ve uygulama kanıtıyla doldurulmadı. Teknik geliştirmeyi durduran yeni bir kullanıcı izni olarak yorumlanmaz.',('plan',))
g('GEO01','1 4 11',HUM,'AUTHORIZED_PARTIAL','Kullanıcı kamuya açmayı ve teknik SEO/GEO/AEO uygulamasını açıkça yetkilendirdi; karar ve kapsam bu sürüm raporlarında kayıtlı. Bağımsız kurumsal imza veya başka kişi adına onay üretilmedi.',('llms','plan'))
g('GEO01','3',TECH,'DOCUMENTED','Bu kontrol düzeyindeki karşılaştırma teknik, dış servis ve işletim bağımlılıklarını ayırır; başka gate imzası eksik diye teknik sonuçları BLOCKED saymaz.',('reports/public-requirements-2026-10-12.json',))
g('GEO01','5',HUM,'PLAN_READY','50 soruluk taslak, amaç, metrik ve baseline protokolü hazır; gerçek ölçüm henüz yapılmadı.',('plan',))
g('GEO01','7 14 18',HUM,'PARTIAL','Kaynak snapshot, commit, yerel test ve HTTP dosyaları mevcut. Bağımsız imza, kurumsal retention/silme işi ve müşteri rolüyle tüm kanıt erişimi doğrulanmadı.',('source','http'))
g('GEO01','13',NA,'N/A','Bu uygulamada hiçbir süreli exception kaydı kullanılmadı; tamamlanmayan ölçümler PASS sayılmadı.')
g('GEO01','16',TECH,'REVIEWED','Google/OpenAI/Schema.org ve llms.txt birincil belgeleri 12 Ekim 2026 incelemesinde kullanıldı. Sürekli değişiklik alarmı bunun dışında bir işletim işidir.',('seo','llms'))
g('GEO02','1 8',HUM,'PARTIAL','Kişi adı mevcut özgün içerikten gelir. Tüzel şirket/marka sahipliği, author credential veya bağımsız doğrulama tarihi uydurulmadı; editör kaynak kaydı tamamlanmalı.',('source','seo'))
g('GEO02','2',TECH,'READY_FOR_LIVE','Tek public canonical origin, kişi owner URL ve stabil @id üretimi uygulanıp yerel test edildi; yeni deployment HTTP kontrolü ayrıca kaydedilir.',('seo','http'))
g('GEO02','3 4 13',EXT,'OPEN','Site içindeki profil/iletişim bağlantıları mevcut; haricî hesap sahipliği ve platformlardaki güncel ad, iletişim ve domain karşılaştırması için doğrulanmış hesap erişimi/kanıtı yok.',('source','seo'))
g('GEO02','5 9',TECH,'LOCAL_TESTED','Kişi–yayıncı–makale–kitap–hizmet ilişkileri tek graph içinde, duplicate/unresolved @id ve görünür içerik parity senaryolarıyla test edildi.',('seo',))
g('GEO02','6 10 11',NA,'N/A','Yayın tek Türkçe kişi sitesidir; ikinci locale, holding/franchise/şube veya rebrand/M&A olayı yok. Bu senaryolar için yapay entity/çeviri eklenmez.')
g('GEO02','7',HUM,'PARTIAL','Makine okunur entity taslağı sürümlü depoda mevcut; tüm dış profil/claim doğrulamaları henüz tamamlanmadığı için onaylı nihai inventory denmez.',('source',))
g('GEO02','12',NA,'N/A','Doğrulanmış eski kişi adı/ürün lifecycle değişimi bulunmuyor. Mevcut üç emekli test URL yönlendirmesi ayrı teknik testlerle korunuyor.',('seo','http'))
g('GEO02','14',TECH,'APPLIED','Knowledge Panel yokluğu teknik hata veya başarı KPIı olarak gösterilmedi.',('plan',))
g('GEO02','15',EXT,'NOT_OBSERVED','Yaygın entity incident geçmişi/izleme erişimi yok; eldeki kaynakta olay gözlenmemesi son 30 günün temiz olduğunun kanıtı değildir.')
g('GEO03','1 10 11',HUM,'PARTIAL','Resmî kaynaklara dayanan bot sınıf taslağı ve karar ayrımı var. Tüm vendor kaynak hashleri, isimli devamlı owner ve gerçek edge gözlemi yok.',('reports/geo/bot-registry-draft.json','llms'))
g('GEO03','2 3 4 12',TECH,'APPLIED','Search, training ve kullanıcı isteği botları farklı amaçlarla belgeli. Kamuya erişim arama için açıldı; eğitim botlarına sıralama vaadiyle yeni özel izin verilmedi.',('llms','reports/geo/bot-registry-draft.json'))
g('GEO03','5',HUM,'AUTHORIZED_PARTIAL','Kamuya erişim ve teknik uygulama kullanıcı tarafından açıkça yetkilendirildi. Kurumsal çoklu imza matrisi ayrıca işletim kaydıdır; yeniden onay isteme gerekçesi değildir.',('llms',))
g('GEO03','6',TECH,'LOCAL_TESTED','Panel ve API noindex/auth/RLS kontrolleri ile robots güvenlikten ayrılıyor. Gerçek Supabase projesi henüz bağlı olmadığı için uzak kullanıcı akışı tamamlanmış sayılmaz.',('auth','http'))
g('GEO03','7 14',TECH,'READY_FOR_LIVE','Canonical/sitemap/robots aynı public origin kullanıyor; admin/API özel kuralları ve route dışlama kaynak testleri var. Yeni yayın HTTP kanıtı beklenir.',('seo','http'))
g('GEO03','8 9 13 15 16 17 18 20',EXT,'OPEN','Gerçek vendor IP/rDNS, WAF/CDN logları ve aktif alarm/tatbikat kanıtı yok. Anonim 63-URL HTTP taraması ve altı user-agent eşitlik testi mevcut; gerçek bot trafiği veya çok bölgeli zaman serisi yerine geçmez.',('http',))
g('GEO03','19',NA,'N/A','Bu yayında acil bot engelleme kuralı uygulanmadı; hayalî incident/expiry kaydı üretilmez.')
g('GEO04','1 8 9',TECH,'PARTIAL','30 makaledeki mevcut doğrudan cevap, 133 görünür answer unit ve bölüm bağlantısı işlenip negatif/idempotent CMS senaryolarıyla test edildi. Tüm ticari konular için ayrı chunk/migration sözleşmesi ve gerçek kullanıcı sorgu kapsamı ayrıca değerlendirilmeli.',('aeo','plan'))
g('GEO04','3',TECH,'LOCAL_TESTED','FAQ, yazar, tarih, kitap/hizmet/arşiv ve breadcrumb yapıları son görünür DOM üzerinden üretiliyor; gizleme/düzenleme/sıralama senaryoları kontrol edildi.',('seo','aeo'))
g('GEO04','4',TECH,'PARTIAL','Yinelenen title/description yok; özgün ithal makale gövdeleri korunuyor. Tüm corpus için bağımsız anlamsal duplicate/spun incelemesi yapılmış sayılmaz.',('http','aeo'))
g('GEO04','5',EXT,'PARTIAL','Tek H1, başlık/alt/landmark/bağlantı ve hareket tercihine ilişkin kaynak kontrolleri var. Gerçek mobil/masaüstü tarayıcı erişilebilirlik ve görsel okunabilirlik ölçümü yok.',('seo','perf'))
g('GEO04','2 6 7 10 11 12 13',HUM,'PARTIAL','26 bibliyografik kayıt ve 23 makalede 62 görünür kaynak bağlantısı işlendi. Bu, her sayısal/psikolojik iddianın kaynak locator, yöntem, örneklem, lisans ve uygun uzman tarafından doğrulandığı anlamına gelmez.',('aeo',))
g('GEO04','14',HUM,'OPEN','Konuşma videoları ve kitap tanıtımları görünür HTML başlık/açıklama taşır; tüm gerçek konuşmaların izinli transcript/caption dosyaları yok. Metin uydurulmadı.',('seo',))
g('GEO04','15',NA,'N/A','Tek Türkçe locale; çeviri karşılaştırması gerektiren ikinci sürüm yok. Türkçe karakter bütünlüğü teknik testlerde korunuyor.',('aeo','llms'))
g('GEO04','16 17 18',HUM,'OPEN','Gerçek içerik incident tatbikatı, ekip kalibrasyonu ve kurumsal saklama/onay işlemleri henüz yürütülmedi; mevcut test artifactleri bunun yerine geçmez.',('aeo','plan'))
g('GEO05','1 2 7 12 13 16',TECH,'PARTIAL','25 konu/owner taslağı, tek canonical URL politikası, indekslenebilir route ve iç bağlantı testleri mevcut. Search Console sorgu verisiyle top intent/cannibalization kararı henüz doğrulanmadı.',('plan','seo','nav'))
g('GEO05','3 6',HUM,'OPEN','Özgün içerikteki üstünlük/psikoloji/araştırma iddiaları editör ve gerektiğinde uygun uzman tarafından kaynaklandırılmalı; metinler sessizce silinmedi veya güçlendirilmedi.',('aeo',))
g('GEO05','4',TECH,'DOCUMENTED','Kapsam Türkçe, tek mevcut kamuya açık keynote/kişisel gelişim sitesi; ikinci pazar/locale uydurulmadı.',('llms','plan'))
g('GEO05','5 9',TECH,'PLAN_READY','Branded/unbranded/comparison/how-to/risk sınıflarında dengeli 50 sentetik soru sürümlü JSONda mevcut. Gerçek model cevapları değildir.',('plan',))
g('GEO05','8 10 11 15 17',EXT,'OPEN','Gerçek arama/satış sorgu verisi, trend gözlemi ve model yanıtlarıyla öncelik, answer gap ve adversarial davranış ölçümü yapılmadı.',('plan',))
g('GEO05','14',NA,'N/A','Yerel çeviri/pazar farkı olan ikinci locale yok; ikinci locale başarı oranı uydurulmaz.')
g('GEO05','18',TECH,'LOCAL_TESTED','UTF-8/NFC, Türkçe karakterler, başlık/cevap ve Markdown/JSON çıktıları yerel senaryolarla kontrol edildi.',('aeo','llms','seo'))
g('GEO05','19',HUM,'PARTIAL','Taslaklar ve testler sürümlü depoda; kurumsal retention ve isimli review süreci ayrıca tamamlanmalı.',('plan','aeo'))
g('GEO06','1',EXT,'PARTIAL','Tek kişi @id ve görünür sosyal bağlantı temeli var. sameAs bağlantılarının tümünde hesap sahipliği haricî kanıtla doğrulanmadı.',('seo','source'))
g('GEO06','2 5 7 8 9 10 12 21',TECH,'LOCAL_TESTED','Son CMS DOMu temel alınan schema sözleşmeleri, negatif fixturelar, stabil/çözümlenen @id, gerçek yazar/tarih ve güvenli JSON/Türkçe çıktı testleri geçti. Fiyat/review/award gibi olmayan bilgiler eklenmiyor.',('seo','aeo'))
g('GEO06','3 13',EXT,'PARTIAL','Yerel JSON parse, tip/property sözleşmesi ve DOM parity testleri geçti. Gerçek Google Rich Results/Schema.org servis sonucu alınmadı.',('seo',))
g('GEO06','4 17',TECH,'READY_FOR_LIVE','23 seçilmiş yayımlanmış URL; yerel 38 kontrol ve 100KiB/200-link üst sınırı geçti. --live komutu doğrudan 200/self-canonical/indexable çıktıyı ayrıca kaydeder.',('llms',))
g('GEO06','11 14 20',TECH,'PARTIAL','Sürümlü kod, değişiklik testleri ve deployment artifact geçmişi mevcut. Tam immutable kurumsal manifest/imza ve migration/rollback tatbikatı ayrıca yok.',('seo','llms','source'))
g('GEO06','15',TECH,'LOCAL_TESTED','Türkçe tarihler, geçersiz/ters tarihler, locale ve Unicode normalizasyonu kontrol edildi. Fiyat/para birimi/stock olmayan siteye sentetik Offer eklenmiyor.',('seo','llms'))
g('GEO06','16',TECH,'PARTIAL','UTF-8, MIME, içerik hash ETag ve koşullu 304/HEAD sözleşmesi testli. Gerçek CDN compression/çok bölge cache parity ve canlı 304 ayrı kanıt ister.',('llms','http'))
g('GEO06','18',TECH,'LOCAL_TESTED','LKG deposu olmadığı için kontrollü 404/no-store fallback seçildi; disabled/boş/geçersiz girdi ve bütçe arızaları test edildi. LKG restore yapılmış gibi gösterilmez.',('llms',))
g('GEO06','19',HUM,'OPEN','Yayından kaldırma ile dosyadan çıkma yerel testli; gerçek incident tatbikatı ve ölçülen RTO yok.',('llms',))
g('GEO07','2 10',TECH,'PARTIAL','Build zamanı ile sahte tarih tazelemesi yok; görünür makale/not tarihi schema ile eşleşiyor. İthal tarihlerin geçmiş editoryal semantic diff kanıtı dış kayıt gerektirir.',('seo',))
g('GEO07','3 11 16',EXT,'OPEN','Kaynak değişimi/link-rot için sürekli görev ve dashboard etkin değil; insan/cron işletim erişimi ve izleme kaydı gerekir.',('plan',))
g('GEO07','4',HUM,'DOCUMENTED','Correction/deprecation akışı ve kullanıcı görünür önemli düzeltme ilkesi raporda mevcut; yaşanmamış olay için gerçek closure kanıtı yok.',('plan',))
g('GEO07','1 5 6 7 8 9 14',HUM,'PARTIAL','Görünür yazar ilişkisi ve kaynak bağları iyileştirildi. Tüm kritik iddiaların kaynak puanı, bağımsız reviewer/credential ve editör review tarihleri ayrıca doğrulanmalı.',('seo','aeo'))
g('GEO07','12 17 18',TECH,'LOCAL_TESTED','Yayından çıkarma arşiv/sitemap/discovery listesinden çıkar; üç eski test yönlendirilir. CMS–DOM–schema tarih parity ve Türkçe çıktı testleri geçer.',('seo','llms','aeo'))
g('GEO07','15',NA,'N/A','Bu turda özgün metinde maddi bir iddia düzeltmesi yapılmadı; correction notice uydurulmaz. Kaynak bağlantı ekleri ve kod geçmişi kaydedildi.',('aeo',))
g('GEO07','19',HUM,'PARTIAL','Kod ve kanıt hashleri sürümlü; gerçek insan reviewer ve retention/deletion işletimi henüz yok.',('source','seo'))
g('GEO08','1 2 4 5 7 8 9 10 11 13 15 16 17 20',EXT,'OPEN','Haricî platform hesabı/immutable ID/inspector/cache düzeltme ve olay kayıtlarına yetkili erişim yok. Site içi OG/sameAs çıktısı bu dış kanıtın yerine geçmez.',('http','seo','source'))
g('GEO08','3 12',HUM,'OPEN','Bu çalışmada review/mention/logo izni uydurulmadı. Mevcut müşteri/referans logo ve medya kullanım izinleri müşterinin gerçek kayıtlarıyla kontrol edilmeli.',('plan',))
g('GEO08','6',HUM,'OPEN','Sosyal hesapları sürekli işleten gerçek owner ve backup kişiler atanmış kabul edilmedi; bu teknik site yayını için yeni izin talebi değildir.')
g('GEO08','14',NA,'N/A','Review outreach veya ücretli/teşvikli yorum programı yürütülmüyor; sırf checklist için yeni program başlatılmaz.')
g('GEO08','18',TECH,'APPLIED','Bu çalışma sahte yorum, astroturfing, ücretli gizli mention, toplu şikâyet veya rakip karalama üretmedi.',('plan',))
g('GEO08','19',EXT,'PARTIAL','Site UTF-8 kontrolü geçer; erişilemeyen haricî profil metinlerinin Türkçe karakter bütünlüğü doğrulandı sayılamaz.',('seo',))
g('GEO09','1 2 4 6 8 9 10 11 12 13 14 15 17 22 24',EXT,'NOT_MEASURED','Gerçek çoklu model baseline/run, citation/claim değerlendirmeleri, kör çift evaluator, istatistik veya AI-referral verisi bulunmuyor. 50 soruluk taslak gerçek gözlem değildir; metrik/AI görünürlük skoru uydurulmadı.',('plan',))
g('GEO09','3 7 16',HUM,'PLAN_READY','Rubric, risk/critical override, örneklem ve 50 soruluk sürümlü taslak hazırlanmış; atomik reference facts ve gerçek değerlendirme kayıtları ayrıca tamamlanmalı.',('plan',))
g('GEO09','18 19',NA,'N/A','Bu turda ücretli model API otomasyonu veya token bütçesi kullanılmadı. İleride gerçek prompt lab çalıştırılırsa sağlayıcı/bedel/ToS kapsamı o işte belirlenir.')
g('GEO09','20',NA,'N/A','Ham model transcript/screenshot toplama işi başlamadı; bu veri için aktif retention/deletion çalışıyormuş gibi gösterilmez.')
g('GEO09','21',TECH,'PARTIAL','HTTP ölçümlerinde çerez/token kullanılmadı ve kayıtlar redakte edildi. Henüz olmayan prompt-lab transcriptleri için redaction QA sonucu üretilemez.',('http',))
g('GEO09','25',TECH,'LOCAL_TESTED','Türkçe site ve makine çıktılarının UTF-8/NFC testleri geçer; model yanıtlarının ölçümü ayrıca kapsamdır.',('llms','aeo'))
g('GEO10','1 2 4 7 8 9 10 11 12 14 15 16 17 18 19 20',HUM,'PARTIAL','Bu karşılaştırma mevcut teknik kanıtı açık dış servis/editör/işletim işleriyle ayırır. Programın tamamı, bağımsız imzalar, 30 günlük olay geçmişi, restore tatbikatı veya müşteriye teslim kabulü tamamlanmış sayılmadı.',('reports/public-requirements-2026-10-12.json','http','plan'))
g('GEO10','3',TECH,'READY_FOR_LIVE','63 rotanın anonim başlangıç taraması var; düzeltme sonrası HTTP kontrolü ve discovery --live tekrar çalıştırılmalı. Lighthouse ve üçüncü taraf servisler ayrı kalır.',('http','llms'))
g('GEO10','5',TECH,'PARTIAL','Bot sınıfları/arama erişimi ayrımı belge ve kodla uyumlu; gerçek vendor IP ve sosyal cache sonuçları ayrıca doğrulanmalı.',('llms','http'))
g('GEO10','6',EXT,'NOT_MEASURED','Prompt seti ve sampling taslağı hazır; gerçek çoklu model baseline sonuçları yok.',('plan',))
g('GEO10','13',NA,'N/A','Açık ölçümler için süreli exception veya hard-stop override kullanılmadı.')

# SEO: retain every checkbox (including escaped checkboxes embedded in Notion HTML)
# and every final gate-table row. These IDs distinguish checks (C) from gate rows (G).
for gate,keys in seo_ids.items():
    mark(keys,HUM,'OPEN','Kontrolün gerçek insan/operasyon kaydı henüz yok; teknik site çalışmasını otomatik BLOCKED yapmaz.',('plan',))
sc('SEO01','1',TECH,'PARTIAL','CMS meta override ve benzersiz title/description testli; gerçek 20-URL pixel-width/SERP ölçümü yok.',('seo','http'))
sc('SEO01','2 3 7',TECH,'READY_FOR_LIVE','Canonical/query kökü, taranabilir nav/arşiv/iç bağlantılar ve OG parity uygulanıp testlendi; yeni public yayın taraması ayrıca çalışır.',('seo','nav','http'))
sc('SEO01','4',EXT,'PARTIAL','DOM/schema ve yasak rating testleri geçti; gerçek Rich Results çıktısı yok.',('seo',))
sc('SEO01','5 8',EXT,'OPEN','GSC Inspection ve gerçek CrUX/Lighthouse erişimi/çıktısı yok. PageSpeed mobil/masaüstü denemeleri kota 0 nedeniyle 429 döndü.',('perf','http'))
sc('SEO01','6',NA,'N/A','Bu origin artık kullanıcı yetkisiyle kamuya açık yayındır; ona staging noindex eklenmez. Ayrı staging ortamı bulunmuyor; admin/API ayrıca noindex/auth ile korunur.',('http',))
sc('SEO01','9',HUM,'DOCUMENTED','Teknik karar, dosyalar, kapsam ve geri dönüş raporlarda; ayrı issue/RFC sistemi uydurulmadı.',('seo','llms'))
sg('SEO01','6',NA,'N/A','Playbooktaki contact@figtures.com ajans sabitidir; Ziya Şakir Yılmaz site iletişiminin yerine konmaz. Proje içeriklerindeki gerçek iletişim korunur.')
sc('SEO02','1 2 3 4 5 7',TECH,'READY_FOR_LIVE','63-route envanter, 308 tek-hop yönlendirme, breadcrumb ve canonical/OG eşliği, en fazla iki tıkla erişim kontrolleri mevcut; yeni deployment HTTP kanıtı ayrıca alınır.',('seo','nav','http'))
sc('SEO02','6',NA,'N/A','Facet arama/filtre URL üretimi yok; iletişim query parametreleri temel sayfaya canonical olur.',('seo',))
sg('SEO02','1 2 3 7 8 9',TECH,'READY_FOR_LIVE','Tek public origin ve trailing slash, bilinmeyen URL 404, 3 emekli test 308, URL/breadcrumb envanteri kod ve kaynak testlerinde uygulanmış.',('seo','http','nav'))
sg('SEO02','4 5',NA,'N/A','Tek locale ve facetsiz site; hreflang/x-default veya facet noindex gerekmiyor.')
sg('SEO02','6',EXT,'OPEN','25 konu taslağı var; gerçek ilk 50 GSC sorgusu ve cannibalization sorgu sahipliği verisi yok.',('plan',))
sc('SEO03','1 3 5 6',TECH,'READY_FOR_LIVE','Robots/sitemap public origin ile üretilir; arama/sosyal erişim kapalı değildir, noindex sızıntısı ve normal/bot HTML eşliği HTTP ile tekrar denetlenir.',('seo','http'))
sc('SEO03','2',NA,'N/A','Ayrı staging ortamı yok; kullanıcı bu siteyi public yaptı. Admin/API korunur.',('http',))
sc('SEO03','4',NA,'N/A','Facet/infinite-calendar rotaları bulunmuyor.')
sg('SEO03','1 3 5 6',TECH,'READY_FOR_LIVE','Canonical kökü, robots, sitemap ve CSS/JS erişimi ortak kaynakla testlendi. Kamuya açma yetkisi kullanıcıdan mevcut.',('seo','http'))
sg('SEO03','2 7',NA,'N/A','Ayrı staging, facet veya infinite-calendar yüzeyi yok; mevcut public origin bilinçli yayındır.')
sg('SEO03','4',EXT,'OPEN','GSC property/DNS hesabı erişimi yok; sitemap yayınlamak Search Consolea gönderilmiş anlamına gelmez.')
sc('SEO04','1',EXT,'PARTIAL','63 URL anonim HTML içinde H1/ana içerik mevcut; GSC View crawled page içeriğine erişilmedi.',('http',))
sc('SEO04','2 3',EXT,'OPEN','Browser filmstrip/E2E ve GSC Inspection screenshot aracı yok; HTTP çıktısı bu kanıtın yerini tutmaz.',('http',))
sc('SEO04','4 5',TECH,'HTTP_BASELINE_TESTED','Deep-link GET ve farklı UA talepleri SSR title/H1/OG içeriğini döndürür; yeni release snapshotı tekrar alınır.',('http',))
sg('SEO04','1 2 3 5',TECH,'HTTP_BASELINE_TESTED','Tüm 63 sayfa SSR; başlık/ana içerik ve SEO meta ilk HTTP yanıtında. CSS/JS robots ile engellenmiyor.',('http','seo'))
sg('SEO04','4 6 7',EXT,'OPEN','GSC rendered page ve desteklenen tarayıcı E2E/screenshot kanıtı yok.',('http',))
sc('SEO05','1 3',TECH,'LOCAL_AND_HTTP_TESTED','Bütün 63 URLde title/description tekil; CMS düzenleme sonrası DOM meta parity negatif senaryoları geçti. Screaming Frog aracı çalışmış gibi gösterilmez.',('seo','http'))
sc('SEO05','2',EXT,'OPEN','Gerçek SERP pixel genişliği/font bold/truncation kontrolü henüz yok; karakter sayısı pixel testi yerine kullanılmadı.')
sc('SEO05','4',NA,'N/A','İkinci locale/hreflang kümesi yok.')
sc('SEO05','5',HUM,'PARTIAL','Yeni gizli metin, sahte review veya keyword listesi eklenmedi; özgün metinlerin tüm anlamsal/sayısal iddialarının editoryal QAı ayrıca yapılmalı.',('aeo','seo'))
sg('SEO05','1 2 3 7',TECH,'LOCAL_AND_HTTP_TESTED','Tekil başlık/description, Türkçe dil ve H1 ile CMS meta parity kontrolü mevcut.',('seo','http'))
sg('SEO05','4 5',NA,'N/A','İkinci dil bulunmuyor; Figtures ajans e-postası Ziya Beyin NAP bilgisi değildir.')
sg('SEO05','6',HUM,'PARTIAL','Gizli/sentetik schema yok; tüm özgün metnin clickbait veya kaynaksız iddia değerlendirmesi editör işi olarak açık.',('seo','aeo'))
sc('SEO06','1',EXT,'OPEN','Gerçek Google Rich Results servis sonucu yok; yerel validator ayrı raporlandı.',('seo',))
sc('SEO06','2 3 4 5',TECH,'LOCAL_TESTED','FAQ görünür metin eşliği, aggregateRating yokluğu, breadcrumb ve JSON schema/kimlik sözleşmesi kaynak testlerinde geçer.',('seo',))
sg('SEO06','1 3 4 5 6',TECH,'LOCAL_TESTED','Gerçek sayfa işlevlerine uygun tipler, görünür FAQ ve yasak rating kuralları, değişiklik raporu ve kullanıcı teknik uygulama yetkisi mevcut.',('seo',))
sg('SEO06','2',EXT,'OPEN','Haricî Rich Results Test çıktısı yok.',('seo',))
sc('SEO07','1 2 3 4 6',EXT,'OPEN','Gerçek tarayıcı/CrUX ölçümü yok; PageSpeed API denemesi mobil/masaüstünde 429 kota 0 ile reddedildi. LCP/CLS/INP skoru uydurulmadı.',('perf',))
sc('SEO07','5 7 8 9 10 12',TECH,'LOCAL_TESTED','Poster ilk HTMLde/high-priority; font/preconnect/erken CSS ve aktif-video preload yönetimi kaynakta var; TEDx bitince iframe temizlenir. Gerçek waterfall/tarayıcı sonucu değildir.',('perf',))
sc('SEO07','11',EXT,'OPEN','Başlangıç proxy HTTP süreleri 600ms hedefinden yüksek; ölçüm origin/browser TTFBden ayrılmalı. Gerçek hedef karşılandı denemez.',('http','perf'))
sg('SEO07','1 4',TECH,'PARTIAL','Medya/CSS/font ve üçüncü taraf kaynak envanteri ile somut azaltmalar mevcut; tüm route bütçeleri ve sürekli CI alert işletimi henüz kurulmadı.',('perf',))
sg('SEO07','2 3 5 6',EXT,'OPEN','Gerçek Lighthouse/CrUX baseline ve sonrası karşılaştırma verisi yok; kod testi performans puanı değildir.',('perf',))
sc('SEO08','1',EXT,'OPEN','LinkedIn/X/Meta hesabı inspector/debugger ve preview cache kontrolüne erişim yok.',('http',))
sc('SEO08','2 3 4 5',TECH,'READY_FOR_LIVE','Public origin OG görsel/URL düzeltmesi ve Türkçe og:locale server HTMLde; son yayın asset/scrape kayıtları tekrar alınır.',('seo','http'))
sg('SEO08','1 2 4 5 6 8',TECH,'READY_FOR_LIVE','SSR OG/Twitter, canonical eşliği ve açık bot erişimi mevcut; teknik değişiklik kullanıcı yetkili. Yeni HTTP kanıtı beklenir.',('seo','http'))
sg('SEO08','3',TECH,'PARTIAL','Görsel ölçü/format yanlış taşınması düzeltildi; mevcut OG boyutu ve gerçek LinkedIn kırpma/preview davranışı ayrı kontrol edilmeli.',('seo',))
sg('SEO08','7',EXT,'OPEN','Top 10 URL için haricî sosyal debugger sonucu yok.',('http',))
sc('SEO09','1 3 4 5 6 7 8 9 10 11 12',EXT,'OPEN','GSC/analytics dashboard, gerçek 28 günlük/haftalık trafik-index-CWV ve manual action verisine erişim yok; varsayımsal başarı veya incident yokluğu yazılmadı.')
sg('SEO09','1 2',EXT,'OPEN','Dashboard erişimi ve son iki haftalık gerçek izleme kaydı yok.')
sc('SEO10','1 2 3 4 5 13 14 15 16 25 26 27',EXT,'OPEN','GSC/CrUX, production logları, Rich Results ve sosyal debugger gibi gerçek dış servis sonuçları yok; HTTP kaynak kontrolü bu sonuçları taklit etmez.',('http','perf','seo'))
sc('SEO10','6 8 17',NA,'N/A','Özel alan adı/locale migrationı yapılmıyor ve ikinci locale yok. Mevcut public yayının yanlış canonicalı düzeltiliyor; migration trafik iyileşmesi veya hreflang uydurulmaz.')
sc('SEO10','7 11 12 19 20 21 22 23 24',TECH,'READY_FOR_LIVE','Route/redirect registry, self-canonical, robots/sitemap, 404/308 ve erişim kontrolleri kodda mevcut; son release anonim HTTP taramasıyla kapanır.',('seo','nav','http'))
sc('SEO10','9',HUM,'DOCUMENTED','Başlangıç kusurları, yapılan düzeltmeler, ölçüm sınırları ve tekrar komutları release raporlarında kayıtlı.',('seo','http','llms'))
sc('SEO10','10 18 28',HUM,'PARTIAL','Teknik değişiklikler kullanıcı yetkili ve testli; bütün programın dış ölçümü, bağımsız işletim signoffu ve gerçek staging rollback tatbikatı yapılmadı.',('http','plan'))
sg('SEO10','1 4',TECH,'READY_FOR_LIVE','Launch set/kesim kontrolü 63-route test ve deployment sonrası HTTP ile değerlendirilir; diğer ölçümler ayrı tutulur.',('http',))
sg('SEO10','2',TECH,'LOCAL_TESTED','Mevcut üç emekli test 308 yönlendirmesi ve slash davranışı kaynak ve HTTP başlangıçta test edildi; özel domain migrationı yok.',('http','seo'))
sg('SEO10','3 5 6',HUM,'OPEN','Gerçek rollback tatbikatı, T+7 işletim görevi ve bütün dış ölçümlerin kapanışı henüz yok; zaman gelmeden tamamlandı işaretlenmez.')

discovery_path=R/'public-audit/discovery-http.json'
if discovery_path.exists():
    live=json.loads(discovery_path.read_text())
    if live.get('status')=='PASS':
        g('GEO06','4 17',TECH,'LIVE_HTTP_TESTED',f"{live['completedAt']}: 23/23 link doğrudan 200, self-canonical, noindex yok ve SSR H1 mevcut; 3228 byte UTF-8, MIME ve bütçe geçti.",('llms','reports/public-audit/discovery-http.json'))
        g('GEO06','16',TECH,'PARTIAL','Canlı 200 UTF-8/MIME, OAI-SearchBot UA aynı çıktı ve SHA-256 ETag koşullu 304 geçti. Çok bölge compression/origin-edge fiziksel altyapı parity ölçümü ayrıca yok.',('llms','reports/public-audit/discovery-http.json'))
live_after=R/'public-audit/live-after.json'
if live_after.exists():
    final=json.loads(live_after.read_text())
    # Root crawler has its own full result semantics: do not infer a pass from file existence.
    source_index.append({'program':'LIVE_EVIDENCE','file':str(live_after.relative_to(ROOT)),'sha256':hashlib.sha256(live_after.read_bytes()).hexdigest(),'note':'Final live crawler output; inspect its summary/errors before closing related controls.'})
    summary=final.get('summary',{})
    if summary.get('routes')==63 and summary.get('successfulPages')==63 and summary.get('errors')==0 and summary.get('warnings')==0:
        for row in rows.values():
            if row['category']==TECH and row['status']=='READY_FOR_LIVE':
                row['status']='LOCAL_AND_LIVE_TESTED'
                row['postDeployVerification']={'timestamp':final['timestamp'],'routes':63,'errors':0,'warnings':0,'evidence':'reports/public-audit/live-after.json'}
                row['assessment']+=' Sonuç: son deployment sonrası 63 URLnin anonim HTTP denetimi 0 hata/0 uyarı ile geçti; yukarıdaki beklenen tekrar tamamlandı.'
                row['evidence'].append('reports/public-audit/live-after.json')

assert len(geo)==196
assert all('category' in r and r['assessment'] for r in rows.values())
assert len(rows)==len(set(rows))
for r in rows.values():
    for p in r['evidence']:
        if p.endswith('public-requirements-2026-10-12.json'):continue
        assert (ROOT/p).exists(),p
counts=dict(Counter(r['category'] for r in rows.values()))
record={
 'version':'1.0.0','assessedAt':'2026-10-12','authorization':'User explicitly authorized public access and further SEO/GEO/AEO implementation; no new permission gate is implied.',
 'scope':'All 196 original GEO checkbox controls, every SEO checkbox after normalizing Notion embedded HTML/escaped Markdown, every SEO final gate-table row; narrative section headings and original full source snapshots indexed separately.',
 'notAClaim':'Requirement coverage is not a percentage SEO score, a blanket PASS or a guarantee of indexation/citation. Compound controls keep their external/editorial remainder.',
 'counts':{'total':len(rows),'geo':len(geo),'seo':len(rows)-len(geo),'categories':counts},
 'categories':{TECH:'Implemented or locally testable technical work; row status and evidence define verification level.',EXT:'Real provider access, observation window, browser/validator or external measurement required.',HUM:'Substantive source/editorial review or ongoing human operational process; not a blanket technical blockade.',NA:'Scenario genuinely absent in this single-locale person website; reason recorded, not a pass claim.'},
 'sources':source_index,'controls':list(rows.values())}
(R/'public-requirements-2026-10-12.json').write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
md=['# SEO / GEO / AEO — madde düzeyinde kamuya açık yayın karşılaştırması','',
'12 Ekim 2026. Kullanıcının dış erişim ve teknik çalışma yetkisi mevcut. Önceki “özel site / onay yok” nedeniyle bütün maddeleri BLOCKED gösteren yaklaşım bu dosyada kullanılmaz. Teknik sonuç, gerçek dış ölçüm ve insan işletim kaydı ayrı ayrı değerlendirilir.','',
f'**Kapsam: {len(rows)} özgün kontrol — 196 GEO maddesi, {len(rows)-196} SEO kontrolü.** GEO madde kimlikleri ve özgün talepleri aynen korunur. SEO listeleri Notion içindeki `<br>` ve kaçışlı checkboxlar dahil çıkarılmıştır; `C` checklist, `G` final gate tablosu satırını belirtir. Bütün kaynak dosyaları ve SHA-256ları JSONda kayıtlıdır; ayrıca tüm anlatı bölüm başlıkları saklanır. Bu sayılar başarı/SEO yüzdesi değildir.','',
'Tam makine okunur karşılaştırma: [public-requirements-2026-10-12.json](./public-requirements-2026-10-12.json). Her satır özgün talep, kaynak URL, durum, somut kalan iş ve kanıt yolu taşır.','',
'| Kategori | Madde | Anlam |','|---|---:|---|']
labels={TECH:'Teknik uygulama / doğrulanabilir',EXT:'Dış erişim veya gerçek ölçüm',HUM:'Editoryal doğrulama / işletim',NA:'Bu siteye uygulanmaz'}
for k,v in counts.items():md.append(f'| {labels[k]} | {v} | {record["categories"][k]} |')
md+=['','## Gerçekten açık kalan işler','',
'1. **Lighthouse/CrUX ve tarayıcı:** mobil/masaüstü PageSpeed isteği 429 kota 0 ile reddedildi. Hız puanı, LCP/CLS/INP, pixel-width ve gerçek erişilebilirlik görsel kontrolü yok. Kaynak/HTTP testi eşdeğer değildir.',
'2. **Search Console/Bing ve gözlem süresi:** property/sitemap gönderimi, Googleın seçtiği canonical, index coverage, query/cannibalization ve gerçek trafik verisi için hesap erişimi gerekir. Yayın anında 28 günlük sonuç üretilmez.',
'3. **Haricî doğrulayıcı ve sosyal önizlemeler:** gerçek Rich Results ve LinkedIn/Meta/X inspector sonuçları yok. Yerel JSON/DOM parity ve 200 OG asset kontrolü ayrı, tamamlanmış teknik kanıtlardır.',
'4. **İçerik doğruluğu:** 26 kaynak kaydı, 23 makalede 62 bağlantı ve 30 doğrudan cevap mevcut; tüm kritik sayısal/psikolojik iddialar, eser sahipliği, medya izinleri ve uygun uzman incelemesi bunlarla otomatik doğrulanmaz. Gerçek konuşma transcriptleri ayrıca gerekir.',
'5. **Operasyon:** gerçek vendor-IP/WAF logları, devamlı alarm, source freshness/link-rot izleme, sorumlular, saklama/silme ve restore tatbikatı ayrıca işletilmelidir. Bu kayıtlar yok diye tamamlanmış metadata/schema testleri başarısız gösterilmez.',
'6. **AI cevap ölçümü:** 50 dengeli soru taslağı hazır; iki modelde gerçek tekrar/claim/citation ve kör evaluator sonuçları yok. Taslak dataset gerçek görünürlük skoru değildir.',
'7. **CMS bağlantısı:** Supabase hesabı/projesi bağlı değildir. Yerel auth/RLS/API testleri gerçek kullanıcıyla kayıt–yayın–revizyon–medya akışının uzak uçtan uca kanıtı değildir.','',
'## Gerçekten kapsam dışı senaryolar','',
'İkinci locale/hreflang, holding/franchise/yerel şube, rebrand/M&A, e-ticaret fiyat/stok/Offer, facet/infinite calendar, ücretli review programı ve mevcut olmayan domain migrationı bu kişisel Türkçe siteye sırf belge örneği olduğu için eklenmez. Playbooktaki `contact@figtures.com`, Ziya Beyin müşteri iletişim bilgisi yerine konmaz. Public olarak seçilen mevcut origin artık “staging” kabul edilip noindexe alınmaz.','',
'## Kontrol satırları','',
'`LOCAL_TESTED` yerel doğrulama, `READY_FOR_LIVE` kod hazır ancak son deployment HTTP kontrolü bekleniyor, `HTTP_BASELINE_TESTED` gerçek başlangıç HTTP kanıtı, `PARTIAL` bileşik gereksinimin anlamlı bir bölümü açık, `OPEN/NOT_MEASURED` kanıt henüz yok anlamına gelir. `AUTHORIZED_PARTIAL` kullanıcının uygulama izninin var olduğunu, başka insanların imzasının uydurulmadığını belirtir.','']
for gate in sorted(set(r['gate'] for r in rows.values())):
    md+=['### '+gate,'','| Kimlik | Özgün gereksinim | Kategori / durum | Değerlendirme |','|---|---|---|---|']
    for r in rows.values():
        if r['gate']!=gate:continue
        esc=lambda s:s.replace('|','\\|').replace('\n',' ')
        md.append(f'| {r["controlId"]} | {esc(r["requirement"])} | {labels[r["category"]]} · {r["status"]} | {esc(r["assessment"])} |')
    md.append('')
(R/'public-requirements-2026-10-12.md').write_text('\n'.join(md)+'\n')
print(json.dumps(record['counts'],ensure_ascii=False,indent=2))
