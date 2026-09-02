import { writable } from 'svelte/store'

/** What the header's filter holds. Transient: not persisted, not in the URL. */
export const query = writable('')

/**
 * What Enter in the filter does, set by whichever screen is showing. A filter narrowed to
 * one thing leaves nothing to choose, so the key does what pressing that thing does; with
 * none or many left there is nothing to mean by it.
 */
export const only = writable<(() => void) | null>(null)

/** The namespace an application does not name; it is noise on every row. */
export const DEFAULT = 'default'

/** The namespace of a component, and the name under it. */
export function split(id: string): { namespace: string; component: string } {
  const at = id.indexOf('.')

  if (at === -1) return { namespace: DEFAULT, component: id }

  return { namespace: id.slice(0, at), component: id.slice(at + 1) }
}

/**
 * The namespaces the runtime provides components in. Configuration has no notion of a
 * system component — what the service is told is a name and a schema — so this is a
 * list, and it grows when the runtime ships another one. It must keep saying what
 * `SYSTEM` says in the introspection UI.
 */
const SYSTEM = new Set(['identity', 'exposition', 'realtime', 'introspection', 'configuration'])

/** Whether a component came with the runtime rather than with the application. */
export function system(component: string): boolean {
  return SYSTEM.has(split(component).namespace)
}

/** A name match outranks a match on something the configuration merely holds. */
const NAME = 2
const MEMBER = 1

type Searchable = { component: string; configuration: object }

/**
 * How well a component answers the filter, or `0` when it does not. Someone typing
 * `apps` means the component of that name before a value that happens to read the
 * same, so the list leads with names.
 *
 * An empty query matches every name, which leaves the order alone.
 */
export function rank(item: Searchable, query: string): number {
  if (matches(item.component, query)) return NAME

  return terms(item.configuration).some((term) => matches(term, query)) ? MEMBER : 0
}

/**
 * Every key and every value in a configuration, at any depth, each as its own term —
 * never a concatenation of them, or a query would creep across two unrelated values
 * and call it a hit.
 *
 * A secret is left out. What stands in its place is a reference rather than the secret,
 * but the page refuses to show it, and a filter that answered for it would show it.
 */
function terms(value: unknown, into: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) terms(item, into)

    return into
  }

  if (typeof value === 'object' && value !== null) {
    for (const [key, held] of Object.entries(value)) {
      into.push(key)
      terms(held, into)
    }

    return into
  }

  if (typeof value === 'string') {
    if (!SECRET.test(value)) into.push(value)

    return into
  }

  if (typeof value === 'number' || typeof value === 'boolean') into.push(String(value))

  return into
}

/** Mirrors `SECRET_RX` in `extensions/configuration/source/const.ts`. */
const SECRET = /^\$([A-Z0-9_]{1,32})$/

/**
 * A subsequence match, so `idtok` finds `identity.tokens`. Spaces in the query are
 * dropped, which lets `identity tokens` find it too. An empty query matches everything.
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
