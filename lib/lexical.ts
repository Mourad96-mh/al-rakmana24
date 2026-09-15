import type { BodyBlock } from './content-types'

/**
 * Lexical (what Payload stores) → `BodyBlock[]` (what the UI renders).
 *
 * `components/Prose` binds to the small union in `lib/content-types.ts`, not to
 * Lexical's node tree, and that indirection is deliberate: the editor's
 * serialization format is Payload's business, the five shapes the design
 * supports are ours. A richer editor plugin therefore cannot silently produce
 * markup no component knows how to style — it produces a node type this file
 * does not recognise, and that node is DROPPED rather than rendered wrong.
 *
 * What is supported, and it is everything `collections/Articles.ts` can produce
 * with the default `lexicalEditor()`:
 *
 *   paragraph                    → paragraph
 *   heading (any level)          → heading
 *   quote                        → quote
 *   list (bullet or numbered)    → list
 *
 * There is no `callout` in Lexical's defaults — it stays in the union for the
 * demo fixtures and for the day a custom block is added.
 *
 * Inline formatting (bold, italic, links) is FLATTENED to text. The union has
 * no inline nodes, so keeping the marks would mean inventing a representation
 * the renderer cannot use. A link's label survives; its href does not.
 */

/** A Lexical node, as far as we need to care. */
type LexicalNode = {
  type?: unknown
  text?: unknown
  children?: unknown
  tag?: unknown
  listType?: unknown
  [key: string]: unknown
}

type LexicalRoot = { root?: { children?: unknown } } | null | undefined

const isNode = (value: unknown): value is LexicalNode =>
  typeof value === 'object' && value !== null

const childrenOf = (node: LexicalNode): LexicalNode[] =>
  Array.isArray(node.children) ? node.children.filter(isNode) : []

/**
 * All the text under a node, concatenated.
 *
 * Recursive because formatting nests: a bold word inside a link inside a
 * paragraph is three levels of node holding one string.
 */
function textOf(node: LexicalNode): string {
  if (typeof node.text === 'string') return node.text
  return childrenOf(node).map(textOf).join('')
}

const clean = (value: string): string => value.replace(/\s+/g, ' ').trim()

/** One top-level node → zero or one block. Unknown types yield nothing. */
function blockOf(node: LexicalNode): BodyBlock | null {
  const type = typeof node.type === 'string' ? node.type : ''

  switch (type) {
    case 'paragraph': {
      const text = clean(textOf(node))
      // Lexical keeps empty paragraphs as spacing; the renderer does its own.
      return text ? { type: 'paragraph', text } : null
    }

    case 'heading': {
      const text = clean(textOf(node))
      return text ? { type: 'heading', text } : null
    }

    case 'quote': {
      const text = clean(textOf(node))
      return text ? { type: 'quote', text } : null
    }

    case 'list': {
      const items = childrenOf(node)
        .map((item) => clean(textOf(item)))
        .filter((item) => item.length > 0)
      return items.length > 0 ? { type: 'list', items } : null
    }

    default:
      return null
  }
}

/**
 * Convert a Payload `richText` value. Anything unexpected yields `[]` rather
 * than throwing: a malformed body must render an empty article, never a 500 on
 * a public page.
 */
export function lexicalToBlocks(value: LexicalRoot): BodyBlock[] {
  if (!value || typeof value !== 'object') return []
  const root = (value as { root?: unknown }).root
  if (!isNode(root)) return []

  return childrenOf(root)
    .map(blockOf)
    .filter((block): block is BodyBlock => block !== null)
}

/**
 * Reading time, computed rather than authored so it cannot go stale, and so the
 * Arabic and French versions of the same article report their own real length.
 *
 * 200 words/min for Latin script; Arabic is counted the same way — the Moroccan
 * press convention, and close enough for a "5 min" badge.
 *
 * Lives here, beside the converter that produces its input: it operates on
 * `BodyBlock[]`, which is the shape every body in the site has taken since
 * `lib/demo` was removed.
 */
export function readingMinutes(body: readonly BodyBlock[]): number {
  const words = body.reduce((total, block) => {
    const text =
      block.type === 'list'
        ? block.items.join(' ')
        : block.type === 'callout'
          ? `${block.title} ${block.text}`
          : block.text
    return total + text.trim().split(/\s+/).filter(Boolean).length
  }, 0)

  return Math.max(1, Math.round(words / 200))
}
