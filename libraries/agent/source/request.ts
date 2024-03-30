import * as undici from 'undici'
import * as parse from './parse'

export async function request (http: string, origin?: string): Promise<undici.Dispatcher.ResponseData> {
  const { method, url, headers, body } = parse.request(http)

  const href = new URL(url, origin).href

  return undici.request(href, { method, headers, body })
}
