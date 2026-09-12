import { describe, it, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { console } from './Console.ts'
import { collect, metrics, registry } from './metrics.ts'
import { consoleMeter, measuring, meters } from './meters.ts'
import { OtlpMetrics } from './OtlpMetrics.ts'
import type { Meter } from './meters.ts'
import type { Series } from './Registry.ts'

afterEach(() => {
  metrics()
})

describe('metrics', () => {
  it('should default to no exporters', () => {
    metrics()

    assert.strictEqual(meters().length, 0)
    assert.strictEqual(measuring(), false)
  })

  it('should opt into the console exporter', () => {
    metrics({ exporters: { console: {} } })

    assert.deepStrictEqual(meters(), [consoleMeter])
    assert.strictEqual(measuring(), true)
  })

  it('should create configured exporters', () => {
    metrics({ exporters: { console: null, otlp: { endpoint: 'http://localhost:9090' } } })

    assert.strictEqual(meters()[0], consoleMeter)
    assert.ok(meters()[1] instanceof OtlpMetrics)
  })

  it('should disable the console exporter when not listed', () => {
    metrics({ exporters: { otlp: { endpoint: 'http://localhost:9090' } } })

    assert.strictEqual(meters().length, 1)
    assert.ok(meters()[0] instanceof OtlpMetrics)
  })

  it('should keep the registry across configurations', () => {
    const before = registry()

    metrics({ exporters: { console: {} } })

    assert.strictEqual(registry(), before)
  })

  it('should keep instruments declared before it was configured', () => {
    const conversions = registry().counter('kept')

    conversions.add(1)
    metrics({ exporters: { console: {} } })

    assert.ok(collected().some((series) => series.name === 'kept'))
  })
})

describe('collect', () => {
  it('should hand the series to every exporter', () => {
    const exported: Series[][] = []
    const meter: Meter = { export: (series) => exported.push(series) }

    metrics({ exporters: {} })
    meters().push(meter)
    registry().counter('collected').add(1)

    collect()

    assert.strictEqual(exported.length, 1)
    assert.ok(exported[0].some((series) => series.name === 'collected'))
  })

  it('should do nothing when nothing is measuring', () => {
    const collectMethod = mock.method(registry(), 'collect')

    metrics()
    collect()

    assert.strictEqual(collectMethod.mock.callCount(), 0)

    collectMethod.mock.restore()
  })
})

describe('console meter', () => {
  it('should write a series as a trace entry', () => {
    const write = mock.method(console, 'entry')

    consoleMeter.export(
      [{ name: 'written', type: 'counter', labels: { a: 'b' }, value: 1 }],
      console
    )

    assert.strictEqual(write.mock.callCount(), 1)
    assert.deepStrictEqual(write.mock.calls[0].arguments[0], 'trace')
    assert.strictEqual(write.mock.calls[0].arguments[1], 'written')

    write.mock.restore()
  })
})

function collected(): Series[] {
  const exported: Series[] = []

  meters().push({ export: (series) => exported.push(...series) })
  collect()

  return exported
}
