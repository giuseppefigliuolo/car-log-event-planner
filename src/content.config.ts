/**
 * Content model. Everything editable (texts + images) lives in src/content/*.json
 * and is validated here at build time, so a bad CMS edit fails the build instead
 * of shipping a broken page. Decap CMS (public/admin/config.yml) mirrors this shape.
 *
 * Text conventions (see src/lib/rich.ts):
 *   *parola*  -> italic accent (<em>, in rosa antico)
 *   newline   -> line break
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lines = z.array(z.string().min(1)).min(1);

const pages = defineCollection({
  loader: glob({ pattern: 'home.json', base: './src/content/pages' }),
  schema: ({ image }) => {
    const pic = z.object({ src: image(), alt: z.string() });
    return z.object({
      seo: z.object({
        title: z.string().max(70),
        description: z.string().max(170),
        ogImage: image()
      }),
      // First-visit intro: photos that flash by, each with its event category.
      intro: z.object({
        frames: z.array(z.object({ image: image(), label: z.string() })).min(2).max(8)
      }),
      hero: z.object({
        kicker: z.string(),
        meta: z.string(),
        lead: z.string(),
        leadDesktop: z.string(),
        /** Under the name in the mobile hero. */
        leadMobile: z.string(),
        cta: z.string(),
        scroll: z.string(),
        image: pic,
        // Mobile hero "Mazzo": the Polaroids of what Carmen organises, in the order they're flipped.
        // The Storie show for whom, so none of these photos should appear there.
        // `back` is the handwritten note on the reverse (tap = the card turns). Without it the card doesn't turn.
        // TODO: the six notes are drafts, to be confirmed with Carmen.
        deck: z.array(z.object({ title: z.string().min(1), back: z.string().optional().default(''), image: pic })).min(5).max(12)
      }),
      // Scrolling band; also the services listed in the JSON-LD.
      services: lines,
      manifesto: z.object({
        kicker: z.string(),
        text: z.string(),
        signature: z.string()
      }),
      about: z.object({
        kicker: z.string(),
        title: lines,
        body: lines,
        statLabel: z.string(),
        image: pic,
        detail: pic
      }),
      stories: z.object({
        kicker: z.string(),
        title: z.string(),
        items: z
          .array(
            z.object({
              title: z.string(),
              type: z.string(),
              place: z.string().optional().default(''),
              text: z.string(),
              image: pic
            })
          )
          .min(1)
      }),
      // "Grazie, Carmen": heading of the reviews section (the reviews themselves are the `reviews` collection).
      reviews: z.object({
        kicker: z.string(),
        title: lines
      }),
      instagram: z.object({
        kicker: z.string(),
        title: lines,
        // 12 on desktop (6 columns), the first 9 on mobile (3 columns).
        feed: z.array(pic).min(9)
      }),
      contact: z.object({
        kicker: z.string(),
        title: z.string(),
        body: z.string(),
        cta: z.string(),
        // Three columns of photos drifting at different speeds behind the card.
        columns: z.array(z.array(image()).min(2)).length(3)
      })
    });
  }
});

const settings = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/settings' }),
  schema: ({ image }) => z.object({
    brand: z.string(),
    tagline: z.string(),
    founder: z.string(),
    eventsCount: z.number().int(),
    whatsapp: z.object({
      // International format, digits only or with + and spaces (e.g. +39 333 1234567).
      number: z.string(),
      message: z.string()
    }),
    email: z.union([z.email(), z.literal('')]).default(''),
    website: z.url(),
    instagram: z.url(),
    instagramHandle: z.string(),
    // Profile-block label under the handle.
    // TODO: check the post count on the real profile (900+ is a placeholder).
    instagramPostsLabel: z.string(),
    // Avatar in the Instagram section (square photo, shown in a 64px circle).
    instagramAvatar: image(),
    area: z.object({
      locality: z.string().optional().default(''),
      province: z.string(),
      region: z.string(),
      country: z.string().length(2)
    }),
    vatNumber: z.string().optional().default(''),
    intro: z.object({ enabled: z.boolean() })
  })
});

// One file per review in src/content/reviews/. Real reviews only: with none published the section isn't rendered.
const reviews = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/reviews' }),
  schema: z.object({
    text: z.string().min(1),
    author: z.string().min(1),
    /** Event type, e.g. "Matrimonio". */
    type: z.string().optional().default(''),
    place: z.string().optional().default(''),
    /** Ascending; ties keep the file order. */
    order: z.number().int().optional().default(0),
    /** Off by default: an incomplete entry never reaches the page. */
    published: z.boolean().optional().default(false),
    /** Example text, not a real review: shown on collaudo builds, never in production (lib/content getReviews). */
    mock: z.boolean().optional().default(false)
  })
});

export const collections = { pages, settings, reviews };
