'use strict'

const { describe, it, beforeEach } = require('node:test')
const assert = require('node:assert/strict')

const clone = require('clone-deep')

const { validate } = require('../../src/.component')
const fixtures = require('./validate.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.ok)
})

it('should be ok', () => {
  assert.doesNotThrow(() => validate(manifest))
})

it('should provide error', () => {
  manifest.foo = 'bar'

  assert.throws(() => validate(manifest))
})

it('should not have additional properties', () => {
  manifest.foo = 'bar'

  assert.throws(() => validate(manifest))
})

describe('namespace', () => {
  it('should match token pattern', () => {
    manifest.namespace = '1'
    assert.throws(() => validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo_'
    assert.throws(() => validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo_bar'
    assert.throws(() => validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo-'
    assert.throws(() => validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'foo-bar'
    assert.throws(() => validate(manifest), (error) => /must match pattern/.test(error.message))

    manifest.namespace = 'FooBar12'
    assert.doesNotThrow(() => validate(manifest))
  })

  it('should forbid \'system\' namespace', () => {
    manifest.namespace = 'system'
    assert.throws(() => validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  it('should set `default` namespace', async () => {
    delete manifest.namespace

    assert.doesNotThrow(() => validate(manifest))
    assert.deepStrictEqual(manifest.namespace, 'default')
  })
})

describe('name', () => {
  it('should be optional', () => {
    delete manifest.name
    assert.doesNotThrow(() => validate(manifest))
  })
})

describe('entity', () => {
  it('should be optional', () => {
    delete manifest.entity
    assert.doesNotThrow(() => validate(manifest))
  })

  it('should be object', () => {
    manifest.entity = 'foo'
    assert.throws(() => validate(manifest), (error) => /must be object/.test(error.message))
  })

  it('should not have additional properties', () => {
    manifest.entity.foo = 'bar'
    assert.throws(() => validate(manifest))
  })

  describe('schema', () => {
    it('should be required', () => {
      delete manifest.entity.schema
      assert.throws(() => validate(manifest))
    })

    it('should be JSON schema object', () => {
      manifest.entity.schema = { properties: { foo: 'bar' } }
      assert.throws(() => validate(manifest))
    })

    it('should be JSON schema object of type object', () => {
      manifest.entity.schema = { type: 'integer' }
      assert.throws(() => validate(manifest), (error) => /must be equal to constant/.test(error.message))

      manifest.entity.schema = {}
      validate(manifest)
      assert.strictEqual(manifest.entity.schema.type, 'object')
    })

    it('should have property names matching token pattern', () => {
      manifest.entity.schema.properties._foo = { type: 'string' }
      assert.throws(() => validate(manifest), (error) => /pattern/.test(error.message))
    })

    it('should allow default id', () => {
      manifest.entity.schema.properties.id = {
        type: 'string',
        pattern: '^[a-fA-F0-9]+$'
      }
      assert.doesNotThrow(() => validate(manifest))
    })
  })

  describe('associated', () => {
    it('should provide default', () => {
      assert.doesNotThrow(() => validate(manifest))
      assert.strictEqual(manifest.entity.associated, false)
    })
  })
})

describe('bindings', () => {
  it('should be array of unique strings', () => {
    manifest.bindings = 'oops'
    assert.throws(() => validate(manifest), (error) => /must be array/.test(error.message))

    manifest.bindings = ['oops', 'oops']
    assert.throws(() => validate(manifest), (error) => /duplicate items/.test(error.message))

    manifest.bindings = ['oops', {}]
    assert.throws(() => validate(manifest), (error) => /must be string/.test(error.message))
  })

  it('should forbid explicit loop', () => {
    manifest.bindings = ['@toa.io/bindings.loop']
    assert.throws(() => validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })
})

describe('operations', () => {
  it('should be object', () => {
    manifest.operations.get = 'bar'
    assert.throws(() => validate(manifest), (error) => /must be object/.test(error.message))
  })

  it('should not have additional properties', () => {
    manifest.operations.get.foo = 'bar'
    assert.throws(() => validate(manifest))
  })

  it('should have type (transition or observation)', () => {
    delete manifest.operations.get.type
    assert.throws(() => validate(manifest))

    manifest.operations.get.type = 'foo'
    assert.throws(() => validate(manifest), (error) => /one of the allowed values/.test(error.message))
  })

  it('should forbid explicit loop', () => {
    manifest.operations.get.bindings = ['@toa.io/bindings.loop']
    assert.throws(() => validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  it('should forbid query: false for observations', () => {
    manifest.operations.get.query = false
    assert.throws(() => validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })

  for (const [_, operation] of [
    ['computation', 'compute']
  ])
     it(`should set query: false for ${_}`, async () => {
    validate(manifest)

    assert.strictEqual(manifest.operations[operation].query, false)
  })

  describe('scope', () => {
    it('should have scope', () => {
      delete manifest.operations.get.scope
      assert.throws(() => validate(manifest), (error) => /required property/.test(error.message))
    })

    it('should allow only entity or set for observations', () => {
      manifest.operations.get.scope = 'changeset'
      assert.throws(() => validate(manifest), (error) => /allowed values/.test(error.message))
    })

    it('should allow only entity for transitions', () => {
      manifest.operations.add.scope = 'changeset'
      assert.throws(() => validate(manifest), (error) => /allowed values/.test(error.message))

      manifest.operations.add.scope = 'set'
      assert.throws(() => validate(manifest), (error) => /allowed values/.test(error.message))
    })

    it('should allow only changeset for assignments', () => {
      manifest.operations.set.scope = 'changeset'
      assert.doesNotThrow(() => validate(manifest))

      manifest.operations.set.scope = 'set'
      assert.throws(() => validate(manifest), (error) => /allowed values/.test(error.message))
    })
  })

  describe('concurrency', () => {
    it('should be required for transitions', () => {
      delete manifest.operations.add.concurrency
      assert.throws(() => validate(manifest), (error) => /required property/.test(error.message))
    })

    it('should throw for observations, assignments', () => {
      manifest.operations.get.concurrency = 'none'
      assert.throws(() => validate(manifest))
      delete manifest.operations.get.concurrency

      manifest.operations.set.concurrency = 'none'
      assert.throws(() => validate(manifest))
    })
  })

  describe('input, output', () => {
    it('should be schema', () => {
      manifest.operations.get.input = { properties: { foo: 'bar' } }
      assert.throws(() => validate(manifest))

      delete manifest.operations.get.input
      manifest.operations.get.output = { properties: { foo: 'bar' } }
      assert.throws(() => validate(manifest))
    })
  })
})

describe('receivers', () => {
  it('should throw if transition points to undefined operation', () => {
    manifest.receivers['foo.bar.happened'].operation = 'notExists'

    assert.throws(() => validate(manifest), (error) => /refers to undefined operation/.test(error.message))
  })

  it('should throw if transition points to observation', () => {
    manifest.receivers['foo.bar.happened'].operation = 'get'

    assert.throws(() => validate(manifest), (error) => /of the allowed types/.test(error.message))
  })

  it('should throw if source has a name `context`', async () => {
    manifest.receivers['foo.bar.happened'].source = 'context'

    assert.throws(() => validate(manifest), (error) => /must NOT be valid/.test(error.message))
  })
})
