import { describe, it, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { collect, metrics, registry } from './metrics.ts'
import { measuring, meters } from './meters.ts'
import { OtlpMetrics } from './OtlpMetrics.ts'
import type { Meter } from './meters.ts'
import type { Series } from './Registry.ts'

afterEach(() => {
  metrics()
})

describe('metrics', () => {
  it('should measure nothing until it is called', () => {
    metrics()

    assert.strictEqual(meters().length, 0)
    assert.strictEqual(measuring(), false)
  })

  it('should measure without an exporter', () => {
    metrics({})

    assert.strictEqual(meters().length, 0)
    assert.strictEqual(measuring(), true)
  })

  it('should create the configured exporter', () => {
    metrics({ exporters: { otlp: { endpoint: 'http://localhost:9090' } } })

    assert.strictEqual(meters().length, 1)
    assert.ok(meters()[0] instanceof OtlpMetrics)
  })

  it('should keep the registry across configurations', () => {
    const before = registry()

    metrics({})

    assert.strictEqual(registry(), before)
  })

  it('should keep instruments declared before it was configured', () => {
    const conversions = registry().counter('kept')

    conversions.add(1)
    metrics({})

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

  it('should collect nothing where nothing exports', () => {
    const collectMethod = mock.method(registry(), 'collect')

    metrics({})
    collect()

    assert.strictEqual(collectMethod.mock.callCount(), 0)

    collectMethod.mock.restore()
  })
})

function collected(): Series[] {
  const exported: Series[] = []

  meters().push({ export: (series) => exported.push(...series) })
  collect()

  return exported
}
