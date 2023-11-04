import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { Readable } from 'node:stream'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { buffer } from '@toa.io/streams'
import { formats, types } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'
import type { Format } from './formats'

export function write (request: Request, response: Response, message: OutgoingMessage): void {
  if (message.body instanceof Readable)
    stream(message, request, response)
  else
    send(message, request, response)
}

export async function read (request: Request): Promise<any> {
  const type = request.headers['content-type']

  if (type === undefined) return undefined

  if (!(type in formats)) throw new UnsupportedMediaType()

  const format = formats[type]

  const buf = await buffer(request)

  try {
    return format.decode(buf)
  } catch {
    throw new BadRequest()
  }
}

function send (message: OutgoingMessage, request: Request, response: Response): void {
  if (message.body === undefined) {
    response.end()

    return
  }

  const encoder = negotiate(request)
  const buf = encoder.encode(message.body)

  response.set('content-type', encoder.type)
  response.end(buf)
}

function stream
(message: OutgoingMessage, request: Request, response: Response): void {
  const encoded = message.headers !== undefined && 'content-type' in message.headers

  if (encoded)
    pipe(message, response)
  else
    multipart(message, request, response)

  message.body.on('error', (e: Error) => {
    console.error(e)
    response.end()
  })
}

function pipe (message: OutgoingMessage, response: Response): void {
  response.set(message.headers)
  message.body.pipe(response)
}

function multipart (message: OutgoingMessage, request: Request, response: Response): void {
  const encoder = negotiate(request)
  const stream = message.body as Readable

  response.set('content-type', `${encoder.multipart}; boundary=${BOUNDARY}`)

  stream
    .map((part) => Buffer.concat([CUT, encoder.encode(part)]))
    .on('end', () => response.end(FINALCUT))
    .pipe(response)
}

function negotiate (request: Request): Format {
  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  if (mediaType === undefined)
    throw new NotAcceptable()

  return formats[mediaType]
}

const BOUNDARY = 'cut'
const CUT = Buffer.from(`--${BOUNDARY}\r\n`)
const FINALCUT = Buffer.from(`--${BOUNDARY}--`)

export interface IncomingMessage extends Readable {
  method: string
  path: string
  url: string
  headers: IncomingHttpHeaders
  query: Query
  parse: <T> () => Promise<T>
}

export interface OutgoingMessage {
  status?: number
  headers?: OutgoingHttpHeaders
  body?: any
}

export interface Query {
  id?: string
  criteria?: string
  sort?: string
  omit?: string
  limit?: string
}
