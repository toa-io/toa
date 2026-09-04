import { readFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createHash } from 'node:crypto'
import * as contentType from 'content-type'
import { console } from 'openspan'
import { type Format, decoders } from './formats/index.js'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions.js'
import type { Context } from './Context.js'
import type { ServerResponse } from './types.js'

const server = `Exposition/${JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version}` +
  ((process.env.TOA_CONTEXT === undefined ? '' : ` ${process.env.TOA_CONTEXT}`) +
    (process.env.TOA_ENV === undefined ? '' : `/${process.env.TOA_ENV}`))

const pending = new Map<string, PendingStream>()

export async function write (context: Context, response: ServerResponse, message: OutgoingMessage): Promise<void> {
  for (const transform of context.pipelines.response)
    await transform(message)

  if (message?.status !== undefined)
    response.statusCode = message.status

  response.setHeader('server', server)
  message.headers?.forEach((value, key) => response.setHeader(key, value))
  context.timing.append(response)

  if (response.destroyed) {
    console.warn('Request destroyed prematurely', { path: context.url.pathname })

    return
  }

  response.on('error', (exception: Error) =>
    console.warn('HTTP response error', { path: context.url.pathname, exception }))

  if (message.body instanceof Readable)
    stream(message, context, response)
  else
    send(message, context, response)
}

export async function read (context: Context): Promise<any> {
  const header = context.request.headers['content-type']

  if (header === undefined)
    return undefined

  const { type, parameters } = contentType.parse(header)

  if (!(type in decoders))
    throw new UnsupportedMediaType()

  const format = decoders[type]
  const buf = await context.buffer()

  try {
    return format.decode(buf, parameters.charset)
  } catch (error: unknown) {
    console.debug('Failed to decode message', {
      path: context.url.pathname,
      error: error?.toString?.()
    })

    throw new BadRequest()
  }
}

function send (message: OutgoingMessage, context: Context, response: ServerResponse): void {
  if (message.body === undefined || message.body === null) {
    // a HEAD reply carries no body but must still report the length a GET would
    // have returned, so a length already set by a directive is left alone
    if (!response.hasHeader('content-length'))
      response.setHeader('content-length', '0')

    response.end()

    return
  }

  if (context.encoder === null)
    throw new NotAcceptable()

  const buf = context.encoder.encode(message.body)

  if (message.etag === true && conditional(context, response, buf))
    return

  response.setHeader('content-type', context.encoder.type)
  response.setHeader('content-length', buf.length.toString())
  response.appendHeader('vary', 'accept')
  response.end(buf)
}

/**
 * Tags a reply that carries no version with a hash of the body being sent, and answers
 * `304` when the client already has it. The tag is taken from the encoded body rather
 * than from a serialization of its own, so it identifies the representation — which is
 * what `vary` says.
 */
function conditional (context: Context, response: ServerResponse, buf: Buffer): boolean {
  const etag = `"${createHash('sha256').update(buf).digest('hex')}"`

  response.setHeader('etag', etag)

  if (context.request.headers['if-none-match'] !== etag)
    return false

  response.setHeader('content-length', '0')
  response.appendHeader('vary', 'accept')

  response.statusCode = 304
  response.end()

  return true
}

function stream (message: OutgoingMessage, context: Context, response: ServerResponse): void {
  const encoded = message.headers !== undefined && message.headers.has('content-type')
  const source: Readable = encoded ? message.body : multipart(message, context, response)

  // not awaited: a reply that streams is written long after the request is answered, and a
  // realtime subscription outlives the span the reply was produced in
  //
  // `pipeline` carries an error to every stage and destroys them. `pipe` leaves the stages it
  // built behind, and an `error` on a stream nobody listens to is an uncaught exception.
  pipeline(source, response)
    .catch((exception: Error) =>
      console.warn('Message stream error', { path: context.url.pathname, exception }))

  if (context.debug)
    debugStream(context, response)
}

/**
 * Frames an object stream as `multipart/*`: an `ACK` part, the parts themselves, then `FIN`.
 * The body is a `Readable`; `write` reached here by testing it.
 */
export function multipart (message: OutgoingMessage, context: Context, response: ServerResponse): Readable {
  if (context.encoder === null)
    throw new NotAcceptable()

  const encoder = context.encoder

  response.setHeader('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  return Readable.from(frames(message.body as Readable, encoder))
}

async function * frames (body: Readable, encoder: Format): AsyncGenerator<Buffer> {
  yield Buffer.concat([CUT, CRLF, encoder.encode('ACK'), CRLF, CUT])

  for await (const part of body)
    yield Buffer.concat([
      CRLF /* indicates no boundary headers */,
      encoder.encode(part),
      CRLF,
      CUT])

  yield Buffer.concat([CRLF, encoder.encode('FIN'), CRLF, FINALCUT])
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const CRLF = Buffer.from('\r\n')
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

const PENDING_DEBUG_INTERVAL = 30000

let pendingInterval: NodeJS.Timeout | null = null

function debugStream (context: Context, response: ServerResponse): void {
  const ctx = { method: context.request.method, path: context.url.pathname }

  console.debug('Stream opened', ctx)
  pending.set(context.id, ctx)

  response.on('close', () => {
    console.debug('Stream closed', ctx)
    pending.delete(context.id)

    if (pending.size === 0) {
      if (pendingInterval !== null)
        clearInterval(pendingInterval)

      pendingInterval = null
    }
  })

  if (pendingInterval === null)
    pendingInterval = setInterval(() =>
      console.debug('Pending streams', { size: pending.size }),
    PENDING_DEBUG_INTERVAL)
}

export interface OutgoingMessage {
  status?: number
  headers?: Headers
  body?: any

  /** tag the response with a hash of the encoded body, see `conditional` */
  etag?: boolean

  /**
   * Built by the gateway rather than returned by an operation, as a request is `authentic`
   * when it was made by one: what is in it is the gateway's own, and the checks that answer
   * for what an operation returns have nothing to say about it.
   */
  authentic?: boolean
}

export interface Query {
  [key: string]: string | number | undefined

  id?: string
  criteria?: string
  search?: string
  sample?: number
  sort?: string
  omit?: string
  limit?: string
  version?: number
}

interface PendingStream {
  method: string
  path: string
}
