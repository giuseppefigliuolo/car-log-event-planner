/**
 * Review notes [data-reviews] > figure[data-tilt="base degrees"]: the note at the centre of the screen is straight,
 * the others lean by `base × clamp(|note centre − screen centre| / (0.6 × viewport width), 0, 1)`.
 * Runs on the shared rAF loop, only while the strip is on screen and only when something moved (page scroll,
 * the strip's own horizontal scroll, resize); rects are read first, styles written after, only for notes in view,
 * only when the value changes. Motion only: without it the notes stay straight.
 */
import { $, $$, clamp, setStyle } from '../core/dom';
import { subscribe } from '../core/loop';
import { watch } from '../core/visible';

export function initReviews() {
  const track = $('[data-reviews]');
  if (!track) return;
  const notes = $$('[data-tilt]', track).map((el) => ({ el, base: Number(el.dataset.tilt) || 0 }));
  if (!notes.length) return;
  const zone = watch(track, '0px');
  let moved = true; // the strip scrolled sideways since the last frame
  track.addEventListener('scroll', () => { moved = true; }, { passive: true });

  let centres: (number | null)[] = [];
  subscribe({
    read: (f) => {
      centres = [];
      if (!zone.on || !(f.changed || moved)) return;
      moved = false;
      // A rotation doesn't move a box's centre, so the leaning notes measure the same as straight ones.
      centres = notes.map(({ el }) => {
        const r = el.getBoundingClientRect();
        return r.right < 0 || r.left > f.vw ? null : (r.left + r.right) / 2;
      });
    },
    write: (f) => {
      centres.forEach((cx, i) => {
        if (cx === null) return;
        const { el, base } = notes[i];
        const k = clamp(Math.abs(cx - f.vw / 2) / (0.6 * f.vw));
        setStyle(el, 'transform', `rotate(${(base * k).toFixed(2)}deg)`);
      });
    }
  });
}
