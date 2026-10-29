// Translate the shared navigation labels without maintaining a second menu tree.
const labels={
 'KEYNOTE · EĞİTİM · MENTORLUK':'KEYNOTE · TRAINING · MENTORING',
 'Başarı':'Success','Kafa Yapısı':'Mindset','Satış':'Sales','Liderlik':'Leadership',
 'Eğitimler':'Training','Konuşmacı':'Speaker','Ziya':'About Ziya','Birlikte çalışalım':'Work with Ziya',
 'Etkinliğiniz, ekibiniz veya kendi gelişiminiz için.':'For your event, your team or your next step.',
 'Kendim için':'For individuals','Kurumum için':'For organisations','Kitaplar':'Books','Makaleler':'Articles',
 'Mentorluk':'Mentoring','Kendini test et':'Explore your mindset','Menü':'Menu','Ziya hakkında':'About Ziya',
 'Keşfet':'Explore','Başarı Sözlüğü':'Success Glossary','Sistemler':'Approaches',
 'Başarı Mühendisliği™':'Success Engineering™','Kurşun Geçirmez Kafa Yapısı™':'Bulletproof Mindset™',
 'Kafa Yapısı Testi':'Mindset Assessment','Test hakkında':'About the assessment','Araştırmalar':'Research',
 'Hayattan Notlar':'Notes on Life','Buradan Başla':'Start here','Bülten':'Newsletter','İletişim':'Contact',
 'Basın / Medya Kiti':'Press / Media Kit',
 'Kurumsal programlar':'Corporate programmes','Satışın Mühendisliği':'Sales Engineering',
 'Liderlik: Etkiyi Çoğaltmak':'Leadership: Multiplying Impact',
 'Kurşun Geçirmez Kafa Yapısı™ Atölyesi':'Bulletproof Mindset™ Workshop',
 'Başarının mühendisliği vardır.':'Success can be engineered.',
 'Başarı, kafa yapısı, satış ve liderlik üzerine fikirler, sistemler ve uygulama araçları.':'Ideas, systems and practical tools for success, mindset, sales and leadership.'
};
export function applySpeakerLocale(document,payload){
 if(payload.route!=='/en/speaker/')return;
 const translate=node=>{for(const child of [...node.childNodes]){
  if(child.nodeType===3){const key=child.nodeValue.trim();if(labels[key])child.nodeValue=child.nodeValue.replace(key,labels[key]);}
  else if(child.nodeType===1&&!['SVG','SCRIPT','STYLE'].includes(child.tagName))translate(child);
 }};
 for(const root of document.querySelectorAll('body > header,body > footer')){
  translate(root);
  for(const node of root.querySelectorAll('[aria-label]')){const label=node.getAttribute('aria-label');const mapped={'Ana menü':'Main navigation','Sosyal medya':'Social media'};if(mapped[label])node.setAttribute('aria-label',mapped[label]);}
  for(const a of root.querySelectorAll('a[href]')){
   const href=a.getAttribute('href');
   if(a.textContent.trim()==='Speaker · English'){a.textContent='Speaker · Türkçe';a.setAttribute('href','/konusmaci/');a.setAttribute('hreflang','tr');a.setAttribute('lang','tr');continue;}
   if(href==='/konusmaci/')a.setAttribute('href','/en/speaker/');
   else if(href==='/iletisim/')a.setAttribute('href','#inquiry');
   else if(href?.startsWith('/')&&!href.startsWith('/en/'))a.setAttribute('hreflang','tr');
  }
 }
 document.querySelector('.hamb')?.setAttribute('aria-label','Open navigation');
}
