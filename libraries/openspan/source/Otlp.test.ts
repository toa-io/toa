import { it, before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as http from 'node:http'
import { console } from './Console.js'
import { Otlp } from './Otlp.js'
import type { AddressInfo } from 'node:net'
import type { Span } from './exporters.js'

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

before(async () => {
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

after(async () => {
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

  assert.strictEqual(requests.length, 1)
  assert.partialDeepStrictEqual(requests[0], { method: 'POST', url: '/v1/traces' })
  assert.strictEqual(requests[0].headers['content-type'], 'application/json')
})

it('should encode spans as OTLP JSON', async () => {
  const exporter = new Otlp({ endpoint, service: 'my-service' })

  exporter.export(span)
  await exporter.flush()

  const body = JSON.parse(requests[0].body)
  const resource = body.resourceSpans[0]
  const encoded = resource.scopeSpans[0].spans[0]

  assert.ok(resource.resource.attributes.some((attribute: any) =>
    isDeepStrictEqual(attribute, { key: 'service.name', value: { stringValue: 'my-service' } })))

  assert.partialDeepStrictEqual(encoded, {
    traceId: span.traceId,
    spanId: span.spanId,
    parentSpanId: span.parentId,
    name: 'test',
    kind: 2,
    startTimeUnixNano: '1700000000000000000',
    endTimeUnixNano: '1700000000012345000',
    status: { code: 2 }
  })

  assert.ok([
    { key: 'component', value: { stringValue: 'pots' } },
    { key: 'method', value: { stringValue: 'GET' } },
    { key: 'attempt', value: { intValue: '2' } },
    { key: 'ratio', value: { doubleValue: 0.5 } },
    { key: 'ok', value: { boolValue: true } }
  ].every((item: any) => encoded.attributes.some((candidate: any) => isDeepStrictEqual(candidate, item))))
})

it('should batch spans', async () => {
  const exporter = new Otlp({ endpoint })

  exporter.export(span)
  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 1)

  const body = JSON.parse(requests[0].body)

  assert.strictEqual(body.resourceSpans[0].scopeSpans[0].spans.length, 2)
})

it('should group spans by service', async () => {
  const exporter = new Otlp({ endpoint, service: 'fallback' })

  exporter.export({ ...span, service: 'orders' })
  exporter.export({ ...span, name: 'second', service: 'orders' })
  exporter.export({ ...span, name: 'third' })
  await exporter.flush()

  const body = JSON.parse(requests[0].body)

  assert.strictEqual(body.resourceSpans.length, 2)

  const services = body.resourceSpans.map((resource: any) =>
    resource.resource.attributes.find((attribute: any) => attribute.key === 'service.name').value.stringValue)

  assert.ok(['orders', 'fallback'].every((item: any) => services.some((candidate: any) => isDeepStrictEqual(candidate, item))))

  const orders = body.resourceSpans[services.indexOf('orders')]

  assert.strictEqual(orders.scopeSpans[0].spans.length, 2)
})

it('should send custom headers', async () => {
  const exporter = new Otlp({ endpoint, headers: { authorization: 'Bearer token' } })

  exporter.export(span)
  await exporter.flush()

  assert.partialDeepStrictEqual(requests[0].headers, { authorization: 'Bearer token' })
})

it('should not fail on export errors', async () => {
  const exporter = new Otlp({ endpoint: refused })

  exporter.export(span)

  await assert.strictEqual(await exporter.flush(), undefined)
})

it('should not fail on serialization errors and keep exporting', async () => {
  const exporter = new Otlp({ endpoint })
  const circular: Record<string, unknown> = {}

  circular.self = circular

  exporter.export({ ...span, attributes: { circular } })

  await assert.strictEqual(await exporter.flush(), undefined)
  assert.strictEqual(requests.length, 0)

  exporter.export(span)

  await assert.strictEqual(await exporter.flush(), undefined)
  assert.strictEqual(requests.length, 1)
})

it('should bound a request by the timeout', async () => {
  respond = () => undefined // never responds

  const exporter = new Otlp({ endpoint, timeout: 50 })

  exporter.export(span)

  // hangs indefinitely unless the request is destroyed
  await assert.strictEqual(await exporter.flush(), undefined)
})

it('should drop spans while the endpoint is unavailable', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new Otlp({ endpoint })

  exporter.export(span)
  await exporter.flush()

  assert.strictEqual(requests.length, 1)

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
})

it('should warn once while the endpoint is unavailable', async () => {
  const warn = mock.method(console, 'warn', () => undefined)

  respond = (response) => response.writeHead(503).end()

  // no cooldown: every batch reaches the endpoint
  const exporter = new Otlp({ endpoint, cooldown: 0 })

  exporter.export(span)
  await exporter.flush()

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 2)
  assert.strictEqual(warn.mock.callCount(), 1)

  warn.mock.restore()
})

it('should resume exporting when the endpoint recovers', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new Otlp({ endpoint, cooldown: 0 })

  exporter.export(span)
  await exporter.flush()

  respond = (response) => response.writeHead(200).end()

  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 2)

  const body = JSON.parse(requests[1].body)

  assert.strictEqual(body.resourceSpans[0].scopeSpans[0].spans[0].name, 'second')
})
