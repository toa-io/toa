import { writable } from 'svelte/store'
import { Globe, ShieldCog, ShieldKeyhole, ShieldUser } from '@lucide/svelte'
import type { Described, Method, Resource } from '@/discovery'

/** What the header's filter holds. Transient: not persisted, not in the URL. */
export const query = writable('')

/**
 * What Enter in the filter does, set by whichever screen is showing. A filter narrowed to
 * one thing leaves nothing to choose, so the key does what pressing that thing does.
 */
export const only = writable<(() => void) | null>(null)

/** A path match outranks a match on something the resource merely serves. */
const PATH = 2
const MEMBER = 1

/**
 * The first segment of the paths the runtime serves itself. A route says nothing about the
 * package it came from, so this is a list, and it grows when the runtime exposes another.
 */
const SYSTEM = new Set(['identity', 'introspection', 'configuration', 'realtime'])

/** Whether the runtime serves it rather than the application. */
export function system(route: string): boolean {
  return SYSTEM.has(route.split('/')[1] ?? '')
}

/** What a path is read as: a resource is addressed with the slash it is declared without. */
export function slashed(route: string): string {
  return route.endsWith('/') ? route : route + '/'
}

/** The verbs a resource serves, in the order it answered them. */
export function verbs(resource: Resource): string[] {
  return Object.keys(resource).filter((key) => key === key.toUpperCase() && key !== '')
}

/** What one of them is. */
export function method(resource: Resource, verb: string): Method {
  return resource[verb] as Method
}

/**
 * What guards it, strictest first — which is the one icon a reader is shown. `system` is
 * what an application runs on rather than what it serves, so it outranks the rest.
 *
 * Nothing said is `public`: what the gateway states is what it refuses by, and a resource
 * it refuses nobody by is one anybody may reach.
 */
export function guard(described: Described): Guard {
  if (described.system === true) return 'system'

  if (described.protected === true) return 'protected'

  if (described.private === true) return 'private'

  return 'public'
}

/** One icon each, in the order `guard` decides between them. */
export const GUARDS = {
  system: ShieldCog,
  protected: ShieldKeyhole,
  private: ShieldUser,
  public: Globe,
} as const

export type Guard = keyof typeof GUARDS

/**
 * How well a resource answers the filter, or `0` when it does not. Someone typing `pots`
 * means the path of that name before a method that happens to be described so, which is
 * why the path leads.
 */
export function rank(route: string, resource: Resource, query: string): number {
  if (matches(route, query)) return PATH

  const described = [resource.title, resource.description]
    .concat(verbs(resource))
    .concat(
      verbs(resource).flatMap((verb) => [
        method(resource, verb).title,
        method(resource, verb).description,
      ]),
    )
    .filter((text): text is string => typeof text === 'string')

  return described.some((text) => matches(text, query)) ? MEMBER : 0
}

/**
 * A subsequence match, so `idtok` finds `identity/tokens`. Spaces in the query are dropped,
 * which lets `identity tokens` find it too. An empty query matches everything.
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
