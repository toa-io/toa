import type { IncomingMessage } from './types.js'

/**
 * The client address: the value of the header the deployment names, or the connection's.
 * Of a header holding a list, the last value is the one the edge in front appended.
 */
export function address (request: IncomingMessage, header?: string): string {
  if (header !== undefined) {
    const value = request.headers[header]
    const raw = Array.isArray(value) ? value[value.length - 1] : value
    const last = raw?.slice(raw.lastIndexOf(',') + 1).trim()

    if (last !== undefined && last !== '')
      return last
  }

  return request.socket.remoteAddress ?? ''
}
