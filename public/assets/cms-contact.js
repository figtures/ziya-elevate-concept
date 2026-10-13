/* Enabled by the server only after the Supabase contact function is configured. */
(() => {
 const script=document.currentScript,form=document.getElementById('contactForm');if(!form)return;
 const url=script.dataset.endpoint,key=script.dataset.key;
 let content={};try{content=JSON.parse(document.getElementById('cms-contact-content')?.textContent||'{}');}catch{}
 const text=(key,fallback)=>typeof content[key]==='string'?content[key]:fallback;
 const phone=/^\d{7,15}$/.test(content.phone||'')?content.phone:'905326467755';
 const hp=document.createElement('input');hp.name='website';hp.tabIndex=-1;hp.autocomplete='off';hp.setAttribute('aria-hidden','true');hp.style.cssText='position:absolute;left:-10000px;width:1px;height:1px';form.append(hp);
 const submit=form.querySelector('[type=submit]');submit.textContent=text('submitLabel','Talebimi gönder');let busy=false;
 form.addEventListener('submit',async e=>{
  e.preventDefault();e.stopImmediatePropagation();if(busy||!form.reportValidity())return;
  const get=id=>document.getElementById(id)?.value.trim()||'';const payload={name:get('ad'),email:get('ep'),company:get('firma'),team_size:get('ekip'),topic:get('konu'),message:get('mesaj'),website:hp.value};
  if(payload.message.length<10){document.getElementById('mesaj').setCustomValidity(text('minMessageText','Lütfen talebinizi en az 10 karakterle açıklayın.'));form.reportValidity();document.getElementById('mesaj').setCustomValidity('');return;}
  busy=true;submit.disabled=true;submit.textContent=text('sendingLabel','Gönderiliyor…');let success=false,error='';
  try{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',apikey:key},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const body=await r.json();if(!r.ok||!body.ok||!body.id)throw Error(body.error||'Talep kaydedilemedi.');success=true;}catch(err){error=err.message||'Bağlantı kurulamadı.';}
  const preview=document.getElementById('contactPreview');preview.querySelector('h3').textContent=success?text('successTitle','Talebiniz alındı.'):text('errorTitle','Talep kaydedilemedi.');preview.querySelector('p').textContent=success?text('successText','Ekibimiz ilettiğiniz e-posta üzerinden sizinle iletişime geçebilir. Dilerseniz WhatsApp üzerinden de devam edebilirsiniz.'):error+' '+text('errorText','Tekrar deneyebilir veya WhatsApp üzerinden gönderebilirsiniz.');
  const message=[text('greeting','Merhaba Ziya Bey,'),document.getElementById('konu').selectedOptions[0].text,'Ad Soyad: '+payload.name,'E-posta: '+payload.email,payload.company,payload.team_size,payload.message].filter(Boolean).join('\n');document.getElementById('preparedMessage').textContent=message;document.getElementById('sendWhatsApp').href='https://wa.me/'+phone+'?text='+encodeURIComponent(message);preview.hidden=false;preview.setAttribute('role','status');preview.scrollIntoView({block:'center',behavior:'smooth'});
  busy=false;submit.disabled=false;submit.textContent=success?text('againLabel','Yeni talep gönder'):text('retryLabel','Tekrar dene');
 },true);
})();
