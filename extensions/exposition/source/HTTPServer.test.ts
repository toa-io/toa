import { HTTPServer } from './HTTPServer'
import { express, cors } from './HTTPServer.fixtures'
import { Connector } from '@toa.io/core'
import type { Express } from 'express'
import type { CorsOptions } from 'cors'
import * as timers from 'timers'
import { generate } from 'randomstring'

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
  await server.open()

  expect(app.listen).toHaveBeenCalledWith(8000, expect.anything())
})

it('should stop HTTP server', async () => {
  await server.open()
  await server.close()

  const httpServer = app.listen.mock.results[0].value

  expect(httpServer.close).toHaveBeenCalled()
})
