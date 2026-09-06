import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import * as fixtures from './collapse.fixtures.js'
import { collapse } from '../../src/.component/index.js'

let samples

beforeEach(() => {
  samples = clone(fixtures.samples)
})

it('should ignore locator', () => {
  const source = {}
  const prototype = { namespace: 'foo1', name: 'bar1' }
  const manifest = clone(source)

  collapse(manifest, prototype)

  assert.deepStrictEqual(manifest, source)
})

it('should remove prototype property', () => {
  const manifest = { prototype: 'a' }

  collapse(manifest, {})

  assert.deepStrictEqual(manifest, {})
})

describe('entity', () => {
  it('should merge entity schema', () => {
    const manifest = clone(samples.entity.manifest)

    collapse(manifest, samples.entity.prototype)
    assert.deepStrictEqual(manifest, samples.entity.result)
  })

  it('should not inherit migrations', () => {
    const manifest = { entity: { migrations: [{ id: '0002', steps: [] }] } }
    const prototype = { entity: { migrations: [{ id: '0001', steps: [] }] } }

    collapse(manifest, prototype)

    assert.deepStrictEqual(manifest.entity.migrations.map(({ id }) => id), ['0002'])
  })

  it('should leave a component with no migrations without any', () => {
    const manifest = {}
    const prototype = { entity: { migrations: [{ id: '0001', steps: [] }] } }

    collapse(manifest, prototype)

    assert.strictEqual(manifest.entity?.migrations, undefined)
  })
})

it('should ignore bindings', () => {
  const source = { bindings: ['foo'] }
  const prototype = { bindings: ['bar'] }
  const manifest = clone(source)

  collapse(manifest, prototype)
  assert.deepStrictEqual(manifest, source)

  delete manifest.bindings

  collapse(manifest, prototype)
  assert.deepStrictEqual(manifest, {})
})

it('should merge operations', () => {
  const manifest = clone(samples.operations.manifest)
  const prototype = clone(samples.operations.prototype)

  collapse(manifest, prototype, '/somewhere')

  // the prototype's path is generated, so it is checked apart from the shape
  assert.strictEqual(typeof manifest.prototype.path, 'string')

  const { path, ...rest } = manifest.prototype

  assert.deepStrictEqual({ ...manifest, prototype: rest }, samples.operations.result)
})
