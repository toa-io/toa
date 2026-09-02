import { describe, it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Console, record } from './Console.js'
import { current } from './tracing.js'
import { consoleExporter, exporters, exporting, flush, recording } from './exporters.js'
import { Otlp } from './Otlp.js'
import { traces } from './traces.js'
import type { Exporter, Span } from './exporters.js'

afterEach(() => {
  traces()
})

describe('traces', () => {
  it('should default to no exporters', () => {
    traces()

    assert.strictEqual(exporters().length, 0)
    assert.strictEqual(recording(), false)
  })

  it('should opt into the console exporter', () => {
    traces({ exporters: { console: {} } })

    assert.deepStrictEqual(exporters(), [consoleExporter])
    assert.strictEqual(recording(), true)
  })

  it('should create configured exporters', () => {
    traces({ exporters: { console: null, otlp: { endpoint: 'http://localhost:4318' } } })

    assert.strictEqual(exporters()[0], consoleExporter)
    assert.ok(exporters()[1] instanceof Otlp)
  })

  it('should disable the console exporter when not listed', () => {
    traces({ exporters: { otlp: { endpoint: 'http://localhost:4318' } } })

    assert.strictEqual(exporters().length, 1)
    assert.ok(exporters()[0] instanceof Otlp)
  })

  it('should share exporters between module copies', async () => {
    // a process may load several copies of the module (the package installed more than once)
    let copy!: { exporting: typeof exporting, exporters: typeof exporters }

    copy = await import('./exporters.js')

    const exporter: Exporter = { export: () => undefined }

    copy.exporting([exporter])

    assert.deepStrictEqual(exporters(), [exporter])
  })

  it('should flush exporters', async () => {
    const flusher = mock.fn(async () => undefined)
    const exporter: Exporter = { export: () => undefined, flush: flusher }

    exporting([exporter, consoleExporter]) // consoleExporter has no flush

    await flush()

    assert.ok(flusher.mock.callCount() > 0)
  })
})

describe('export', () => {
  const streams: any = {
    stdout: { write: mock.fn() },
    stderr: { write: mock.fn() }
  }

  beforeEach(() => {
    streams.stdout.write.mock.resetCalls()
  })

  it('should pass spans to exporters', async () => {
    const seen: Span[] = []
    const exporter: Exporter = { export: (span) => void seen.push(span) }

    exporting([exporter])

    const instance = new Console({ streams, context: { component: 'pots' } })

    await instance.span({ name: 'work', kind: 'server', attributes: { foo: 1 } }, () => null)

    assert.strictEqual(seen.length, 1)

    assert.partialDeepStrictEqual(seen[0], { name: 'work', kind: 'server', attributes: { foo: 1 }, scope: { component: 'pots' } })
    assert.match(seen[0]['traceId'], /^[\da-f]{32}$/)
    assert.match(seen[0]['spanId'], /^[\da-f]{16}$/)
    assert.strictEqual(typeof seen[0]['time'], 'number')
    assert.strictEqual(typeof seen[0]['duration'], 'number')

    assert.strictEqual(streams.stdout.write.mock.callCount(), 0)
  })

  it('should attribute spans to a service', async () => {
    const seen: Span[] = []
    const exporter: Exporter = { export: (span) => void seen.push(span) }

    exporting([exporter])

    const instance = new Console({ streams })

    await instance.span({ name: 'request', service: 'exposition' }, async () => {
      await instance.span('inherited', () => null)
      await instance.span({ name: 'overridden', service: 'orders' }, () => null)
    })

    assert.deepStrictEqual(seen.map((span) => [span.name, span.service]), [
      ['inherited', 'exposition'],
      ['overridden', 'orders'],
      ['request', 'exposition']
    ])
  })

  it('should mark the span as failed through the context', async () => {
    const seen: Span[] = []
    const exporter: Exporter = { export: (span) => void seen.push(span) }

    exporting([exporter])

    const instance = new Console({ streams })

    await instance.span('work', () => {
      current()!.status = 'error'
    })

    assert.strictEqual(seen[0].status, 'error')
  })

  it('should fan out to multiple exporters', async () => {
    const first = { export: mock.fn() }
    const second = { export: mock.fn() }

    exporting([first, second])

    const instance = new Console({ streams })

    await instance.span('work', () => null)

    assert.strictEqual(first.export.mock.callCount(), 1)
    assert.strictEqual(second.export.mock.callCount(), 1)
  })

  it('should record externally completed spans', () => {
    const seen: Span[] = []
    const exporter: Exporter = { export: (span) => void seen.push(span) }

    exporting([exporter])

    const span: Span = {
      name: 'find pots',
      traceId: 'a'.repeat(32),
      spanId: 'b'.repeat(16),
      kind: 'client',
      time: Date.now(),
      duration: 1.5
    }

    record(span)

    assert.deepStrictEqual(seen, [span])
  })

  it('should not export unsampled spans', async () => {
    const exporter = { export: mock.fn() }

    exporting([exporter])
    traces({ sample: 0, exporters: {} })
    exporting([exporter])

    const instance = new Console({ streams })

    await instance.span('work', () => null)

    assert.strictEqual(exporter.export.mock.callCount(), 0)
  })
})
