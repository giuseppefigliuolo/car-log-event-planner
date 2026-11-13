/** Mobile menu: accessible toggle (aria-expanded, inert, Esc), scroll lock, animated links. */
import { $, $$ } from '../core/dom';
import { lockScroll, scrollToHash } from '../core/smooth';

export function initMenu() {
  const btn = $<HTMLButtonElement>('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const label = $('[data-menu-label]');
  if (!btn || !menu) return;
  const html = document.documentElement;
  let open = false;

  const set = (v: boolean) => {
    open = v;
    html.classList.toggle('menu-open', v);
    btn.setAttribute('aria-expanded', String(v));
    if (label) label.textContent = v ? 'Chiudi' : 'Menu';
    v ? menu.removeAttribute('inert') : menu.setAttribute('inert', '');
    lockScroll(v);
    if (v) $('a', menu)?.focus({ preventScroll: true });
  };

  btn.addEventListener('click', () => set(!open));
  addEventListener('keydown', (e) => {
    if (open && e.key === 'Escape') { set(false); btn.focus(); }
  });
  $$<HTMLAnchorElement>('[data-menu-link]', menu).forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      set(false);
      setTimeout(() => scrollToHash(a.getAttribute('href')!), 400);
    })
  );
  // Leaving the mobile layout with the menu open must not keep the page locked.
  matchMedia('(min-width: 900px)').addEventListener('change', (m) => m.matches && open && set(false));
}
