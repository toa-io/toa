import type { IncomingMessage } from './types.ts'

/**
 * The client address: the value of the header the deployment names, and nothing otherwise.
 * Of a header holding a list, the last value is the one the edge in front appended. The
 * connection's address is never it: behind an edge it is the edge's.
 */
export function address(request: IncomingMessage, header?: string): string | undefined {
  if (header === undefined) return

  const value = request.headers[header]
  const raw = Array.isArray(value) ? value[value.length - 1] : value
  const last = raw?.slice(raw.lastIndexOf(',') + 1).trim()

  return last === '' ? undefined : last
}

/**
 * The country the edge wrote for the client, as it wrote it. One value, never a list: an edge
 * writes it whole, and a header a client sent beside it is the deployment's to strip.
 */
export function country(request: IncomingMessage, header?: string): string | undefined {
  if (header === undefined) return

  const value = request.headers[header.toLowerCase()]
  const raw = (Array.isArray(value) ? value[value.length - 1] : value)?.trim()

  return raw === '' ? undefined : raw
}
