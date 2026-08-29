import * as http from 'node:http'
import { console } from './Console'
import { Otlp } from './Otlp'
import type { AddressInfo } from 'node:net'
import type { Span } from './exporters'

interface Request {
  method?: string
  url?: string
  headers: http.IncomingHttpHeaders
  body: string
}

let requests: Request[] = []
let respond: (response: http.ServerResponse) => void
let server: http.Server
let endpoint: string

// an endpoint nothing listens on
const refused = 'http://localhost:1'

beforeAll(async () => {
  server = http.createServer((request, response) => {
    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk: string) => (body += chunk))
    request.on('end', () => {
      requests.push({ method: request.method, url: request.url, headers: request.headers, body })
      respond(response)
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))

  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})

afterAll(async () => {
  server.closeAllConnections()

  await new Promise<void>((resolve) => server.close(() => resolve()))
})

beforeEach(() => {
  requests = []
  respond = (response) => response.writeHead(200).end()
})

const span: Span = {
  name: 'test',
  traceId: 'a'.repeat(32),
  spanId: 'b'.repeat(16),
  parentId: 'c'.repeat(16),
  kind: 'server',
  time: 1700000000000,
  duration: 12.345,
  attributes: { method: 'GET', attempt: 2, ratio: 0.5, ok: true },
  scope: { component: 'pots' },
  status: 'error'
}

it('should post spans to the endpoint', async () => {
  const exporter = new Otlp({ endpoint: endpoint + '/' })

  exporter.export(span)
  await exporter.flush()

  expect(requests).toHaveLength(1)
  expect(requests[0]).toMatchObject({
    method: 'POST',
    url: '/v1/traces',
    headers: expect.objectContaining({ 'content-type': 'application/json' })
  })
})

it('should encode spans as OTLP JSON', async () => {
  const exporter = new Otlp({ endpoint, service: 'my-service' })

  exporter.export(span)
  await exporter.flush()

  const body = JSON.parse(requests[0].body)
  const resource = body.resourceSpans[0]
  const encoded = resource.scopeSpans[0].spans[0]

  expect(resource.resource.attributes).toContainEqual({
    key: 'service.name',
    value: { stringValue: 'my-service' }
  })

  expect(encoded).toMatchObject({
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentId,
    name: 'test',
    kind: 2,
    startTimeUnixNano: '1700000000000000000',
    endTimeUnixNano: '1700000000012345000',
    status: { code: 2 }
  })

  expect(encoded.attributes).toEqual(expect.arrayContaining([
    { key: 'component', value: { stringValue: 'pots' } },
    { key: 'method', value: { stringValue: 'GET' } },
    { key: 'attempt', value: { intValue: '2' } },
    { key: 'ratio', value: { doubleValue: 0.5 } },
    { key: 'ok', value: { boolValue: true } }
  ]))
})

it('should batch spans', async () => {
  const exporter = new Otlp({ endpoint })

  exporter.export(span)
  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  expect(requests).toHaveLength(1)

  const body = JSON.parse(requests[0].body)

  expect(body.resourceSpans[0].scopeSpans[0].spans).toHaveLength(2)
})

it('should group spans by service', async () => {
  const exporter = new Otlp({ endpoint, service: 'fallback' })

  exporter.export({ ...span, service: 'orders' })
  exporter.export({ ...span, name: 'second', service: 'orders' })
  exporter.export({ ...span, name: 'third' })
  await exporter.flush()

  const body = JSON.parse(requests[0].body)

  expect(body.resourceSpans).toHaveLength(2)

  const services = body.resourceSpans.map((resource: any) =>
    resource.resource.attributes.find((attribute: any) => attribute.key === 'service.name').value.stringValue)

  expect(services).toEqual(expect.arrayContaining(['orders', 'fallback']))

  const orders = body.resourceSpans[services.indexOf('orders')]

  expect(orders.scopeSpans[0].spans).toHaveLength(2)
})

it('should send custom headers', async () => {
  const exporter = new Otlp({ endpoint, headers: { authorization: 'Bearer token' } })

  exporter.export(span)
  await exporter.flush()

  expect(requests[0].headers).toMatchObject({ authorization: 'Bearer token' })
})

it('should not fail on export errors', async () => {
  const exporter = new Otlp({ endpoint: refused })

  exporter.export(span)

  await expect(exporter.flush()).resolves.toBeUndefined()
})

it('should not fail on serialization errors and keep exporting', async () => {
  const exporter = new Otlp({ endpoint })
  const circular: Record<string, unknown> = {}

  circular.self = circular

  exporter.export({ ...span, attributes: { circular } })

  await expect(exporter.flush()).resolves.toBeUndefined()
  expect(requests).toHaveLength(0)

  exporter.export(span)

  await expect(exporter.flush()).resolves.toBeUndefined()
  expect(requests).toHaveLength(1)
})

it('should bound a request by the timeout', async () => {
  respond = () => undefined // never responds

  const exporter = new Otlp({ endpoint, timeout: 50 })

  exporter.export(span)

  // hangs indefinitely unless the request is destroyed
  await expect(exporter.flush()).resolves.toBeUndefined()
})

it('should drop spans while the endpoint is unavailable', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new Otlp({ endpoint })

  exporter.export(span)
  await exporter.flush()

  expect(requests).toHaveLength(1)

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  expect(requests).toHaveLength(1)
})

it('should warn once while the endpoint is unavailable', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

  respond = (response) => response.writeHead(503).end()

  // no cooldown: every batch reaches the endpoint
  const exporter = new Otlp({ endpoint, cooldown: 0 })

  exporter.export(span)
  await exporter.flush()

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  expect(requests).toHaveLength(2)
  expect(warn).toHaveBeenCalledTimes(1)

  warn.mockRestore()
})

it('should resume exporting when the endpoint recovers', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new Otlp({ endpoint, cooldown: 0 })

  exporter.export(span)
  await exporter.flush()

  respond = (response) => response.writeHead(200).end()

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  expect(requests).toHaveLength(2)

  const body = JSON.parse(requests[1].body)

  expect(body.resourceSpans[0].scopeSpans[0].spans[0].name).toBe('second')
})
