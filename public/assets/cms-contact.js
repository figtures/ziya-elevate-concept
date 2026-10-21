/* Enabled by the server only after the Supabase contact function is configured. */
(() => {
 const script=document.currentScript,form=document.getElementById('contactForm');if(!form)return;
 const url=script.dataset.endpoint,key=script.dataset.key,en=form.dataset.language==='en';
 let content={};try{content=JSON.parse(document.getElementById('cms-contact-content')?.textContent||'{}');}catch{}
 const text=(key,fallback)=>typeof content[key]==='string'?content[key]:fallback;
 const phone=/^\d{7,15}$/.test(content.phone||'')?content.phone:'905326467755';
 const hp=document.createElement('input');hp.name='website';hp.tabIndex=-1;hp.autocomplete='off';hp.setAttribute('aria-hidden','true');hp.style.cssText='position:absolute;left:-10000px;width:1px;height:1px';form.append(hp);
 form.dataset.cmsConnected='true';
 const submit=form.querySelector('[type=submit]');submit.textContent=text('submitLabel',en?'Send inquiry':'Talebimi gönder');let busy=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();if(busy||!form.reportValidity())return;
  const get=id=>document.getElementById(id)?.value.trim()||'';
  const topic=get('konu'),corporate=['konusmaci','kurumsal'].includes(topic),keynote=topic==='konusmaci';
  const message=get('mesaj');
  if(message.length<10){document.getElementById('mesaj').setCustomValidity(text('minMessageText',en?'Please describe your inquiry in at least 10 characters.':'Lütfen talebinizi en az 10 karakterle açıklayın.'));form.reportValidity();document.getElementById('mesaj').setCustomValidity('');return;}
  const attendeeNames={'under-100':'100’den az','100-500':'100–500','500+':'500+'};
  // Keep all inquiry details together in the existing CRM record; the Edge Function
  // validates the combined message and inserts it atomically before returning its ID.
  const details=[get('telefon')&&'Telefon: '+get('telefon'),get('sehir')&&'Şehir: '+get('sehir'),keynote&&get('etkinlik-tarihi')&&'Etkinlik tarihi: '+get('etkinlik-tarihi'),keynote&&attendeeNames[get('katilimci-sayisi')]&&'Katılımcı sayısı: '+attendeeNames[get('katilimci-sayisi')],en&&'İletişim dili: English'].filter(Boolean);
  const payload={name:get('ad'),email:get('ep'),company:corporate?get('firma'):'',team_size:keynote?(attendeeNames[get('katilimci-sayisi')]||''):corporate?get('ekip'):'',topic,message:[...details,'',message].join('\n').trim(),website:hp.value};
  busy=true;submit.disabled=true;submit.textContent=text('sendingLabel',en?'Sending…':'Gönderiliyor…');let success=false,error='';
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const body=await r.json();if(!r.ok||!body.ok||!body.id)throw Error(body.error||(en?'Your inquiry could not be saved.':'Talep kaydedilemedi.'));success=true;}catch(err){error=err.message||(en?'Could not connect.':'Bağlantı kurulamadı.');}
  const preview=document.getElementById('contactPreview');preview.querySelector('h3').textContent=success?text('successTitle',en?'Your inquiry has been received.':'Talebiniz alındı.'):text('errorTitle',en?'Your inquiry could not be saved.':'Talep kaydedilemedi.');preview.querySelector('p').textContent=success?text('successText',en?'Thank you. We have received your inquiry and will contact you within 48 hours.':'Teşekkürler. Talebiniz bize ulaştı. En geç 48 saat içinde sizinle iletişime geçeceğiz.'):error+' '+text('errorText',en?'Please try again or continue on WhatsApp.':'Tekrar deneyebilir veya WhatsApp üzerinden gönderebilirsiniz.');
  const prepared=[text('greeting',en?'Hello Ziya,':'Merhaba Ziya Bey,'),document.getElementById('konu').selectedOptions[0].text,'Ad Soyad: '+payload.name,'E-posta: '+payload.email,payload.company&&'Şirket / Kurum: '+payload.company,payload.team_size&&'Ekip / katılımcı: '+payload.team_size,payload.message].filter(Boolean).join('\n');document.getElementById('preparedMessage').textContent=prepared;document.getElementById('sendWhatsApp').href='https://wa.me/'+phone+'?text='+encodeURIComponent(prepared);preview.hidden=false;preview.setAttribute('role','status');preview.scrollIntoView({block:'center',behavior:'smooth'});
  busy=false;submit.disabled=false;submit.textContent=success?text('againLabel',en?'Send a new inquiry':'Yeni talep gönder'):text('retryLabel',en?'Try again':'Tekrar dene');
 },true);
})();
