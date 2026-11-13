/**
 * Enter-viewport reveals. Only toggles a class; the animation itself is CSS (global.css).
 *  [data-r]   fade + rise
 *  [data-rm]  container whose [data-rl] lines slide out of their masks (--i = line index)
 * Elements entering together are staggered by 80 ms (--d), unless they set their own --d.
 */
import { $$ } from '../core/dom';

export function initReveal(ready: Promise<void>) {
  let isReady = false;
  const pending: Element[] = [];
  const show = (els: Element[]) =>
    els.forEach((el, k) => {
      const s = (el as HTMLElement).style;
      if (!s.getPropertyValue('--d')) s.setProperty('--d', `${k * 80}ms`);
      el.classList.add('is-in');
    });

  const io = new IntersectionObserver(
    (entries) => {
      const batch: Element[] = [];
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        io.unobserve(e.target);
        batch.push(e.target);
      }
      if (!batch.length) return;
      isReady ? show(batch) : pending.push(...batch);
    },
    { rootMargin: '0px 0px -8% 0px' }
  );
  $$('[data-r], [data-rm]').forEach((el) => io.observe(el));
  ready.then(() => { isReady = true; show(pending.splice(0)); });
}
