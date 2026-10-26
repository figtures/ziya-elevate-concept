-- Reviewed V13 launch bootstrap for the explicitly requested NEW press page.
-- Apply after the template-registration migration, before deploying V13.
-- Only a newly inserted document may produce a publication or history row.
-- Existing IDs OR routes (including drafts, archived pages, renamed pages and
-- deliberately unpublished pages) are never edited or republished. Rerunnable.
-- Do not use the general seed installer here: it can republish existing rows.
begin;
with inserted as (
  insert into public.cms_documents(id,route,kind,draft,revision,published_revision,archived)
  select '/basin/','/basin/','page',$v13_press_payload$
{
  "id": "/basin/",
  "route": "/basin/",
  "template": "/basin/",
  "kind": "page",
  "title": "Basın / Medya Kiti | Ziya Şakir Yılmaz",
  "description": "Ziya Şakir Yılmaz’ın konuşma konularına, basın ve etkinlik dosyalarına, resmî sosyal medya profillerine ve tarihli dijital etki verilerine ulaşın.",
  "ogImage": "/assets/og/ziya-sakir-yilmaz.png",
  "values": {
    "87bb6dfb-v13-generated-85:@src": "/assets/hero-loop-restored-1440.mp4",
    "87bb6dfb-v13-generated-85:@poster": "/assets/hero-restored-poster.jpg",
    "87bb6dfb-v13-generated-85:@data-start-at": "7.6",
    "87bb6dfb-v13-generated-85:focal": "center center",
    "87bb6dfb-v13-generated-87:text": "Ziya Şakir Yılmaz",
    "87bb6dfb-v13-generated-87:@href": "/",
    "87bb6dfb-v13-generated-88:text": "Etkinlik ve basın",
    "87bb6dfb-v13-generated-89:text": "Basın / Medya Kiti",
    "87bb6dfb-v13-generated-90:text": "Konuşma konuları, basın ve etkinlik dosyaları, tarihli dijital etki verileri.",
    "87bb6dfb-v13-generated-94:text": "Videoyu duraklat",
    "87bb6dfb-v13-generated-99:text": "Etkinlik ve basın",
    "87bb6dfb-v13-generated-100:text": "Ziya Bey’i daha",
    "87bb6dfb-v13-generated-101:tail": "yakından tanıyın.",
    "87bb6dfb-v13-generated-103:@href": "/konusmaci/",
    "87bb6dfb-v13-generated-104:text": "Konuşma konuları ve TEDx arşivi",
    "87bb6dfb-v13-generated-107:@href": "/kitaplar/",
    "87bb6dfb-v13-generated-108:text": "Kitapları",
    "87bb6dfb-v13-generated-111:@href": "/iletisim/?konu=basin",
    "87bb6dfb-v13-generated-112:text": "Basın kiti talep et",
    "87bb6dfb-v13-generated-117:text": "Basın ve etkinlik dosyaları",
    "87bb6dfb-v13-generated-121:text": "Yüksek çözünürlüklü fotoğraflar, kısa ve uzun biyografi, konuşma konuları ve logo kullanım rehberi tek pakette.",
    "87bb6dfb-v13-generated-122:text": "Basın Kitini İste ",
    "87bb6dfb-v13-generated-122:@href": "/iletisim/?konu=basin#talep-formu",
    "87bb6dfb-v13-generated-125:text": "Konuşmacı Sayfası",
    "87bb6dfb-v13-generated-125:@href": "/konusmaci/",
    "87bb6dfb-v13-generated-126:@href": "https://tr.linkedin.com/in/ziyayilmaz",
    "87bb6dfb-v13-generated-127:text": "LinkedIn",
    "87bb6dfb-v13-generated-128:text": "Profil",
    "87bb6dfb-v13-generated-129:@href": "https://www.instagram.com/ziyasakir/",
    "87bb6dfb-v13-generated-130:text": "Instagram @ziyasakir",
    "87bb6dfb-v13-generated-131:text": "Profil",
    "87bb6dfb-v13-generated-132:@href": "https://www.youtube.com/@ZiyaSakirYlmaz",
    "87bb6dfb-v13-generated-133:text": "YouTube",
    "87bb6dfb-v13-generated-134:text": "Kanal",
    "87bb6dfb-v13-generated-135:@href": "https://www.kitapyurdu.com/yazar/ziya-sakir-yilmaz/203025.html",
    "87bb6dfb-v13-generated-136:text": "Kitapyurdu yazar sayfası",
    "87bb6dfb-v13-generated-137:text": "Kitaplar",
    "87bb6dfb-v13-generated-140:text": "DİJİTAL ETKİ · TARİHLİ VERİLER",
    "87bb6dfb-v13-generated-144:text": "Bu bölüm çeyrekte bir güncellenir; rakamlar tarihlidir. Kaynak: Favikon sosyal medya etki gücü sıralaması ve platform sayaçları (29 Eylül 2026).",
    "87bb6dfb-v13-generated-145:text": "Favikon etki sıralamasında motivasyon ve kişisel gelişimde Instagram ve LinkedIn'de Türkiye 2.si; tüm kategorilerde Türkiye 23.sü.",
    "87bb6dfb-v13-generated-146:text": "687.000+",
    "87bb6dfb-v13-generated-147:text": "Instagram 630.000+ · LinkedIn 57.000+ · YouTube, Facebook ve Telegram toplulukları.",
    "87bb6dfb-v13-generated-148:text": "Türkiye 2.si",
    "87bb6dfb-v13-generated-149:text": "Instagram'da Türkiye #2, dünyada #101 · LinkedIn'de Türkiye #2, dünyada #76.",
    "87bb6dfb-v13-generated-150:text": "Türkiye 2.si",
    "87bb6dfb-v13-generated-151:text": "Instagram'da Türkiye #2 · LinkedIn'de Türkiye #28.",
    "87bb6dfb-v13-generated-152:text": "Türkiye 23.sü",
    "87bb6dfb-v13-generated-153:text": "Tüm sosyal medya kategorileri genelinde Türkiye sıralaması."
  },
  "sections": [
    {
      "id": "87bb6dfb-v13-generated-83",
      "source": "87bb6dfb-v13-generated-83",
      "hidden": false,
      "values": {},
      "groups": []
    },
    {
      "id": "87bb6dfb-v13-generated-95",
      "source": "87bb6dfb-v13-generated-95",
      "hidden": false,
      "values": {},
      "groups": []
    }
  ],
  "ogImageAlt": "Yaşamak. Anlamak. Paylaşmak. — Ziya Şakir Yılmaz adını içeren paylaşım görseli.",
  "ogImageAltFor": "/assets/og/ziya-sakir-yilmaz.png"
}
$v13_press_payload$::jsonb,1,1,false
  where not exists (
    select 1 from public.cms_documents where id='/basin/' or route='/basin/'
  )
  on conflict do nothing
  returning id,route,kind,draft,revision
), published as (
  insert into public.cms_published(id,route,kind,payload,revision)
  select id,route,kind,draft,revision from inserted
  returning id
)
insert into public.cms_versions(document_id,payload,revision,action)
select inserted.id,inserted.draft,inserted.revision,'seed'
from inserted join published using(id);
commit;
