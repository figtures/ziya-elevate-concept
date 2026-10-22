import { createRoot } from 'react-dom/client';
import { LogosSlider, type ReferenceLogo } from '@/components/ui/logos-slider';
import './reference-slider.css';
import {parseMediaFrame,serializeMediaFrame} from '../../cms/media-framing.mjs';

function safeUrl(value: string | null, image = false): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value, window.location.href);
    if (!image && ['mailto:', 'tel:'].includes(url.protocol)) return value;
    if (!['http:', 'https:'].includes(url.protocol)) return;
    if (image || url.origin === window.location.origin || url.protocol === 'https:') return value;
  } catch { return; }
}

function mountReferenceSliders() {
  document.querySelectorAll<HTMLElement>('[data-reference-slider]').forEach((host) => {
    if (host.dataset.referenceMounted) return;
    const logos: ReferenceLogo[] = [...host.querySelectorAll<HTMLImageElement>('li img')].flatMap((img, index) => {
      const image = safeUrl(img.getAttribute('src'), true);
      const description = (img.getAttribute('alt') || '').trim();
      if (!image || !description) return [];
      const frame = parseMediaFrame(img.getAttribute('data-media-frame'), image);
      return [{ id: `reference-${index}`, image, description,
        frame: frame ? serializeMediaFrame(frame) : undefined,
        width: Number(img.getAttribute('width')) || undefined,
        height: Number(img.getAttribute('height')) || undefined,
        href: safeUrl(img.closest('a')?.getAttribute('href') || null) }];
    });
    if (!logos.length) return;
    const label = host.getAttribute('aria-label') || 'Referanslar';
    const durationValue = Number(host.dataset.duration);
    const duration = durationValue > 0 && Number.isFinite(durationValue) ? durationValue : undefined;
    const island = document.createElement('div');
    island.className = 'reference-slider-island';
    host.appendChild(island);
    // Keep the server-rendered list intact until React successfully commits.
    createRoot(island).render(<LogosSlider logos={logos} label={label} duration={duration} />);
    host.dataset.referenceMounted = 'true';
    const observer = new MutationObserver(() => {
      if (!island.querySelector('.reference-slider-ui')) return;
      [...host.children].forEach((child) => { if (child !== island && child instanceof HTMLElement) child.hidden = true; });
      observer.disconnect();
    });
    observer.observe(island, { childList: true, subtree: true });
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountReferenceSliders, { once: true });
else mountReferenceSliders();
