import http from 'node:http'
import { HTTPServer } from './HTTPServer'
import { express, cors } from './HTTPServer.fixtures'
import { Connector } from '@toa.io/core'
import type { Express } from 'express'
import type { CorsOptions } from 'cors'
import { immediate } from '@toa.io/generic'

jest.mock('express', () => () => express())
jest.mock('cors', () => (options: CorsOptions) => cors(options))

let server: HTTPServer
let app: jest.MockedObject<Express>

beforeEach(() => {
  jest.clearAllMocks()

  server = HTTPServer.create()
  app = express.mock.results[0]?.value
})

it('should instance of connector', async () => {
  expect(server).toBeInstanceOf(Connector)
})

it('should create express app', async () => {
  expect(express).toHaveBeenCalled()
  expect(app.disable).toHaveBeenCalledWith('x-powered-by')
  expect(app.enable).toHaveBeenCalledWith('case sensitive routing')
  expect(app.enable).toHaveBeenCalledWith('strict routing')
})

it('should support cors', async () => {
  expect(cors).toHaveBeenCalledWith(<CorsOptions>{ allowedHeaders: ['content-type'] })

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
  const handler = () => undefined

  server.handle(handler)

  expect(app.use).toHaveBeenCalledWith(handler)
})
