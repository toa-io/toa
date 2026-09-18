import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Reply } from '@toa.io/core/types'

export const JSON_TYPE = 'application/json'
export const BYTES_TYPE = 'application/octet-stream'
export const VALUES_TYPE = 'application/x-ndjson'

/** How a stream ended, said once it is too late to say it in a status. */
export const STATUS = 'toa-status'

const OK = 'ok'

/**
 * A value is the envelope, a stream is the body — bytes as they are, values newline-delimited —
 * and how the stream ended is a trailer, so a body that stops without one is a stream that was
 * cut rather than one that finished.
 */
export async function write(response: ServerResponse, reply: Reply | Readable): Promise<void> {
  if (!(reply instanceof Readable)) {
    const body = JSON.stringify(reply ?? null)

    response.writeHead(200, { 'content-type': JSON_TYPE })
    response.end(body)

    return
  }

  await stream(response, reply)
}

async function stream(response: ServerResponse, source: Readable): Promise<void> {
  // one iterator throughout: taking the first chunk with a `for await` that breaks would close
  // the stream it was read from
  const iterator = source[Symbol.asyncIterator]()
  const first = await iterator.next()

  // `Readable.from` makes every generator an object mode stream, whatever it yields, so what the
  // body is, is settled by what came out of it rather than by how it was made
  const bytes = !source.readableObjectMode || Buffer.isBuffer(first.value)

  response.writeHead(200, {
    'content-type': bytes ? BYTES_TYPE : VALUES_TYPE,
    trailer: STATUS
  })

  try {
    await pipeline(frames(first, iterator, bytes), response, { end: false })
    response.addTrailers({ [STATUS]: OK })
  } catch (error: unknown) {
    // the status is written, so what failed is said where it still can be
    response.addTrailers({ [STATUS]: JSON.stringify(reason(error)) })
  }

  response.end()
}

async function* frames(
  first: IteratorResult<unknown>,
  rest: AsyncIterator<unknown>,
  bytes: boolean
): AsyncGenerator<Buffer> {
  if (first.done !== true) yield frame(first.value, bytes)

  for (;;) {
    const next = await rest.next()

    if (next.done === true) return

    yield frame(next.value, bytes)
  }
}

/** What a caller is told of a stream that failed after it had started. */
function reason(error: unknown): unknown {
  const carried = error as { exception?: unknown, message?: string } | undefined

  return carried?.exception ?? carried?.message ?? null
}

function frame(chunk: unknown, bytes: boolean): Buffer {
  if (bytes) {
    if (Buffer.isBuffer(chunk)) return chunk
    if (typeof chunk === 'string') return Buffer.from(chunk)

    throw new Error('A stream carries bytes and values, and is served as neither')
  }

  if (Buffer.isBuffer(chunk))
    throw new Error('A stream carries bytes and values, and is served as neither')

  return Buffer.from(JSON.stringify(chunk) + '\n')
}

/** What a caller is handed: the envelope a value came back as, or the stream a stream did. */
export function read(message: IncomingMessage): Promise<Reply> | Readable {
  const type = message.headers['content-type']

  if (type === BYTES_TYPE) return checked(message, message)
  if (type === VALUES_TYPE) return checked(message, values(message))

  return envelope(message)
}

async function envelope(message: IncomingMessage): Promise<Reply> {
  const chunks: Buffer[] = []

  for await (const chunk of message) chunks.push(chunk as Buffer)

  const body = Buffer.concat(chunks).toString()

  return body === '' ? (null as unknown as Reply) : (JSON.parse(body) as Reply)
}

function values(message: IncomingMessage): Readable {
  return Readable.from(lines(message), { objectMode: true })
}

async function* lines(message: IncomingMessage): AsyncGenerator<unknown> {
  let rest = ''

  for await (const chunk of message) {
    const text = rest + (chunk as Buffer).toString()
    const parts = text.split('\n')

    rest = parts.pop() ?? ''

    for (const part of parts) if (part !== '') yield JSON.parse(part)
  }

  if (rest !== '') yield JSON.parse(rest)
}

/**
 * A stream is whole only where its trailer says so: a body that ends without one was cut, and one
 * whose trailer carries an exception failed after it had started.
 *
 * Pulled rather than piped, so that what arrived before a failure is read before the failure is
 * raised: a chunk that got through is never dropped for the sake of reporting the one that did not.
 */
function checked(message: IncomingMessage, source: Readable): Readable {
  return Readable.from(pull(message, source), { objectMode: source.readableObjectMode })
}

async function* pull(message: IncomingMessage, source: Readable): AsyncGenerator<unknown> {
  for await (const chunk of source) yield chunk

  const status = message.trailers[STATUS]

  if (status !== OK) throw failure(status)
}

function failure(status: string | undefined): Error {
  if (status === undefined)
    return new Error('The reply stream ended without saying that it was whole')

  const error = new Error('The reply stream failed')

  error.cause = JSON.parse(status)

  return error
}
