import { Readable } from 'node:stream'
import { buffer } from 'node:stream/consumers'
import { formats } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'
import type * as http from 'node:http'
import type { Format } from './formats'
import type { Timing } from './Timing'

export function write
(request: IncomingMessage, response: http.ServerResponse, message: OutgoingMessage): void {
  for (const transform of request.pipelines.response)
    transform(message)

  message.headers?.forEach((value, key) => response.setHeader(key, value))
  request.timing.append(response)

  if (message.body instanceof Readable)
    stream(message, request, response)
  else
    send(message, request, response)
}

export async function read (request: IncomingMessage): Promise<any> {
  const type = request.headers['content-type']

  if (type === undefined)
    return undefined

  if (!(type in formats))
    throw new UnsupportedMediaType()

  const format = formats[type]
  const buf = await request.timing.capture('req:buffer', buffer(request))

  try {
    return format.decode(buf)
  } catch {
    throw new BadRequest()
  }
}

function send
(message: OutgoingMessage, request: IncomingMessage, response: http.ServerResponse): void {
  if (message.body === undefined || message.body === null) {
    response.end()

    return
  }

  if (request.encoder === null)
    throw new NotAcceptable()

  const buf = request.encoder.encode(message.body)

  response
    .setHeader('content-type', request.encoder.type)
    .appendHeader('vary', 'accept')
    .end(buf)
}

function stream
(message: OutgoingMessage, request: IncomingMessage, response: http.ServerResponse): void {
  const encoded = message.headers !== undefined && message.headers.has('content-type')

  if (encoded)
    pipe(message, response)
  else
    multipart(message, request, response)

  message.body.on('error', (e: Error) => {
    console.error(e)
    response.end()
  })
}

function pipe (message: OutgoingMessage, response: http.ServerResponse): void {
  message.body.pipe(response)
}

function multipart
(message: OutgoingMessage, request: IncomingMessage, response: http.ServerResponse): void {
  if (request.encoder === null)
    throw new NotAcceptable()

  const encoder = request.encoder

  response.setHeader('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  message.body
    .map((part: unknown) => Buffer.concat([CUT, encoder.encode(part)]))
    .on('end', () => response.end(FINALCUT))
    .pipe(response)
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

export interface IncomingMessage extends http.IncomingMessage {
  method: string // defined
  url: string // defined

  locator: URL
  parse: <T> () => Promise<T>
  encoder: Format | null
  subtype: string | null
  pipelines: {
    body: Array<(input: unknown) => unknown>
    response: Array<(output: OutgoingMessage) => void>
  }
  timing: Timing
}

export interface OutgoingMessage {
  status?: number
  headers?: Headers
  body?: any
}

export interface Query {
  [key: string]: string | undefined

  id?: string
  criteria?: string
  sort?: string
  omit?: string
  limit?: string
}
