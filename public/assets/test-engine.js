/* Client-authored 20 questions / five layers. Answers remain in this page. */
(() => {
  'use strict';
  const D = window.TEST_DEF;if (!D) return;
  let content={};try{content=JSON.parse(document.getElementById('cms-test-content')?.textContent||'{}');}catch{}
  const text=(key,fallback)=>typeof content[key]==='string'?content[key]:fallback;
  const $ = id => document.getElementById(id);const answers = [];
  let index = 0, report = '';
  const show = () => {
    const q = D.questions[index];
    $('qLayer').textContent = text('layerPrefix','Katman: ')+D.layers[q.l].name;$('qText').textContent = q.q;
    $('qNum').textContent = text('questionPrefix','Soru ')+(index+1);$('bar').style.width = (index / D.questions.length * 100)+'%';
    $('qOpts').replaceChildren();
    q.o.forEach(([text, points]) => {
      const button = document.createElement('button');button.type = 'button';button.textContent = text;
      button.addEventListener('click', () => {answers[index] = points;if (index < D.questions.length-1) {index++;show();} else finish();});
      $('qOpts').append(button);
    });
    $('previousQuestion').disabled = index === 0;$('qText').focus({preventScroll:true});
    $('quiz').scrollIntoView({block:'center',behavior:'instant'});
  };
  const finish = () => {
    $('quiz').hidden = true;$('result').hidden = false;
    const layers = Object.keys(D.layers).map(key => {
      const points = D.questions.map((q,i) => q.l === key ? answers[i] : null).filter(v => v !== null);
      return {key,name:D.layers[key].name,score:Math.round((points.reduce((a,b)=>a+b,0)-points.length)/(points.length*3)*100)};
    });
    const score = Math.round((answers.reduce((a,b)=>a+b,0)-D.questions.length)/(D.questions.length*3)*100);
    const weakest = [...layers].sort((a,b)=>a.score-b.score)[0],strongest = [...layers].sort((a,b)=>b.score-a.score)[0];
    const verdict = D.verdicts.find(v=>score>=v.min) || D.verdicts.at(-1);
    $('scoreNum').textContent = score;$('verdict').textContent = verdict.v;$('verdictText').textContent = verdict.vt;
    $('layerBars').replaceChildren();
    layers.forEach(layer => {
      const row=document.createElement('div');row.className='layer-bar';const head=document.createElement('div');head.className='lb-head';
      const name=document.createElement('b');name.textContent=layer.name;const num=document.createElement('span');num.textContent=layer.score+'/100';head.append(name,num);
      const track=document.createElement('div');track.className='track';const fill=document.createElement('i');fill.className='fill';fill.style.width=layer.score+'%';track.append(fill);
      row.append(head,track);$('layerBars').append(row);
    });
    $('strongText').textContent = strongest.name+' ('+strongest.score+'/100). '+text('strongSuffix','Gelişim yolculuğunda bu katmandan güç al.');
    const weakTip = weakest.score >= 75 ? text('maintainTip','Bu katmanda da güçlü bir öz değerlendirme yaptın. Kazandığın alışkanlıkları sürdür; aşağıdaki adımları düzenli hatırlatıcı olarak kullan.') : D.layers[weakest.key].tip;
    $('weakText').textContent = weakest.name+' ('+weakest.score+'/100): '+weakTip;
    $('weakBox').querySelector('.cap-tag').textContent = weakest.score >= 75 ? text('maintainLabel','Sürdürülecek alışkanlık') : text('weakLabel','Gelişim alanın');
    const steps=D.layers[weakest.key].steps || [];$('stepsList').replaceChildren();
    steps.forEach(([title,text])=>{const li=document.createElement('li');const b=document.createElement('b');b.textContent=title+' ';li.append(b,document.createTextNode(text));$('stepsList').append(li);});
    report=[text('reportTitle','KURŞUN GEÇİRMEZ KAFA YAPISI · KİŞİSEL RAPOR'),text('reportAuthor','Ziya Şakir Yılmaz'),new Date().toLocaleDateString('tr-TR'),'',text('reportScorePrefix','Genel skor: ')+score+'/100',verdict.v,verdict.vt,'',...layers.map(l=>l.name+': '+l.score+'/100'),'',text('reportStrongPrefix','Güçlü katman: ')+strongest.name,text('reportWeakPrefix','Odak katman: ')+weakest.name,weakTip,'',text('reportStepsLabel','İLK ÜÇ ADIM'),...steps.map((s,i)=>(i+1)+'. '+s.join(' ')),'',text('reportDisclaimer','Bu sonuç klinik veya psikolojik bir değerlendirme değildir; kişisel farkındalık ve gelişim aracıdır.')].join('\n');
    $('result').focus({preventScroll:true});$('result').scrollIntoView({block:'start',behavior:'instant'});
  };
  $('startBtn').addEventListener('click',()=>{$('intro').hidden=true;$('quiz').hidden=false;show();});
  $('previousQuestion').addEventListener('click',()=>{if(index>0){index--;show();}});
  $('downloadReport').addEventListener('click',()=>{
    const url=URL.createObjectURL(new Blob(['\uFEFF'+report],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='kursun-gecirmez-kafa-yapisi-raporum.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  $('retryBtn')?.addEventListener('click',()=>{answers.length=0;index=0;$('result').hidden=true;$('quiz').hidden=false;show();});
})();
