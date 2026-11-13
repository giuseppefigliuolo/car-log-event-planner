/**
 * Mobile hero "Mazzo": where each Polaroid sits in the pile. Shared by the markup (first paint, no JS)
 * and scripts/features/deck.ts, so the pile the script draws is the one already on screen.
 */

/** Degrees, one per card (repeats past the sixth). */
export const TILTS = [-3.2, 4.4, -5.6, 2.6, -4.2, 5.2];

/** Card `i` of `n` at depth `d` (0 = front): the four front cards show, each one lower, smaller, more tilted. */
export function pileStyle(i: number, d: number, n: number) {
  const tilt = TILTS[i % TILTS.length];
  const scale = +(1 - d * 0.05).toFixed(2);
  const rot = +(d ? tilt : tilt * 0.25).toFixed(2);
  return {
    zIndex: String(20 + n - d),
    opacity: d < 4 ? '1' : '0',
    transform: `translate3d(0,${d * 13}px,0) scale(${scale}) rotate(${rot}deg)`
  };
}
