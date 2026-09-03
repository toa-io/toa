import * as undici from 'undici'
import * as parser from './parse/index.js'
import { PROTOCOL } from './protocol.js'
import type { HTTPRequest } from './parse/request.js'

const dispatchers = new Map<string, undici.Dispatcher>()

/**
 * One dispatcher per origin. Over `h2c` every request is a stream on a single connection,
 * so there is nothing to pool.
 */
export function dispatcher (origin: string): undici.Dispatcher {
  let existing = dispatchers.get(origin)

  if (existing === undefined) {
    existing = PROTOCOL === 'h2c' ? new undici.H2CClient(origin) : new undici.Pool(origin)

    dispatchers.set(origin, existing)
  }

  return existing
}

export async function request (http: string, options: Options = {}): Promise<undici.Dispatcher.ResponseData> {
  const { base, ...requestOptions } = options
  const { method, headers, body, url } = parse(http, base)
  const { origin, pathname, search } = new URL(url)

  if (origin === undefined)
    throw new Error('Invalid Host header')

  return await dispatcher(origin).request({
    ...requestOptions,
    path: pathname + search,
    method,
    headers,
    body
  })
}

export function parse (http: string, origin?: string): HTTPRequest {
  const { method, url, headers, body } = parser.request(http, origin)

  origin ??= 'https://' + headers.get('host')

  const href = new URL(url, origin).href

  return { method, headers, body, url: href }
}

type Options = Partial<undici.Dispatcher.RequestOptions> & { base?: string }
