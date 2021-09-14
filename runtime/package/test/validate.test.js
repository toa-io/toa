'use strict'

const clone = require('clone-deep')

const { validate } = require('../src/validate')
const fixtures = require('./validate.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.ok)
})

it('should be ok', () => {
  expect(validate(manifest)).toBe(null)
})

it('should provide error', () => {
  manifest.foo = 'bar'

  expect(validate(manifest)).toMatchObject({
    keyword: 'additionalProperties',
    property: 'foo',
    message: expect.stringMatching(/must NOT have additional properties/)
  })
})

it('should not have additional properties', () => {
  manifest.foo = 'bar'

  expect(validate(manifest)).toMatchObject({ keyword: 'additionalProperties' })
})

describe('domain', () => {
  it('should be required', () => {
    delete manifest.domain

    expect(validate(manifest)).toMatchObject({ keyword: 'required' })
  })

  it('should match token pattern', () => {
    manifest.domain = '1'
    expect(validate(manifest)).toMatchObject({ keyword: 'pattern' })

    manifest.domain = 'foo_'
    expect(validate(manifest)).toMatchObject({ keyword: 'pattern' })

    manifest.domain = 'foo-'
    expect(validate(manifest)).toMatchObject({ keyword: 'pattern' })

    manifest.domain = 'foo-BAR'
    expect(validate(manifest)).toBe(null)

    manifest.domain = 'foo_bar'
    expect(validate(manifest)).toBe(null)

    manifest.domain = 'FooBar12'
    expect(validate(manifest)).toBe(null)
  })
})

describe('name', () => {
  it('should be optional', () => {
    delete manifest.name
    expect(validate(manifest)).toBe(null)
  })
})

describe('entity', () => {
  it('should be optional', () => {
    delete manifest.entity
    expect(validate(manifest)).toBe(null)
  })

  it('should be object', () => {
    manifest.entity = 'foo'
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })
  })

  it('should not have additional properties', () => {
    manifest.entity.foo = 'bar'
    expect(validate(manifest)).toMatchObject({ keyword: 'additionalProperties' })
  })

  describe('schema', () => {
    it('should be required', () => {
      delete manifest.entity.schema
      expect(validate(manifest)).toMatchObject({ keyword: 'required' })
    })

    it('should be JSON schema object', () => {
      manifest.entity.schema = { properties: { foo: 1 } }
      expect(validate(manifest)).toMatchObject({ keyword: 'type' })
    })

    it('should be JSON schema object of type object', () => {
      manifest.entity.schema = { type: 'integer' }
      expect(validate(manifest)).toMatchObject({ keyword: 'const' })

      manifest.entity.schema = {}
      validate(manifest)
      expect(manifest.entity.schema.type).toBe('object')
    })

    it('should forbid additional properties', () => {
      manifest.entity.schema = { additionalProperties: true }
      expect(validate(manifest)).toMatchObject({ keyword: 'const' })

      manifest.entity.schema = {}
      validate(manifest)
      expect(manifest.entity.schema.additionalProperties).toBe(false)
    })

    it('should have property names matching token pattern', () => {
      manifest.entity.schema.properties._foo = { type: 'string' }
      expect(validate(manifest)).toMatchObject({ keyword: 'pattern' })
    })

    it('should allow default id', () => {
      manifest.entity.schema.properties.id = { type: 'string', pattern: '^[a-fA-F0-9]+$' }
      expect(validate(manifest)).toBe(null)
    })

    it('should forbid non-default id', () => {
      manifest.entity.schema.properties.id = { type: 'integer' }
      expect(validate(manifest)).toMatchObject({ keyword: 'const' })
    })

    it('should provide default property id', () => {
      validate(manifest)
      expect(manifest.entity.schema.properties.id).toStrictEqual({ type: 'string', pattern: '^[a-fA-F0-9]+$' })
    })
  })

  describe('storage', () => {
    it('should be object', () => {
      manifest.entity.storage = 'foo'
      expect(validate(manifest)).toMatchObject({ keyword: 'type' })
    })

    it('should provide default', () => {
      delete manifest.entity.storage
      expect(validate(manifest)).toBe(null)
      expect(manifest.entity.storage).toStrictEqual({ connector: '@kookaburra/storages.mongodb' })
    })

    describe('connector', () => {
      it('should provide default', () => {
        delete manifest.entity.storage.connector
        expect(validate(manifest)).toBe(null)
        expect(manifest.entity.storage.connector).toStrictEqual('@kookaburra/storages.mongodb')
      })
    })
  })
})

describe('bindings', () => {
  it('should have default value', () => {
    delete manifest.bindings
    expect(validate(manifest)).toBe(null)
    expect(manifest.bindings).toStrictEqual(['@kookaburra/bindings.http', '@kookaburra/bindings.amqp'])
  })

  it('should be array of unique strings', () => {
    manifest.bindings = 'oops'
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })

    manifest.bindings = ['oops', 'oops']
    expect(validate(manifest)).toMatchObject({ keyword: 'uniqueItems' })

    manifest.bindings = ['oops', 1]
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })
  })

  it('should forbid explicit loop', () => {
    manifest.bindings = ['@kookaburra/bindings.loop']
    expect(validate(manifest)).toMatchObject({ keyword: 'not' })
  })
})

describe('remotes', () => {
  it('should be optional', () => {
    delete manifest.remotes
    expect(validate(manifest)).toBe(null)
  })

  it('should be unique non-empty array of strings', () => {
    manifest.remotes = 1
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })

    manifest.remotes = ['a', {}]
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })

    manifest.remotes = ['a', 'a']
    expect(validate(manifest)).toMatchObject({ keyword: 'uniqueItems' })

    manifest.remotes = []
    expect(validate(manifest)).toMatchObject({ keyword: 'minItems' })
  })
})

describe('operations', () => {
  it('should be required', () => {
    delete manifest.operations
    expect(validate(manifest)).toMatchObject({ keyword: 'required' })
  })

  it('should be non-empty array of objects', () => {
    manifest.operations = 1
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })

    manifest.operations = []
    expect(validate(manifest)).toMatchObject({ keyword: 'minItems' })

    manifest.operations = ['a', {}]
    expect(validate(manifest)).toMatchObject({ keyword: 'type' })
  })

  describe('operation', () => {
    it('should be object', () => {
      manifest.operations[0] = 'bar'
      expect(validate(manifest)).toMatchObject({ keyword: 'type' })
    })

    it('should not have additional properties', () => {
      manifest.operations[0].foo = 'bar'
      expect(validate(manifest)).toMatchObject({ keyword: 'additionalProperties' })
    })

    it('should have name', () => {
      delete manifest.operations[0].name
      expect(validate(manifest)).toMatchObject({ keyword: 'required' })
    })

    it('should have type (transition or observation)', () => {
      delete manifest.operations[0].type
      expect(validate(manifest)).toMatchObject({ keyword: 'required' })

      manifest.operations[0].type = 'foo'
      expect(validate(manifest)).toMatchObject({ keyword: 'enum' })
    })

    it('should have type (entity or set)', () => {
      delete manifest.operations[0].target
      expect(validate(manifest)).toMatchObject({ keyword: 'required' })

      manifest.operations[0].target = 'foo'
      expect(validate(manifest)).toMatchObject({ keyword: 'enum' })
    })

    it('should have default bridge', () => {
      delete manifest.operations[0].bridge
      expect(validate(manifest)).toBe(null)
      expect(manifest.operations[0].bridge).toBe('@kookaburra/bridges.javascript.native')
    })

    it('should forbid explicit loop', () => {
      manifest.operations[0].bindings = ['@kookaburra/bindings.loop']
      expect(validate(manifest)).toMatchObject({ keyword: 'not' })
    })

    describe('input, output', () => {
      it('should be null by default', () => {
        delete manifest.operations[0].input
        delete manifest.operations[0].output

        expect(validate(manifest)).toBe(null)
        expect(manifest.operations[0].input).toStrictEqual({ type: 'null' })
        expect(manifest.operations[0].output).toStrictEqual({ type: 'null' })
      })

      it('should be schema', () => {
        manifest.operations[0].input = { properties: { foo: 1 } }
        expect(validate(manifest)).toMatchObject({ keyword: 'type' })

        delete manifest.operations[0].input
        manifest.operations[0].output = { properties: { foo: 1 } }
        expect(validate(manifest)).toMatchObject({ keyword: 'type' })
      })
    })
  })
})
