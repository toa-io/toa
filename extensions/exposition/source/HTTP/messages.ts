import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { buffer } from '@toa.io/generic'
import { formats, types } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'

export function write (request: Request, response: Response, body: any): void {
  const type = negotiate(request)
  const format = formats[type]
  const buf = format.encode(body)

  // content-length and etag are set by Express
  response.set('content-type', type)
  response.send(buf)
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

function negotiate (request: Request): string {
  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  if (mediaType === undefined) throw new NotAcceptable()

  return mediaType
}

interface Message {
  body?: any
}

export interface IncomingMessage extends Message {
  method: string
  path: string
  headers: IncomingHttpHeaders
}

export interface OutgoingMessage extends Message {
  headers: OutgoingHttpHeaders
}
