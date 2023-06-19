import { type IncomingHttpHeaders, type OutgoingHttpHeaders } from 'node:http'
import { type Request } from 'express'
import { buffer } from '@toa.io/generic'
import { formats } from './formats'
import { BadRequest, UnsupportedMediaType } from './exceptions'

export async function read (request: Request): Promise<IncomingMessage> {
  const { path, headers } = request
  const value = await decode(request)

  return { path, headers, value }
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
