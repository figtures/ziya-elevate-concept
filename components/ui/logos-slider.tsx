'use client';

import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { ProgressiveBlur } from '@/components/ui/progressive-blur';

export type ReferenceLogo = { id: string; image: string; description: string; width?: number; height?: number; href?: string };
export type LogosSliderProps = { logos: ReferenceLogo[]; label?: string; duration?: number; gap?: number };

export function LogosSlider({ logos, label = 'Referanslar', duration, gap = 48 }: LogosSliderProps) {
  const [paused, setPaused] = useState(false);
  const reducedMotion = useReducedMotion();
  if (!logos.length) return null;
  return <div className="reference-slider-ui" role="region" aria-label={label} aria-roledescription="logo şeridi">
    <div className="reference-slider-window">
      <InfiniteSlider className="reference-slider-track" duration={duration || Math.max(30, logos.length * 4)} gap={gap} paused={paused}>
        {logos.map((logo) => {
          const img = <img src={logo.image} alt={logo.description} width={logo.width} height={logo.height}
            loading="lazy" decoding="async" />;
          return <div key={logo.id} className="reference-slider-logo">
            {logo.href ? <a href={logo.href} aria-label={logo.description}>{img}</a> : img}
          </div>;
        })}
      </InfiniteSlider>
      {!reducedMotion && <>
        <ProgressiveBlur className="reference-slider-blur reference-slider-blur-left" direction="left" blurIntensity={0.8}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 'clamp(30px, 8vw, 120px)' }} />
        <ProgressiveBlur className="reference-slider-blur reference-slider-blur-right" direction="right" blurIntensity={0.8}
          style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 'clamp(30px, 8vw, 120px)' }} />
      </>}
    </div>
    {!reducedMotion && <button type="button" className="reference-slider-toggle" aria-pressed={paused}
      aria-label={paused ? 'Logo akışını oynat' : 'Logo akışını duraklat'} onClick={() => setPaused(!paused)}>
      {paused ? <Play size={16} strokeWidth={1.7} aria-hidden="true" /> : <Pause size={16} strokeWidth={1.7} aria-hidden="true" />}
      <span>{paused ? 'Oynat' : 'Duraklat'}</span>
    </button>}
  </div>;
}
