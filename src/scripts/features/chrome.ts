/**
 * Page chrome driven by scroll position (runs with or without motion):
 *  - header: hides while scrolling down (past 180px), frosted once scrolled (always on desktop)
 *  - header logo (<900px): hidden while the hero shows the name, back once the hero is mostly scrolled
 *    past or the menu opens (data-logo, styles in Header.astro)
 *  - page background: blends to the colour of the [data-bg] section across the 55% line
 *  - mobile WhatsApp button [data-fab]: after the hero, hidden over the contact section
 */
import { $, $$, docTop, isWide } from '../core/dom';
import { onMeasure, subscribe } from '../core/loop';

export function initChrome() {
  const html = document.documentElement;
  const hdr = $('[data-hdr]');
  const fab = $('[data-fab]');
  const contact = $('#contatti');
  const hero = $('[data-hero]');
  const base = getComputedStyle(html).getPropertyValue('--bg').trim() || '#f8f4ef';
  const secs = $$('[data-bg]').map((el) => ({ c: el.dataset.bg!, el, top: 0, h: 0 }));

  let wide = isWide(), contactTop = Infinity, heroH = 0;
  onMeasure(() => {
    wide = isWide();
    contactTop = contact ? docTop(contact) : Infinity;
    heroH = hero ? hero.offsetHeight : 0;
    secs.forEach((s) => { s.top = docTop(s.el); s.h = s.el.offsetHeight; });
  });

  const state = { hidden: false, solid: false, fab: false, bg: '', logo: '' };
  const toggle = (el: HTMLElement | null, cls: string, key: 'hidden' | 'solid' | 'fab', v: boolean) => {
    if (!el || state[key] === v) return;
    state[key] = v;
    el.classList.toggle(cls, v);
  };

  subscribe((f) => {
    const menu = html.classList.contains('menu-open');
    if (Math.abs(f.dy) > 1 || menu) toggle(hdr, 'is-hidden', 'hidden', f.dy > 0 && f.y > 180 && !menu);
    toggle(hdr, 'is-solid', 'solid', (f.y > 40 || wide) && !menu);
    toggle(fab, 'is-on', 'fab', f.y > f.vh * 0.9 && contactTop - f.y > f.vh * 0.9 && !menu && !html.classList.contains('intro'));
    const logo = wide || menu || f.y > heroH - f.vh * 0.45 ? 'on' : 'off';
    if (hdr && logo !== state.logo) { state.logo = logo; hdr.dataset.logo = logo; }
    if (!f.changed) return;
    const line = f.y + f.vh * 0.55;
    let c = base;
    for (const s of secs) if (line > s.top && line < s.top + s.h) { c = s.c; break; }
    if (c !== state.bg) { state.bg = c; document.body.style.backgroundColor = c; }
  });
}
