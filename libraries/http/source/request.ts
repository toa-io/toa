import * as parse from './parse'

export async function request (http: string, origin?: string): Promise<string> {
  const { method, url, headers, body } = parse.request(http)

  const reference = new URL(url, origin).href
  const response = await fetch(reference, { method, headers, body })

  return await parse.response(response)
}
