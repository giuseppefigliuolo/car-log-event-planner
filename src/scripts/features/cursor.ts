/** Desktop only: the pink bubble that follows the pointer over [data-cursor] (with its label), and magnetic buttons. */
import { $$, damp } from '../core/dom';
import { subscribe } from '../core/loop';

export function initCursor() {
  const html = document.documentElement;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  bubble.appendChild(label);
  document.body.appendChild(bubble);

  let mx = -200, my = -200, bx = mx, by = my, s = 0, over = false, idle = true;
  addEventListener('mousemove', (e) => {
    if (idle) { bx = e.clientX; by = e.clientY; idle = false; }
    mx = e.clientX; my = e.clientY;
  }, { passive: true });
  document.addEventListener('mouseover', (e) => {
    const t = (e.target as Element).closest?.<HTMLElement>('[data-cursor]');
    over = !!t;
    if (t) label.textContent = t.dataset.cursor!;
  });
  document.addEventListener('mouseleave', () => { over = false; });

  const magnets = $$('[data-magnet]').map((el) => ({ el, x: 0, y: 0, r: null as DOMRect | null }));

  subscribe({
    read: (f) => {
      for (const m of magnets) {
        const r = m.el.getBoundingClientRect();
        m.r = r.bottom < 0 || r.top > f.vh ? null : r;
      }
    },
    write: (f) => {
      const target = over && !html.classList.contains('menu-open') ? 1 : 0;
      if (Math.abs(mx - bx) > 0.1 || Math.abs(my - by) > 0.1 || Math.abs(s - target) > 0.001) {
        bx = damp(bx, mx, 0.2, f.k); by = damp(by, my, 0.2, f.k); s = damp(s, target, 0.16, f.k);
        bubble.style.transform = `translate3d(${bx.toFixed(1)}px,${by.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      }
      for (const m of magnets) {
        if (!m.r) continue;
        // Centre without the current pull, so the button doesn't chase itself.
        const cx = m.r.left + m.r.width / 2 - m.x, cy = m.r.top + m.r.height / 2 - m.y;
        const dx = mx - cx, dy = my - cy;
        const near = Math.hypot(dx, dy) < Math.max(m.r.width, m.r.height) * 0.9;
        const tx = near ? dx * 0.3 : 0, ty = near ? dy * 0.3 : 0;
        if (Math.abs(tx - m.x) < 0.05 && Math.abs(ty - m.y) < 0.05) continue;
        m.x = damp(m.x, tx, 0.15, f.k); m.y = damp(m.y, ty, 0.15, f.k);
        m.el.style.transform = `translate3d(${m.x.toFixed(1)}px,${m.y.toFixed(1)}px,0)`;
      }
    }
  });
}
