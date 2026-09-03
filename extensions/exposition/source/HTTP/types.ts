import type { Readable, Writable } from 'node:stream'
import type { OutgoingHttpHeaders } from 'node:http'
import type { IncomingHttpHeaders } from 'node:http2'

/**
 * What Exposition requires of a request. Both `http.IncomingMessage` and
 * `http2.Http2ServerRequest` satisfy it, so the pipeline is written once.
 */
export interface IncomingMessage extends Readable {
  url: string
  method: string
  complete: boolean
  headers: IncomingHeaders
  socket: { remoteAddress?: string | undefined }
}

/**
 * What Exposition requires of a response.
 *
 * `setHeader` and `appendHeader` return `void` because `Http2ServerResponse` returns
 * nothing from them, so neither can be chained.
 */
export interface ServerResponse extends Writable {
  statusCode: number
  writableEnded: boolean
  setHeader: (name: string, value: number | string | string[]) => void
  appendHeader: (name: string, value: string | string[]) => void
  hasHeader: (name: string) => boolean
  writeHead: (status: number, headers?: OutgoingHttpHeaders) => ServerResponse
}

/**
 * HTTP/2's header map: HTTP/1.1's, plus the pseudo-headers. `:authority` is typed here
 * so the authority can be read without narrowing at every call site.
 */
export type IncomingHeaders = IncomingHttpHeaders

/** `h2c` is cleartext HTTP/2: there is no in-process TLS to negotiate ALPN with. */
export type Protocol = 'h1' | 'h2c'
