/**
 * /llms.txt — a plain-language, citation-friendly summary for AI assistants
 * and answer engines (GEO). Generated from the same CMS content as the page.
 */
import type { APIRoute } from 'astro';
import { getHome, getSettings } from '../lib/content';
import { areaLabel, whatsappHref } from '../lib/contact';
import { plain } from '../lib/rich';
import { rootUrl } from '../lib/url';

export const GET: APIRoute = async ({ site }) => {
  const h = await getHome();
  const s = await getSettings();
  const url = rootUrl(site!);
  const contacts = [
    `- Sito: ${url}`,
    s.whatsapp.number ? `- WhatsApp: ${s.whatsapp.number} (${whatsappHref(s)})` : '',
    s.email ? `- Email: ${s.email}` : '',
    `- Instagram: ${s.instagram} (${s.instagramHandle})`,
    `- Zona: ${areaLabel(s)}, Italia`
  ].filter(Boolean);

  const body = `# ${s.brand} — ${s.tagline}

> ${h.seo.description}

${s.brand} è il marchio di ${s.founder}, wedding & event planner in ${s.area.region} (${s.area.province}). Ha organizzato e allestito oltre ${s.eventsCount} eventi: ${h.services.map((x) => x.toLowerCase()).join(', ')}. ${plain(h.hero.lead)} ${plain(h.hero.leadDesktop)}

## Contatti
${contacts.join('\n')}
Il modo più rapido per un preventivo è scrivere su WhatsApp: ${s.founder} risponde personalmente.

## Chi è
${h.about.body.map(plain).join('\n')}

## Il lavoro
${plain(h.manifesto.text)}

## Alcuni eventi realizzati
${h.stories.items.map((it) => `- ${it.title} — ${it.type}${it.place ? `, ${it.place}` : ''}: ${it.text}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
