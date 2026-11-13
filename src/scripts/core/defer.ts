/**
 * Photos marked `defer` (components/ui/Img.astro) ship without src: they can't be seen yet, so they stay out of
 * the initial load. Once the page has loaded and a second has passed, they are filled in when the browser is idle.
 */
import { $$ } from './dom';

function fill() {
  for (const img of $$<HTMLImageElement>('img[data-defer]')) {
    img.parentElement?.querySelectorAll<HTMLSourceElement>('source[data-srcset]').forEach((s) => {
      s.srcset = s.dataset.srcset!;
      s.removeAttribute('data-srcset');
    });
    img.src = img.dataset.src!;
    img.removeAttribute('data-defer');
    img.removeAttribute('data-src');
  }
}

export function initDefer() {
  const idle = () => (typeof requestIdleCallback === 'function' ? requestIdleCallback(fill, { timeout: 2500 }) : setTimeout(fill, 0));
  const later = () => setTimeout(idle, 1000);
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
}
