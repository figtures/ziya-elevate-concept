/* Personal 66-day practice. No account, network request or fabricated lesson plan. */
(function () {
  'use strict';
  const host = document.querySelector('[data-habit-plan]');
  if (!host) return;
  const storageKey = 'zsy:habit-plan:v1';
  const form = host.querySelector('[data-plan-form]');
  const progress = host.querySelector('[data-plan-progress]');
  const status = host.querySelector('[data-plan-status]');
  const input = host.querySelector('#plan-start');
  const goalInput = host.querySelector('#plan-goal');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const dayNumber = value => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return NaN; const d = new Date(`${value}T12:00:00Z`); return Number.isFinite(d.getTime()) && d.toISOString().slice(0, 10) === value ? Math.floor(d.getTime() / 86400000) : NaN; };
  const dayLabel = value => new Intl.DateTimeFormat('tr-TR', {day: 'numeric', month: 'long'}).format(new Date(`${value}T12:00:00Z`));
  const dateAt = index => new Date((dayNumber(plan.start) + index) * 86400000).toISOString().slice(0, 10);
  const valid = value => value?.version === 1 && typeof value.goal === 'string' && value.goal.trim().length > 0 && value.goal.length <= 180 && Number.isFinite(dayNumber(value.start)) && value.start <= today() && Array.isArray(value.done) && value.done.every(n => Number.isInteger(n) && n >= 0 && n < 66);
  let plan = null;
  let persistent = true;
  input.max = today(); input.value = today();
  try { const saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); if (valid(saved)) plan = {...saved, done: [...new Set(saved.done)]}; }
  catch { persistent = false; }
  function message(text) { status.textContent = text; }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(plan)); persistent = true; return true; }
    catch { persistent = false; message('Tarayıcı kayda izin vermiyor. İlerlemen bu açık sayfada tutuluyor; kapatmadan önce “Kaydımı indir” ile sakla.'); return false; }
  }
  function render() {
    form.hidden = Boolean(plan); progress.hidden = !plan;
    if (!plan) return;
    host.querySelector('[data-plan-goal]').textContent = plan.goal;
    const elapsed = Math.max(0, dayNumber(today()) - dayNumber(plan.start));
    const count = plan.done.length;
    host.querySelector('[data-plan-summary]').textContent = `${dayLabel(plan.start)} tarihinde başladın. ${count} / 66 gün uyguladın.${elapsed >= 65 ? ' 66 günlük takvimin tamamlandı; uygulamanı değerlendirebilir veya yeni bir plan başlatabilirsin.' : ` Takvimde ${elapsed + 1}. gündesin.`}`;
    host.querySelector('[data-plan-meter]').value = count;
    const weeks = host.querySelector('[data-plan-weeks]'); weeks.replaceChildren();
    for (let first = 0; first < 66; first += 7) {
      const group = document.createElement('details'); group.className = 'content-detail';
      const end = Math.min(first + 7, 66); group.open = elapsed >= first && elapsed < end;
      if (elapsed >= 66 && end === 66) group.open = true;
      const summary = document.createElement('summary');
      const weekCount = plan.done.filter(n => n >= first && n < end).length;
      summary.textContent = `${Math.floor(first / 7) + 1}. hafta · ${first + 1}–${end}. gün · ${weekCount}/${end - first} tamamlandı`;
      group.append(summary);
      const body = document.createElement('div'); body.className = 'depth-body';
      for (let index = first; index < end; index++) {
        const date = dateAt(index); const p = document.createElement('p'); const label = document.createElement('label');
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = plan.done.includes(index); checkbox.disabled = date > today(); checkbox.dataset.planDay = String(index);
        label.append(checkbox, document.createTextNode(` ${index + 1}. gün · ${dayLabel(date)}${date > today() ? ' · Henüz başlamadı' : ''}`));
        p.append(label); body.append(p);
      }
      group.append(body); weeks.append(group);
    }
    if (!persistent) message('Tarayıcı kayda izin vermiyor. İlerlemen bu açık sayfada tutuluyor; kapatmadan önce “Kaydımı indir” ile sakla.');
  }
  form.addEventListener('submit', event => {
    event.preventDefault(); const goal = goalInput.value.trim(); const start = input.value;
    if (!goal || goal.length > 180 || !Number.isFinite(dayNumber(start)) || start > today()) { message('Kısa bir davranış ve bugün veya daha önceki bir başlangıç tarihi gir.'); return; }
    plan = {version: 1, goal, start, done: []}; const saved = save(); render();
    if (saved) message('Planın bu tarayıcıya kaydedildi. Uyguladığın günleri işaretleyebilirsin.');
    host.querySelector('[data-plan-goal]').setAttribute('tabindex', '-1'); host.querySelector('[data-plan-goal]').focus();
  });
  host.addEventListener('change', event => {
    const target = event.target; if (!target.matches('[data-plan-day]') || !plan) return;
    const index = Number(target.dataset.planDay); if (index < 0 || index > 65 || dateAt(index) > today()) return;
    plan.done = target.checked ? [...new Set([...plan.done, index])].sort((a,b)=>a-b) : plan.done.filter(n=>n !== index);
    const saved = save(); const openWeeks = [...host.querySelectorAll('[data-plan-weeks] details')].map(n=>n.open); render();
    host.querySelectorAll('[data-plan-weeks] details').forEach((n,i)=>n.open = openWeeks[i]);
    host.querySelector(`[data-plan-day="${index}"]`)?.focus();
    if (saved) message(`${index + 1}. gün ${plan.done.includes(index) ? 'tamamlandı olarak kaydedildi' : 'işareti kaldırıldı'}.`);
  });
  host.querySelector('[data-plan-reset]').addEventListener('click', () => {
    if (!window.confirm('Mevcut planı bu tarayıcıdan silip yeni bir plan başlatmak istiyor musun? Saklamak için önce “Kaydımı indir” seçeneğini kullanabilirsin.')) return;
    try { localStorage.removeItem(storageKey); }
    catch { message('Kayıt silinemedi. Tarayıcının depolama iznini kontrol et.'); return; }
    plan = null; input.value = today(); goalInput.value = ''; render(); message('Yeni bir davranış seçebilirsin.'); goalInput.focus();
  });
  host.querySelector('[data-plan-export]').addEventListener('click', () => {
    if (!plan) return;
    const lines = ['66 Günlük Uygulama Takibim', '', `Günlük davranışım: ${plan.goal}`, `Başlangıç: ${plan.start}`, `Tamamlanan: ${plan.done.length}/66`, '', ...Array.from({length: 66}, (_,index)=>`${index + 1}. gün | ${dateAt(index)} | ${plan.done.includes(index) ? 'Tamamlandı' : 'İşaretlenmedi'}`)];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + lines.join('\n')], {type:'text/plain;charset=utf-8'})); const link = document.createElement('a'); link.href = url; link.download = '66-gun-uygulama-kaydim.txt'; host.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1000); message('Kayıt dosyan indirmeye hazırlandı.');
  });
  render();
})();
