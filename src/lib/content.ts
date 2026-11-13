import { getCollection, getEntry } from 'astro:content';

export async function getHome() {
  const entry = await getEntry('pages', 'home');
  if (!entry) throw new Error('Missing src/content/pages/home.json');
  return entry.data;
}

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Missing src/content/settings/site.json');
  return entry.data;
}

/**
 * Published reviews, in the CMS order (none → the section isn't rendered). Example reviews (`mock: true`) show on
 * collaudo / preview builds only: the production build (INDEXABLE=true) leaves them out.
 */
export async function getReviews() {
  const production = process.env.INDEXABLE === 'true';
  const all = await getCollection('reviews');
  return all
    .filter((r) => r.data.published && !(production && r.data.mock))
    .sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id))
    .map((r) => r.data);
}

export type Home = Awaited<ReturnType<typeof getHome>>;
export type Settings = Awaited<ReturnType<typeof getSettings>>;
export type Review = Awaited<ReturnType<typeof getReviews>>[number];
