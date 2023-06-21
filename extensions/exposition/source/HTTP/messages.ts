import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { buffer } from '@toa.io/generic'
import { formats, types } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'

export function write (request: Request, response: Response, value: any): void {
  const buf = encode(value, request, response)

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

function encode (value: any, request: Request, response: Response): Buffer {
  const type = negotiate(request)
  const format = formats[type]
  const buf = format.encode(value)

  response.set('content-type', type)
  // content-length and etag are set by Express

  return buf
}

function negotiate (request: Request): string {
  const negotiator = new Negotiator(request)
  const mediaType = negotiator.mediaType(types)

  if (mediaType === undefined) throw new NotAcceptable()

  return mediaType
}

interface Message {
  value?: any
}

export interface IncomingMessage extends Message {
  path: string
  headers: IncomingHttpHeaders
}

export interface OutgoingMessage extends Message {
  headers: OutgoingHttpHeaders
}
