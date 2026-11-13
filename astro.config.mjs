// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// SITE_URL / BASE_PATH: canonical origin and sub-path. The GitHub Pages workflow sets both from
// actions/configure-pages (github.io/<repo>/ now; custom domain at root once connected).
const site = process.env.SITE_URL || 'https://giuseppefigliuolo.github.io';
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: {
    // Single landing page: inlining all CSS removes a render-blocking request.
    inlineStylesheets: 'always',
    format: 'directory'
  },
  compressHTML: true,
  prefetch: false,
  i18n: {
    // Italian only for now. Add 'en' here and a src/pages/en/ route to go bilingual.
    locales: ['it'],
    defaultLocale: 'it'
  },
  image: {
    breakpoints: [320, 480, 768, 1080, 1400]
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Bodoni Moda',
      cssVariable: '--font-display',
      weights: [400, 500],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Times New Roman', 'serif'],
      // Optical-size axis: the big titles get the high-contrast display cut, as in the design.
      options: { experimental: { variableAxis: { opsz: [['6', '96']] } } }
    },
    {
      provider: fontProviders.google(),
      name: 'Work Sans',
      cssVariable: '--font-body',
      weights: [300, 400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif']
    },
    {
      provider: fontProviders.google(),
      name: 'IBM Plex Mono',
      cssVariable: '--font-mono',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['Menlo', 'monospace']
    }
  ],
  integrations: [sitemap()],
  vite: {
    build: { assetsInlineLimit: 2048 }
  }
});
