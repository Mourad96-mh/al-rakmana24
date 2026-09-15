import type {
  ArticleSummary,
  Entity,
  EntityData,
  EntityKind,
  EntitySummary,
} from './content-types'
import { ENTITY_LABELS } from './content-types'
import { TOURS, TYPES_TEXTE, vocabLabel } from './entity-vocab'
import type { Locale } from './rubriques'
import { SITE_NAME, absolute } from './site'
import * as links from './links'

/**
 * schema.org for the entity hubs — the SEO moat (CLAUDE.md §5).
 *
 * The hubs are the reason this site can outrank a bigger newsroom on « loi
 * 09-08 » or on a startup's name: they are the only pages that gather, in one
 * place, what a thing IS and everything we have written about it. Structured
 * data is how that gathering becomes legible to a crawler, so a hub without
 * JSON-LD is a hub that only works for humans.
 *
 * Two rules hold everywhere in this file:
 *
 *   1. **Nothing is invented.** Every property comes from `EntityData`, which
 *      comes from one read of the Payload document. A field the newsroom has
 *      not filled in is `undefined`, and `JSON.stringify` drops it — an absent
 *      property is correct, an empty or guessed one is a lie to a machine that
 *      cannot tell.
 *   2. **URLs are absolute.** A crawler resolving `@id` has no base to resolve
 *      against, so every identifier goes through `absolute()`.
 */

/** A plain JSON object, as schema.org nodes are. */
type Node = Record<string, unknown>

/** `undefined` entries vanish under `JSON.stringify`; empty arrays should too. */
const list = <T>(values: readonly T[]): readonly T[] | undefined =>
  values.length > 0 ? values : undefined

/**
 * The publisher, repeated on every page by `@id` rather than by value.
 *
 * Google treats the organisation as one entity across the site; giving it a
 * stable `@id` is what lets the hubs, the articles and the homepage all point
 * at the same node instead of declaring three lookalike ones.
 */
export const PUBLISHER_ID = absolute('/#organisation')

export const publisherNode = (): Node => ({
  '@type': 'NewsMediaOrganization',
  '@id': PUBLISHER_ID,
  name: SITE_NAME,
  url: absolute('/'),
})

/* --------------------------------------------------------------- entity hubs */

/**
 * The entity itself, typed per hub:
 *
 *   startups / entreprises  → `Organization`
 *   personnalités           → `Person`
 *   textes juridiques       → `Legislation`
 *
 * `Legislation` is the accurate type for a loi or a décret and is what Google
 * documents for legal texts; `CreativeWork`, which it extends, would also
 * validate but would throw away `legislationIdentifier` and
 * `legislationDate` — the two properties that make the legal hub findable by
 * its reference rather than by its title.
 */
function entityNode(entity: Entity, locale: Locale, url: string): Node {
  const data: EntityData = entity.data
  const common = {
    '@id': `${url}#entite`,
    name: entity.name,
    description: entity.summary || undefined,
    url,
    image: entity.image?.src ? absolute(entity.image.src) : undefined,
    inLanguage: locale,
  }

  if (data.kind === 'startups') {
    return {
      '@type': 'Organization',
      ...common,
      // `sameAs` is for the entity's OWN canonical presence elsewhere. The
      // company's website is exactly that; our page is `url`.
      sameAs: data.siteWeb,
      foundingDate: data.anneeCreation !== undefined ? String(data.anneeCreation) : undefined,
      foundingLocation: data.ville ? { '@type': 'Place', name: data.ville } : undefined,
      founder: list(data.fondateurs.map((name) => ({ '@type': 'Person', name }))),
      /**
       * One `FundingEvent` per announced round. This is the structured form of
       * « Meilleures levées de fonds » (CLAUDE.md §7): a round with no amount
       * still carries its date and its name, which is the part a reader
       * searching for the company's history is looking for.
       */
      funding: list(
        data.levees.map((levee) => ({
          '@type': 'MonetaryGrant',
          // The LABEL, not the stored value: schema.org `name` is read by
          // humans, and « Série A » is not `serie-a`.
          name: vocabLabel(TOURS, levee.tour, locale),
          startDate: levee.date,
          amount:
            levee.montant !== undefined
              ? {
                  '@type': 'MonetaryAmount',
                  value: levee.montant,
                  currency: levee.devise,
                }
              : undefined,
          url: levee.source,
        })),
      ),
    }
  }

  if (data.kind === 'entreprises') {
    return {
      '@type': 'Organization',
      ...common,
      sameAs: data.siteWeb,
      location: data.siege ? { '@type': 'Place', name: data.siege } : undefined,
    }
  }

  if (data.kind === 'personnalites') {
    return {
      '@type': 'Person',
      ...common,
      jobTitle: data.fonction,
      nationality: data.nationalite ? { '@type': 'Country', name: data.nationalite } : undefined,
      affiliation: list(data.organisations.map((name) => ({ '@type': 'Organization', name }))),
      sameAs: list([data.linkedin, data.x].filter((u): u is string => Boolean(u))),
    }
  }

  return {
    '@type': 'Legislation',
    ...common,
    legislationIdentifier: data.reference,
    // The date the text entered the Bulletin officiel — its legal birth date.
    legislationDate: data.datePublicationBO,
    // Likewise a label — « Décret », not `decret`.
    legislationType: vocabLabel(TYPES_TEXTE, data.typeTexte, locale),
    // The official publication, not our commentary on it.
    sameAs: data.lienOfficiel,
    // The downloadable official text, when the newsroom has attached it.
    associatedMedia: entity.file
      ? { '@type': 'MediaObject', contentUrl: entity.file.url, encodingFormat: entity.file.ext }
      : undefined,
  }
}

/** Articles → an `ItemList` of positioned links. */
function articleListNode(
  articles: readonly ArticleSummary[],
  locale: Locale,
  name: string,
): Node | undefined {
  if (articles.length === 0) return undefined

  return {
    '@type': 'ItemList',
    name,
    numberOfItems: articles.length,
    itemListElement: articles.map((article, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: absolute(links.article(locale, article.slug)),
      name: article.title,
    })),
  }
}

/**
 * A hub page: the entity, the page, and the articles that reference it, as one
 * `@graph` rather than three loose scripts.
 *
 * `mainEntity` is what tells a crawler that this page is ABOUT the startup and
 * not merely one that mentions it — the distinction the whole hub taxonomy
 * exists to make.
 */
export function entityHubJsonLd(entity: Entity, locale: Locale): Node {
  const url = absolute(links.entity(locale, entity.kind, entity.slug))
  const node = entityNode(entity, locale, url)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      node,
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name: entity.name,
        description: entity.summary || undefined,
        inLanguage: locale,
        isPartOf: { '@id': PUBLISHER_ID },
        mainEntity: { '@id': node['@id'] },
        // Free access, always — règle d'or #1.
        isAccessibleForFree: true,
        mainEntityOfPage: articleListNode(
          entity.articles,
          locale,
          locale === 'fr' ? 'Nos articles' : 'مقالاتنا',
        ),
      },
    ],
  }
}

/**
 * A hub INDEX — « Startups », « Textes légaux »… — as a `CollectionPage` whose
 * `ItemList` points at each fiche.
 */
export function entityIndexJsonLd(
  kind: EntityKind,
  entities: readonly EntitySummary[],
  locale: Locale,
  description: string,
): Node {
  const url = absolute(links.entityIndex(locale, kind))
  const name = ENTITY_LABELS[kind][locale]

  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name,
        description,
        inLanguage: locale,
        isPartOf: { '@id': PUBLISHER_ID },
        isAccessibleForFree: true,
        mainEntity:
          entities.length > 0
            ? {
                '@type': 'ItemList',
                name,
                numberOfItems: entities.length,
                itemListElement: entities.map((entity, index) => ({
                  '@type': 'ListItem',
                  position: index + 1,
                  url: absolute(links.entity(locale, kind, entity.slug)),
                  name: entity.name,
                })),
              }
            : undefined,
      },
    ],
  }
}

/* ----------------------------------------------- dossiers · tags · auteurs */

/**
 * Any other page that is a LIST of articles: a dossier, a tag, a byline.
 *
 * `about` carries the thing the list is about when there is one — for an author
 * page that is a `Person`, which is what makes a byline an entity Google can
 * connect to the articles it signs.
 */
export function articleListJsonLd({
  url,
  name,
  description,
  locale,
  articles,
  about,
}: {
  url: string
  name: string
  description?: string
  locale: Locale
  articles: readonly ArticleSummary[]
  about?: Node
}): Node {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      publisherNode(),
      {
        '@type': 'CollectionPage',
        '@id': url,
        url,
        name,
        description: description || undefined,
        inLanguage: locale,
        isPartOf: { '@id': PUBLISHER_ID },
        isAccessibleForFree: true,
        about,
        mainEntity: articleListNode(articles, locale, name),
      },
    ],
  }
}
