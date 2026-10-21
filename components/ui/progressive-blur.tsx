'use client';

import { cn } from '@/lib/utils';
import { type HTMLMotionProps, motion } from 'motion/react';

export const GRADIENT_ANGLES = { top: 0, right: 90, bottom: 180, left: 270 };

export type ProgressiveBlurProps = {
  direction?: keyof typeof GRADIENT_ANGLES;
  blurLayers?: number;
  blurIntensity?: number;
} & HTMLMotionProps<'div'>;

/** A progressively masked backdrop blur; it never intercepts the content below. */
export function ProgressiveBlur({
  direction = 'bottom', blurLayers = 8, blurIntensity = 0.25,
  className, style, ...props
}: ProgressiveBlurProps) {
  const layers = Number.isFinite(blurLayers) ? Math.min(16, Math.max(2, Math.floor(blurLayers))) : 8;
  const intensity = Number.isFinite(blurIntensity) ? Math.max(0, blurIntensity) : 0.25;
  const segmentSize = 1 / (layers + 1);

  return (
    <motion.div {...props} aria-hidden="true" className={cn('relative pointer-events-none', className)}
      style={{ position: 'relative', ...style, pointerEvents: 'none' }}>
      {Array.from({ length: layers }, (_, index) => {
        const gradientStops = [index, index + 1, index + 2, index + 3].map((pos, stop) =>
          `rgba(255,255,255,${stop === 1 || stop === 2 ? 1 : 0}) ${pos * segmentSize * 100}%`);
        const gradient = `linear-gradient(${GRADIENT_ANGLES[direction]}deg, ${gradientStops.join(',')})`;
        return <div key={index} className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{
          position: 'absolute', inset: 0, borderRadius: 'inherit', pointerEvents: 'none',
          maskImage: gradient, WebkitMaskImage: gradient,
          backdropFilter: `blur(${index * intensity}px)`, WebkitBackdropFilter: `blur(${index * intensity}px)`,
        }} />;
      })}
    </motion.div>
  );
}
