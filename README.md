# Carmen Log — sito

One-page site for Carmen Log, Wedding & Event Planner in Basilicata, implemented from the Claude Design
project "Landing page wedding planner" (`Carmen Log Landing v2.dc.html`, copies in `design/`).
Static [Astro](https://astro.build) build, same stack and conventions as `../baratto`:
hosted on GitHub Pages, content editable through Decap CMS (prepared, not yet switched on).

```
npm install
npm run dev        # http://localhost:4321
npm run build      # → dist/
npm run preview    # serve dist/
npm run check      # type + content-schema check
```

How it works inside (boot sequence, `data-*` contract, animation loop, content model):
see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Design variants implemented
The design file is a set of proposals switched by props; this build implements the defaults chosen there:

| Part | Variant |
|---|---|
| Intro | **Sequenza** — event photos wipe in one after another with their category, then the curtain lifts |
| Hero < 900px | **Mazzo** — the name on one line, a pile of Polaroids of the events Carmen organises (tap, swipe, "Sfoglia", autoplay), WhatsApp |
| Hero ≥ 900px | **Split** — text left, the vertical photo right at full height |
| Fonts | **Bodoni Moda + Work Sans** (+ IBM Plex Mono for small labels) |
| Storie | **Stack** — full-height cards that stick and pile up |
| Menu mobile | **Cerchio** — a circle grows out of the burger |
| Finale | **Galleria** — three photo columns drifting at different speeds behind a card |

On desktop WhatsApp lives only in the header; on mobile a floating "Scrivimi" button appears after the hero.

## Structure

```
design/                    ← Claude Design pages (source of truth for layout), not built, git-ignored
src/
  content/                 ← ALL editable texts + image references (CMS writes here)
    pages/home.json
    settings/site.json     ← brand, WhatsApp number + message, Instagram, area, P.IVA, intro on/off
  content.config.ts        ← schema: a bad edit fails the build instead of breaking the page
  assets/images/           ← photos (optimized at build: AVIF + WebP, responsive widths)
  components/
    sections/*.astro       ← one file per page section, scoped CSS next to markup
    ui/                    ← Img (responsive <picture>, `skip` per breakpoint), Lines (masked headings), Brand ("Carmen *Log*")
    Seo.astro              ← meta, Open Graph, canonical, hreflang, JSON-LD graph
    Header.astro, Intro.astro, Footer.astro, Fab.astro
  layouts/Base.astro       ← <head>, fonts, motion/intro flags
  lib/                     ← content loaders, rich text, WhatsApp link, nav, base-path URLs, deck pile
  pages/
    index.astro
    robots.txt.ts          ← blocks crawlers unless INDEXABLE=true
    llms.txt.ts            ← plain-text summary for AI assistants (GEO)
  scripts/
    main.ts                ← entry, load order
    core/                  ← single rAF loop (read→write phases), Lenis, visibility, helpers
    features/              ← intro, reveal, fit, chrome (header/bg/fab), deck, scroll-fx, marquee, menu, cursor
  styles/global.css        ← tokens, primitives, motion initial states
public/admin/              ← Decap CMS (config.yml)
.github/workflows/deploy.yml ← build + deploy to GitHub Pages on every push to main
```

### Text conventions (CMS)
- `*parola*` → italic accent in rosa antico (in the manifesto: italic only)
- Headings that are lists of lines slide in line by line.

## Performance notes
- Zero framework runtime: HTML + inlined CSS; one ~9 KB (gzip) script incl. smooth scroll.
- One animation loop for everything; layout measured on resize only; only `transform`, `opacity`,
  `clip-path` are animated (the story stack dims with an overlay's opacity, not `filter`).
- Hero photo (desktop) and the first two deck cards (mobile) load with `fetchpriority=high`, each only at its
  own breakpoint; everything else lazy with explicit sizes (no CLS).
- Intro plays once per session (~3.9 s, the design's timing) over the already-rendered hero; its photos
  are fetched only when it plays.
- Fonts self-hosted by Astro (Bodoni Moda with its optical-size axis, Work Sans, IBM Plex Mono),
  subset, with metric-matched fallbacks.
- Without JS or with reduced motion every section degrades to a static, fully readable layout.

## SEO / GEO
- Semantic sections, one `h1` (the brand + a visually hidden "Wedding & Event Planner in Basilicata"),
  ordered `h2/h3`, stories as an ordered list of `article`s.
- JSON-LD graph: `ProfessionalService`/`LocalBusiness` (founder, area served, services as offers,
  Instagram), `WebSite`, `WebPage`. Built from `settings/site.json` — WhatsApp number, locality and
  P.IVA are added automatically once filled in.
- `/llms.txt`, `/sitemap-index.xml`, `/robots.txt`, canonical + `hreflang` (IT now, EN-ready).
- **Collaudo is `noindex`.** At launch: connect the custom domain in GitHub → Settings → Pages,
  add the repo variable `INDEXABLE=true` and re-run the deploy.

## Deploy (GitHub Pages)
Same workflow as Baratto: every push to `main` builds and deploys via `.github/workflows/deploy.yml`.
The repo doesn't exist yet: create it (e.g. `carmen-log-site`), push, enable Pages → "GitHub Actions".
Every internal URL must go through `import.meta.env.BASE_URL` / `src/lib/url.ts`, never a hard-coded `/…`.

## Turning on the CMS (Decap)
Planned switch to Sveltia CMS, missing validations, open decisions: see [docs/CMS.md](docs/CMS.md).

Local, no account needed:
```
npm run cms     # terminal 1 (local Decap proxy)
npm run dev     # terminal 2 → http://localhost:4321/admin/
```
Online: deploy an OAuth proxy (e.g. decap-proxy on Cloudflare Workers), create a GitHub OAuth app,
set `backend.base_url` and `backend.repo` in `public/admin/config.yml`.

## Open items
- **WhatsApp number** → `settings/site.json` → `whatsapp.number`. Until then every WhatsApp button
  opens WhatsApp without a recipient (the build prints a warning).
- Locality (comune), email, P.IVA (required by Italian law on business sites) → `site.json`.
- Privacy/cookie policy page (no cookies or trackers are used today).
- Optional hero video: the design supports a video in place of the veil photo (`heroVideo`); not wired yet.
