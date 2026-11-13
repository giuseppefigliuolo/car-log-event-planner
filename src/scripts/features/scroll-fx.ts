/**
 * Scroll-linked effects (motion only):
 *  parallax [data-px] (speed; [data-ps] scale, the offset never exceeds the scale's spare room;
 *    [data-px-wide]/[data-ps-wide] override them from 900px up),
 *  manifesto words [data-words] that fill in as the paragraph is read,
 *  story stack [data-sc]: a card shrinks and dims while the next one covers it.
 */
import { $, $$, clamp, docTop, hostOf, isWide, setStyle } from '../core/dom';
import { onMeasure, subscribe } from '../core/loop';
import { watch } from '../core/visible';

export function initScrollFx() {
  parallax();
  words();
  stack();
}

function parallax() {
  const items = $$('[data-px]').map((el) => ({ el, host: hostOf(el), speed: 0, scale: 1, top: 0, h: 0, eh: 0 }));
  if (!items.length) return;
  onMeasure(() => {
    const wide = isWide();
    for (const it of items) {
      const d = it.el.dataset;
      it.speed = +((wide && d.pxWide) || d.px || 0);
      it.scale = +((wide && d.psWide) || d.ps || 1);
      it.top = docTop(it.host);
      it.h = it.host.offsetHeight;
      it.eh = it.el.offsetHeight;
    }
  });
  subscribe((f) => {
    if (!f.changed) return;
    for (const it of items) {
      const top = it.top - f.y;
      if (top + it.h < -300 || top > f.vh + 300) continue;
      let off = (top + it.h / 2 - f.vh / 2) * -it.speed;
      if (it.scale > 1) { const m = ((it.scale - 1) / 2) * it.eh; off = clamp(off, -m, m); }
      setStyle(it.el, 'transform', `translate3d(0,${off.toFixed(1)}px,0) scale(${it.scale})`);
    }
  });
}

function words() {
  const box = $('[data-words]');
  if (!box) return;
  const ws = $$('[data-wd]', box);
  let top = 0, h = 0, last = -1;
  onMeasure(() => { top = docTop(box); h = box.offsetHeight; });
  subscribe((f) => {
    if (!f.changed) return;
    const r = top - f.y;
    const n = Math.round(clamp((f.vh * 0.82 - r) / (h + f.vh * 0.2)) * ws.length);
    if (n === last) return;
    const [a, b] = last < 0 ? [0, ws.length] : [Math.min(n, last), Math.max(n, last)];
    for (let i = a; i < b; i++) ws[i].classList.toggle('on', i < n);
    last = n;
  });
}

function stack() {
  const slots = $$('[data-sc]');
  if (slots.length < 2) return;
  const cards = slots.map((s) => ({ card: s.firstElementChild as HTMLElement, dim: $('[data-dim]', s) }));
  const zone = watch(slots[0].parentElement!, '10% 0px');
  let tops: number[] = [], was = false;
  subscribe({
    // Sticky boxes move on their own: read their live positions (reads first, no writes in between).
    // `!was`: the observer reports a jump (anchor link) a frame late, after the scroll frame has passed.
    read: (f) => {
      tops = zone.on && (f.changed || !was) ? slots.map((s) => s.getBoundingClientRect().top) : [];
      was = zone.on;
    },
    write: (f) => {
      if (!tops.length) return;
      cards.forEach(({ card, dim }, i) => {
        const next = tops[i + 1];
        const p = next === undefined ? 0 : clamp((f.vh - next) / Math.max(1, f.vh - tops[i]));
        setStyle(card, 'transform', p ? `scale(${(1 - p * 0.07).toFixed(4)})` : 'none');
        if (dim) setStyle(dim, 'opacity', (p * 0.25).toFixed(3));
      });
    }
  });
}
