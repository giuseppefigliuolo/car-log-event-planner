# Carmen Log — architecture

Developer guide to how the site is built. For setup, deploy and CMS see the [README](../README.md).
Same skeleton as `../baratto` (content collections → sections → one rAF loop), smaller.

## 1. Where it comes from

Claude Design project "Landing page wedding planner"
([`5d4b3784-…`](https://claude.ai/design/p/5d4b3784-8dbe-4237-a840-54aadc0b9dc7)), moved to the canvas
<https://claude.ai/artifact/SSFRCemKTroLhqPBrbLayV>. Copies of its pages are in `design/` (git-ignored):

| File | What it is |
|---|---|
| `Carmen Log Landing v2.dc.html` | **The page implemented.** One template with every proposal behind props (`introVariant`, `heroVariant`, `heroDesktop`, `fontPair`, `storieVariant`, `menuVariant`, `finaleVariant`); the defaults are the chosen ones. |
| `Carmen Log Proposte.dc.html` | The comparison board (each proposal in an iframe, "Turno 2" mobile, "Turno 3" desktop + fonts). |
| `Carmen Log Landing.dc.html` | First round. Not used. |

The photos in `src/assets/images/` are the design's `assets/*.jpg`, unchanged (`festa-verde.jpg` is not
used by the page, kept for the CMS).

## 2. Boot sequence

```
<head> inline script ─ prefers-reduced-motion? ── no ──→ html.m
                       first visit this session? ─ yes ─→ html.intro   (overlay visible from first paint)
main.ts
  always:  initSmooth (Lenis only with .m) → initFit → initMenu → initChrome
  .m only: runIntro() ─ hero promise → heroIn(delay)      (adds .is-in on [data-hero], --hd = delay)
                       └ done promise → initReveal starts revealing
           initScrollFx, initMarquee, initCursor (fine pointer only)
  start()  one rAF loop; remeasure on resize / body ResizeObserver / fonts.ready / load
```

Intro timeline (`features/intro.ts`, the design's numbers): photo *i* wipes in at `200 + i·320 ms`
(700 ms, alternating ±2° tilt), the label switches with it; at `200 + n·320 + 500 ms` the curtain lifts
(1150 ms) and the hero entrance starts 250 ms later. A guard releases the page after 6 s whatever happens,
and a CSS animation hides the overlay at 6.5 s if JS never ran.

## 3. The `data-*` contract

| Attribute | Where | Effect |
|---|---|---|
| `data-hero` | hero `<section>` | gets `.is-in`; children: `data-hl` (title lines slide up), `data-hf` (texts fade/rise), `data-hi` (photo wipe from the bottom). Order via `--i`. |
| `data-r` | any | fade + rise on entering the viewport (batch-staggered 80 ms via `--d`) |
| `data-rm` / `data-rl` | heading / its lines | lines slide out of `.mask`, `--i` × 110 ms |
| `data-px` (`data-ps`, `data-px-wide`, `data-ps-wide`) | image or wrapper | parallax relative to its parent; with a scale the offset is clamped to the spare room |
| `data-fit` (`="m"`: only < 900px) | the giant names | font-size fitted to the parent's content width (iterated: Bodoni's opsz axis makes width non-linear in size) |
| `data-words` / `data-wd` | manifesto | words get `.on` as the paragraph scrolls (82% → top) |
| `data-sc` / `data-dim` | story slots | covered card scales to 0.93 and dims by 25% |
| `data-bg="#hex"` | sections | page background blends to it when the section crosses 55% of the viewport |
| `data-marquee` | services band | drifts left, faster with scroll velocity |
| `data-cursor="Label"` | images | pink bubble with the label follows the pointer (desktop) |
| `data-magnet` | contact CTA | pulled toward the pointer when near |
| `data-hdr`, `data-fab`, `data-menu*` | chrome | header hide/frost, mobile WhatsApp button, menu |

## 4. Animation loop

`core/loop.ts` (same as Baratto): every subscriber gets `read` then `write` phases, a `Frame` with
`y, dy, vel, k (60 Hz frames elapsed), vw, vh, changed`. Layout is cached in `onMeasure` callbacks
(rebuilt on resize); per-frame reads only where unavoidable: the sticky story slots (only while the stack is
near the viewport) and the magnet button. `initFit` registers first so later measures see final sizes.

## 5. Content model

`src/content.config.ts` validates `pages/home.json` and `settings/site.json` (Zod + `image()`).
`public/admin/config.yml` mirrors it for Decap. All WhatsApp links go through `lib/contact.ts →
whatsappHref()` (number + prefilled message from settings).

## 6. Design vs. implementation

- Variants: only the chosen defaults are built; the alternatives stay in `design/`.
- Hero: the design renders two different heroes (mobile Full-bleed / desktop Split) and switches in JS at
  900px. Here it's one `<section>` with one `h1`, rearranged by CSS at the same breakpoint (no JS, no
  duplicated heading).
- Background-image `<div>`s became real `<img>` (responsive AVIF/WebP, alt text) for performance and SEO.
- Contatti columns: each column's photos run twice so tall phones never show an empty band under them.
- Mobile hero: a faint top gradient keeps the header logo legible over the white veil.
- Story stack dims with a black overlay's opacity instead of `filter: brightness()` (compositor-only).
- Reduced motion: transitions are 0 s (not 0.01 ms: `transition-property` defaults to `all`, which made
  the fitting measure the previous font-size).
- Not built: the optional hero video prop (`heroVideo`).
