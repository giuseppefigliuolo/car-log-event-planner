# Carmen Log — note di sviluppo

## Git

- **Si lavora solo su `main`.** Non creare branch aggiuntivi (feature, fix, ecc.): non servono, nel repo lavora una persona sola.
- Commit direttamente su `main`, solo quando richiesto.
- Ogni push su `main` fa partire build e deploy su GitHub Pages (`.github/workflows/deploy.yml`): non pushare senza che sia stato chiesto.

## Verifiche prima di dire "fatto"

- `npm run check` (astro check) e `npm run build` senza errori. Non c'è uno script lint.
- Dopo modifiche a `src/content.config.ts` il dev server va riavviato (`npm run dev`), altrimenti usa il vecchio schema.
