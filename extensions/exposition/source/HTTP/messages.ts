import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { Readable } from 'node:stream'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { map, buffer } from '@toa.io/streams'
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
  if (message.body === undefined || message.body?.length === 0) {
    response.end()

    return
  }

  const encoder = format(request, response)
  const buf = encoder.encode(message.body)

  response.end(buf)
}

function stream
(message: OutgoingMessage, request: Request, response: Response): void {
  if (message.headers !== undefined && 'content-type' in message.headers)
    pipe(message, response)
  else
    pipeValues(message, request, response)
}

function pipe (message: OutgoingMessage, response: Response): void {
  response.set(message.headers)
  message.body.pipe(response)
}

function pipeValues (message: OutgoingMessage, request: Request, response: Response): void {
  const encoder = format(request, response)

  map(message.body, encoder.encode).pipe(response)
}

function negotiate (request: Request): string {
  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  if (mediaType === undefined)
    throw new NotAcceptable()

  return mediaType
}

function format (request: Request, response: Response): Format {
  const type = negotiate(request)
  const format = formats[type]

  response.set('content-type', type)

  return format
}

export interface IncomingMessage extends Readable {
  method: string
  path: string
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
