import * as undici from 'undici'
import * as parser from './parse'
import type { HTTPRequest } from './parse/request'

export async function request (http: string, origin?: string): Promise<undici.Dispatcher.ResponseData> {
  const { method, headers, body, url } = parse(http, origin)

  return undici.request(url, { method, headers, body })
}

export function parse (http: string, origin?: string): HTTPRequest {
  const { method, url, headers, body } = parser.request(http, origin)

  origin ??= 'https://' + headers.get('host')

  const href = new URL(url, origin).href

  return { method, headers, body, url: href }
}
