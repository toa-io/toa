import { writable } from 'svelte/store'
import type { Node } from '@/introspection'

/** What the header's filter holds. Transient: not persisted, not in the URL. */
export const query = writable('')

type Searchable = Pick<Node, 'namespace' | 'component' | 'operations' | 'events'>

/** A name match outranks a match on something the component merely holds. */
const NAME = 2
const MEMBER = 1

/** The namespace an application does not name; it is noise on every card. */
export const DEFAULT = 'default'

/** Drops that namespace from an id meant to be read. */
export function shorten(id: string): string {
  return id.startsWith(DEFAULT + '.') ? id.slice(DEFAULT.length + 1) : id
}

export function identify(of: { namespace: string; component: string }): string {
  return `${of.namespace}.${of.component}`
}

/**
 * How well a component answers the filter, or `0` when it does not. Someone typing
 * `apps` means the component of that name before an operation that happens to be
 * called the same, so the list leads with names.
 *
 * An empty query matches every name, which leaves the order alone.
 */
export function rank(node: Searchable, query: string): number {
  if (matches(identify(node), query)) return NAME

  const member =
    node.operations.some((operation) => matches(operation.endpoint, query)) ||
    node.events.some((event) => matches(event.label, query))

  return member ? MEMBER : 0
}

/**
 * A subsequence match, so `idtok` finds `identity.tokens`. Spaces in the query are
 * dropped, which lets `identity tokens` find it too. An empty query matches everything.
 *
 * Each name is matched on its own — never a concatenation of them — or a query would
 * creep across two unrelated operations and call it a hit.
 */
export function matches(text: string, query: string): boolean {
  const needle = query.toLowerCase().replace(/\s+/g, '')

  if (needle === '') return true

  const haystack = text.toLowerCase()

  let at = 0

  for (const character of needle) {
    at = haystack.indexOf(character, at) + 1

    if (at === 0) return false
  }

  return true
}
