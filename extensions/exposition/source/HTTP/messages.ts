import { readFileSync } from 'node:fs'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import * as contentType from 'content-type'
import { console } from 'openspan'
import { type Format, decoders } from './formats/index.js'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions.js'
import { environment } from '@toa.io/generic'
import type { Context } from './Context.js'
import type { ServerResponse } from './types.js'

const context = environment.get('TOA_CONTEXT')
const env = environment.get('TOA_ENV')

/*
 * What answered, on every reply: the build of the gateway, and the context and environment
 * it was deployed with. Under a name of its own rather than `server`, which a CDN in front
 * takes for itself — Cloudflare pins it to `cloudflare` and refuses to let a rule set it,
 * so a gateway that said it there said it to nobody. A name like `ray`'s, and it survives
 * the same hop `ray` does.
 */
const exposition =
  `${JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version}` +
  ((context === undefined ? '' : ` ${context}`) + (env === undefined ? '' : `/${env}`))

/**
 * Applies what the request accumulated in `pipelines.response` — an `io:output` restriction,
 * a `vary` a `map` directive owes. Separate from `write` because a message is not always
 * written: one call of several produces a value the reply is assembled from.
 */
export async function shape(context: Context, message: OutgoingMessage): Promise<void> {
  for (const transform of context.pipelines.response) await transform(message)
}

export async function write(
  context: Context,
  response: ServerResponse,
  message: OutgoingMessage
): Promise<void> {
  await shape(context, message)

  if (message?.status !== undefined) response.statusCode = message.status

  response.setHeader('exposition', exposition)
  message.headers?.forEach((value, key) => response.setHeader(key, value))
  context.timing.append(response)

  if (response.destroyed) {
    console.warn('Request destroyed prematurely', { path: context.url.pathname })

    return
  }

  response.on('error', (exception: Error) =>
    console.warn('HTTP response error', { path: context.url.pathname, exception })
  )

  if (message.body instanceof Readable) stream(message, context, response)
  else send(message, context, response)
}

export async function read(context: Context): Promise<any> {
  const header = context.request.headers['content-type']

  if (header === undefined) return undefined

  const { type, parameters } = contentType.parse(header)

  if (!(type in decoders)) throw new UnsupportedMediaType()

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

function send(
  message: OutgoingMessage,
  context: Context,
  response: ServerResponse
): void {
  if (message.body === undefined || message.body === null) {
    // a HEAD reply carries no body but must still report the length a GET would
    // have returned, so a length already set by a directive is left alone
    if (!response.hasHeader('content-length')) response.setHeader('content-length', '0')

    response.end()

    return
  }

  if (context.encoder === null) throw new NotAcceptable()

  const buf = context.encoder.encode(message.body)

  response.setHeader('content-type', context.encoder.type)
  response.setHeader('content-length', buf.length.toString())
  response.appendHeader('vary', 'accept')
  response.end(buf)
}

function stream(
  message: OutgoingMessage,
  context: Context,
  response: ServerResponse
): void {
  const encoded = message.headers !== undefined && message.headers.has('content-type')
  const source: Readable = encoded ? message.body : multipart(message, context, response)

  // not awaited: a reply that streams is written long after the request is answered, and a
  // realtime subscription outlives the span the reply was produced in
  //
  // `pipeline` carries an error to every stage and destroys them. `pipe` leaves the stages it
  // built behind, and an `error` on a stream nobody listens to is an uncaught exception.
  pipeline(source, response).catch((exception: Error) =>
    console.warn('Message stream error', { path: context.url.pathname, exception })
  )
}

/**
 * Frames an object stream as `multipart/*`: an `ACK` part, the parts themselves, then `FIN`.
 * The body is a `Readable`; `write` reached here by testing it.
 */
export function multipart(
  message: OutgoingMessage,
  context: Context,
  response: ServerResponse
): Readable {
  if (context.encoder === null) throw new NotAcceptable()

  const encoder = context.encoder

  response.setHeader('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  return new Framing(message.body as Readable, encoder, context.signal)
}

/**
 * A part is pulled when the reader takes one, so a slow reader holds the body back.
 *
 * Not a generator under `Readable.from`: that one's `return()` waits behind the `next()` it is
 * suspended in, and a body destroyed with its reply would live on until its next part — a
 * subscription's, until its next heartbeat. Destroyed, this destroys the body at once.
 *
 * Aborted, it ends with `FIN` instead of being cut: the gateway is stopping, and the reader is
 * told the stream is over rather than left to find out.
 */
class Framing extends Readable {
  private readonly body: Readable
  private readonly parts: AsyncIterator<unknown>
  private readonly encoder: Format
  private readonly signal: AbortSignal
  private pulling = false
  private stopping = false
  private finished = false

  public constructor(body: Readable, encoder: Format, signal: AbortSignal) {
    super()

    this.body = body
    this.encoder = encoder
    this.signal = signal
    this.parts = body[Symbol.asyncIterator]()

    this.push(Buffer.concat([CUT, CRLF, encoder.encode('ACK'), CRLF, CUT]))

    if (signal.aborted) this.stop()
    else signal.addEventListener('abort', this.stop, { once: true })
  }

  public override _read(): void {
    if (this.pulling || this.finished) return

    this.pulling = true

    this.pull().catch((error: Error) => this.destroy(error))
  }

  public override _destroy(
    error: Error | null,
    callback: (error?: Error | null) => void
  ): void {
    this.signal.removeEventListener('abort', this.stop)
    this.body.destroy()

    callback(error)
  }

  private async pull(): Promise<void> {
    let result: IteratorResult<unknown>

    try {
      result = await this.parts.next()
    } catch (error) {
      // the body was destroyed by `stop`, and that is not an error of the stream
      if (this.stopping) {
        this.finish()

        return
      }

      throw error
    } finally {
      this.pulling = false
    }

    if (result.done === true || this.stopping) this.finish()
    else
      this.push(
        Buffer.concat([
          CRLF /* indicates no boundary headers */,
          this.encoder.encode(result.value),
          CRLF,
          CUT
        ])
      )
  }

  private readonly stop = (): void => {
    this.stopping = true
    this.body.destroy()

    // a pull in flight finishes on its own once the body is gone
    if (!this.pulling) this.finish()
  }

  private finish(): void {
    if (this.finished) return

    this.finished = true
    this.signal.removeEventListener('abort', this.stop)

    this.push(Buffer.concat([CRLF, this.encoder.encode('FIN'), CRLF, FINALCUT]))
    this.push(null)
  }
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const CRLF = Buffer.from('\r\n')
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

export interface OutgoingMessage {
  status?: number
  headers?: Headers
  body?: any

  /** what the reply carries for a cache to validate by; the `cache` family sets the headers */
  version?: number
  modified?: number | string

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
