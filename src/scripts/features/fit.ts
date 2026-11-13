/**
 * [data-fit]: text sized to fill its parent's width exactly (the giant "Carmen Log" in the hero and footer).
 * [data-fit="m"] only below the 900px breakpoint (the hero name is two stacked lines on desktop).
 * Runs on every remeasure (resize, fonts loaded). Registered first, so later measures see the final sizes.
 */
import { $$, isWide } from '../core/dom';
import { onMeasure } from '../core/loop';

export function initFit() {
  const els = $$('[data-fit]');
  if (!els.length) return;
  onMeasure(() => {
    const wide = isWide();
    for (const el of els) {
      if (el.dataset.fit === 'm' && wide) { el.style.fontSize = ''; continue; }
      const p = el.parentElement!, cs = getComputedStyle(p);
      const w = p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (w <= 0) continue;
      // Bodoni Moda's optical-size axis changes glyph widths with the font size, so width isn't
      // proportional to size: a few rounds converge (sub-pixel after the third).
      let size = 100;
      for (let i = 0; i < 4; i++) {
        el.style.fontSize = `${size}px`;
        const sw = el.offsetWidth;
        if (!sw) break;
        const next = Math.floor(((size * w) / sw) * 100) / 100;
        if (Math.abs(next - size) < 0.05) break;
        size = next;
      }
      el.style.fontSize = `${size}px`;
    }
  });
}
