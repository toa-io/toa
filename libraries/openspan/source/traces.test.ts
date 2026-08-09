import { Console, record } from './Console'
import { current } from './tracing'
import { consoleExporter, exporters, exporting } from './exporters'
import { Otlp } from './Otlp'
import { traces } from './traces'
import type { Exporter, Span } from './exporters'

afterEach(() => {
  traces()
})

describe('traces', () => {
  it('should default to the console exporter', () => {
    traces()

    expect(exporters()).toEqual([consoleExporter])
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
