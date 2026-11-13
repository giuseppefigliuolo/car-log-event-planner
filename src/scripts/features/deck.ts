/**
 * Mobile hero "Mazzo" (<900px): a pile of Polaroids. The front card flies off sideways on a swipe, "Sfoglia" or the
 * autoplay; the rest of the pile moves up (CSS transition on transform/opacity). A tap (or "Gira") turns the front card
 * over instead, showing its handwritten back (CSS 3D: .flip[data-flip="1"], see Hero.astro).
 *  - size: from the deck's box, on every change of it (ResizeObserver: resize, fonts, name block height)
 *  - pile: lib/deck pileStyle(), the same the markup uses for the first paint
 *  - drag: Pointer Events; `touch-action: pan-y` leaves vertical scrolling to the browser (→ pointercancel)
 *  - flip: only the front card can be turned; autoplay waits while it is (9 s after turning it, 2.5 s after turning it
 *    back); a turned card that gets thrown shows its back while it flies and is reset once it's at the bottom
 *  - autoplay (motion only): every 3.2 s from the shared rAF loop, only while the deck is on screen,
 *    nothing else is moving it, the card isn't turned, the intro is over and the menu closed
 *  - entrance (motion only): `enter(delay)`, started with the hero's (main.ts); the cards fly in from below
 *    through the independent `translate`/`rotate` properties, so the pile's `transform` is left alone
 */
import { $, $$, isWide } from '../core/dom';
import { subscribe } from '../core/loop';
import { watch } from '../core/visible';
import { pileStyle } from '../../lib/deck';

const EASE = 'cubic-bezier(.22,1,.36,1)';
const IO = 'cubic-bezier(.76,0,.24,1)';
const FLICK = 'cubic-bezier(.2,.75,.3,1)';
const EVERY = 3200; // ms between autoplay throws

export interface Deck { enter(delay: number): void }

interface Press { id: number; x: number; y: number; lx: number; lt: number; v: number; dx: number; dy: number; drag: boolean }

export function initDeck(motion: boolean): Deck | null {
  const deck = $('[data-deck]');
  const cards = deck ? $$('[data-card]', deck) : [];
  const n = cards.length;
  if (!deck || n < 2) return null;
  const html = document.documentElement;
  const ctrl = $('[data-deck-ctrl]');
  const count = $('[data-deck-count]');
  const pad = (x: number) => String(x).padStart(2, '0');

  let top = 0; // index of the front card
  let flying = false; // a throw is running: no new throw, no new press
  let press: Press | null = null;
  let ready = motion ? Infinity : 0; // autoplay starts after the entrance
  let paused = 0; // autoplay paused until (ms)
  let last = 0; // time of the last throw
  let turned = false; // the front card shows its back

  // ---- size (px; the CSS fallback in Hero.astro is the same formula) ----
  const layout = () => {
    const w = deck.clientWidth, h = deck.clientHeight;
    if (!w || !h) return; // hidden (≥900px)
    const cw = Math.round(Math.max(150, Math.min(w * 0.74, 300, (h - 52 - 33.5) / 1.25)));
    const ch = 1.25 * cw + 33.5; // 4:5 photo + frame + caption
    const y = Math.max(0, (h - ch - 40) / 2); // 40px for the cards peeking out behind
    for (const c of cards) {
      c.style.width = `${cw}px`;
      c.style.left = `${(w - cw) / 2}px`;
      c.style.top = `${y}px`;
    }
    if (ctrl) ctrl.style.width = `${cw}px`;
  };
  new ResizeObserver(layout).observe(deck);

  // ---- pile ----
  const place = (c: HTMLElement, i: number) => {
    const p = pileStyle(i, (i - top + n) % n, n);
    c.style.zIndex = p.zIndex;
    c.style.opacity = p.opacity;
    c.style.transform = p.transform;
  };
  const pile = (except?: HTMLElement) => cards.forEach((c, i) => c !== except && place(c, i));
  const settle = () => {
    const c = cards[top];
    c.style.transition = '';
    place(c, top);
  };

  // Announced only when the visitor flipped it: the autoplay would talk every 3 s.
  const show = (byUser: boolean) => {
    if (!count) return;
    count.setAttribute('aria-live', byUser ? 'polite' : 'off');
    count.textContent = `${pad(top + 1)} / ${pad(n)}`;
  };

  // ---- flip the front card ----
  const flipOf = (c: HTMLElement) => $('[data-flip]', c)!;
  const canFlip = (c: HTMLElement) => !!$('[data-face="back"]', c);
  // Only the visible face is exposed to screen readers.
  const face = (c: HTMLElement, on: boolean) => {
    flipOf(c).dataset.flip = on ? '1' : '0';
    $('[data-face="front"]', c)?.setAttribute('aria-hidden', String(on));
    $('[data-face="back"]', c)?.setAttribute('aria-hidden', String(!on));
  };
  /** Turn the front card over (or back). False when it can't (a throw is running, or the card has no back). */
  const flip = () => {
    const c = cards[top];
    if (flying || !canFlip(c)) return false;
    turned = !turned;
    face(c, turned);
    paused = performance.now() + (turned ? 9000 : 2500);
    return true;
  };
  // A thrown card is at the bottom of the pile, invisible: put it face up again without the turning animation.
  const reset = (c: HTMLElement) => {
    const f = flipOf(c);
    if (f.dataset.flip !== '1') return;
    f.style.transition = 'none';
    face(c, false);
    f.getBoundingClientRect(); // flush: the style change above must apply before the transition comes back
    f.style.transition = '';
  };

  // ---- throw the front card ----
  const fling = (dir: 1 | -1, byUser: boolean, dragDy?: number) => {
    if (flying) return;
    flying = true;
    last = performance.now();
    const i = top, c = cards[i];
    const from = getComputedStyle(c).transform; // wherever it is now (dragged, settling, at rest)
    const to = `translate3d(${dir * innerWidth * 1.15}px,${(dragDy ?? 0) - 30}px,0) rotate(${dir * 24}deg)`;
    c.style.transition = 'none';
    c.style.zIndex = String(40 + n);
    const a = c.animate(
      [{ transform: from }, { transform: to }],
      dragDy === undefined
        ? { duration: 780, easing: IO, fill: 'forwards' }
        : { duration: 460, easing: FLICK, fill: 'forwards' }
    );
    top = (top + 1) % n;
    turned = false; // the new front card is face up
    pile(c);
    show(byUser);
    a.onfinish = () => {
      place(c, i); // back of the pile, invisible, no transition
      reset(c);
      a.cancel();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        c.style.transition = '';
        flying = false;
      }));
    };
  };

  // ---- pointer: tap = turn, swipe = throw that way, short drag = back in place ----
  deck.addEventListener('pointerdown', (e) => {
    if (flying || press || (e.pointerType === 'mouse' && e.button !== 0)) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, lx: e.clientX, lt: e.timeStamp, v: 0, dx: 0, dy: 0, drag: false };
    paused = performance.now() + 4000;
    deck.setPointerCapture(e.pointerId);
  });
  deck.addEventListener('pointermove', (e) => {
    const p = press;
    if (!p || e.pointerId !== p.id) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (!p.drag) {
      if (Math.abs(dx) <= 6) return;
      p.drag = true;
      cards[top].style.transition = 'none';
    }
    const dt = e.timeStamp - p.lt;
    if (dt > 0) p.v = (e.clientX - p.lx) / dt; // px/ms of the last move
    p.lx = e.clientX;
    p.lt = e.timeStamp;
    p.dx = dx;
    p.dy = dy;
    cards[top].style.transform = `translate3d(${dx}px,${dy * 0.25}px,0) rotate(${dx * 0.07}deg)`;
  });
  deck.addEventListener('pointerup', (e) => {
    const p = press;
    if (!p || e.pointerId !== p.id) return;
    press = null;
    paused = performance.now() + 2500;
    if (!p.drag) { if (!flip()) fling(-1, true); } // a card without a back goes to the next one
    else if (Math.abs(p.dx) > 70 || Math.abs(p.v) > 0.55) fling((p.dx || p.v) < 0 ? -1 : 1, true, p.dy);
    else settle();
  });
  // The browser took the gesture (vertical scroll): put the card back.
  deck.addEventListener('pointercancel', (e) => {
    const p = press;
    if (!p || e.pointerId !== p.id) return;
    press = null;
    if (p.drag) settle();
  });

  $('[data-deck-next]')?.addEventListener('click', () => {
    paused = performance.now() + 2500;
    fling(-1, true);
  });
  // A card that can't turn: the button does what "Sfoglia" does.
  $('[data-deck-flip]')?.addEventListener('click', () => {
    if (!flip()) {
      paused = performance.now() + 2500;
      fling(-1, true);
    }
  });

  // ---- autoplay ----
  if (motion) {
    const zone = watch(deck, '0px');
    subscribe((f) => {
      if (!zone.on || flying || press || turned || f.now < ready || f.now < paused || f.now - last < EVERY) return;
      if (html.classList.contains('intro') || html.classList.contains('menu-open')) return;
      fling(-1, false);
    });
  }

  return {
    enter(delay) {
      ready = performance.now() + delay + 300 + n * 110 + 2400;
      if (isWide()) return; // hidden: the cards just sit in the pile
      cards.forEach((c, i) => {
        const d = (i - top + n) % n;
        const a = c.animate(
          [{ translate: '0 115vh', rotate: `${i % 2 ? 16 : -16}deg` }, { translate: '0 0', rotate: '0deg' }],
          { duration: 1250, easing: EASE, fill: 'both', delay: delay + 300 + (n - 1 - d) * 110 }
        );
        // Done: the CSS rest state (no translate/rotate) is the same, so drop the animation.
        a.finished.then(() => a.cancel(), () => {});
      });
    }
  };
}
