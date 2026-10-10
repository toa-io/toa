import * as http from 'node:http'
import { Connector } from '@toa.io/core'
import { console } from 'openspan'
import { HEADER, PATH, attach } from './envelope.ts'
import { write } from './reply.ts'
import type { Readable } from 'node:stream'
import type { Reply, Request } from '@toa.io/core/types'

export type Invoke = (request: Request) => Promise<Reply | Readable>

/**
 * What answers streamed calls on one port, for every component of this process whose address
 * names that port.
 */
export class Server extends Connector {
  private readonly port: number
  private readonly routes = new Map<string, Invoke>()
  private readonly server: http.Server

  public constructor(port: number) {
    super()

    this.port = port
    this.server = http.createServer(this.listener.bind(this))
  }

  public route(path: string, invoke: Invoke): void {
    if (this.routes.has(path)) throw new Error(`Endpoint '${path}' is already served`)

    this.routes.set(path, invoke)
  }

  public unroute(path: string): void {
    this.routes.delete(path)
  }

  protected override async open(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.server.on('error', reject)

      this.server.listen(this.port, () => {
        this.server.off('error', reject)
        console.info('Streamed calls are served', { port: this.port })
        resolve()
      })
    })
  }

  protected override async close(): Promise<void> {
    await new Promise<void>((resolve) => {
      // a call in flight holds its connection, and is waited for; nothing else is kept
      this.server.closeIdleConnections()
      this.server.close(() => resolve())
    })
  }

  private listener(request: http.IncomingMessage, response: http.ServerResponse): void {
    const invoke =
      request.method === 'POST' ? this.routes.get(request.url ?? '') : undefined

    if (typeof invoke !== 'function') {
      response.writeHead(404)
      response.end()

      return
    }

    const header = request.headers[HEADER]
    const path = request.headers[PATH]

    const envelope = placed(path) ? parse(header) : null

    // thrown from here, a request that is not a call would take the process down with it
    if (envelope === null) {
      response.writeHead(400)
      response.end()

      return
    }

    attach(envelope, path as string, request)

    invoke(envelope)
      .then(async (reply) => await write(response, reply))
      .catch((error: unknown) => {
        console.error('Streamed call failed', { error })

        if (!response.headersSent) response.writeHead(500)

        response.end()
      })
  }
}

/**
 * Where a caller took the stream from, as `detach` names it: a property, or its `stream`. Any
 * other path is not one a caller makes, and one through `__proto__` would write the stream into
 * every object of the process.
 */
function placed(path: unknown): path is string {
  if (typeof path !== 'string') return false

  const [key, nested, ...rest] = path.split('.')

  return (
    key !== '' &&
    !FORBIDDEN.has(key) &&
    (nested === undefined || nested === 'stream') &&
    rest.length === 0
  )
}

const FORBIDDEN = new Set(['__proto__', 'constructor', 'prototype'])

/** The call a header carries, or `null` where it carries none: what `attach` can put a stream in. */
function parse(header: unknown): Request | null {
  if (typeof header !== 'string') return null

  let envelope: unknown

  try {
    envelope = JSON.parse(header)
  } catch {
    return null
  }

  if (envelope === null || typeof envelope !== 'object' || Array.isArray(envelope))
    return null

  const input = (envelope as Request).input

  if (
    input !== undefined &&
    input !== null &&
    (typeof input !== 'object' || Array.isArray(input))
  )
    return null

  return envelope as Request
}
