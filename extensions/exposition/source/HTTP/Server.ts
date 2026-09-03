import assert from 'node:assert'
import fs from 'node:fs'
import os from 'node:os'
import * as http from 'node:http'
import * as http2 from 'node:http2'
import { once } from 'node:events'
import { setTimeout } from 'node:timers/promises'
import { console, current, decide, decode, run, type SpanContext } from 'openspan'
import { Connector } from '@toa.io/core'
import { type OutgoingMessage, write } from './messages.js'
import { ClientError, Exception } from './exceptions.js'
import { Context } from './Context.js'
import { PROBE, Probe } from './Probe.js'
import type { IncomingMessage, Protocol, ServerResponse } from './types.js'

export class Server extends Connector {
  private readonly server: http.Server | http2.Http2Server
  private readonly properties: Properties
  private readonly authorities: Record<string, string>

  /** Tracked for the drain: `Http2Server` has no `closeIdleConnections`. */
  private readonly sessions = new Set<http2.ServerHttp2Session>()

  private readonly probe: Probe

  private process?: Processor

  private constructor (properties: Properties) {
    super()

    this.properties = properties
    this.authorities = Object.fromEntries(Object.entries(properties.authorities).map(([key, value]) => [value, key]))
    this.server = instantiate(properties.protocol)
    this.probe = new Probe(properties.probe)

    this.server.on('request', (req, res) =>
      this.listener(req as unknown as IncomingMessage, res as unknown as ServerResponse))

    if (properties.protocol === 'h1') this.h1(this.server as http.Server)
    else this.h2(this.server as http2.Http2Server)
  }

  public static create (options: Options): Server {
    const properties: Properties = { ...DEFAULTS, ...options }

    return new Server(properties)
  }

  public attach (process: Processor): void {
    this.process = process
  }

  protected override async open (): Promise<void> {
    // answers 503 from here; the gateway's dependencies have settled by the time `open` runs
    await this.probe.listen()

    this.server.listen(this.properties.port)

    await once(this.server, 'listening')

    console.info('HTTP Server is listening')

    this.probe.complete()

    console.info('Ready')
  }

  protected override async close (): Promise<void> {
    await this.probe.close()

    this.server.close()

    // GOAWAY lets in-flight streams finish; `Http2Server` has no `closeIdleConnections`
    if (this.properties.protocol === 'h1')
      (this.server as http.Server).closeIdleConnections()
    else
      for (const session of this.sessions) session.close()

    console.info('Stopped accepting new connections')

    // keep-alive clients hold connections open indefinitely, so the drain is bounded
    await Promise.race([
      once(this.server, 'close'),
      setTimeout(this.properties.drain, undefined, { ref: false })
    ])

    if (this.properties.protocol === 'h1')
      (this.server as http.Server).closeAllConnections()
    else
      for (const session of this.sessions) session.destroy()

    console.info('Stopped')
  }

  /** A malformed HTTP/1.1 request has no framing to answer in, so the status line is written by hand. */
  private h1 (server: http.Server): void {
    server.on('clientError', (error, socket) => {
      console.warn('Client connection error', error)

      if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
      else socket.destroy()
    })
  }

  /** HTTP/2 has no `clientError`: failures surface per session, per stream, or per frame. */
  private h2 (server: http2.Http2Server): void {
    server.on('session', (session) => {
      this.sessions.add(session)
      session.on('close', () => this.sessions.delete(session))
    })

    server.on('sessionError', (error) => console.warn('Session error', error))
    server.on('streamError', (error) => console.warn('Stream error', error))

    server.on('unknownProtocol', (socket) => {
      console.warn('Unknown protocol')
      socket.destroy()
    })
  }

  private listener (request: IncomingMessage, response: ServerResponse): void {
    request.once('error', (error) => {
      console.warn('Request error', errorAttributes(request, error))

      if (!response.writableEnded)
        response.destroy()
    })

    // no listener on `request.socket`: under HTTP/2 it is the session's socket, shared by
    // every concurrent stream, and removing listeners on it would strip the siblings'

    const host = authorityOf(request)?.toLowerCase()

    if (host === undefined || !HOST.test(host)) {
      console.warn('Request without a valid authority', errorAttributes(request, new Error('Invalid authority')))

      response.writeHead(400).end()

      return
    }

    // directives and components read `host`; HTTP/2 sends `:authority` instead, and what a
    // component sees must not depend on the protocol the request arrived over
    request.headers.host ??= host

    const url = parse(request, host)

    if (url instanceof Error) {
      console.warn('Invalid request', errorAttributes(request, url))

      response.writeHead(400).end()

      return
    }

    if (request.method === undefined || !this.properties.methods.has(request.method)) {
      response.writeHead(501).end()

      return
    }

    assert(this.process !== undefined, 'Request processor is not attached')

    const authority = this.authorities[host] ?? host

    // if the request carries no trace context, the trace starts here
    const remote = trace(request.headers)

    const processing = remote === null
      ? this.serve(request, response, authority, url)
      : run(remote, async () => await this.serve(request, response, authority, url))

    processing.catch((error) => {
      console.error('Request processing failed', error)

      if (!response.writableEnded)
        response.writeHead(500).end()
    })
  }

  // eslint-disable-next-line max-params
  private async serve (request: IncomingMessage,
    response: ServerResponse,
    authority: string,
    url: URL): Promise<void> {
    await console.span({
      name: `${request.method} ${request.url}`,
      kind: 'server',
      service: 'exposition',
      attributes: { method: request.method, url: request.url, authority }
    }, async () => {
      response.setHeader('ray', current()!.traceId)

      const context = new Context(authority, request, this.properties, url)

      await this.process!(context)
        .then(this.success(context, response))
        .catch(this.fail(context, response))
        .finally(() => request.removeAllListeners('error'))
    })
  }

  private success (context: Context, response: ServerResponse) {
    return async (message: OutgoingMessage) => {
      let status = message.status

      if (status === undefined)
        if (message.body === null)
          status = 404
        else if (context.request.method === 'POST')
          status = 201
        else if (message.body === undefined && context.request.method !== 'HEAD')
          status = 204
        else
          status = 200

      message.status = status

      await write(context, response, message)
    }
  }

  private fail (context: Context, response: ServerResponse) {
    return async (exception: Error) => {
      try {
        // Over HTTP/2 the reply is followed by RST_STREAM(NO_ERROR), which tells the client
        // to stop sending without discarding the response — so the body is never read.
        if (!context.request.complete && this.properties.protocol === 'h1')
          await adam(context.request)

        const status = exception instanceof Exception ? exception.status : 500
        const span = current()

        // https://opentelemetry.io/docs/specs/semconv/http/http-spans/#status
        if (status >= 500 && span !== undefined)
          span.status = 'error'

        if (!response.writableEnded) {
          response.statusCode = status

          const message: OutgoingMessage = { status: response.statusCode }

          // eslint-disable-next-line max-depth
          if (exception instanceof Exception && exception.headers !== undefined)
            message.headers = exception.headers

          // eslint-disable-next-line max-depth
          if (context.encoder === null)
            message.body = undefined
          else if (exception instanceof ClientError || this.properties.debug)
            message.body =
              exception instanceof Exception
                ? exception.body
                : (this.properties.debug && exception.stack) ?? exception.message

          await write(context, response, message)
        }
      } catch (final) {
        console.error('Error in error handler', final)

        if (!response.writableEnded)
          try {
            response.writeHead(500).end()
          } catch {
            // Nothing more we can do
          }
      }
    }
  }
}

function instantiate (protocol: Protocol): http.Server | http2.Http2Server {
  if (protocol === 'h1')
    return http.createServer()

  return http2.createServer({
    // realtime pins one stream per subscription, and they all share a session
    maxSessionMemory: SESSION_MEMORY,
    settings: { initialWindowSize: WINDOW }
  })
}

/**
 * The authority the request is addressed to. HTTP/2 carries it in `:authority` and omits
 * `host` entirely, so reading `host` alone would leave every HTTP/2 request unattributed.
 */
function authorityOf (request: IncomingMessage): string | undefined {
  return request.headers[':authority'] ?? request.headers.host
}

/** Parsing the URL is how a request is validated, so the `Context` is handed the result. */
function parse (request: IncomingMessage, authority: string): URL | Error {
  try {
    return new URL(request.url, `https://${authority}`)
  } catch (error) {
    return error as Error
  }
}

// https://github.com/whatwg/fetch/issues/1254
async function adam (request: IncomingMessage): Promise<void> {
  const devnull = fs.createWriteStream(os.devNull)

  devnull.on('error', () => undefined)
  request.pipe(devnull).on('error', () => undefined)

  await once(request, 'end')
}

function errorAttributes (request: IncomingMessage, error: Error & any): RequestErrorAttributes {
  const attributes: RequestErrorAttributes = {
    path: request.url,
    method: request.method,
    name: error.name
  }

  if (typeof error.code === 'string')
    attributes.code = error.code

  if (typeof error.stack === 'string')
    attributes.stack = error.stack

  return attributes
}

export const PORT = 8000

export const DRAIN = 10 // seconds

/** Megabytes a single HTTP/2 session may hold, over Node's default of 10. */
const SESSION_MEMORY = 128

/** Per-stream flow control window. The default 64 KiB throttles in proportion to RTT. */
const WINDOW = 1024 * 1024

/**
 * Extracts the remote trace context from the request headers.
 *
 * The `ray` header adopts the trace by ID only and does not bypass sampling:
 * the sampling decision is made by the server.
 */
function trace (headers: IncomingMessage['headers']): SpanContext | null {
  if (typeof headers.traceparent === 'string')
    return decode(headers.traceparent)

  // adopting a trace by ID does not bypass sampling
  if (typeof headers.ray === 'string' && RAY.test(headers.ray) && headers.ray !== ZERO_RAY)
    return { traceId: headers.ray.toLowerCase(), sampled: decide() }

  return null
}

/**
 * A host name with an optional port, or a bracketed IPv6 literal. The URL parser admits
 * `,` `;` `=` `(` `)` and quotes in a host, and the authority is written into criteria.
 */
const HOST = /^(?:[a-z0-9.-]{1,253}|\[[0-9a-f:.]{2,45}\])(?::\d{1,5})?$/

const RAY = /^[\da-f]{32}$/i
const ZERO_RAY = '0'.repeat(32)

const DEFAULTS: Omit<Properties, 'authorities'> = {
  methods: new Set<string>(['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'LOCK', 'UNLOCK']),
  debug: false,
  port: PORT,
  drain: DRAIN * 1000,
  protocol: 'h1',
  probe: PROBE
}

interface Properties {
  authorities: Record<string, string>
  methods: Set<string>
  debug: boolean
  port: number
  drain: number
  protocol: Protocol

  /** Port of the readiness probe, which is HTTP/1.1 whatever the gateway serves. */
  probe: number
}

export type Options = { authorities: Properties['authorities'] } & {
  [K in Exclude<keyof Properties, 'authorities'>]?: Properties[K]
}

export type Processor = (input: Context) => Promise<OutgoingMessage>

interface RequestErrorAttributes {
  path: string
  method: string
  name: string
  code?: string
  stack?: string
}
