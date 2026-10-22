'use client';

import { cn } from '@/lib/utils';
import { applyMediaFrame, parseMediaFrame } from '../../cms/media-framing.mjs';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Pause, Play, Quote } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

export type StaggerTestimonial = {
  id: string;
  name: string;
  quote: string;
  role?: string;
  company?: string;
  avatar?: string;
  avatarFrame?: string;
  draft?: boolean;
  hidden?: boolean;
};

export type StaggerTestimonialsProps = {
  items: StaggerTestimonial[];
  className?: string;
};

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean)
  .filter((_, index, words) => index === 0 || index === words.length - 1)
  .map(word => Array.from(word)[0]).join('').toLocaleUpperCase('tr-TR');

const relativePosition = (index: number, active: number, count: number) => {
  const position = (index - active + count) % count;
  return position > count / 2 ? position - count : position;
};

/** CMS-driven adaptation of the staggered-card composition; no fabricated data. */
export function StaggerTestimonials({ items, className }: StaggerTestimonialsProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');
  const [containerWidth, setContainerWidth] = useState(720);
  const [tallestCard, setTallestCard] = useState(350);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const viewport = useRef<HTMLDivElement>(null);
  const cards = useRef(new Map<string, HTMLElement>());
  const statusId = useId();
  const reducedMotion = useReducedMotion();
  const hasItems = items.length > 0;
  const active = Math.max(0, items.findIndex(item => item.id === activeId));
  const narrow = containerWidth < 560;
  const cardWidth = Math.max(180, Math.min(420, containerWidth - (narrow ? 32 : 80)));
  const step = cardWidth * (narrow ? 0.86 : 0.76);

  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const measure = () => {
      if (element.clientWidth > 0) setContainerWidth(element.clientWidth);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasItems]);

  useLayoutEffect(() => {
    const measure = () => {
      const height = Math.ceil(Math.max(0, ...Array.from(cards.current.values(), element => element.offsetHeight)));
      if (height > 0) setTallestCard(height);
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    cards.current.forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [cardWidth, items]);

  const move = useCallback((direction: number) => {
    if (items.length < 2) return;
    setActiveId(items[(active + direction + items.length) % items.length].id);
  }, [active, items]);

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    setInView(false);
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting && entry.intersectionRatio >= 0.15);
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasItems]);

  useEffect(() => {
    const updateVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  const autoplayRunning = items.length > 1 && !reducedMotion && !autoplayPaused
    && !hovered && !focusWithin && inView && pageVisible;

  useEffect(() => {
    if (!autoplayRunning) return;
    const timer = window.setTimeout(() => move(1), 2000);
    return () => window.clearTimeout(timer);
  }, [autoplayRunning, move]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  };

  if (!items.length) return null;

  return <div ref={viewport} className={cn('stagger-testimonials', className)}
    role="region" aria-roledescription="yorum galerisi" aria-label="Deneyimler"
    tabIndex={0} onKeyDown={onKeyDown} data-reduced-motion={reducedMotion ? 'true' : undefined}
    data-autoplay={autoplayRunning ? 'running' : 'paused'}
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocusWithin(true)}
    onBlurCapture={event => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
    }}>
    <div className="stagger-testimonials-stage" style={{ height: tallestCard + (narrow ? 64 : 80) }}>
      {items.map((item, index) => {
        const position = relativePosition(index, active, items.length);
        const centered = index === active;
        const visible = Math.abs(position) <= 2;
        return <motion.figure key={item.id}
          ref={element => { if (element) cards.current.set(item.id, element); else cards.current.delete(item.id); }}
          className="stagger-testimonial-card" data-active={centered ? 'true' : 'false'}
          data-draft={item.draft ? 'true' : undefined}
          role="group" aria-roledescription="yorum" aria-label={`${index + 1} / ${items.length}`}
          aria-hidden={!centered} initial={false}
          onClick={() => { if (!centered && visible) setActiveId(item.id); }}
          style={{ width: cardWidth, zIndex: centered ? 10 : Math.max(0, 5 - Math.abs(position)),
            pointerEvents: visible ? 'auto' : 'none', cursor: centered ? 'default' : 'pointer' }}
          animate={{ x: -cardWidth / 2 + position * step,
            y: centered ? 0 : narrow ? 20 : Math.abs(position) % 2 ? 32 : 18,
            rotate: centered || reducedMotion ? 0 : position < 0 ? -2.5 : 2.5,
            scale: centered ? 1 : 0.94, opacity: visible ? centered ? 1 : 0.72 : 0 }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 190, damping: 27, mass: 1 }}>
          <Quote className="stagger-testimonial-quote-icon" size={28} strokeWidth={1.6} aria-hidden="true" />
          {(item.draft || item.hidden) && <p className="stagger-testimonial-state">
            {item.draft ? 'Taslak · örnek metin' : 'Önizleme · yayında gizli'}
          </p>}
          <blockquote>{item.quote}</blockquote>
          <figcaption className="stagger-testimonial-author">
            {item.avatar ? <span data-media-frame-clip style={{ display: 'block', width: narrow ? 46 : 52, height: narrow ? 46 : 52, flex: 'none', overflow: 'hidden', borderRadius: '50%' }}>
              <img key={item.avatar + (item.avatarFrame || '')} src={item.avatar} alt="" width="52" height="52" loading="lazy" decoding="async" style={{ width: '100%', height: '100%' }}
                ref={element => { const frame = parseMediaFrame(item.avatarFrame, item.avatar); if (element && frame) applyMediaFrame(element, frame); }} />
              </span> :
              <span className="stagger-testimonial-initials" aria-hidden="true">{initials(item.name)}</span>}
            <span className="stagger-testimonial-byline"><strong>{item.name}</strong>
              {(item.role || item.company) && <span>{[item.role, item.company].filter(Boolean).join(' · ')}</span>}
            </span>
          </figcaption>
        </motion.figure>;
      })}
    </div>
    <div className="stagger-testimonials-controls">
      <button type="button" onClick={() => move(-1)} disabled={items.length < 2}
        aria-label="Önceki yorum" aria-describedby={statusId}>
        <ChevronLeft size={22} strokeWidth={1.8} aria-hidden="true" />
      </button>
      <span id={statusId} className="stagger-testimonials-counter" aria-live={autoplayRunning ? 'off' : 'polite'} aria-atomic="true">
        <span className="stagger-testimonials-sr-only">Yorum </span>
        <strong>{String(active + 1).padStart(2, '0')}</strong><span aria-hidden="true"> / </span>
        <span className="stagger-testimonials-sr-only"> / </span>{String(items.length).padStart(2, '0')}
      </span>
      <button type="button" onClick={() => move(1)} disabled={items.length < 2}
        aria-label="Sonraki yorum" aria-describedby={statusId}>
        <ChevronRight size={22} strokeWidth={1.8} aria-hidden="true" />
      </button>
      {items.length > 1 && !reducedMotion && <button type="button"
        onClick={() => setAutoplayPaused(paused => !paused)}
        aria-label={autoplayPaused ? 'Otomatik geçişi başlat' : 'Otomatik geçişi duraklat'}>
        {autoplayPaused ? <Play size={18} strokeWidth={1.8} aria-hidden="true" /> :
          <Pause size={18} strokeWidth={1.8} aria-hidden="true" />}
      </button>}
    </div>
  </div>;
}
