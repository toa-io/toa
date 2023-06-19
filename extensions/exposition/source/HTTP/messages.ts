import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { type Request, type Response } from 'express'
import Negotiator from 'negotiator'
import { buffer } from '@toa.io/generic'
import { formats, types } from './formats'
import { BadRequest, NotAcceptable, UnsupportedMediaType } from './exceptions'

export async function read (request: Request): Promise<IncomingMessage> {
  const { path, headers } = request
  const value = await decode(request)

  return { path, headers, value }
}

export function write (request: Request, response: Response, message: OutgoingMessage): void {
  encode(message, request)

  for (const [header, value] of Object.entries(message.headers))
    response.set(header, value as string)

  if (message.value === undefined)
    response.status(204)
      .end()
  else
    response.status(200)
      .send(message.value)
}

async function decode (request: Request): Promise<any> {
  const type = request.headers['content-type']

  if (type === undefined) return null

  if (!(type in formats)) throw new UnsupportedMediaType()

  const format = formats[type]
  const buf = await buffer(request)

  try {
    return format.decode(buf)
  } catch {
    throw new BadRequest()
  }
}

function encode (message: OutgoingMessage, request: Request): void {
  if (message.value === undefined) return

  const type = acceptable(request)
  const format = formats[type]

  message.value = format.encode(message.value)
  message.headers['content-type'] = type
  // content-length and etag are set by Express
}

function acceptable (request: Request): string {
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
