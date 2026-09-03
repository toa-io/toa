import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import clone from 'clone-deep'

import { validate } from '../../src/.component/index.js'
import * as fixtures from './validate.fixtures.js'

let manifest

beforeEach(() => {
  manifest = clone(fixtures.ok)
})

it('should be ok', async () => {
  await assert.doesNotReject(validate(manifest))
})

it('should provide error', async () => {
  manifest.foo = 'bar'

  await assert.rejects(validate(manifest))
})

it('should not have additional properties', async () => {
  manifest.foo = 'bar'

  await assert.rejects(validate(manifest))
})

describe('namespace', () => {
  it('should match token pattern', async () => {
    manifest.namespace = '1'
    await assert.rejects(validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo_'
    await assert.rejects(validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo_bar'
    await assert.rejects(validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo-'
    await assert.rejects(validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo-bar'
    await assert.rejects(validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'FooBar12'
    await assert.doesNotReject(validate(manifest))
  })

  it('should forbid \'system\' namespace', async () => {
    manifest.namespace = 'system'
    await assert.rejects(validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  it('should set `default` namespace', async () => {
    delete manifest.namespace

    await assert.doesNotReject(validate(manifest))
    assert.deepStrictEqual(manifest.namespace, 'default')
  })
})

describe('name', () => {
  it('should be optional', async () => {
    delete manifest.name
    await assert.doesNotReject(validate(manifest))
  })
})

describe('entity', () => {
  it('should be optional', async () => {
    delete manifest.entity
    await assert.doesNotReject(validate(manifest))
  })

  it('should be object', async () => {
    manifest.entity = 'foo'
    await assert.rejects(validate(manifest), (error) => /must be object/.test(error.message))
  })

  it('should not have additional properties', async () => {
    manifest.entity.foo = 'bar'
    await assert.rejects(validate(manifest))
  })

  describe('schema', () => {
    it('should be required', async () => {
      delete manifest.entity.schema
      await assert.rejects(validate(manifest))
    })

    it('should be JSON schema object', async () => {
      manifest.entity.schema = { properties: { foo: 'bar' } }
      await assert.rejects(validate(manifest))
    })

    it('should be JSON schema object of type object', async () => {
      manifest.entity.schema = { type: 'integer' }
      await assert.rejects(validate(manifest), (error) => /must be equal to constant/.test(error.message))

      manifest.entity.schema = {}
      validate(manifest)
      assert.strictEqual(manifest.entity.schema.type, 'object')
    })

    it('should have property names matching token pattern', async () => {
      manifest.entity.schema.properties._foo = { type: 'string' }
      await assert.rejects(validate(manifest), (error) => /pattern/.test(error.message))
    })

    it('should allow default id', async () => {
      manifest.entity.schema.properties.id = {
        type: 'string',
        pattern: '^[a-fA-F0-9]+$'
      }
      await assert.doesNotReject(validate(manifest))
    })
  })

  describe('associated', () => {
    it('should provide default', async () => {
      await assert.doesNotReject(validate(manifest))
      assert.strictEqual(manifest.entity.associated, false)
    })
  })
})

describe('bindings', () => {
  it('should be array of unique strings', async () => {
    manifest.bindings = 'oops'
    await assert.rejects(validate(manifest), (error) => /must be array/.test(error.message))

    manifest.bindings = ['oops', 'oops']
    await assert.rejects(validate(manifest), (error) => /duplicate items/.test(error.message))

    manifest.bindings = ['oops', {}]
    await assert.rejects(validate(manifest), (error) => /must be string/.test(error.message))
  })

  it('should forbid explicit loop', async () => {
    manifest.bindings = ['@toa.io/bindings.loop']
    await assert.rejects(validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })
})

describe('operations', () => {
  it('should be object', async () => {
    manifest.operations.get = 'bar'
    await assert.rejects(validate(manifest), (error) => /must be object/.test(error.message))
  })

  it('should not have additional properties', async () => {
    manifest.operations.get.foo = 'bar'
    await assert.rejects(validate(manifest))
  })

  it('should have type (transition or observation)', async () => {
    delete manifest.operations.get.type
    await assert.rejects(validate(manifest))

    manifest.operations.get.type = 'foo'
    await assert.rejects(validate(manifest), (error) => /one of the allowed values/.test(error.message))
  })

  it('should forbid explicit loop', async () => {
    manifest.operations.get.bindings = ['@toa.io/bindings.loop']
    await assert.rejects(validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  it('should forbid query: false for observations', async () => {
    manifest.operations.get.query = false
    await assert.rejects(validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  for (const [_, operation] of [
    ['computation', 'compute']
  ])
     it(`should set query: false for ${_}`, async () => {
    validate(manifest)

    assert.strictEqual(manifest.operations[operation].query, false)
  })

  describe('scope', () => {
    it('should have scope', async () => {
      delete manifest.operations.get.scope
      await assert.rejects(validate(manifest), (error) => /required property/.test(error.message))
    })

    it('should allow only entity or set for observations', async () => {
      manifest.operations.get.scope = 'changeset'
      await assert.rejects(validate(manifest), (error) => /allowed values/.test(error.message))
    })

    it('should allow only entity for transitions', async () => {
      manifest.operations.add.scope = 'changeset'
      await assert.rejects(validate(manifest), (error) => /allowed values/.test(error.message))

      manifest.operations.add.scope = 'set'
      await assert.rejects(validate(manifest), (error) => /allowed values/.test(error.message))
    })

    it('should allow only changeset for assignments', async () => {
      manifest.operations.set.scope = 'changeset'
      await assert.doesNotReject(validate(manifest))

      manifest.operations.set.scope = 'set'
      await assert.rejects(validate(manifest), (error) => /allowed values/.test(error.message))
    })
  })

  describe('concurrency', () => {
    it('should be required for transitions', async () => {
      delete manifest.operations.add.concurrency
      await assert.rejects(validate(manifest), (error) => /required property/.test(error.message))
    })

    it('should throw for observations, assignments', async () => {
      manifest.operations.get.concurrency = 'none'
      await assert.rejects(validate(manifest))
      delete manifest.operations.get.concurrency

      manifest.operations.set.concurrency = 'none'
      await assert.rejects(validate(manifest))
    })
  })

  describe('input, output', () => {
    it('should be schema', async () => {
      manifest.operations.get.input = { properties: { foo: 'bar' } }
      await assert.rejects(validate(manifest))

      delete manifest.operations.get.input
      manifest.operations.get.output = { properties: { foo: 'bar' } }
      await assert.rejects(validate(manifest))
    })
  })
})

describe('receivers', () => {
  it('should throw if transition points to undefined operation', async () => {
    manifest.receivers['foo.bar.happened'].operation = 'notExists'

    await assert.rejects(validate(manifest), (error) => /refers to undefined operation/.test(error.message))
  })

  it('should throw if transition points to observation', async () => {
    manifest.receivers['foo.bar.happened'].operation = 'get'

    await assert.rejects(validate(manifest), (error) => /of the allowed types/.test(error.message))
  })

  it('should throw if source has a name `context`', async () => {
    manifest.receivers['foo.bar.happened'].source = 'context'

    await assert.rejects(validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })
})
