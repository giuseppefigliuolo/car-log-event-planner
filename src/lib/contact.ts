import type { Settings } from './content';

let warned = false;

/** wa.me link with the prefilled message. Every WhatsApp button on the page uses it. */
export function whatsappHref(s: Settings): string {
  const num = s.whatsapp.number.replace(/[^\d]/g, '');
  if (!num && !warned) {
    warned = true;
    console.warn('\n[carmen-log] settings/site.json → whatsapp.number is empty: the WhatsApp buttons have no recipient.\n');
  }
  return `https://wa.me/${num}?text=${encodeURIComponent(s.whatsapp.message)}`;
}

/** "Basilicata (PZ)" or "Potenza, Basilicata (PZ)" once the locality is known. */
export const areaLabel = (s: Settings) =>
  `${s.area.locality ? `${s.area.locality}, ` : ''}${s.area.region} (${s.area.province})`;
