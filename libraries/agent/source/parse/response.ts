import * as codes from 'http-status-codes'
import type { IncomingHttpHeaders } from 'node:http'
import type { Dispatcher } from 'undici'

export async function response (response: Dispatcher.ResponseData, body?: string): Promise<string> {
  const statusText = codes.getReasonPhrase(response.statusCode) ?? 'Unknown'
  const statusLine = `${response.statusCode} ${statusText}\n`
  const headerLines = stringifyHeaders(response.headers) + '\n'
  const responseText = body ?? await response.body.text()

  return statusLine + headerLines + responseText
}

function stringifyHeaders (headers: IncomingHttpHeaders): string {
  let lines = ''

  for (const [name, value] of Object.entries(headers))
    lines += `${name}: ${Array.isArray(value) ? value.join(', ') : (value ?? '')}\n`

  return lines
}
