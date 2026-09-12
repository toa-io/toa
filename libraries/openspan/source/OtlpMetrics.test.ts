import { it, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as http from 'node:http'
import { OtlpMetrics } from './OtlpMetrics.ts'
import type { AddressInfo } from 'node:net'
import type { Series } from './Registry.ts'

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

before(async () => {
  server = http.createServer((request, response) => {
    let body = ''

    request.setEncoding('utf8')
    request.on('data', (chunk: string) => (body += chunk))
    request.on('end', () => {
      requests.push({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body
      })
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

const counter: Series = {
  name: 'toa.operation.errors',
  type: 'counter',
  labels: { component: 'default.orders' },
  value: 3
}

const gauge: Series = {
  name: 'toa.operation.inflight',
  type: 'gauge',
  labels: {},
  value: 2
}

const histogram: Series = {
  name: 'toa.operation.duration',
  type: 'histogram',
  labels: { operation: 'debit' },
  unit: 's',
  bounds: [1, 10],
  buckets: [1, 1, 1],
  count: 3,
  sum: 55.5
}

async function post(series: Series[], options = {}): Promise<any> {
  const exporter = new OtlpMetrics({ endpoint, ...options })

  exporter.export(series)

  await exporter.flush()

  return JSON.parse(requests[0].body)
}

it('should post series to the endpoint', async () => {
  const exporter = new OtlpMetrics({ endpoint: endpoint + '/' })

  exporter.export([counter])
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
  assert.partialDeepStrictEqual(requests[0], { method: 'POST', url: '/v1/metrics' })
  assert.strictEqual(requests[0].headers['content-type'], 'application/json')
})

it('should encode a counter as a cumulative monotonic sum', async () => {
  const body = await post([counter])
  const metric = body.resourceMetrics[0].scopeMetrics[0].metrics[0]

  assert.strictEqual(metric.name, 'toa.operation.errors')
  assert.strictEqual(metric.sum.isMonotonic, true)
  assert.strictEqual(metric.sum.aggregationTemporality, 2)
  assert.strictEqual(metric.sum.dataPoints[0].asDouble, 3)
  assert.ok(
    metric.sum.dataPoints[0].attributes.some((attribute: any) =>
      isDeepStrictEqual(attribute, {
        key: 'component',
        value: { stringValue: 'default.orders' }
      })
    )
  )
})

it('should encode a gauge', async () => {
  const body = await post([gauge])
  const metric = body.resourceMetrics[0].scopeMetrics[0].metrics[0]

  assert.strictEqual(metric.gauge.dataPoints[0].asDouble, 2)
})

it('should encode a histogram with its bounds and counts', async () => {
  const body = await post([histogram])
  const metric = body.resourceMetrics[0].scopeMetrics[0].metrics[0]
  const point = metric.histogram.dataPoints[0]

  assert.strictEqual(metric.unit, 's')
  assert.strictEqual(metric.histogram.aggregationTemporality, 2)
  assert.strictEqual(point.count, '3')
  assert.strictEqual(point.sum, 55.5)
  assert.deepStrictEqual(point.bucketCounts, ['1', '1', '1'])
  assert.deepStrictEqual(point.explicitBounds, [1, 10])
})

it('should group series of one name into one metric', async () => {
  const body = await post([
    counter,
    { ...counter, labels: { component: 'default.mail' }, value: 1 }
  ])

  const metrics = body.resourceMetrics[0].scopeMetrics[0].metrics

  assert.strictEqual(metrics.length, 1)
  assert.strictEqual(metrics[0].sum.dataPoints.length, 2)
})

it('should carry the resource it was given', async () => {
  const body = await post([counter], {
    resource: { 'service.name': 'pots', 'service.namespace': 'shop' }
  })

  const attributes = body.resourceMetrics[0].resource.attributes

  assert.ok(
    [
      { key: 'service.name', value: { stringValue: 'pots' } },
      { key: 'service.namespace', value: { stringValue: 'shop' } }
    ].every((item) =>
      attributes.some((candidate: any) => isDeepStrictEqual(candidate, item))
    )
  )
})

it('should name an instance so that replicas do not collide', async () => {
  const body = await post([counter])

  const instance = body.resourceMetrics[0].resource.attributes.find(
    (attribute: any) => attribute.key === 'service.instance.id'
  )

  assert.ok(instance.value.stringValue.includes(String(process.pid)))
})

it('should keep one start time so a series does not appear to reset', async () => {
  const exporter = new OtlpMetrics({ endpoint })

  exporter.export([counter])
  await exporter.flush()

  exporter.export([{ ...counter, value: 4 }])
  await exporter.flush()

  const points = requests.map(
    (request) =>
      JSON.parse(request.body).resourceMetrics[0].scopeMetrics[0].metrics[0].sum
        .dataPoints[0]
  )

  assert.strictEqual(points[0].startTimeUnixNano, points[1].startTimeUnixNano)
  assert.ok(BigInt(points[1].timeUnixNano) >= BigInt(points[0].startTimeUnixNano))
})

it('should not fail on export errors', async () => {
  const exporter = new OtlpMetrics({ endpoint: 'http://localhost:1' })

  exporter.export([counter])

  assert.strictEqual(await exporter.flush(), undefined)
})

it('should drop series while the endpoint is unavailable', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new OtlpMetrics({ endpoint })

  exporter.export([counter])
  await exporter.flush()

  assert.strictEqual(requests.length, 1)

  exporter.export([counter])
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
})

it('should export nothing where there is nothing to export', async () => {
  const exporter = new OtlpMetrics({ endpoint })

  exporter.export([])
  await exporter.flush()

  assert.strictEqual(requests.length, 0)
})
