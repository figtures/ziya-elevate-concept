/** V13 permits these four exact editorial labels, not arbitrary “merkez” names. */
export const APPROVED_KNOWLEDGE_LABELS = Object.freeze([
  'Başarı Bilgi Merkezi',
  'Satış Bilgi Merkezi',
  'Liderlik Bilgi Merkezi',
  'Kafa Yapısı Bilgi Merkezi',
]);
const approved = new Set(APPROVED_KNOWLEDGE_LABELS.flatMap(label => [label, `${label} · 8 başlık`]));

export function containsDisallowedCenterTerm(value) {
  if (typeof value === 'string') return /merkez/i.test(value) && !approved.has(value.trim());
  if (Array.isArray(value)) return value.some(containsDisallowedCenterTerm);
  if (value && typeof value === 'object') return Object.entries(value).some(([key, child]) => containsDisallowedCenterTerm(key) || containsDisallowedCenterTerm(child));
  return false;
}

export const CONTENT_LANGUAGE_ERROR = '“Merkez / merkezi” yalnız onaylı dört Bilgi Merkezi başlığında kullanılabilir.';
