import * as parse from './parse'

export async function request (http: string, origin?: string): Promise<Response> {
  const { method, url, headers, body } = parse.request(http)

  const reference = new URL(url, origin).href

  return await fetch(reference, { method, headers, body })
}
