import { Console, record } from './Console'
import { current } from './tracing'
import { consoleExporter, exporters, exporting, flush, recording } from './exporters'
import { Otlp } from './Otlp'
import { traces } from './traces'
import type { Exporter, Span } from './exporters'

afterEach(() => {
  traces()
})

describe('traces', () => {
  it('should default to no exporters', () => {
    traces()

    expect(exporters()).toHaveLength(0)
    expect(recording()).toBe(false)
  })

  it('should opt into the console exporter', () => {
    traces({ exporters: { console: {} } })

    expect(exporters()).toEqual([consoleExporter])
    expect(recording()).toBe(true)
  })

  it('should create configured exporters', () => {
    traces({ exporters: { console: null, otlp: { endpoint: 'http://localhost:4318' } } })

    expect(exporters()[0]).toBe(consoleExporter)
    expect(exporters()[1]).toBeInstanceOf(Otlp)
  })

  it('should disable the console exporter when not listed', () => {
    traces({ exporters: { otlp: { endpoint: 'http://localhost:4318' } } })

    expect(exporters()).toHaveLength(1)
    expect(exporters()[0]).toBeInstanceOf(Otlp)
  })

  it('should share exporters between module copies', () => {
    // a process may load several copies of the module (the package installed more than once)
    let copy!: { exporting: typeof exporting, exporters: typeof exporters }

    jest.isolateModules(() => {
      copy = require('./exporters')
    })

    const exporter: Exporter = { export: () => undefined }

    copy.exporting([exporter])

    expect(exporters()).toEqual([exporter])
  })

  it('should flush exporters', async () => {
    const flusher = jest.fn(async () => undefined)
    const exporter: Exporter = { export: () => undefined, flush: flusher }

    exporting([exporter, consoleExporter]) // consoleExporter has no flush

    await flush()

    expect(flusher).toHaveBeenCalled()
  })
})

describe('export', () => {
  const streams: any = {
    stdout: { write: jest.fn() },
    stderr: { write: jest.fn() }
  }

  beforeEach(() => {
    streams.stdout.write.mockClear()
  })

  it('should pass spans to exporters', async () => {
    const seen: Span[] = []
    const exporter: Exporter = { export: (span) => void seen.push(span) }

    exporting([exporter])

    const instance = new Console({ streams, context: { component: 'pots' } })

    await instance.span({ name: 'work', kind: 'server', attributes: { foo: 1 } }, () => null)

    expect(seen).toHaveLength(1)

    expect(seen[0]).toMatchObject({
      name: 'work',
      kind: 'server',
      attributes: { foo: 1 },
      scope: { component: 'pots' },
      traceId: expect.stringMatching(/^[\da-f]{32}$/),
      spanId: expect.stringMatching(/^[\da-f]{16}$/),
      time: expect.any(Number),
      duration: expect.any(Number)
    })

    expect(streams.stdout.write).not.toHaveBeenCalled()
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

    expect(seen.map((span) => [span.name, span.service])).toEqual([
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

    expect(seen[0].status).toBe('error')
  })

  it('should fan out to multiple exporters', async () => {
    const first = { export: jest.fn() }
    const second = { export: jest.fn() }

    exporting([first, second])

    const instance = new Console({ streams })

    await instance.span('work', () => null)

    expect(first.export).toHaveBeenCalledTimes(1)
    expect(second.export).toHaveBeenCalledTimes(1)
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

    expect(seen).toEqual([span])
  })

  it('should not export unsampled spans', async () => {
    const exporter = { export: jest.fn() }

    exporting([exporter])
    traces({ sample: 0, exporters: {} })
    exporting([exporter])

    const instance = new Console({ streams })

    await instance.span('work', () => null)

    expect(exporter.export).not.toHaveBeenCalled()
  })
})
