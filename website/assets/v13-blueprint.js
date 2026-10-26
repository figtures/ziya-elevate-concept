/* The five-stage blueprint is a scroll timeline, not a timed animation.
   Without JavaScript, or with reduced motion, every stage is fully readable. */
(() => {
  'use strict';
  const sections = [...document.querySelectorAll('[data-v13-blueprint]')];
  if (!sections.length) return;
  const desktop = window.matchMedia('(min-width: 1024px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const clamp = value => Math.max(0, Math.min(1, value));
  let cleanup = () => {};

  function install() {
    cleanup();
    const disposers = [];
    sections.forEach(section => {
      const steps = [...section.querySelectorAll('[data-v13-blueprint-step]')];
      const list = section.querySelector('.v13-blueprint-steps');
      if (!steps.length || !list) return;
      const complete = () => {
        section.style.setProperty('--v13-blueprint-progress', '1');
        steps.forEach(step => {
          step.style.setProperty('--v13-step-progress', '1');
          step.dataset.v13StepState = 'complete';
        });
      };
      complete();
      if (reduced.matches) {
        section.dataset.v13BlueprintMode = 'static';
        return;
      }
      if (!desktop.matches) {
        section.dataset.v13BlueprintMode = 'mobile';
        // Short, once-only reveals; no sticky layout or hidden reading content.
        if ('IntersectionObserver' in window && typeof Element.prototype.animate === 'function') {
          const animations = new Set();
          const observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            const animation = entry.target.animate([
              { transform: 'translateY(16px)', opacity: .8 },
              { transform: 'translateY(0)', opacity: 1 },
            ], { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)' });
            animations.add(animation);
            animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
          }), { threshold: .12 });
          steps.forEach(step => observer.observe(step));
          disposers.push(() => { observer.disconnect(); animations.forEach(animation => animation.cancel()); });
        }
        return;
      }

      section.dataset.v13BlueprintMode = 'desktop';
      let frame = 0;
      const update = () => {
        frame = 0;
        const rect = list.getBoundingClientRect();
        // At the first stage's arrival, the drawing starts. The final stage is
        // complete before leaving the viewport. Reverse scroll reverses it.
        const progress = clamp((window.innerHeight * .8 - rect.top) / Math.max(1, rect.height));
        section.style.setProperty('--v13-blueprint-progress', String(progress));
        steps.forEach((step, index) => {
          const stage = clamp(progress * steps.length - index);
          step.style.setProperty('--v13-step-progress', String(stage));
          step.dataset.v13StepState = stage >= 1 ? 'complete' : stage > 0 ? 'active' : 'pending';
        });
      };
      const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule, { passive: true });
      const observer = 'ResizeObserver' in window ? new ResizeObserver(schedule) : null;
      observer?.observe(list);
      update();
      disposers.push(() => {
        window.removeEventListener('scroll', schedule);
        window.removeEventListener('resize', schedule);
        observer?.disconnect();
        if (frame) window.cancelAnimationFrame(frame);
      });
    });
    cleanup = () => disposers.splice(0).forEach(dispose => dispose());
  }

  desktop.addEventListener('change', install);
  reduced.addEventListener('change', install);
  window.addEventListener('pagehide', () => cleanup());
  window.addEventListener('pageshow', event => { if (event.persisted) install(); });
  install();
})();
