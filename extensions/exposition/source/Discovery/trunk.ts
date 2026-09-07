import Negotiator from 'negotiator'
import { types } from '../HTTP/formats/index.js'
import { DISCOVERY } from '@toa.io/definitions/extensions.exposition'
import type { Context, OutgoingMessage } from '../HTTP/index.js'

/** What a browser asks for, and what nothing else here answers with. */
const HTML = 'text/html'

/**
 * Where a browser that asked for the trunk is sent. An application serves what it declares,
 * and `/` is usually not one of those — a person who typed the address into a browser is
 * looking for something to look at, and the page is the only thing here that is one.
 *
 * A client that asked for something in particular gets what it asked for: only an `accept`
 * that prefers a page, or one that names no preference at all, is sent here. The second is
 * what an unfurler sends — several ask for anything, and a link to an application would
 * otherwise show nothing — and what `curl` sends, which the page serves no worse than the
 * `405` it used to get.
 */
export function looking(context: Context): OutgoingMessage | null {
  if (context.request.method !== 'GET' || context.procedural) return null

  const accept = context.request.headers.accept

  if (accept !== undefined && accept.trim() !== ANYTHING) {
    if (new Negotiator(context.request).mediaType([...types, HTML]) !== HTML) return null
  }

  return { status: 302, headers: new Headers({ location: DISCOVERY + '/' }) }
}

/** An `accept` that names nothing, which is the same as naming none. */
const ANYTHING = '*/*'
