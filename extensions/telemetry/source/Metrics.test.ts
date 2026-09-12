import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import { registry, type Counter } from 'openspan'
import { Metrics } from './Metrics.ts'

const locator = new Locator('pots', 'default')

describe('Metrics', () => {
  it('should carry an instrument per declared name', () => {
    const aspect = new Metrics(locator, {
      metrics: { conversions: { type: 'counter' }, backlog: { type: 'gauge' } }
    })

    const metrics = aspect.invoke()

    assert.ok('add' in metrics.conversions)
    assert.ok('set' in metrics.backlog)
  })

  it('should name a series after the component', () => {
    const aspect = new Metrics(locator, { metrics: { named: { type: 'counter' } } })

    ;(aspect.invoke().named as Counter).add(1)

    assert.ok(
      registry()
        .collect()
        .some((series) => series.name === 'default.pots.named')
    )
  })

  it('should raise a misuse for a name that is not declared', () => {
    const aspect = new Metrics(locator, { metrics: { conversions: { type: 'counter' } } })

    assert.throws(() => aspect.invoke().converisons, {
      code: 600,
      message: /Metric 'converisons' is not declared/
    })
  })

  it('should not raise on what is asked of every object', async () => {
    const aspect = new Metrics(locator, {})
    const metrics = aspect.invoke()

    assert.doesNotThrow(() => JSON.stringify(metrics))
    assert.doesNotThrow(() => String(metrics))

    // `then` would otherwise make awaiting it raise
    assert.strictEqual(await metrics, metrics)
  })

  it('should carry nothing where nothing is declared', () => {
    const aspect = new Metrics(locator, {})

    assert.deepStrictEqual(Object.keys(aspect.invoke()), [])
  })
})
