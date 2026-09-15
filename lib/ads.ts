/**
 * Espaces publicitaires.
 *
 * Advertising is NOT a paywall: règle d'or #1 forbids payment, gating and
 * checkout — it says nothing against display advertising, which is the client's
 * own revenue model and was requested explicitly ("espace publicitaire" en tête
 * de page et en colonne de droite).
 *
 * Nothing in here reads cookies, headers or the request, so every page carrying
 * a slot stays SSG/ISR (règle d'or #4). A personalised / auction-served banner
 * would have to become a client island mounted *inside* the reserved box below —
 * the box itself must stay server-rendered so the height is reserved at build
 * time and a late-arriving creative never shifts the layout.
 *
 * Today no creative is booked, so every slot renders a labelled placeholder that
 * links to « Nous contacter » — an empty slot sells the inventory instead of
 * showing a dead grey rectangle. When the client books an advertiser, add an
 * entry to CREATIVES; when the ads have to be editable from the back-office,
 * replace `getCreative` with a Payload query and nothing else changes.
 */

import type { Locale } from './rubriques'

/** IAB standard formats. The frame reserves exactly these ratios. */
export type AdFormat = 'leaderboard' | 'rectangle' | 'halfpage'

export const AD_FORMATS = {
  /** Top of page, full width. Falls back to 320 × 100 on phones. */
  leaderboard: { width: 970, height: 90 },
  /** Right rail, first position (pavé / MPU). */
  rectangle: { width: 300, height: 250 },
  /** Right rail, sticky second position. */
  halfpage: { width: 300, height: 600 },
} as const satisfies Record<AdFormat, { width: number; height: number }>

/**
 * A slot is an *emplacement*, not a page: the two rail slots are the same
 * inventory wherever the rail appears, which is how an advertiser buys them.
 */
export type AdSlotId = 'header-leaderboard' | 'rail-top' | 'rail-bottom'

export type AdCreative = {
  /** Image at the slot's exact ratio (see AD_FORMATS). */
  src: string
  /** Landing page. */
  href: string
  /** Advertiser name — used as the alt text, so it must be the real name. */
  advertiser: string
}

/**
 * Booked creatives, per slot and per locale. Bilingual on purpose: a French
 * banner on the Arabic side reads as a bug, and the two audiences are sold
 * separately. A locale with no entry falls back to the placeholder, never to
 * the other language's banner (same reasoning as règle d'or #2).
 */
const CREATIVES: Partial<Record<AdSlotId, Partial<Record<Locale, AdCreative>>>> = {}

export function getCreative(id: AdSlotId, locale: Locale): AdCreative | null {
  return CREATIVES[id]?.[locale] ?? null
}
