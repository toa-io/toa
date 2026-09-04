import * as http from '../HTTP/index.js'
import { verbs } from '../RTD/syntax/index.js'
import type { Params } from './types.js'

/**
 * What a name resolves to: the path the call is made at, and the verb it is made with.
 *
 * A name is the route template with its slashes trimmed, then `#` and the verb —
 * `pots/:id#GET`. Neither `#` nor `/` can appear in a path segment, so a name is one
 * string per procedure and no two procedures can share one.
 */
export interface Address {
  path: string
  verb: string

  /** the `params` the path took, which are therefore not the operation's input */
  variables: string[]
}

export function address (method: string, params: Params): Address {
  const cut = method.indexOf(SEPARATOR)

  if (cut === -1)
    throw new http.NotFound(`'${method}' names no verb`)

  const verb = method.slice(cut + 1)

  if (!verbs.has(verb))
    throw new http.NotFound(`'${verb}' is not a method`)

  const template = method.slice(0, cut)
  const variables: string[] = []
  const fragments: string[] = []

  for (const segment of template === '' ? [] : template.split('/')) {
    // it stands for a segment the caller cannot name, so there is nothing to substitute
    if (segment === WILDCARD)
      throw new http.NotFound('An anonymous wildcard cannot be addressed')

    if (segment !== TAIL && segment[0] !== VARIABLE) {
      fragments.push(segment)

      continue
    }

    const name = segment === TAIL ? TAIL : segment.slice(1)
    const value = params[name]

    if (value === undefined || value === null)
      throw new http.BadRequest(`'${method}' requires the parameter '${name}'`)

    const fragment = String(value)

    // `**` stands for the rest of the path and may carry separators; a variable is one segment
    if (!(segment === TAIL ? TAILED : OPAQUE).test(fragment))
      throw new http.BadRequest(`The parameter '${name}' cannot be a path of its own`)

    variables.push(name)
    fragments.push(fragment)
  }

  // a route is matched with its trailing slash, and the trunk is the bare one
  const path = fragments.length === 0 ? '/' : `/${fragments.join('/')}/`

  return { path, verb, variables }
}

const SEPARATOR = '#'
const VARIABLE = ':'
const WILDCARD = '*'
const TAIL = '**'

/** A segment ends at what divides or ends a path. */
const OPAQUE = /^[^/?#]*$/

/** A tail is several segments, so it keeps the divider and loses only what ends a path. */
const TAILED = /^[^?#]*$/
