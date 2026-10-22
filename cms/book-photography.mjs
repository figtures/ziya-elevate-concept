// Replace only the three superseded, site-owned photographs. Editor uploads,
// copy, ordering, visibility and approval state are never changed here.
export const BOOK_PHOTOGRAPHY_REVISIONS = Object.freeze({
  '/assets/kitap-basari-studio-v1.webp': '/assets/kitap-basari-studio-v2.webp',
  '/assets/kitap-sir-studio-v1.webp': '/assets/kitap-sir-studio-v2.webp',
  '/assets/kitap-72-studio-v1.webp': '/assets/kitap-72-studio-v2.webp',
});

export function currentBookPhotography(payload) {
  if (!payload || !['/', '/kitaplar/', '/basari-muhendisligi/'].includes(payload.template || payload.route)) return payload;
  const replaceValues = values => {
    if (!values || typeof values !== 'object') return values;
    let result = values;
    for (const [key, value] of Object.entries(values)) {
      const next = key.endsWith(':@src') && BOOK_PHOTOGRAPHY_REVISIONS[value];
      if (!next) continue;
      if (result === values) result = {...values};
      result[key] = next;
    }
    return result;
  };
  let changed = false;
  const update = node => {
    if (!node || typeof node !== 'object') return node;
    const values = replaceValues(node.values);
    const next = values === node.values ? node : {...node, values};
    if (next !== node) changed = true;
    return next;
  };
  let next = update(payload);
  const sections = payload.sections?.map(section => {
    let result = update(section);
    const groups = section.groups?.map(group => {
      const items = group.items?.map(update);
      if (items?.some((item, index) => item !== group.items[index])) return {...group, items};
      return group;
    });
    if (groups?.some((group, index) => group !== section.groups[index])) result = {...result, groups};
    return result;
  });
  if (sections?.some((section, index) => section !== payload.sections[index])) next = {...next, sections};
  return changed ? next : payload;
}
