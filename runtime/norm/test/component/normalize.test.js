import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { normalize, extensions } from '../../src/.component/index.js'
import * as fixtures from './normalize.fixtures.js'

let manifest

beforeEach(() => {
  manifest = clone(fixtures.operations)
})

describe('operations', () => {
  it('should set default bindings', async () => {
    await normalize(manifest)

    assert.deepStrictEqual(manifest.operations.add.bindings, manifest.bindings)
  })

  it('should state an empty output where none is declared', async () => {
    await normalize(manifest)

    assert.deepStrictEqual(manifest.operations.add.output, {})
  })

  it('should state no input for an operation that takes none', async () => {
    manifest.operations.compute = { type: 'computation', input: null }

    await normalize(manifest)

    assert.equal('input' in manifest.operations.compute, false)
  })

  it('should scope a computation to none', async () => {
    manifest.operations.compute = { type: 'computation' }

    await normalize(manifest)

    assert.deepStrictEqual(manifest.operations.compute.scope, 'none')
    assert.deepStrictEqual(manifest.operations.compute.query, false)
  })

  it('should scope an effect to none unless it says otherwise', async () => {
    manifest.operations.affect = { type: 'effect' }
    manifest.operations.reach = { type: 'effect', scope: 'objects' }

    await normalize(manifest)

    assert.deepStrictEqual(manifest.operations.affect.scope, 'none')
    assert.deepStrictEqual(manifest.operations.reach.scope, 'objects')
  })
})

describe('namespace', () => {
  it('should default to `default`', async () => {
    delete manifest.namespace

    await normalize(manifest)

    assert.deepStrictEqual(manifest.namespace, 'default')
  })
})

describe('entity', () => {
  it('should default storage and flags', async () => {
    manifest.entity = { properties: {} }

    await normalize(manifest)

    assert.deepStrictEqual(manifest.entity.storage, '@toa.io/storages.mongodb')
    assert.deepStrictEqual(manifest.entity.associated, false)
    assert.deepStrictEqual(manifest.entity.custom, false)
  })

  it('should allow a date-time on the record', async () => {
    manifest.entity = { properties: { settled: { type: 'string', format: 'date-time' } } }

    await normalize(manifest)

    assert.deepStrictEqual(manifest.entity.properties.settled.format, 'date-time')
  })
})

describe('extensions', () => {
  it('should add predefined extensions', async () => {
    await extensions(manifest)

    // telemetry normalizes its declaration, so a component that declares nothing has an
    // empty one rather than none; fetch has no manifest of its own to normalize
    assert.deepStrictEqual(manifest.extensions['@toa.io/extensions.telemetry'], {})
    assert.strictEqual(manifest.extensions['@toa.io/extensions.fetch'], null)
  })

  it('should add predefined extensions without explicit declarations', async () => {
    delete manifest.extensions

    await extensions(manifest)

    assert.deepStrictEqual(manifest.extensions, {
      '@toa.io/extensions.telemetry': {},
      '@toa.io/extensions.fetch': null,
      '@toa.io/extensions.introspection': {}
    })
  })
})

describe('receivers', () => {
  it('should substitute default namespace', async () => {
    manifest.receivers = {
      'messages.created': { operation: 'add' }
    }

    await normalize(manifest)

    assert.deepStrictEqual(Object.keys(manifest.receivers), ['default.messages.created'])
  })

  it('should not substitute default namespace for foreign events', async () => {
    manifest.receivers = {
      'messages.created': { transition: 'add', source: 'test' }
    }

    await normalize(manifest)

    assert.deepStrictEqual(Object.keys(manifest.receivers), ['messages.created'])
  })
})
