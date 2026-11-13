export const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  root.querySelector<T>(sel);
export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/**
 * Frame-rate independent easing. `rate` is the fraction covered per 60 Hz frame, `k` the elapsed time in such
 * frames (Frame.k): identical to lerp(a, b, rate) at 60 Hz, same speed at 120 Hz.
 */
export const damp = (a: number, b: number, rate: number, k: number) => a + (b - a) * (1 - Math.pow(1 - rate, k));
export const easeInOut3 = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const fine = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
/** The design's breakpoint: header nav + split hero from here up. Keep in sync with the CSS (900px). */
export const isWide = () => innerWidth >= 900;

/** Layout box of an element: skips the display:contents <picture> wrapper. */
export function hostOf(el: Element): HTMLElement {
  const p = el.parentElement!;
  return (p.tagName === 'PICTURE' ? p.parentElement : p) as HTMLElement;
}

/** Document-space top of an element (its own transform included, so measure untransformed hosts). */
export function docTop(el: Element): number {
  return el.getBoundingClientRect().top + scrollY;
}

/** Write a style property only when the value actually changes. */
export function setStyle(el: HTMLElement & { _s?: Record<string, string> }, prop: string, value: string) {
  const cache = (el._s ||= {});
  if (cache[prop] === value) return;
  cache[prop] = value;
  el.style.setProperty(prop, value);
}
