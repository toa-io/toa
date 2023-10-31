import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { Readable } from 'node:stream'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { map, buffer } from '@toa.io/streams'
import { formats, types } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'

export function write (request: Request, response: Response, body: any): void {
  if (body instanceof Readable) void pipe(body, request, response)
  else send(body, request, response)
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

function send (body: any, request: Request, response: Response): void {
  if (body === undefined || body?.length === 0) {
    response.end()

    return
  }

  const type = negotiate(request)
  const format = formats[type]
  const buf = format.encode(body)

  // content-length and etag are set by Express
  response.set('content-type', type)
  response.send(buf)
}

async function pipe (stream: Readable, request: Request, response: Response): Promise<void> {
  const type = negotiate(request)
  const format = formats[type]

  response.set('content-type', type)
  map(stream, format.encode).pipe(response)
}

function negotiate (request: Request): string {
  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  if (mediaType === undefined) throw new NotAcceptable()

  return mediaType
}

export interface IncomingMessage {
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
