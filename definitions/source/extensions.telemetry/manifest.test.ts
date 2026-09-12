import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.ts'

describe('manifest', () => {
  it('should give a component that declares nothing a declaration', () => {
    assert.deepStrictEqual(manifest(undefined), {})
    assert.deepStrictEqual(manifest(null), {})
  })

  it('should accept a declaration', () => {
    const declaration = {
      metrics: {
        conversions: { type: 'counter' as const, labels: { currency: ['EUR'] } },
        orders: { type: 'histogram' as const, unit: 'EUR', buckets: [5, 20] },
        backlog: { type: 'gauge' as const, labels: null }
      }
    }

    assert.deepStrictEqual(manifest(declaration), declaration)
  })

  it('should refuse a name that is not an identifier', () => {
    assert.throws(() => manifest({ metrics: { 'not a name': { type: 'counter' } } }), {
      message: /Invalid telemetry declaration/
    })
  })

  it('should refuse an unknown type', () => {
    assert.throws(
      () => manifest({ metrics: { conversions: { type: 'summary' } } } as never),
      { message: /Invalid telemetry declaration/ }
    )
  })

  it('should refuse a histogram without buckets', () => {
    assert.throws(() => manifest({ metrics: { orders: { type: 'histogram' } } }), {
      message: "Histogram 'orders' declares no buckets"
    })
  })

  it('should refuse buckets that do not ascend', () => {
    assert.throws(
      () => manifest({ metrics: { orders: { type: 'histogram', buckets: [20, 5] } } }),
      { message: "Buckets of 'orders' must ascend" }
    )
  })

  it('should refuse buckets on what is not a histogram', () => {
    assert.throws(
      () => manifest({ metrics: { conversions: { type: 'counter', buckets: [1] } } }),
      { message: "Buckets are a histogram's, and 'conversions' is a counter" }
    )
  })

  it('should refuse an empty enumeration', () => {
    assert.throws(
      () =>
        manifest({ metrics: { conversions: { type: 'counter', labels: { a: [] } } } }),
      { message: /Invalid telemetry declaration/ }
    )
  })

  it('should refuse UNDECLARED as a value', () => {
    assert.throws(
      () =>
        manifest({
          metrics: { conversions: { type: 'counter', labels: { a: ['UNDECLARED'] } } }
        }),
      { message: /enumerates 'UNDECLARED'/ }
    )
  })
})
