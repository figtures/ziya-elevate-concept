"""Build the bilingual event kit from approved profile copy and native project photos.
Run with the Codex primary Python runtime (reportlab, Pillow, fontTools).
"""
from pathlib import Path
import json, tempfile
from html import escape
from io import BytesIO
from PIL import Image as PILImage
from fontTools.ttLib import TTFont as FontFile
from fontTools.varLib.instancer import instantiateVariableFont
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image, Table, TableStyle, KeepTogether
from reportlab.lib.enums import TA_LEFT

ROOT=Path(__file__).resolve().parents[1]
DATA=json.loads((ROOT/'content/speaker-kit.json').read_text())
OUT=ROOT/'website/assets/ziya-sakir-yilmaz-speaker-kit.pdf'
navy=colors.HexColor('#111c33'); muted=colors.HexColor('#526071'); cream=colors.HexColor('#f6f3ed');gold=colors.HexColor('#b5a17d')
with tempfile.TemporaryDirectory() as tmp:
 for name,weight in [('Manrope',400),('ManropeBold',700)]:
  font=FontFile(ROOT/'scripts/assets/Manrope-Variable.ttf')
  static=instantiateVariableFont(font,{'wght':weight},inplace=True)
  p=Path(tmp)/(name+'.ttf');static.save(p);pdfmetrics.registerFont(TTFont(name,str(p)))
styles={
 'label':ParagraphStyle('label',fontName='ManropeBold',fontSize=9,leading=13,textColor=muted,spaceAfter=10),
 'title':ParagraphStyle('title',fontName='ManropeBold',fontSize=28,leading=35,textColor=navy,spaceAfter=20),
 'cover':ParagraphStyle('cover',fontName='ManropeBold',fontSize=34,leading=40,textColor=navy,spaceAfter=10),
 'head':ParagraphStyle('head',fontName='ManropeBold',fontSize=15,leading=21,textColor=navy,spaceAfter=10,spaceBefore=14),
 'body':ParagraphStyle('body',fontName='Manrope',fontSize=11,leading=17,textColor=navy,spaceAfter=12),
 'small':ParagraphStyle('small',fontName='Manrope',fontSize=9,leading=13.5,textColor=muted,spaceAfter=8),
 'tiny':ParagraphStyle('tiny',fontName='Manrope',fontSize=8,leading=12,textColor=muted,spaceAfter=6),
}
W,H=595.276,841.89;M=48;CW=W-2*M
story=[]
def p(text,style='body'):return Paragraph(text,styles[style])
def paras(text,style='body'):
 for part in text.split('\n\n'):story.append(p(escape(part),style))
def header(label,title):
 story.extend([p(label,'label'),p(title,'title')])
def linked(label,url):return '<link href="'+escape(url,quote=True)+'" color="#111c33"><u>'+escape(label)+'</u></link>'
def photo(asset,width,height):
 im=PILImage.open(ROOT/'website/assets'/asset).convert('RGB')
 # Fit without inventing new pixels; embedded photographs keep their native source resolution.
 ratio=min(width/im.width,height/im.height)
 b=BytesIO();im.save(b,'JPEG',quality=92);b.seek(0)
 return Image(b,width=im.width*ratio,height=im.height*ratio)
def footer(c,doc):
 c.saveState();c.setFillColor(navy);c.setFont('Manrope',8)
 c.drawString(M,27,'ZIYA ŞAKİR YILMAZ  /  SPEAKER KIT')
 c.drawRightString(W-M,27,str(doc.page))
 c.restoreState()
logo=PILImage.open(ROOT/'website/assets/logo-zsy.png')
story.append(Image(str(ROOT/'website/assets/logo-zsy.png'),width=84,height=84*logo.height/logo.width,hAlign='LEFT'))
story.append(Spacer(1,20));story.extend([p('Ziya Şakir Yılmaz','cover'),p('Başarı Mühendisi · Success Engineer','head'),p('Konuşmacı dosyası / Speaker kit','label')])
story.append(photo('tedx-oan-sahne-genis.jpg',CW,260));story.append(Spacer(1,10))
row=Table([[photo('salon-genis.webp',CW*.62,150),photo('ziya-portre.jpg',CW*.32,150)]],colWidths=[CW*.65,CW*.35]);row.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'MIDDLE'),('LEFTPADDING',(0,0),(-1,-1),0),('RIGHTPADDING',(0,0),(-1,-1),0)]));story.append(row)
story.append(Spacer(1,16));story.append(p('Başarı · Kafa Yapısı · Satış · Liderlik<br/>Success · Mindset · Sales · Leadership','body'))
story.append(p(linked('ziyasakiryilmaz.com','https://ziyasakiryilmaz.com/')+' · Türkçe / English','small'));story.append(PageBreak())
for lang in ['tr','en']:
 header('BİYOGRAFİ / TÜRKÇE' if lang=='tr' else 'BIOGRAPHY / ENGLISH','Etkinlik duyuruları için' if lang=='tr' else 'For your event announcement')
 for n in ['50','150']:
  story.append(p(n+(' kelime' if lang=='tr' else ' words'),'head'));paras(DATA['bios'][lang][n]);story.append(Spacer(1,10))
 story.append(PageBreak())
 header('BİYOGRAFİ / TÜRKÇE' if lang=='tr' else 'BIOGRAPHY / ENGLISH','Uzun biyografi' if lang=='tr' else 'Extended biography')
 story.append(p('300 kelime' if lang=='tr' else '300 words','label'));paras(DATA['bios'][lang]['300']);story.append(PageBreak())
keynotes={
 'tr':[
 ('Başarının Mühendisliği Vardır','Yıllık kickoff, şirket toplantısı, girişimci zirvesi.','Ben Yasası, Sitem/Sistem yaklaşımı ve kendi ilk çalışan sistemini kurmak için kullanılabilecek net bir başlangıç çerçevesi.'),
 ('Kurşun Geçirmez Kafa Yapısı','Değişim dönemindeki kurumlar, satış ekipleri, baskı altında çalışan ekipler.','İçindeki Sabotajcı’yı fark etmek, HENÜZ–RAĞMEN–MÜMKÜN dilini kullanmak ve zor anlarda uygulanabilecek 90 saniyelik bir dur–gör–seç refleksi.'),
 ('Satışın Mühendisliği','Satış zirveleri, B2B ekipleri, bayi toplantıları.','Müşterinin ihtiyacını teşhis etmek; değer, kanıt, karar ve takip üzerinden satış görüşmesini yapılandırmak.'),
 ('Liderlik: Etkiyi Çoğaltmak','Yönetici zirveleri, liderlik programları, aile şirketleri.','Gör, göster, geliştir, geri çekil ve çoğalt döngüsüyle başka liderler yetiştirmeye odaklanmak.')],
 'en':[
 ('Engineering Success','Company kickoffs, company gatherings and entrepreneur events.','The Ben Yasası principle, moving from complaint to system building, and a clear starting framework for building a first working system.'),
 ('Bulletproof Mindset','Teams navigating change, sales pressure, rejection or uncertainty.','Recognising the inner saboteur, using NOT YET–DESPITE–POSSIBLE, and practising a 90-second pause–notice–choose response.'),
 ('The Engineering of Sales','Sales conferences, B2B teams and dealer meetings.','Diagnosing the customer’s need and structuring the conversation around value, evidence, decisions and follow-through.'),
 ('Leadership: Multiplying Impact','Management teams, leadership programmes and family businesses.','Developing other leaders through observation, demonstration, development, stepping back and multiplication.')]
}
for lang in ['tr','en']:
 header('KONUŞMA KONULARI' if lang=='tr' else 'KEYNOTE THEMES','Dört keynote' if lang=='tr' else 'Four keynotes')
 story.append(p('Format: 45 / 60 / 90 '+('dakika. Süre ve kapsam etkinliğinize göre birlikte belirlenir.' if lang=='tr' else 'minutes. Duration and scope are agreed for your event.'),'small'))
 for i,(title,audience,content) in enumerate(keynotes[lang],1):
  story.append(KeepTogether([p(f'{i:02}  {escape(title)}','head'),p(('<b>Hedef kitle:</b> ' if lang=='tr' else '<b>For:</b> ')+escape(audience),'body'),p(escape(content),'body')]))
 story.append(PageBreak())
header('ETKİNLİK HAZIRLIĞI / EVENT PLANNING','Format ve iletişim')
story.append(p('Türkçe / English · 45 / 60 / 90 dk<br/>Sahne / hibrit / online · In person / hybrid / online','head'))
story.append(p('Teknik hazırlık / Technical preparation','head'))
story.append(p('Sahne için net ses sağlayan yaka veya kulaklık mikrofonu, sunum ekranı, sunum kumandası ve teknik prova planlanır. Hibrit ve online etkinliklerde kararlı bağlantı, ses kontrolü ve platform provası yapılır. Kesin teknik akış organizasyon ekibiyle birlikte netleştirilir.','small'))
story.append(p('For in-person events, plan a headset or lapel microphone, presentation screen, clicker and a technical check. Hybrid and online events require a stable connection, audio check and platform rehearsal. The final technical brief is agreed with your production team.','small'))
story.append(p('Sahne kaynakları / Event sources','head'))
for event in DATA['eventSources']:story.append(p(linked(event['label'],event['url']),'small'))
story.append(p('İletişim / Contact','head'))
story.append(p(linked('Etkinlik daveti / Event inquiry','https://ziyasakiryilmaz.com/iletisim/?konu=konusmaci#talep-formu')+'<br/>'+linked('WhatsApp +90 532 646 77 55','https://wa.me/905326467755')+'<br/>'+linked('English speaker page','https://ziyasakiryilmaz.com/en/speaker/'),'small'))
story.append(p(linked('LinkedIn','https://tr.linkedin.com/in/ziyayilmaz')+' · '+linked('Instagram @ziyasakir','https://www.instagram.com/ziyasakir/')+' · '+linked('YouTube','https://www.youtube.com/@ZiyaSakirYlmaz'),'small'))
story.append(p('Fotoğraflar ve logo / Photos and logo','head'))
for asset in DATA['photoAssets']:
 im=PILImage.open(ROOT/'website/assets'/asset)
 story.append(p(linked(asset,f'https://ziyasakiryilmaz.com/assets/{asset}')+f' · {im.width} × {im.height} px','tiny'))
story.append(p(linked('Logo PNG','https://ziyasakiryilmaz.com/assets/logo-zsy.png')+' · '+linked('Website','https://ziyasakiryilmaz.com/'),'tiny'))
story.append(p('Fotoğraflar mevcut kaynak çözünürlüklerinde sunulur. / Photographs are provided at their available source resolution.','tiny'))
SimpleDocTemplate(str(OUT),pagesize=(W,H),leftMargin=M,rightMargin=M,topMargin=42,bottomMargin=48,title='Ziya Şakir Yılmaz Speaker Kit',author='Ziya Şakir Yılmaz',subject='Bilingual speaker biography, keynotes and event planning',pageCompression=1).build(story,onFirstPage=footer,onLaterPages=footer)
public=ROOT/'public/assets'/OUT.name;public.parent.mkdir(parents=True,exist_ok=True);public.write_bytes(OUT.read_bytes())
assert OUT.stat().st_size < 10_000_000
print(f'{OUT}: {OUT.stat().st_size} bytes')
for lang,versions in DATA['bios'].items():
 for words,text in versions.items():assert len(text.split())==int(words),(lang,words)
