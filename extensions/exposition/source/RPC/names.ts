import * as http from '../HTTP/index.js'
import { verbs } from '../RTD/syntax/index.js'
import type { Segment } from '../RTD/segment.js'
import { QUERY, type Params } from './types.js'

/**
 * What a name resolves to: the path the call is made at, and the verb it is made with.
 *
 * A name is the route template with its variables marked and the verb appended as a segment
 * of its own — `pots/_id/GET`. Neither `/` nor a verb can be mistaken for anything else: the
 * verb is always the last segment, and `/` cannot occur inside one.
 */
export interface Address {
  path: string
  verb: string

  /** the `params` the path took, which are therefore not the operation's input */
  variables: string[]
}

export function address (method: string, params: Params): Address {
  const parts = method.split(SEPARATOR)
  const verb = parts.pop()!

  if (!verbs.has(verb))
    throw new http.NotFound(`'${method}' names no method`)

  const variables: string[] = []
  const fragments: string[] = []

  for (const part of parts) {
    const key = parameter(part)

    if (key === null) {
      fragments.push(literal(part, method))

      continue
    }

    if (part !== TAIL && !NAMEABLE.test(key))
      throw new http.NotFound(`'${method}' names no procedure`)

    const value = params[key]

    if (value === undefined || value === null)
      throw new http.BadRequest(`'${method}' requires the parameter '${key}'`)

    const fragment = String(value)

    // `__` stands for the rest of the path and may carry separators; a variable is one segment
    if (!(part === TAIL ? TAILED : OPAQUE).test(fragment))
      throw new http.BadRequest(`The parameter '${key}' cannot be a path of its own`)

    variables.push(key)
    fragments.push(fragment)
  }

  // a route is matched with its trailing slash, and the trunk is the bare one
  const path = fragments.length === 0 ? '/' : `/${fragments.join('/')}/`

  return { path, verb, variables }
}

/**
 * What the call carries, as a request carries it: the path took its variables, `query` is
 * the querystring, and the rest is the body.
 */
export function split (params: Params, variables: string[]): { query?: Params, input?: Params } {
  const input: Params = {}
  let query: Params | undefined

  for (const [key, value] of Object.entries(params)) {
    if (variables.includes(key))
      continue

    if (key !== QUERY) {
      input[key] = value

      continue
    }

    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new http.BadRequest(`'${QUERY}' must be an object`)

    query = value as Params
  }

  // an absent body is what a request without one has, and the mapping fills it as it does
  return { query, input: Object.keys(input).length === 0 ? undefined : input }
}

/** The parameter a part reads, or nothing where the part is a literal segment. */
function parameter (part: string): string | null {
  if (part === TAIL)
    return WILDCARD

  return part[0] === VARIABLE ? part.slice(1) : null
}

/** A segment a name cannot spell is a segment no name has, so this one names nothing. */
function literal (part: string, method: string): string {
  if (!NAMEABLE.test(part))
    throw new http.NotFound(`'${method}' names no procedure`)

  return part
}

/** The name of a method on this route, or nothing where the route has none. */
export function name (segments: Segment[], verb: string): string | null {
  const parts: string[] = []

  for (const segment of segments) {
    const part = component(segment)

    if (part === null)
      return null

    parts.push(part)
  }

  parts.push(verb)

  return parts.join(SEPARATOR)
}

/** The segment that leaves a route unnameable, as it was declared, or nothing where none does. */
export function refusal (segments: Segment[]): string | null {
  for (const segment of segments)
    if (component(segment) === null)
      return declared(segment)

  return null
}

function component (segment: Segment): string | null {
  if (segment.fragment !== null)
    return NAMEABLE.test(segment.fragment) ? segment.fragment : null

  if (segment.wildcard === true)
    return TAIL

  // it stands for a segment the caller cannot name, so there is nothing to substitute
  if (segment.placeholder === null)
    return null

  return NAMEABLE.test(segment.placeholder) ? VARIABLE + segment.placeholder : null
}

/** The route as it was declared, which is how a message about it should read. */
export function template (segments: Segment[]): string {
  return '/' + segments.map(declared).join('/')
}

function declared (segment: Segment): string {
  if (segment.fragment !== null)
    return segment.fragment

  if (segment.wildcard === true)
    return '**'

  return segment.placeholder === null ? '*' : ':' + segment.placeholder
}

const SEPARATOR = '/'
const VARIABLE = '_'
const TAIL = '__'

/** How the RTD names the rest of a path, wherever a parameter of it is read. */
const WILDCARD = '**'

/**
 * What a segment may hold to have a name. `_` is the convention's own, and every other
 * character a client leaves alone is here: a client shows a model the name with the rest
 * turned into `_`, and two names must not become one.
 */
const NAMEABLE = /^[A-Za-z0-9-]+$/

/** A segment ends at what divides or ends a path. */
const OPAQUE = /^[^/?#]*$/

/** A tail is several segments, so it keeps the divider and loses only what ends a path. */
const TAILED = /^[^?#]*$/
