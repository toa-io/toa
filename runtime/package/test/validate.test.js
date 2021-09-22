'use strict'

const clone = require('clone-deep')

const { validate } = require('../src/validate')
const fixtures = require('./validate.fixtures')

let manifest

beforeEach(() => {
  manifest = clone(fixtures.ok)
})

it('should be ok', () => {
  expect(() => validate(manifest)).not.toThrow()
})

it('should provide error', () => {
  manifest.foo = 'bar'

  expect(() => validate(manifest)).toThrow(/must NOT have additional property/)
})

it('should not have additional properties', () => {
  manifest.foo = 'bar'

  expect(() => validate(manifest)).toThrow(/must NOT have additional property/)
})

describe('domain', () => {
  it('should match token pattern', () => {
    manifest.domain = '1'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.domain = 'foo_'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.domain = 'foo-'
    expect(() => validate(manifest)).toThrow(/must match pattern/)

    manifest.domain = 'foo-BAR'
    expect(() => validate(manifest)).not.toThrow()

    manifest.domain = 'foo_bar'
    expect(() => validate(manifest)).not.toThrow()

    manifest.domain = 'FooBar12'
    expect(() => validate(manifest)).not.toThrow()
  })
})

describe('name', () => {
  it('should be optional', () => {
    delete manifest.name
    expect(() => validate(manifest)).not.toThrow()
  })
})

describe('entity', () => {
  it('should be optional', () => {
    delete manifest.entity
    expect(() => validate(manifest)).not.toThrow()
  })

  it('should be object', () => {
    manifest.entity = 'foo'
    expect(() => validate(manifest)).toThrow(/must be object/)
  })

  it('should not have additional properties', () => {
    manifest.entity.foo = 'bar'
    expect(() => validate(manifest)).toThrow(/must NOT have additional properties/)
  })

  describe('schema', () => {
    it('should be required', () => {
      delete manifest.entity.schema
      expect(() => validate(manifest)).toThrow(/must have required property/)
    })

    it('should be JSON schema object', () => {
      manifest.entity.schema = { properties: { foo: 1 } }
      expect(() => validate(manifest)).toThrow()
    })

    it('should be JSON schema object of type object', () => {
      manifest.entity.schema = { type: 'integer' }
      expect(() => validate(manifest)).toThrow(/must be equal to constant 'object'/)

      manifest.entity.schema = {}
      validate(manifest)
      expect(manifest.entity.schema.type).toBe('object')
    })

    it('should forbid additional properties', () => {
      manifest.entity.schema = { additionalProperties: true }
      expect(() => validate(manifest)).toThrow(/must be equal to constant 'false'/)

      manifest.entity.schema = {}
      validate(manifest)
      expect(manifest.entity.schema.additionalProperties).toBe(false)
    })

    it('should have property names matching token pattern', () => {
      manifest.entity.schema.properties._foo = { type: 'string' }
      expect(() => validate(manifest)).toThrow(/pattern/)
    })

    it('should allow default id', () => {
      manifest.entity.schema.properties.id = { type: 'string', pattern: '^[a-fA-F0-9]+$' }
      expect(() => validate(manifest)).not.toThrow()
    })
  })

  describe('storage', () => {
    it('should provide default', () => {
      delete manifest.entity.storage
      expect(() => validate(manifest)).not.toThrow()
      expect(manifest.entity.storage).toStrictEqual('@kookaburra/storages.mongodb')
    })
  })
})

describe('bindings', () => {
  it('should have default value', () => {
    delete manifest.bindings
    expect(() => validate(manifest)).not.toThrow()
    expect(manifest.bindings).toStrictEqual(['@kookaburra/bindings.http', '@kookaburra/bindings.amqp'])
  })

  it('should be array of unique strings', () => {
    manifest.bindings = 'oops'
    expect(() => validate(manifest)).toThrow(/must be array/)

    manifest.bindings = ['oops', 'oops']
    expect(() => validate(manifest)).toThrow(/duplicate items/)

    manifest.bindings = ['oops', 1]
    expect(() => validate(manifest)).toThrow(/must be string/)
  })

  it('should forbid explicit loop', () => {
    manifest.bindings = ['@kookaburra/bindings.loop']
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })
})

describe('remotes', () => {
  it('should be optional', () => {
    delete manifest.remotes
    expect(() => validate(manifest)).not.toThrow()
  })

  it('should be unique non-empty array of strings', () => {
    manifest.remotes = 1
    expect(() => validate(manifest)).toThrow(/must be array/)

    manifest.remotes = ['a', {}]
    expect(() => validate(manifest)).toThrow(/must be string/)

    manifest.remotes = ['a', 'a']
    expect(() => validate(manifest)).toThrow(/duplicate items/)

    manifest.remotes = []
    expect(() => validate(manifest)).toThrow(/fewer than 1 items/)
  })
})

describe('operations', () => {
  it('should be non-empty array of objects', () => {
    manifest.operations = 1
    expect(() => validate(manifest)).toThrow(/must be array/)

    manifest.operations = []
    expect(() => validate(manifest)).toThrow(/fewer than 1 items/)

    manifest.operations = ['a', {}]
    expect(() => validate(manifest)).toThrow(/must be object/)
  })

  describe('operation', () => {
    it('should be object', () => {
      manifest.operations[0] = 'bar'
      expect(() => validate(manifest)).toThrow(/must be object/)
    })

    it('should not have additional properties', () => {
      manifest.operations[0].foo = 'bar'
      expect(() => validate(manifest)).toThrow(/additional properties/)
    })

    it('should have name', () => {
      delete manifest.operations[0].name
      expect(() => validate(manifest)).toThrow(/required property/)
    })

    it('should have type (transition or observation)', () => {
      delete manifest.operations[0].type
      expect(() => validate(manifest)).toThrow(/required property/)

      manifest.operations[0].type = 'foo'
      expect(() => validate(manifest)).toThrow(/one of the allowed values/)
    })

    it('should have type (entity or set)', () => {
      delete manifest.operations[0].target
      expect(() => validate(manifest)).toThrow(/required property/)

      manifest.operations[0].target = 'foo'
      expect(() => validate(manifest)).toThrow(/one of the allowed values/)
    })

    it('should forbid explicit loop', () => {
      manifest.operations[0].bindings = ['@kookaburra/bindings.loop']
      expect(() => validate(manifest)).toThrow(/must NOT be valid/)
    })

    describe('input, output', () => {
      it('should be schema', () => {
        manifest.operations[0].input = { properties: { foo: 1 } }
        expect(() => validate(manifest)).toThrow()

        delete manifest.operations[0].input
        manifest.operations[0].output = { properties: { foo: 1 } }
        expect(() => validate(manifest)).toThrow()
      })
    })
  })
})

describe('events', () => {
  it('should throw on duplicate events', () => {
    manifest.events.push({ label: 'created', path: '/somewhere', bridge: 'bridge' })
    expect(() => validate(manifest)).toThrow(/Duplicate event/)
  })
})
