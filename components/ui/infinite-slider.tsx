'use client';

import { cn } from '@/lib/utils';
import { animate, motion, useInView, useMotionValue, useReducedMotion } from 'framer-motion';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import useMeasure from 'react-use-measure';

export type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  duration?: number;
  durationOnHover?: number;
  direction?: 'horizontal' | 'vertical';
  reverse?: boolean;
  className?: string;
  paused?: boolean;
};

/** Measures one complete group, including its closing gap, for a seamless loop. */
export function InfiniteSlider({ children, gap = 16, duration = 25, durationOnHover,
  direction = 'horizontal', reverse = false, className, paused = false }: InfiniteSliderProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [viewportMeasureRef, viewportSize] = useMeasure();
  const setViewport = useCallback((node: HTMLDivElement | null) => {
    viewport.current = node;
    viewportMeasureRef(node);
  }, [viewportMeasureRef]);
  const [measureRef, { width, height }] = useMeasure();
  const translation = useMotionValue(0);
  const reducedMotion = useReducedMotion();
  const inView = useInView(viewport, { margin: '100px' });
  const [hovering, setHovering] = useState(false);
  const [focused, setFocused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const spacing = Number.isFinite(gap) ? Math.max(0, gap) : 16;
  const contentSize = (direction === 'horizontal' ? width : height) + spacing;
  // Short CMS lists still need to cover the viewport while one whole group exits.
  // Vertical callers control their own clipping height; avoid measuring an
  // intrinsic vertical viewport whose height would grow with each added copy.
  const viewportLength = direction === 'horizontal' ? viewportSize.width : 0;
  const duplicateCount = contentSize > spacing ? Math.max(1, Math.ceil(viewportLength / contentSize)) : 1;
  const currentDuration = hovering && durationOnHover ? durationOnHover : duration;
  const stopped = paused || focused || !pageVisible || !inView || (hovering && !durationOnHover);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (reducedMotion) { translation.set(0); return; }
    if (stopped || contentSize <= spacing || !Number.isFinite(contentSize)) return;
    const seconds = Math.max(1, Number.isFinite(currentDuration) ? currentDuration : 25);
    let disposed = false;
    let controls: ReturnType<typeof animate> | undefined;
    const loop = () => {
      const from = reverse ? -contentSize : 0;
      const to = reverse ? 0 : -contentSize;
      const value = translation.get();
      const start = value > 0 || value < -contentSize || Math.abs(value - to) < 0.5 ? from : value;
      translation.set(start);
      controls = animate(translation, to, {
        ease: 'linear', duration: seconds * Math.abs(to - start) / contentSize,
        onComplete: () => { if (!disposed) { translation.set(from); loop(); } },
      });
    };
    loop();
    return () => { disposed = true; controls?.stop(); };
  }, [contentSize, spacing, currentDuration, reducedMotion, reverse, stopped, translation]);

  const vertical = direction === 'vertical';
  const groupStyle = { display: 'flex', flexDirection: vertical ? 'column' as const : 'row' as const,
    alignItems: 'center', gap: spacing, flexShrink: 0 };

  return <div ref={setViewport} className={cn('overflow-hidden', className)}
    data-reduced-motion={reducedMotion ? 'true' : undefined}
    style={{ overflow: 'hidden' }}
    onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <motion.div className="flex w-max" style={{ display: 'flex', width: reducedMotion ? '100%' : 'max-content',
      flexDirection: vertical ? 'column' : 'row', gap: spacing,
      ...(vertical ? { y: translation } : { x: translation }), willChange: reducedMotion || stopped ? 'auto' : 'transform' }}>
      <div ref={measureRef} data-slider-group="primary" style={{ ...groupStyle,
        ...(reducedMotion ? { flexWrap: 'wrap', justifyContent: 'center', width: '100%', flexShrink: 1 } as const : {}) }}>
        {children}
      </div>
      {!reducedMotion && Array.from({ length: duplicateCount }, (_, index) => <div key={index} aria-hidden="true" inert data-slider-group="duplicate" style={groupStyle}>{children}</div>)}
    </motion.div>
  </div>;
}
