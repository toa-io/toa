import { Family, FAMILY } from './Family.js'
import type { Directive } from './Family.js'
import type { Described } from './described.js'
import type { Directives } from '../../RTD/index.js'
import type { Introspection } from '../../Introspection.js'

export const help = new Family()

/**
 * What the resource a method is on says of itself, or nothing where it says nothing. Read
 * from the method because that is what carries a route's directives; every method of one
 * node carries the same declaration.
 */
export function resource(directives: Directives): Described | null {
  const stated = Family.node(directives.declared<Directive>(FAMILY))

  if (stated === null) return null

  return {
    ...(stated.title === undefined ? {} : { title: stated.title }),
    ...(stated.description === undefined ? {} : { description: stated.description })
  }
}

/**
 * What a resource is, taken from what its methods are: the flags are a method's, and a
 * resource carries whichever of them any of its methods does — which is what a reader picks
 * one icon by.
 */
export function guarded(methods: Record<string, Introspection>): Described {
  const described: Described = {}

  for (const introspection of Object.values(methods))
    for (const flag of FLAGS) if (introspection[flag] === true) described[flag] = true

  return described
}

const FLAGS = ['private', 'protected', 'system'] as const

export { FAMILY, Family } from './Family.js'
export { Help } from './Help.js'
export { Parameters } from './Parameters.js'
export type { Directive } from './Family.js'
export type { Described } from './described.js'
