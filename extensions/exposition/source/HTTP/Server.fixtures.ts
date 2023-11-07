import { Buffer } from 'buffer'
import { Readable } from 'stream'
import type { IncomingMessage } from './messages'
import type * as http from 'node:http'
import type { NextFunction, Response, Express, Request } from 'express'
import type { CorsOptions } from 'cors'

const server = {
  close: jest.fn()
} as unknown as jest.Mock<http.Server>

const app = {
  enable: jest.fn(),
  disable: jest.fn(),
  use: jest.fn(),
  listen: jest.fn(() => server)
} as unknown as jest.Mock<Express>

export function createRequest (req: Partial<Request> = {}, content: string | Buffer = ''):
jest.MockedObject<IncomingMessage> {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content)
  const stream = Readable.from(buffer)

  Object.assign(stream, { headers: {} }, req)

  return stream as unknown as jest.MockedObject<IncomingMessage>
}

export const res = {
  status: jest.fn(() => res),
  sendStatus: jest.fn(() => res),
  set: jest.fn(() => res),
  send: jest.fn(() => res),
  end: jest.fn(() => res)
} as unknown as jest.MockedObject<Response>

export const next = jest.fn() as unknown as NextFunction

export const express = jest.fn(() => app)

export const cors = jest.fn((_: CorsOptions) => () => undefined)
