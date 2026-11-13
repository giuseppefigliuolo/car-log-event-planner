/**
 * Counter [data-count="300"]: the server renders the final figure (SEO, no JS). On load, if the figure is still below
 * the fold it is set to 0 and counts up the first time its top passes 88% of the viewport height (1.8 s, ease-out
 * cubic, whole numbers, once); if it is already on screen it stays as it is. The animation runs on the shared rAF
 * loop. Motion only: with reduced motion nothing is touched.
 */
import { $$ } from '../core/dom';
import { subscribe } from '../core/loop';

const LINE = 0.88; // fraction of the viewport height
const DURATION = 1800; // ms

export function initCount() {
  for (const el of $$('[data-count]')) {
    const target = Math.round(Number(el.dataset.count));
    if (!Number.isFinite(target) || target <= 0) continue;
    if (el.getBoundingClientRect().top < innerHeight * LINE) continue; // already visible: stays at the final figure
    el.textContent = '0';

    // Fires when the element's top crosses the 88% line (it enters the viewport above its bottom 12%).
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      let t0 = -1, shown = 0;
      const off = subscribe((f) => {
        if (t0 < 0) t0 = f.now;
        const p = Math.min(1, (f.now - t0) / DURATION);
        const v = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (v !== shown) {
          shown = v;
          el.textContent = String(v);
        }
        if (p >= 1) off();
      });
    }, { rootMargin: `0px 0px -${Math.round((1 - LINE) * 100)}% 0px` });
    io.observe(el);
  }
}
