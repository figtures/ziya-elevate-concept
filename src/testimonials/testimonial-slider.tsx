import { useLayoutEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StaggerTestimonials, type StaggerTestimonial } from '@/components/ui/stagger-testimonials';
import { readTestimonialItems } from './testimonial-source.mjs';

type Mounted = { root: Root; island: HTMLElement; source: HTMLElement };
const mounted = new Map<HTMLElement, Mounted>();

function Commit({ host, source, items }: { host: HTMLElement; source: HTMLElement; items: StaggerTestimonial[] }) {
 useLayoutEffect(() => {
  source.hidden = true;
  host.dataset.testimonialsMounted = 'true';
  return () => { source.hidden = false; delete host.dataset.testimonialsMounted; };
 }, [host, source]);
 return <StaggerTestimonials items={items} />;
}

function renderHost(host: HTMLElement) {
 const current = mounted.get(host);
 if (current) current.root.render(<Commit host={host} source={current.source} items={readTestimonialItems(host)} />);
}

function mountHost(host: HTMLElement) {
 if (mounted.has(host) || host.dataset.testimonialsFailed) return;
 const source = host.querySelector<HTMLElement>('[data-testimonial-source]');
 if (!source || !readTestimonialItems(host).length) return;
 const island = document.createElement('div');
 island.className = 'testimonial-slider-island';
 host.appendChild(island);
 const root = createRoot(island, { onUncaughtError: () => {
  source.hidden = false;
  host.dataset.testimonialsFailed = 'true';
  delete host.dataset.testimonialsMounted;
  queueMicrotask(() => { root.unmount(); island.remove(); mounted.delete(host); });
 } });
 mounted.set(host, { root, island, source });
 renderHost(host);
}

function scan() {
 for (const [host, entry] of mounted) if (!host.isConnected) {
  entry.root.unmount(); mounted.delete(host);
 }
 document.querySelectorAll<HTMLElement>('[data-testimonials-carousel]').forEach(mountHost);
}

function start() {
 scan();
 let scheduled = false;
 // The admin changes views without navigation. Observe only host replacement,
 // not React's own card/animation updates, so typing keeps the selected card.
 const observer = new MutationObserver(records => {
  const relevant = records.some(record => [...record.addedNodes, ...record.removedNodes].some(node =>
   node instanceof HTMLElement && (node.matches('[data-testimonials-carousel]') || node.querySelector('[data-testimonials-carousel]'))));
  if (!relevant || scheduled) return;
  scheduled = true; queueMicrotask(() => { scheduled = false; scan(); });
 });
 observer.observe(document.body, { childList: true, subtree: true });
 document.addEventListener('ziya:testimonials-update', event => {
  const host = event.target;
  if (!(host instanceof HTMLElement) || !host.matches('[data-testimonials-carousel]')) return;
  if (mounted.has(host)) renderHost(host); else mountHost(host);
 });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
else start();
