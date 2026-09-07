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

  it('should let a component state its own id', () => {
    const prototype = { entity: { properties: { id: { type: 'string' }, VERSION: {} } } }
    const manifest = { name: 'pot', entity: { properties: { id: { type: 'number' } } } }

    collapse(manifest, prototype)

    assert.strictEqual(manifest.entity.custom, true)
    assert.deepStrictEqual(manifest.entity.properties.id, { type: 'number' })
  })

  it('should refuse a component that states a property the runtime writes', () => {
    const prototype = { entity: { properties: { DELETED: { type: 'integer' } } } }
    const manifest = {
      name: 'pot',
      entity: { properties: { DELETED: { type: 'integer' } } }
    }

    assert.throws(
      () => collapse(manifest, prototype),
      /System property 'DELETED' cannot be overridden/
    )
  })

  it('should inherit migrations ahead of its own, under the prototype name', () => {
    const manifest = { entity: { migrations: [{ id: '0002', steps: [] }] } }
    const prototype = {
      name: 'base',
      entity: { migrations: [{ id: '0001', steps: [] }] }
    }

    collapse(manifest, prototype)

    assert.deepStrictEqual(manifest.entity.migrations, [
      { id: 'base:0001', steps: [], prototype: 'base' },
      { id: '0002', steps: [] }
    ])
  })

  it('should pass on what the prototype inherited as it is', () => {
    const manifest = { entity: { migrations: [{ id: '0002', steps: [] }] } }
    const prototype = {
      name: 'base',
      entity: {
        migrations: [
          { id: 'system:0001', steps: [], prototype: 'system' },
          { id: '0001', steps: [] }
        ]
      }
    }

    collapse(manifest, prototype)

    assert.deepStrictEqual(
      manifest.entity.migrations.map(({ id }) => id),
      ['system:0001', 'base:0001', '0002']
    )
  })

  it('should inherit migrations into a component that declares none', () => {
    const manifest = {}
    const prototype = {
      name: 'base',
      entity: { migrations: [{ id: '0001', steps: [] }] }
    }

    collapse(manifest, prototype)

    assert.deepStrictEqual(
      manifest.entity.migrations.map(({ id }) => id),
      ['base:0001']
    )
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
