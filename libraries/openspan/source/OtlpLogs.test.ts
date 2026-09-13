import { it, before, after, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { isDeepStrictEqual } from 'node:util'

import * as http from 'node:http'
import { console } from './Console.ts'
import { OtlpLogs } from './OtlpLogs.ts'
import type { AddressInfo } from 'node:net'
import type { Entry } from './Console.ts'

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

const entry: Entry = {
  time: '2023-11-14T22:13:20.000Z',
  severity: 'WARN',
  message: 'Pot boiled over',
  attributes: { method: 'GET', attempt: 2, ratio: 0.5, ok: true },
  context: { namespace: 'default', component: 'pots', operation: 'boil' },
  trace_id: 'a'.repeat(32),
  span_id: 'b'.repeat(16)
}

function records(request: Request): any[] {
  return JSON.parse(request.body).resourceLogs[0].scopeLogs[0].logRecords
}

it('should post entries to the endpoint', async () => {
  const exporter = new OtlpLogs({ endpoint: endpoint + '/' })

  exporter.export(entry)
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
  assert.partialDeepStrictEqual(requests[0], { method: 'POST', url: '/v1/logs' })
  assert.strictEqual(requests[0].headers['content-type'], 'application/json')
})

it('should encode entries as OTLP JSON', async () => {
  const exporter = new OtlpLogs({ endpoint, resource: { 'service.name': 'my-service' } })

  exporter.export(entry)
  await exporter.flush()

  const body = JSON.parse(requests[0].body)
  const resource = body.resourceLogs[0]
  const [encoded] = resource.scopeLogs[0].logRecords

  assert.ok(
    resource.resource.attributes.some((attribute: any) =>
      isDeepStrictEqual(attribute, {
        key: 'service.name',
        value: { stringValue: 'my-service' }
      })
    )
  )

  assert.partialDeepStrictEqual(encoded, {
    timeUnixNano: '1700000000000000000',
    severityNumber: 13,
    severityText: 'WARN',
    body: { stringValue: 'Pot boiled over' },
    traceId: entry.trace_id,
    spanId: entry.span_id
  })

  assert.ok(
    [
      { key: 'method', value: { stringValue: 'GET' } },
      { key: 'attempt', value: { intValue: '2' } },
      { key: 'ratio', value: { doubleValue: 0.5 } },
      { key: 'ok', value: { boolValue: true } },
      { key: 'namespace', value: { stringValue: 'default' } },
      { key: 'component', value: { stringValue: 'pots' } },
      { key: 'operation', value: { stringValue: 'boil' } },
      { key: 'trace_id', value: { stringValue: entry.trace_id } },
      { key: 'span_id', value: { stringValue: entry.span_id } }
    ].every((item: any) =>
      encoded.attributes.some((candidate: any) => isDeepStrictEqual(candidate, item))
    )
  )
})

it('should number every severity', async () => {
  const exporter = new OtlpLogs({ endpoint })
  const severities = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR'] as const

  for (const severity of severities) exporter.export({ ...entry, severity })

  await exporter.flush()

  assert.deepStrictEqual(
    records(requests[0]).map((record: any) => record.severityNumber),
    [1, 5, 9, 13, 17]
  )
})

it('should carry the fields of a span entry', async () => {
  const exporter = new OtlpLogs({ endpoint })

  exporter.export({
    ...entry,
    severity: 'TRACE',
    parent_id: 'c'.repeat(16),
    duration: 12.345,
    kind: 'server',
    status: 'error'
  })

  await exporter.flush()

  const [encoded] = records(requests[0])

  assert.ok(
    [
      { key: 'parent_id', value: { stringValue: 'c'.repeat(16) } },
      { key: 'duration', value: { doubleValue: 12.345 } },
      { key: 'kind', value: { stringValue: 'server' } },
      { key: 'status', value: { stringValue: 'error' } }
    ].every((item: any) =>
      encoded.attributes.some((candidate: any) => isDeepStrictEqual(candidate, item))
    )
  )
})

it('should batch entries', async () => {
  const exporter = new OtlpLogs({ endpoint })

  exporter.export(entry)
  exporter.export({ ...entry, message: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
  assert.strictEqual(records(requests[0]).length, 2)
})

it('should send custom headers', async () => {
  const exporter = new OtlpLogs({ endpoint, headers: { authorization: 'Bearer token' } })

  exporter.export(entry)
  await exporter.flush()

  assert.partialDeepStrictEqual(requests[0].headers, { authorization: 'Bearer token' })
})

it('should not fail on export errors', async () => {
  const exporter = new OtlpLogs({ endpoint: refused })

  exporter.export(entry)

  await assert.strictEqual(await exporter.flush(), undefined)
})

it('should not fail on serialization errors and keep exporting', async () => {
  const warn = mock.method(console, 'warn', () => undefined)
  const exporter = new OtlpLogs({ endpoint })
  const circular: Record<string, unknown> = {}

  circular.self = circular

  exporter.export({ ...entry, attributes: { circular } })

  await assert.strictEqual(await exporter.flush(), undefined)
  assert.strictEqual(requests.length, 0)

  exporter.export(entry)

  await assert.strictEqual(await exporter.flush(), undefined)
  assert.strictEqual(requests.length, 1)

  warn.mock.restore()
})

it('should bound a request by the timeout', async () => {
  respond = () => undefined // never responds

  const exporter = new OtlpLogs({ endpoint, timeout: 50 })

  exporter.export(entry)

  // hangs indefinitely unless the request is destroyed
  await assert.strictEqual(await exporter.flush(), undefined)
})

it('should drop entries while the endpoint is unavailable', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new OtlpLogs({ endpoint })

  exporter.export(entry)
  await exporter.flush()

  assert.strictEqual(requests.length, 1)

  exporter.export({ ...entry, message: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 1)
})

it('should warn once while the endpoint is unavailable', async () => {
  const warn = mock.method(console, 'warn', () => undefined)

  respond = (response) => response.writeHead(503).end()

  // no cooldown: every batch reaches the endpoint
  const exporter = new OtlpLogs({ endpoint, cooldown: 0 })

  exporter.export(entry)
  await exporter.flush()

  exporter.export({ ...entry, message: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 2)
  assert.strictEqual(warn.mock.callCount(), 1)

  warn.mock.restore()
})

it('should resume exporting when the endpoint recovers', async () => {
  respond = (response) => response.writeHead(503).end()

  const exporter = new OtlpLogs({ endpoint, cooldown: 0 })

  exporter.export(entry)
  await exporter.flush()

  respond = (response) => response.writeHead(200).end()

  exporter.export({ ...entry, message: 'second' })
  await exporter.flush()

  assert.strictEqual(requests.length, 2)
  assert.strictEqual(records(requests[1])[0].body.stringValue, 'second')
})
