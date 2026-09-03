import type { IncomingMessage } from './types.js'

/**
 * The client address: the value of the header the deployment names, and nothing otherwise.
 * Of a header holding a list, the last value is the one the edge in front appended. The
 * connection's address is never it: behind an edge it is the edge's.
 */
export function address (request: IncomingMessage, header?: string): string | undefined {
  if (header === undefined)
    return

  const value = request.headers[header]
  const raw = Array.isArray(value) ? value[value.length - 1] : value
  const last = raw?.slice(raw.lastIndexOf(',') + 1).trim()

  return last === '' ? undefined : last
}
