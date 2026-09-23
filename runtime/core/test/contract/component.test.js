import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { component, restore } from '../../source/contract/component.js'
import { ID, SYSTEM, pack, unpack } from '../../source/contract/system.js'

const AMQP = ['@toa.io/bindings.amqp']

/** A normalised manifest, as `@toa.io/norm` leaves one. */
const manifest = () => ({
  version: '3f9a1c02',
  bindings: AMQP,
  entity: {
    storage: '@toa.io/storages.mongodb',
    blank: { foo: 0 },
    properties: { foo: { type: 'integer' }, id: clone(ID), ...clone(SYSTEM) },
    required: ['id', ...Object.keys(SYSTEM)]
  },
  operations: {
    transit: {
      type: 'transition',
      scope: 'object',
      concurrency: 'retry',
      bindings: AMQP,
      input: { type: 'object' },
      output: {}
    },
    compute: {
      type: 'computation',
      scope: 'none',
      query: false,
      bindings: AMQP,
      output: {}
    }
  },
  events: { incremented: { binding: '@toa.io/bindings.amqp', path: '/tmp/whatever' } }
})

describe('what a contract states', () => {
  it('should state the bindings once', () => {
    const contract = component(manifest())

    assert.deepStrictEqual(contract.bindings, AMQP)
    assert.strictEqual(contract.operations.transit.bindings, undefined)
  })

  it('should state an operation bindings of its own', () => {
    const declared = manifest()

    declared.operations.transit.bindings = ['@toa.io/bindings.http']

    const contract = component(declared)

    assert.deepStrictEqual(contract.operations.transit.bindings, [
      '@toa.io/bindings.http'
    ])
  })

  it('should not state an output that describes nothing', () => {
    const contract = component(manifest())

    assert.strictEqual('output' in contract.operations.transit, false)
  })

  it('should state an output that describes something', () => {
    const declared = manifest()

    declared.operations.transit.output = { type: 'number' }

    assert.deepStrictEqual(component(declared).operations.transit.output, {
      type: 'number'
    })
  })

  it('should not state a query that follows from the scope', () => {
    const contract = component(manifest())

    assert.strictEqual('query' in contract.operations.compute, false)
  })

  it('should state a query the scope does not follow to', () => {
    const declared = manifest()

    declared.operations.transit.query = false

    assert.strictEqual(component(declared).operations.transit.query, false)
  })

  it('should state how it is served nowhere', () => {
    const contract = component(manifest())

    assert.strictEqual(contract.operations.transit.concurrency, undefined)
    assert.strictEqual(contract.entity.storage, undefined)
    assert.strictEqual(contract.entity.blank, undefined)
    assert.deepStrictEqual(contract.events.incremented, {
      binding: '@toa.io/bindings.amqp'
    })
  })
})

describe('what the runtime gives every entity', () => {
  it('should be left out, and said to be', () => {
    const { entity } = component(manifest())

    assert.deepStrictEqual(entity, {
      properties: { foo: { type: 'integer' } },
      system: true
    })
  })

  it('should keep what the component requires of its own', () => {
    const declared = manifest()

    declared.entity.required = ['foo', ...declared.entity.required]

    assert.deepStrictEqual(component(declared).entity.required, ['foo'])
  })

  it('should keep an `id` the component names', () => {
    const declared = manifest()

    declared.entity.properties.id = { type: 'number' }

    const { entity } = component(declared)

    assert.deepStrictEqual(entity.properties.id, { type: 'number' })
    assert.strictEqual(entity.system, true)
  })

  it('should keep an entity that declares its own', () => {
    const declared = manifest()

    delete declared.entity.properties.REGION

    const { entity } = component(declared)

    assert.strictEqual(entity.system, undefined)
    assert.deepStrictEqual(entity.properties.VERSION, SYSTEM.VERSION)
    assert.deepStrictEqual(entity.required, ['id', ...Object.keys(SYSTEM)])
  })

  it('should keep an entity whose system property is not the prototype one', () => {
    const declared = manifest()

    declared.entity.properties.CREATED = { type: 'integer' }

    assert.strictEqual(component(declared).entity.system, undefined)
  })

  it('should keep an entity that does not require them', () => {
    const declared = manifest()

    declared.entity.required = ['foo']

    assert.strictEqual(component(declared).entity.system, undefined)
  })
})

describe('what puts it back', () => {
  it('should answer what the component declared', () => {
    const declared = manifest()
    const contract = component(declared)
    const restored = restore(contract)

    assert.deepStrictEqual(restored.entity.properties, declared.entity.properties)
    assert.deepStrictEqual(restored.entity.required, declared.entity.required)
    assert.strictEqual(restored.entity.system, undefined)
    assert.deepStrictEqual(restored.operations.transit.bindings, AMQP)
    assert.strictEqual(restored.operations.compute.query, false)
  })

  it('should leave a manifest as it is', () => {
    const declared = manifest()
    const restored = restore(declared)

    assert.deepStrictEqual(restored.entity.properties, declared.entity.properties)
    assert.deepStrictEqual(restored.operations.transit.bindings, AMQP)
  })

  it('should not touch what it was given', () => {
    const contract = component(manifest())
    const copy = clone(contract)

    restore(contract)

    assert.deepStrictEqual(contract, copy)
  })

  it('should put nothing back where nothing was left out', () => {
    const entity = { properties: { foo: { type: 'integer' } } }

    assert.strictEqual(unpack(entity), entity)
  })

  it('should leave an entity it cannot name alone', () => {
    const entity = { properties: { foo: { type: 'integer' } }, required: ['foo'] }

    assert.strictEqual(pack(entity), entity)
  })
})
