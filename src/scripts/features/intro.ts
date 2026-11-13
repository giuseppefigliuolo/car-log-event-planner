/**
 * First-visit intro ("Sequenza", ≈3.9 s): the event photos wipe in one after another while the label
 * names each category, then the curtain lifts onto the hero. Skipped for returning visitors in the same
 * session and with reduced motion (decided in <head>, see Base.astro).
 *  hero: resolves with the delay (ms) the hero entrance should use
 *  done: resolves once the overlay is gone and scrolling is released
 */
import { $, $$ } from '../core/dom';
import { lockScroll } from '../core/smooth';

const KEY = 'cl-intro';
const E = 'cubic-bezier(.22,1,.36,1)';
const IO = 'cubic-bezier(.76,0,.24,1)';
const STEP = 320; // ms between photos

export interface Intro { hero: Promise<number>; done: Promise<void> }

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function runIntro(): Intro {
  const html = document.documentElement;
  const el = $('[data-intro-el]');
  if (!html.classList.contains('intro') || !el) {
    html.classList.remove('intro');
    el?.remove();
    return { hero: Promise.resolve(60), done: Promise.resolve() };
  }
  try { sessionStorage.setItem(KEY, '1'); } catch {}
  lockScroll(true);

  const label = $('[data-intro-label]', el)!;
  const frame = $('[data-intro-frame]', el)!;
  const imgs = $$<HTMLImageElement>('img[data-intro-img]', el);
  const words = $$('[data-intro-w]', el);
  const A = (t: Element, kf: Keyframe[], o: KeyframeAnimationOptions) => t.animate(kf, { fill: 'both', easing: E, ...o });

  let heroIn!: (d: number) => void, release!: () => void;
  const hero = new Promise<number>((r) => (heroIn = r));
  const done = new Promise<void>((r) => (release = r));
  let over = false;
  const finish = () => {
    if (over) return;
    over = true;
    heroIn(0);
    lockScroll(false);
    html.classList.remove('intro');
    el.remove();
    release();
  };
  // Never leave the page locked, whatever happens.
  const guard = setTimeout(finish, 6000);

  // Fetch the photos now (they have no src in the HTML), start once they're decoded — at most 1.2 s.
  imgs.forEach((img, i) => {
    if (!i) img.fetchPriority = 'high';
    img.src = img.dataset.src!;
  });
  Promise.race([Promise.all(imgs.map((img) => img.decode().catch(() => {}))), wait(1200)]).then(() => {
    try {
      A(label, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 150 });
      words.forEach((w, i) => A(w, [{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], { duration: 1100, delay: 300 + i * 90 }));
      imgs.forEach((img, i) => {
        A(img, [
          { clipPath: 'inset(100% 0 0 0)', transform: `scale(1.25) rotate(${i % 2 ? 2 : -2}deg)` },
          { clipPath: 'inset(0% 0 0 0)', transform: 'scale(1) rotate(0deg)' }
        ], { duration: 700, delay: 200 + i * STEP, easing: IO });
        setTimeout(() => { label.textContent = img.dataset.label || ''; }, 200 + i * STEP);
      });
      const end = 200 + imgs.length * STEP + 500;
      setTimeout(() => {
        A(frame, [{ transform: 'none' }, { transform: 'translateY(-40px) scale(1.04)' }], { duration: 1100, easing: IO });
        A(el, [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }], { duration: 1150, easing: IO });
        heroIn(250);
      }, end);
      setTimeout(() => { clearTimeout(guard); finish(); }, end + 1250);
    } catch {
      finish();
    }
  });
  return { hero, done };
}

/** Hero entrance: titles, texts, photo wipe (states and delays in global.css, base delay in --hd). */
export function heroIn(delay: number) {
  const hero = $('[data-hero]');
  if (!hero) return;
  hero.style.setProperty('--hd', `${delay}ms`);
  hero.classList.add('is-in');
}
