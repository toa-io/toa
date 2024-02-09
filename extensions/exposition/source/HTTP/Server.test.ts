import { randomUUID } from 'node:crypto'
import { Connector } from '@toa.io/core'
import { type Processing, Server } from './Server'
import { type OutgoingMessage } from './messages'
import { BadRequest } from './exceptions'

let server: Server

beforeAll(() => {
  server = Server.create({ port: 0 })
})

it('should instance of connector', async () => {
  expect(server).toBeInstanceOf(Connector)
})

it('should start HTTP server', async () => {
  await server.connect()

  expect(server.connected).toBeTruthy()
  expect(server.port).toBeGreaterThan(0)
})

it('should register request handler', async () => {
  const process: Processing = jest.fn().mockResolvedValue(undefined)

  server.attach(process)

  const res = await fetch(`http://localhost:${server.port}`)

  await res.text()

  expect(process).toHaveBeenCalledTimes(1)
})

it('should send 501 on unknown method', async () => {
  const head = await fetch(`http://localhost:${server.port}/`, { method: 'COPY' })

  await head.text()
  expect(head.status).toBe(501)
})

it('should stop HTTP server', async () => {
  await server.disconnect()
  expect(server.port).toBe(0)
  expect(server.connected).toBeFalsy()
})

describe('result', () => {
  beforeEach(async () => {
    server = Server.create({ port: 0 })
    await server.connect()
  })

  afterEach(async () => {
    await server.disconnect()
  })

  it('should send status code 200 if the result has a value', async () => {
    server.attach(async (): Promise<OutgoingMessage> => ({
      headers: new Headers(), body: randomUUID()
    }))

    const res = await fetch(`http://localhost:${server.port}/`)

    await res.text()
    expect(res.status).toBe(200)
  })

  it('should send status code 204 if the result has no value', async () => {
    server.attach(async (): Promise<OutgoingMessage> => ({ headers: new Headers() }))

    const res = await fetch(`http://localhost:${server.port}/`)

    await res.text()
    expect(res.status).toBe(204)
  })

  it('should send result', async () => {
    const body = { [randomUUID()]: randomUUID() }

    server.attach(async (): Promise<OutgoingMessage> =>
      ({ headers: new Headers(), body }))

    const res = await fetch(`http://localhost:${server.port}/`,
      { headers: { accept: 'application/json' } })

    const result = await res.json()

    expect(result).toEqual(body)
  })

  it('should return 500 on exception', async () => {
    server.attach(jest.fn().mockRejectedValue(new Error('Bad')))

    const res = await fetch(`http://localhost:${server.port}/`)

    await res.text()
    expect(res.status).toBe(500)
  })

  it('should send client error', async () => {
    const message = randomUUID()

    server.attach(jest.fn().mockRejectedValueOnce(new BadRequest(message)))

    const res = await fetch(`http://localhost:${server.port}/`)
    const text = await res.text()

    expect(res.status).toBe(400)
    expect(text).toContain(message)
  })
})

describe('options', () => {
  it('should send 501 on unspecified method', async () => {
    server = Server.create({ methods: new Set(['COPY']), port: 0 })
    await server.connect()

    const res = await fetch(`http://localhost:${server.port}/`)

    await res.text()
    await server.disconnect()
    expect(res.status).toBe(501)
  })
})
