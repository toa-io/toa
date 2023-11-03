import { Connector } from '@toa.io/core'
import { immediate } from '@toa.io/generic'
import { generate } from 'randomstring'
import { type Processing, Server } from './Server'
import { type OutgoingMessage } from './messages'
import { express, cors, createRequest, res, next } from './Server.fixtures'
import { BadRequest } from './exceptions'
import type { Express, Request, RequestHandler } from 'express'
import type { CorsOptions } from 'cors'
import type http from 'node:http'

jest.mock('express', () => () => express())
jest.mock('cors', () => (options: CorsOptions) => cors(options))

let server: Server
let app: jest.MockedObject<Express>

beforeEach(() => {
  jest.clearAllMocks()

  server = Server.create()
  app = express.mock.results[0]?.value
})

it('should instance of connector', async () => {
  expect(server).toBeInstanceOf(Connector)
})

it('should create express app', async () => {
  expect(express).toHaveBeenCalled()
  expect(app.disable).toHaveBeenCalledWith('x-powered-by')
})

it('should support cors', async () => {
  expect(cors).toHaveBeenCalledWith({ allowedHeaders: ['content-type'] } satisfies CorsOptions)

  const middleware = cors.mock.results[0].value

  expect(app.use).toHaveBeenCalledWith(middleware)
})

it('should start HTTP server', async () => {
  const stared = server.connect()

  await immediate()

  expect(app.listen).toHaveBeenCalledWith(8000, expect.anything())

  const done = app.listen.mock.calls[0][1]

  if (done !== undefined) done()

  await stared
})

it('should stop HTTP server', async () => {
  const started = server.connect()

  await immediate()

  app.listen.mock.calls[0][1]?.() // `listen` callback

  await started

  const stopped = server.disconnect()
  const httpServer: jest.MockedObject<http.Server> = app.listen.mock.results[0].value

  await immediate()

  expect(httpServer.close).toHaveBeenCalled()

  httpServer.close.mock.calls[0][0]?.() // `close` callback

  await stopped
})

it('should register request handler', async () => {
  const process = jest.fn(async () => ({})) as unknown as Processing
  const req = createRequest()

  server.attach(process)

  await use(req)

  expect(process).toHaveBeenCalled()
})

it('should send 501 on unknown method', async () => {
  const req = createRequest({ method: generate() })

  await use(req)

  expect(res.sendStatus).toHaveBeenCalledWith(501)
})

describe('request', () => {
  const process = jest.fn(async () => ({})) as unknown as Processing

  beforeEach(() => {
    server.attach(process)
  })

  it('should pass decoded request', async () => {
    const path = generate()
    const method = generate()
    const headers = { 'content-type': 'application/json' }
    const body = { [generate()]: generate() }
    const json = JSON.stringify(body)
    const req = createRequest({ path, method, headers }, json)

    await use(req)

    expect(process).toHaveBeenCalledWith(expect.objectContaining({ path, method, headers, body }))
  })
})

describe('result', () => {
  it('should send status code 200 if the result has a value', async () => {
    const process = async (): Promise<OutgoingMessage> => ({
      headers: new Headers(), body: generate()
    })
    const req = createRequest()

    server.attach(process)
    await use(req)

    expect(res.status).toHaveBeenCalledWith(200)
  })

  it('should send status code 204 if the result has no value', async () => {
    const process = async (): Promise<OutgoingMessage> => ({ headers: new Headers() })
    const req = createRequest()

    server.attach(process)
    await use(req)

    expect(res.status).toHaveBeenCalledWith(204)
  })

  it('should send result', async () => {
    const body = { [generate()]: generate() }
    const json = JSON.stringify(body)
    const buf = Buffer.from(json)
    const process = async (): Promise<OutgoingMessage> => ({ headers: new Headers(), body })
    const req = createRequest({ headers: { accept: 'application/json' } })

    server.attach(process)
    await use(req)

    expect(res.send).toHaveBeenCalledWith(buf)
  })

  it('should return 500 on exception', async () => {
    const process = async (): Promise<OutgoingMessage> => {
      throw new Error('Bad')
    }

    const req = createRequest()

    server.attach(process)
    await use(req)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should output exception message if debug is enabled', async () => {
    jest.clearAllMocks()

    server = Server.create({ debug: true })
    app = express.mock.results[0]?.value

    const message = generate()
    const req = createRequest()

    const process = async (): Promise<OutgoingMessage> => {
      throw new Error(message)
    }

    server.attach(process)
    await use(req)

    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should send client error', async () => {
    const req = createRequest()
    const message = generate()

    const process = async (): Promise<OutgoingMessage> => {
      throw new BadRequest(message)
    }

    server.attach(process)
    await use(req)

    expect(res.status).toHaveBeenCalledWith(400)
  })
})

describe('options', () => {
  it('should send 501 on unspecified method', async () => {
    jest.clearAllMocks()

    server = Server.create({ methods: new Set(['COPY']) })
    app = express.mock.results[0]?.value

    const req = createRequest({ method: 'GET' })

    await use(req)

    expect(res.sendStatus).toHaveBeenCalledWith(501)
  })
})

async function use (req: Request): Promise<void> {
  for (const call of app.use.mock.calls) {
    const usage = call[0] as unknown as RequestHandler

    usage(req, res, next)
  }

  await immediate()
}
