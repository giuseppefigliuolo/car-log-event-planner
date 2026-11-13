# CMS — decision notes

**Status (2026-11-13): parked.** Direction agreed, nothing implemented yet. Decap is configured in
`public/admin/` but not active online.

## Decision

- **Keep Astro and the current architecture.** Content already lives in `src/content/*.json` and is
  validated by Zod at build time (`src/content.config.ts`). A Git-based CMS fits a one-page site with
  occasional edits: no server, no database, no cost, and every edit is a commit (history and rollback
  for free).
- **Switch from Decap to Sveltia CMS** (planned, see below).

## How a Git-based CMS works

1. The client opens `<site>/admin` and logs in with GitHub.
2. They edit texts and photos in a form (fields defined in `public/admin/config.yml`).
3. Save → the CMS commits the JSON and images to `main`.
4. GitHub Actions rebuilds and deploys → live in ~1–2 minutes.

## Decap vs Sveltia

| | Decap | Sveltia |
|---|---|---|
| What | Formerly Netlify CMS, around for years | Rewrite, drop-in replacement for Decap |
| UI | Dated, awkward on phones | Modern, works well on phones |
| Photos | Uploaded as-is (phone shots can be 8 MB+) | Can resize/convert on upload |
| Config | `config.yml` | Same `config.yml` |
| Maturity | Stable, slow development | Younger, actively developed |

Why Sveltia: the client will likely edit from a phone, and big uploads would bloat the repo and slow the
build. Low risk: same config, so switching back is a one-line change in `public/admin/index.html`. It also
edits locally without `decap-server`.

## Plan

| # | Step | Time |
|---|---|---|
| 1 | Replace the Decap `<script>` with Sveltia's in `public/admin/index.html` | ~5 min |
| 2 | Mirror the Zod constraints in `config.yml` (table below) | ~15 min |
| 3 | Online login: GitHub OAuth app + OAuth proxy on Cloudflare Workers (e.g. `sveltia-cms-auth`), then set `backend.base_url` and `backend.repo` in `config.yml` | ~30–45 min |

### Step 2: constraints the CMS doesn't enforce yet

Today these pass the CMS, get committed, then fail the build: the site stays on the previous version and
nobody is told. Enforcing them in `config.yml` shows the error in the form before saving.

| Field | Zod rule | Add in `config.yml` |
|---|---|---|
| `seo.title` | max 70 chars | `pattern: ['^.{0,70}$', 'Massimo 70 caratteri']` |
| `seo.description` | max 170 chars | `pattern: ['^[\s\S]{0,170}$', 'Massimo 170 caratteri']` |
| `services`, `about.title`, `about.body`, `instagram.title` | ≥ 1 non-empty item | `min: 1` on the list |
| `settings.email` | valid email or empty | `pattern` for an email, field stays optional |
| `settings.website`, `settings.instagram` | valid URL | `pattern: ['^https?://', 'Deve iniziare con https://']` |
| `settings.area.country` | 2 letters | `pattern: ['^[A-Z]{2}$', 'Due lettere maiuscole, es. IT']` |

The two schemas (Zod and `config.yml`) are kept in sync by hand: change both together.

## Open decisions

- **Client needs a GitHub account** (collaborator on the repo) with the GitHub backend. If that's a
  blocker, evaluate Pages CMS (hosted; reportedly supports email invites — verify).
- **Repo ownership:** repo and Pages are on a personal account. Decide whether to move them to the client
  or an organization before giving the client access.
- **Tell the client** that changes go live ~1–2 minutes after saving.

## When to reconsider

Only if the client needs to build new pages from sections, run a blog with several authors, see a live
preview or schedule publishing. Then: a headless CMS (Storyblok, Sanity) plus a rebuild webhook.
Astro stays either way.
