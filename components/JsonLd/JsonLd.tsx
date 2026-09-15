/**
 * One `<script type="application/ld+json">`, serialized safely.
 *
 * Two things this centralizes, both of which are easy to get wrong once per
 * page and impossible to notice afterwards:
 *
 *  - **`<` is escaped.** Editorial copy is user input as far as this script is
 *    concerned: a title containing `</script>` would otherwise close the tag
 *    and drop the rest of the document into the page as markup. `\\u003c` is
 *    valid JSON and valid JSON-LD, so nothing downstream notices.
 *  - **`undefined` disappears.** `JSON.stringify` drops undefined properties,
 *    which is exactly the contract `lib/jsonld.ts` is written against: a field
 *    the newsroom has not filled in must be ABSENT, never empty or guessed.
 *
 * Server component, no client cost: the tag is part of the prerendered HTML.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
