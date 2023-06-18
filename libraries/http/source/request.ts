import fetch from 'node-fetch'
import * as parse from './parse'

export async function request (http: string): Promise<string> {
  const { method, url, headers, body } = parse.request(http)
  const response = await fetch(url, { method, headers, body })
  const statusLine = `${response.status} ${response.statusText}\n`
  const headerLines = stringifyHeaders(response.headers.raw()) + '\n'
  const responseText = await response.text()

  return statusLine + headerLines + responseText
}

function stringifyHeaders (headers: Record<string, string[]>): string {
  let lines = ''

  for (const [name, values] of Object.entries(headers))
    lines += `${name}: ${values.join(', ')}\n`

  return lines
}
