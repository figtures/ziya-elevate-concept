/**
 * Progressive reading enhancements for the final, visible CMS DOM.
 * No generated prose, dates, author credentials, or crawler-only answers.
 * Source registry verifies the identity of cited works, not every editorial claim.
 */
export const AEO_VERSION = '1.0.0';
export const VERIFIED_SOURCES = Object.freeze([
  { id:'lally-2010', title:'How are habits formed: Modelling habit formation in the real world', url:'https://doi.org/10.1002/ejsp.674', evidence:'https://onlinelibrary.wiley.com/doi/10.1002/ejsp.674', year:'2010', context:/Lally[\s\S]*(?:2009|2010)|(?:2009|2010)[\s\S]*Lally/u, anchor:/(?:Phillippa )?Lally(?: ve (?:arkadaşları|ekibi))?|How are habits formed: Modelling habit formation in the real world/u },
  { id:'yeager-2019', title:'A national experiment reveals where a growth mindset improves achievement', url:'https://doi.org/10.1038/s41586-019-1466-y', evidence:'https://www.nature.com/articles/s41586-019-1466-y', year:'2019', context:/Yeager[\s\S]*2019|2019[\s\S]*Yeager/u, anchor:/Yeager(?: ve arkadaşları)?/u },
  { id:'sisk-2018', title:'To What Extent and Under Which Circumstances Are Growth Mind-Sets Important to Academic Achievement? Two Meta-Analyses', url:'https://doi.org/10.1177/0956797617739704', evidence:'https://journals.sagepub.com/doi/10.1177/0956797617739704', year:'2018', context:/Sisk[\s\S]*2018|2018[\s\S]*Sisk/u, anchor:/Sisk(?: ve arkadaşları)?/u },
  { id:'gollwitzer-sheeran-2006', title:'Implementation Intentions and Goal Achievement: A Meta-analysis of Effects and Processes', url:'https://www.sciencedirect.com/science/article/abs/pii/S0065260106380021', evidence:'https://www.sciencedirect.com/science/article/abs/pii/S0065260106380021', year:'2006', context:/Gollwitzer[\s\S]*Sheeran[\s\S]*2006|2006[\s\S]*Gollwitzer[\s\S]*Sheeran/u, anchor:/(?:Peter )?Gollwitzer(?: ve (?:Paschal )?Sheeran)?/u },
  { id:'locke-latham-2002', title:'Building a practically useful theory of goal setting and task motivation: A 35-year odyssey', url:'https://pubmed.ncbi.nlm.nih.gov/12237980/', evidence:'https://pubmed.ncbi.nlm.nih.gov/12237980/', year:'2002', context:/Locke[\s\S]*Latham[\s\S]*2002|2002[\s\S]*Locke[\s\S]*Latham/u, anchor:/(?:Edwin )?Locke(?: ve (?:Gary )?Latham)?/u },
  { id:'macnamara-2014', title:'Deliberate practice and performance in music, games, sports, education, and professions: a meta-analysis', url:'https://pubmed.ncbi.nlm.nih.gov/24986855/', evidence:'https://pubmed.ncbi.nlm.nih.gov/24986855/', year:'2014', context:/Macnamara[\s\S]*2014|2014[\s\S]*Macnamara/u, anchor:/(?:Brooke )?Macnamara(?: ve ekibi)?/u },
  { id:'mueller-dweck-1998', title:"Praise for intelligence can undermine children's motivation and performance", url:'https://pubmed.ncbi.nlm.nih.gov/9686450/', evidence:'https://pubmed.ncbi.nlm.nih.gov/9686450/', year:'1998', context:/Mueller[\s\S]*1998|1998[\s\S]*Mueller/u, anchor:/(?:Claudia )?Mueller/u },
  { id:'blackwell-2007', title:'Implicit theories of intelligence predict achievement across an adolescent transition: a longitudinal study and an intervention', url:'https://pubmed.ncbi.nlm.nih.gov/17328703/', evidence:'https://pubmed.ncbi.nlm.nih.gov/17328703/', year:'2007', context:/Blackwell[\s\S]*2007|2007[\s\S]*Blackwell/u, anchor:/Blackwell, Trzesniewski ve Dweck|Blackwell/u },
  { id:'harkin-2016', title:'Does monitoring goal progress promote goal attainment? A meta-analysis of the experimental evidence', url:'https://pubmed.ncbi.nlm.nih.gov/26479070/', evidence:'https://pubmed.ncbi.nlm.nih.gov/26479070/', year:'2016', context:/Harkin[\s\S]*2016|2016[\s\S]*Harkin/u, anchor:/(?:Benjamin )?Harkin(?: ve arkadaşları)?/u },
  { id:'hagger-2016', title:'A Multilab Preregistered Replication of the Ego-Depletion Effect', url:'https://doi.org/10.1177/1745691616652873', evidence:'https://doi.org/10.1177/1745691616652873', year:'2016', context:/Hagger[\s\S]*2016|2016[\s\S]*Hagger/u, anchor:/(?:Martin )?Hagger(?: ve arkadaşları)?/u },
  { id:'wood-2002', title:'Habits in everyday life: thought, emotion, and action', url:'https://pubmed.ncbi.nlm.nih.gov/12500811/', evidence:'https://pubmed.ncbi.nlm.nih.gov/12500811/', year:'2002', context:/Wood[\s\S]*2002|2002[\s\S]*Wood/u, anchor:/(?:Wendy )?Wood(?:, Jeffrey Quinn ve Deborah Kashy| ve arkadaşları)?/u },
  { id:'crede-2017', title:'Much ado about grit: A meta-analytic synthesis of the grit literature', url:'https://pubmed.ncbi.nlm.nih.gov/27845531/', evidence:'https://pubmed.ncbi.nlm.nih.gov/27845531/', year:'2017', context:/Credé[\s\S]*2017|2017[\s\S]*Credé/u, anchor:/Credé(?: ve arkadaşları)?/u },
  { id:'gallup-manager-2015', title:'State of the American Manager: Analytics and Advice for Leaders', url:'https://news.gallup.com/businessjournal/182792/employees-really-want-boss.aspx', evidence:'https://news.gallup.com/businessjournal/182792/employees-really-want-boss.aspx', year:'2015', context:/State of the American Manager[\s\S]*2015|2015[\s\S]*State of the American Manager/u, anchor:/State of the American Manager/u },
  { id:'gallup-delegation-2015', title:'Delegating: A Huge Management Challenge for Entrepreneurs', url:'https://news.gallup.com/businessjournal/182414/delegating-huge-management-challenge-entrepreneurs.aspx', evidence:'https://news.gallup.com/businessjournal/182414/delegating-huge-management-challenge-entrepreneurs.aspx', year:'2015', context:/Badal ve Ott[\s\S]*2015/u, anchor:/Badal ve Ott/u },
  { id:'goleman-2000', title:'Leadership That Gets Results', url:'https://hbr.org/2000/03/leadership-that-gets-results', evidence:'https://hbr.org/2000/03/leadership-that-gets-results', year:'2000', context:/Leadership That Gets Results[\s\S]*2000|2000[\s\S]*Leadership That Gets Results/u, anchor:/Leadership That Gets Results/u },
  { id:'oncken-wass-1974', title:"Management Time: Who’s Got the Monkey?", url:'https://hbr.org/1999/11/management-time-whos-got-the-monkey', evidence:'https://store.hbr.org/product/management-time-who-s-got-the-monkey/99609', year:'1974', context:/Management Time: Who.s Got the Monkey[\s\S]*1974|1974[\s\S]*Management Time: Who.s Got the Monkey/u, anchor:/Management Time: Who.s Got the Monkey\?/u },
  { id:'kotter-1990', title:'What Leaders Really Do', url:'https://hbr.org/2001/12/what-leaders-really-do', evidence:'https://store.hbr.org/product/what-leaders-really-do/r0111f', year:'1990', context:/What Leaders Really Do[\s\S]*1990|1990[\s\S]*What Leaders Really Do/u, anchor:/What Leaders Really Do/u },
  { id:'zenger-folkman-2014', title:'Your Employees Want the Negative Feedback You Hate to Give', url:'https://hbr.org/2014/01/your-employees-want-the-negative-feedback-you-hate-to-give', evidence:'https://hbr.org/2014/01/your-employees-want-the-negative-feedback-you-hate-to-give', year:'2014', context:/Zenger[\s\S]*Folkman[\s\S]*2014|2014[\s\S]*Zenger[\s\S]*Folkman/u, anchor:/(?:Jack )?Zenger ve (?:Joseph )?Folkman/u },
  { id:'seligman-schulman-1986', title:'Explanatory Style as a Predictor of Productivity and Quitting Among Life Insurance Sales Agents', url:'https://ppc.sas.upenn.edu/sites/default/files/predictproductivity.pdf', evidence:'https://ppc.sas.upenn.edu/sites/default/files/predictproductivity.pdf', year:'1986', context:/Seligman[\s\S]*Schulman[\s\S]*1986|1986[\s\S]*Seligman[\s\S]*Schulman/u, anchor:/(?:Martin )?Seligman ile (?:Peter )?Schulman/u },
  { id:'rackham-1988', title:'SPIN Selling', url:'https://www.mheducation.com/highered/mhp/product/spin-selling.html', evidence:'https://www.mheducation.com/highered/mhp/product/spin-selling.html', year:'1988', context:/Rackham[\s\S]*(?:SPIN|1988)|(?:SPIN|1988)[\s\S]*Rackham/u, anchor:/SPIN(?: Selling)?|Neil Rackham/u },
  { id:'eisenberger-2003', title:'Does rejection hurt? An FMRI study of social exclusion', url:'https://pubmed.ncbi.nlm.nih.gov/14551436/', evidence:'https://pubmed.ncbi.nlm.nih.gov/14551436/', year:'2003', context:/Eisenberger[\s\S]*2003|2003[\s\S]*Eisenberger/u, anchor:/(?:Naomi )?Eisenberger(?: ve arkadaşları)?/u },
  { id:'dewall-2010', title:'Acetaminophen reduces social pain: behavioral and neural evidence', url:'https://pubmed.ncbi.nlm.nih.gov/20548058/', evidence:'https://pubmed.ncbi.nlm.nih.gov/20548058/', year:'2010', context:/DeWall[\s\S]*2010|2010[\s\S]*DeWall/u, anchor:/DeWall(?: ve arkadaşları)?/u },
  { id:'marchant-2009', title:'Mental toughness: Managerial and age differences', url:'https://pure.hud.ac.uk/en/publications/mental-toughness-managerial-and-age-differences/', evidence:'https://pure.hud.ac.uk/en/publications/mental-toughness-managerial-and-age-differences/', year:'2009', context:/Marchant[\s\S]*2009|2009[\s\S]*Marchant/u, anchor:/Marchant(?: ve arkadaşları)?/u },
  { id:'maguire-2000', title:'Navigation-related structural change in the hippocampi of taxi drivers', url:'https://pubmed.ncbi.nlm.nih.gov/10716738/', evidence:'https://pubmed.ncbi.nlm.nih.gov/10716738/', year:'2000', context:/Maguire[\s\S]*2000|2000[\s\S]*Maguire/u, anchor:/(?:Eleanor )?Maguire(?: ve ekibi)?/u },
  { id:'woollett-maguire-2011', title:'Acquiring the Knowledge of London’s layout drives structural brain changes', url:'https://pubmed.ncbi.nlm.nih.gov/22169537/', evidence:'https://pubmed.ncbi.nlm.nih.gov/22169537/', year:'2011', context:/Woollett[\s\S]*Maguire[\s\S]*2011|2011[\s\S]*Woollett[\s\S]*Maguire/u, anchor:/Woollett ve Maguire/u },
  { id:'draganski-2004', title:'Neuroplasticity: changes in grey matter induced by training', url:'https://pubmed.ncbi.nlm.nih.gov/14737157/', evidence:'https://pubmed.ncbi.nlm.nih.gov/14737157/', year:'2004', context:/Draganski[\s\S]*2004|2004[\s\S]*Draganski/u, anchor:/Draganski(?: ve arkadaşları)?/u },
].map(source => Object.freeze({...source, checkedAt:'2026-10-12', verificationScope:'bibliographic-identity'})));

const visible = node => Boolean(node && !node.closest('[hidden],[aria-hidden="true"]'));
export function visibleText(node) {
  if (!node) return '';
  const copy = node.cloneNode(true);
  copy.querySelectorAll('script,style,svg,[hidden],[aria-hidden="true"]').forEach(n => n.remove());
  copy.querySelectorAll('br').forEach(n => n.replaceWith(' '));
  return copy.textContent.replace(/\s+/g,' ').trim();
}
function hash(value) {
  let h = 2166136261;
  for (const c of value) h = Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0;
  return h.toString(36);
}
function ensureAnchor(doc, node, prefix, fallback) {
  if (node.id) return node.id; // Existing public deep links never change after a title edit.
  const stable = node.getAttribute('data-cms-node')?.replace(/[^a-zA-Z0-9_-]/g,'');
  const base = `${prefix}-${stable || hash(fallback)}`;
  let id = base, suffix = 2;
  while (doc.getElementById(id)) id = `${base}-${suffix++}`;
  node.id = id;
  return id;
}
function textNodes(node, result = []) {
  for (const child of node.childNodes) {
    if (child.nodeType === 3) result.push(child);
    else if (child.nodeType === 1 && !child.matches('a,script,style,svg,[hidden],[aria-hidden="true"]')) textNodes(child,result);
  }
  return result;
}
function linkSources(doc, article) {
  // Match a named work and its year in the SAME paragraph, never a whole article.
  // Existing editor-created links win; no external text is downloaded into the site.
  const blocks = [...article.querySelectorAll('p,li,.capsule,.faq .a')].filter(visible);
  for (const block of blocks) {
    const ownCopy = block.cloneNode(true);
    ownCopy.querySelectorAll('p,li,.capsule,.faq .a').forEach(n => n.remove());
    const context = visibleText(ownCopy);
    for (const source of VERIFIED_SOURCES) {
      if (!source.context.test(context) || block.querySelector(`[data-source-id="${source.id}"]`)) continue;
      for (const node of textNodes(block)) {
        // Nested blocks receive their own context and cannot borrow the parent's year.
        const closestBlock = node.parentElement?.closest('p,li,.capsule,.faq .a');
        if (closestBlock !== block) continue;
        const match = source.anchor.exec(node.textContent);
        if (!match) continue;
        const link = doc.createElement('a'); link.href = source.url; link.textContent = match[0];
        link.setAttribute('data-source-id',source.id); link.setAttribute('rel','cite'); link.title = source.title;
        const before = doc.createTextNode(node.textContent.slice(0,match.index));
        const after = doc.createTextNode(node.textContent.slice(match.index + match[0].length));
        node.replaceWith(before,link,after); break;
      }
    }
  }
}
export function applyAEO(doc, payload) {
  if (!payload || payload.kind === 'global') return doc;
  for (const detail of doc.querySelectorAll('.faq details')) {
    if (!visible(detail) || !visibleText(detail.querySelector('summary'))) continue;
    ensureAnchor(doc,detail,'soru',visibleText(detail.querySelector('summary')));
    detail.setAttribute('data-answer-unit','faq');
  }
  if (payload.kind !== 'article') return doc;
  const article = doc.querySelector('article.prose');
  if (!visible(article)) return doc;
  const answer = [...article.children].find(node => node.classList.contains('capsule') && visible(node) && /cevap|yanıt/i.test(visibleText(node.querySelector('.cap-tag'))));
  if (answer) { ensureAnchor(doc,answer,'yanit',payload.route); answer.setAttribute('data-answer-unit','direct'); }
  const toc = doc.querySelector('.reading-toc');
  if (visible(toc)) {
    toc.setAttribute('role','navigation'); toc.setAttribute('aria-label','Yazı içindekiler');
    const existing = [...toc.querySelectorAll('a[href^="#"]')];
    const fallback = [...toc.children].find(node=>node.tagName==='A' && !node.getAttribute('href')?.startsWith('#'));
    const chapters = [...article.querySelectorAll('.reading-chapter')].filter(visible);
    const links=[];
    for (const chapter of chapters) {
      const heading = [...chapter.children].find(n=>/^H[2-3]$/.test(n.tagName)&&visible(n));
      const label = visibleText(heading); if (!label) continue;
      const id = ensureAnchor(doc,chapter,'bolum',label), href = '#'+id;
      const link = existing.find(a=>a.getAttribute('href')===href) || doc.createElement('a');
      link.href=href; link.textContent=label; links.push(link);
    }
    // Remove outdated links; preserve the authored index link and decorative icon.
    existing.forEach(node=>node.remove());
    for (const link of links) fallback ? fallback.before(link) : toc.append(link);
  }
  linkSources(doc,article);
  return doc;
}

/** Audit-only view of already-visible units. This is NOT injected as hidden prose. */
export function collectAnswerUnits(doc, route) {
  return [...doc.querySelectorAll('[data-answer-unit]')].filter(visible).map(node=>{
    const copy=node.cloneNode(true), kind=node.getAttribute('data-answer-unit');
    const question=kind==='faq'?visibleText(copy.querySelector('summary')):visibleText(doc.querySelector('h1'));
    copy.querySelector('summary')?.remove(); copy.querySelector('.cap-tag')?.remove();
    return {id:node.id,owner:route+'#'+node.id,kind,question,answer:visibleText(copy),sources:[...node.querySelectorAll('a[data-source-id]')].map(a=>a.href)};
  });
}
