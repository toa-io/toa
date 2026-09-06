import Negotiator from 'negotiator'
import { types } from '../HTTP/formats/index.js'
import { DISCOVERY } from '../const.js'
import type { Context, OutgoingMessage } from '../HTTP/index.js'

/** What a browser asks for, and what nothing else here answers with. */
const HTML = 'text/html'

/**
 * Where a browser that asked for the trunk is sent. An application serves what it declares,
 * and `/` is usually not one of those — a person who typed the address into a browser is
 * looking for something to look at, and the page is the only thing here that is one.
 *
 * A client that takes anything is not one: `accept` has to prefer a page over what the
 * gateway answers with, which is what a browser sends and an API client does not.
 */
export function looking(context: Context): OutgoingMessage | null {
  if (context.request.method !== 'GET' || context.procedural) return null

  if (new Negotiator(context.request).mediaType([...types, HTML]) !== HTML) return null

  return { status: 302, headers: new Headers({ location: DISCOVERY + '/' }) }
}
