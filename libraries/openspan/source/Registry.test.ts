import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { console } from './Console.ts'
import { Registry } from './Registry.ts'
import type { Series } from './Registry.ts'

let registry: Registry

beforeEach(() => {
  registry = new Registry()
})

function find(series: Series[], name: string, labels: object = {}): Series | undefined {
  return series.find((one) => one.name === name && isDeepStrictEqual(one.labels, labels))
}

function isDeepStrictEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

describe('counter', () => {
  it('should accumulate', () => {
    const conversions = registry.counter('conversions')

    conversions.add(1)
    conversions.add(2)

    assert.strictEqual(find(registry.collect(), 'conversions')?.value, 3)
  })

  it('should keep a series per label combination', () => {
    const conversions = registry.counter('conversions', { currency: null })

    conversions.add(1, { currency: 'EUR' })
    conversions.add(2, { currency: 'USD' })
    conversions.add(3, { currency: 'EUR' })

    const series = registry.collect()

    assert.strictEqual(find(series, 'conversions', { currency: 'EUR' })?.value, 4)
    assert.strictEqual(find(series, 'conversions', { currency: 'USD' })?.value, 2)
  })

  it('should report nothing before it is used', () => {
    registry.counter('conversions')

    assert.strictEqual(registry.collect().length, 0)
  })

  it('should stay cumulative across collections', () => {
    const conversions = registry.counter('conversions')

    conversions.add(1)
    registry.collect()
    conversions.add(1)

    assert.strictEqual(find(registry.collect(), 'conversions')?.value, 2)
  })
})

describe('gauge', () => {
  it('should hold the last value', () => {
    const backlog = registry.gauge('backlog')

    backlog.set(10)
    backlog.set(4)

    assert.strictEqual(find(registry.collect(), 'backlog')?.value, 4)
  })

  it('should move by a delta', () => {
    const inflight = registry.gauge('inflight')

    inflight.add(1)
    inflight.add(1)
    inflight.add(-1)

    assert.strictEqual(find(registry.collect(), 'inflight')?.value, 1)
  })

  it('should move both ways', () => {
    const inflight = registry.gauge('inflight')

    inflight.set(3)
    inflight.set(0)

    assert.strictEqual(find(registry.collect(), 'inflight')?.value, 0)
  })
})

describe('histogram', () => {
  it('should count, sum and bucket', () => {
    const duration = registry.histogram('duration', { buckets: [1, 10] })

    duration.record(0.5)
    duration.record(5)
    duration.record(50)

    const series = find(registry.collect(), 'duration')

    assert.strictEqual(series?.count, 3)
    assert.strictEqual(series.sum, 55.5)
    assert.deepStrictEqual(series.buckets, [1, 1, 1])
  })

  it('should put a value on an edge into that edge', () => {
    const duration = registry.histogram('duration', { buckets: [1, 10] })

    duration.record(1)

    assert.deepStrictEqual(find(registry.collect(), 'duration')?.buckets, [1, 0, 0])
  })

  it('should carry its unit', () => {
    registry.histogram('orders', { buckets: [5], unit: 'EUR' }).record(1)

    assert.strictEqual(find(registry.collect(), 'orders')?.unit, 'EUR')
  })
})

describe('labels', () => {
  it('should admit any value where the label enumerates none', () => {
    const conversions = registry.counter('conversions', { currency: null })

    conversions.add(1, { currency: 'CHF' })

    assert.ok(find(registry.collect(), 'conversions', { currency: 'CHF' }))
  })

  it('should record an unenumerated value as UNDECLARED', () => {
    const conversions = registry.counter('conversions', { currency: ['EUR'] })

    conversions.add(1, { currency: 'CHF' })

    assert.ok(find(registry.collect(), 'conversions', { currency: 'UNDECLARED' }))
  })

  it('should warn once per label and not once per value', () => {
    const warn = mock.method(console, 'warn')
    const conversions = registry.counter('conversions', { currency: ['EUR'] })

    conversions.add(1, { currency: 'CHF' })
    conversions.add(1, { currency: 'GBP' })
    conversions.add(1, { currency: 'JPY' })

    assert.strictEqual(warn.mock.callCount(), 1)

    warn.mock.restore()
  })

  it('should name the value that tripped it', () => {
    const warn = mock.method(console, 'warn')

    registry.counter('conversions', { currency: ['EUR'] }).add(1, { currency: 'CHF' })

    assert.strictEqual(warn.mock.calls[0].arguments[1]?.value, 'CHF')

    warn.mock.restore()
  })

  it('should record a missing value as UNDECLARED', () => {
    const conversions = registry.counter('conversions', { currency: ['EUR'] })

    conversions.add(1)

    assert.ok(find(registry.collect(), 'conversions', { currency: 'UNDECLARED' }))
  })
})

describe('collect', () => {
  it('should run observers before reading', () => {
    const memory = registry.gauge('memory')
    let reads = 0

    registry.observe(() => memory.set(++reads))

    assert.strictEqual(find(registry.collect(), 'memory')?.value, 1)
    assert.strictEqual(find(registry.collect(), 'memory')?.value, 2)
  })

  it('should return one entry per instrument and label combination', () => {
    registry.counter('a').add(1)
    registry.gauge('b').set(1)
    registry.histogram('c', { buckets: [1] }).record(1)

    assert.strictEqual(registry.collect().length, 3)
  })
})
