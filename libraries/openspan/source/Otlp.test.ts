import { Otlp } from './Otlp'
import type { Span } from './exporters'

const fetch = jest.fn(async () => ({ ok: true })) as unknown as jest.MockedFunction<typeof global.fetch>

beforeEach(() => {
  fetch.mockClear()
  global.fetch = fetch
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
  const exporter = new Otlp({ endpoint: 'http://localhost:4318/' })

  exporter.export(span)
  await exporter.flush()

  expect(fetch).toHaveBeenCalledWith('http://localhost:4318/v1/traces',
    expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'content-type': 'application/json' })
    }))
})

it('should encode spans as OTLP JSON', async () => {
  const exporter = new Otlp({ endpoint: 'http://localhost:4318', service: 'my-service' })

  exporter.export(span)
  await exporter.flush()

  const body = JSON.parse(fetch.mock.calls[0][1]?.body as string)
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
  const exporter = new Otlp({ endpoint: 'http://localhost:4318' })

  exporter.export(span)
  exporter.export({ ...span, name: 'second' })
  await exporter.flush()

  expect(fetch).toHaveBeenCalledTimes(1)

  const body = JSON.parse(fetch.mock.calls[0][1]?.body as string)

  expect(body.resourceSpans[0].scopeSpans[0].spans).toHaveLength(2)
})

it('should group spans by service', async () => {
  const exporter = new Otlp({ endpoint: 'http://localhost:4318', service: 'fallback' })

  exporter.export({ ...span, service: 'orders' })
  exporter.export({ ...span, name: 'second', service: 'orders' })
  exporter.export({ ...span, name: 'third' })
  await exporter.flush()

  const body = JSON.parse(fetch.mock.calls[0][1]?.body as string)

  expect(body.resourceSpans).toHaveLength(2)

  const services = body.resourceSpans.map((resource: any) =>
    resource.resource.attributes.find((attribute: any) => attribute.key === 'service.name').value.stringValue)

  expect(services).toEqual(expect.arrayContaining(['orders', 'fallback']))

  const orders = body.resourceSpans[services.indexOf('orders')]

  expect(orders.scopeSpans[0].spans).toHaveLength(2)
})

it('should not fail on export errors', async () => {
  fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))

  const exporter = new Otlp({ endpoint: 'http://localhost:4318' })

  exporter.export(span)

  await expect(exporter.flush()).resolves.toBeUndefined()
})

it('should send custom headers', async () => {
  const exporter = new Otlp({
    endpoint: 'http://localhost:4318',
    headers: { authorization: 'Bearer token' }
  })

  exporter.export(span)
  await exporter.flush()

  expect(fetch.mock.calls[0][1]?.headers).toMatchObject({ authorization: 'Bearer token' })
})
