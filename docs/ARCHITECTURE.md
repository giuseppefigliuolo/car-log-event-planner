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

The photos in `src/assets/images/` are the design's `assets/*.jpg`, unchanged.

The mobile hero "Mazzo" and the mobile spacing came later as a written brief (not in the `design/` copies):
the brief is the reference for those.

## 2. Boot sequence

```
<head> inline script ─ prefers-reduced-motion? ── no ──→ html.m
                       first visit ever (no localStorage `cl-intro-seen`)? ─ yes ─→ html.intro   (overlay visible from first paint)
                       seen / reduced motion ─→ data-intro="skip" (overlay never painted)
main.ts
  always:  initSmooth (Lenis only with .m) → initFit → initMenu → initChrome → initDeck
  .m only: runIntro() ─ hero promise → heroIn(delay)      (adds .is-in on [data-hero], --hd = delay)
                                     + deck.enter(delay)  (cards fly in, autoplay starts after)
                       └ done promise → initReveal starts revealing
           initScrollFx, initMarquee, initCursor (fine pointer only)
  start()  one rAF loop; remeasure on resize / body ResizeObserver / fonts.ready / load
```

Intro timeline (`features/intro.ts`, the design's numbers): photo *i* wipes in at `200 + i·320 ms`
(700 ms, alternating ±2° tilt), the label switches with it; at `200 + n·320 + 500 ms` the curtain lifts
(1150 ms) and the hero entrance starts 250 ms later. `cl-intro-seen` is written when the intro ends (not when it starts), so leaving halfway shows it again; dev only: `?introreset=1` clears it. A guard releases the page after 6 s whatever happens,
and a CSS animation hides the overlay at 6.5 s if JS never ran.

## 3. The `data-*` contract

| Attribute | Where | Effect |
|---|---|---|
| `data-hero` | hero `<section>` | gets `.is-in`; children: `data-hl` (title lines slide up), `data-hf` (texts fade/rise), `data-hi` (photo wipe from the bottom). Order via `--i`. |
| `data-r` | any | fade + rise on entering the viewport (batch-staggered 80 ms via `--d`) |
| `data-rm` / `data-rl` | heading / its lines | lines slide out of `.mask`, `--i` × 110 ms |
| `data-px` (`data-ps`, `data-px-wide`, `data-ps-wide`) | image or wrapper | parallax relative to its parent; with a scale the offset is clamped to the spare room |
| `data-fit` (`="m"`: only < 900px) | the giant names | font-size fitted to the parent's content width (iterated: Bodoni's opsz axis makes width non-linear in size); the hero's parent is the centred name block |
| `data-words` / `data-wd` | manifesto | words get `.on` as the paragraph scrolls (82% → top) |
| `data-reviews` > `[data-tilt]` | Recensioni strip | each note leans by `base × clamp(distance from screen centre / 0.6vw)`, so the centred one is straight; computed on the rAF loop for visible notes only (`features/reviews.ts`) |
| `data-count="300"` | the figure in Chi sono | server renders 300; if still below the fold at load it is set to 0 and counts up once (1.8 s) when its top passes 88% of the viewport (`features/count.ts`). Hidden from screen readers; a visually hidden "300+ eventi realizzati" stands in |
| `data-sc` / `data-dim` | story slots | covered card scales to 0.93 and dims by 25% |
| `data-bg="#hex"` | sections | page background blends to it when the section crosses 55% of the viewport |
| `data-marquee` | services band | drifts left, faster with scroll velocity |
| `data-cursor="Label"` | images | pink bubble with the label follows the pointer (desktop) |
| `data-magnet` | contact CTA | pulled toward the pointer when near |
| `data-deck` / `data-card` | mobile hero pile | Polaroids sized from the deck's box; swipe/"Sfoglia" throw the front card, tap/"Gira" turn it over, autoplay every 3.2 s (`features/deck.ts`) |
| `data-flip` (`0`/`1`), `data-face` | inside a card | the 3D flipper and its two faces (`front` = the photo, `back` = the handwritten note, only when the card has `back` text); `aria-hidden` follows the visible face |
| `data-deck-ctrl`, `data-deck-count`, `data-deck-flip`, `data-deck-next` | under the pile | row as wide as a card, "01 / 06" counter, "Gira" and "Sfoglia" buttons |
| `data-hdr`, `data-fab`, `data-menu*` | chrome | header hide/glass (tinted with the page colour), mobile WhatsApp button, menu; `data-logo="on/off"` on the header hides the logo over the mobile hero |

## 4. Animation loop

`core/loop.ts` (same as Baratto): every subscriber gets `read` then `write` phases, a `Frame` with
`y, dy, vel, k (60 Hz frames elapsed), vw, vh, changed`. Layout is cached in `onMeasure` callbacks
(rebuilt on resize); per-frame reads only where unavoidable: the sticky story slots (only while the stack is
near the viewport) and the magnet button. `initFit` registers first so later measures see final sizes.
The deck's autoplay is a subscriber too (no timers); its card sizes follow the deck's own ResizeObserver.

## 5. Content model

`src/content.config.ts` validates `pages/home.json`, `settings/site.json` and the `reviews` collection (one JSON per review in `src/content/reviews/`; `published: false` by default; no published review → the Recensioni section isn't rendered). Reviews carry no schema.org markup on purpose: Google ignores a business's reviews of itself. (Zod + `image()`).
`public/admin/config.yml` mirrors it for Decap. All WhatsApp links go through `lib/contact.ts →
whatsappHref()` (number + prefilled message from settings).

## 6. Design vs. implementation

- Variants: only the chosen defaults are built; the alternatives stay in `design/`.
- Hero: the design renders two different heroes (mobile / desktop Split) and switches in JS at 900px.
  Here it's one `<section>` with one `h1`, rearranged by CSS at the same breakpoint (no JS, no duplicated
  heading). Each layout's photos are downloaded only at its breakpoint (`Img` `skip`: a 1×1
  inline placeholder source), so phones don't fetch the veil photo and desktops don't fetch the deck.
- Mazzo: the pile's first paint comes from the markup (`lib/deck.ts` `pileStyle()` inline, card size in
  container-query units, same formula as the script), so the script takes over without a jump and the
  pile still shows without JS. The counter's `aria-live` is switched off for autoplay flips (only the
  visitor's flips are announced) and the "Sfoglia" button's label contains its visible text.
- Background-image `<div>`s became real `<img>` (responsive AVIF/WebP, alt text) for performance and SEO.
- Contatti columns: on phones each column's photos run twice (one pass of 4 is ~650px, the section 108svh);
  from 900px up one pass fills the section and the repeat is hidden.
- Story stack dims with a black overlay's opacity instead of `filter: brightness()` (compositor-only).
- Reduced motion: transitions are 0 s (not 0.01 ms: `transition-property` defaults to `all`, which made
  the fitting measure the previous font-size).
- Not built: the optional hero video prop (`heroVideo`).
