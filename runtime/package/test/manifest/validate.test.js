'use strict'

const clone = require('clone-deep')

const { validate } = require('../../src/manifest/validate')
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

  it('should forbid system domain', () => {
    manifest.domain = 'system'
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
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
    expect(() => validate(manifest)).toThrow(/must NOT have additional property/)
  })

  describe('schema', () => {
    it('should be required', () => {
      delete manifest.entity.schema
      expect(() => validate(manifest)).toThrow(/must have required property/)
    })

    it('should be JSON schema object', () => {
      manifest.entity.schema = { properties: { foo: 'bar' } }
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

  describe('initialized', () => {
    it('should provide default', () => {
      expect(() => validate(manifest)).not.toThrow()
      expect(manifest.entity.initialized).toBe(false)
    })
  })
})

describe('bindings', () => {
  it('should be array of unique strings', () => {
    manifest.bindings = 'oops'
    expect(() => validate(manifest)).toThrow(/must be array/)

    manifest.bindings = ['oops', 'oops']
    expect(() => validate(manifest)).toThrow(/duplicate items/)

    manifest.bindings = ['oops', {}]
    expect(() => validate(manifest)).toThrow(/must be string/)
  })

  it('should forbid explicit loop', () => {
    manifest.bindings = ['@toa.io/bindings.loop']
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })
})

describe('operations', () => {
  it('should be object', () => {
    manifest.operations.get = 'bar'
    expect(() => validate(manifest)).toThrow(/must be object/)
  })

  it('should not have additional properties', () => {
    manifest.operations.get.foo = 'bar'
    expect(() => validate(manifest)).toThrow(/additional property/)
  })

  it('should have type (transition or observation)', () => {
    delete manifest.operations.get.type
    expect(() => validate(manifest)).toThrow()

    manifest.operations.get.type = 'foo'
    expect(() => validate(manifest)).toThrow(/one of the allowed values/)
  })

  it('should forbid explicit loop', () => {
    manifest.operations.get.bindings = ['@toa.io/bindings.loop']
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })

  it('should forbid query: false for observations', () => {
    manifest.operations.get.query = false
    expect(() => validate(manifest)).toThrow(/must NOT be valid/)
  })

  describe('subject', () => {
    it('should have subject', () => {
      delete manifest.operations.get.subject
      expect(() => validate(manifest)).toThrow(/required property/)
    })

    it('should allow only entity or set for observations', () => {
      manifest.operations.get.subject = 'changeset'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })

    it('should allow only entity for transitions', () => {
      manifest.operations.add.subject = 'changeset'
      expect(() => validate(manifest)).toThrow(/allowed values/)

      manifest.operations.add.subject = 'set'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })

    it('should allow only changeset for assignments', () => {
      manifest.operations.set.subject = 'changeset'
      expect(() => validate(manifest)).not.toThrow()

      manifest.operations.set.subject = 'set'
      expect(() => validate(manifest)).toThrow(/allowed values/)
    })
  })

  describe('concurrency', () => {
    it('should be required for transitions', () => {
      delete manifest.operations.add.concurrency
      expect(() => validate(manifest)).toThrow(/required property/)
    })

    it('should throw for observations, assignments', () => {
      manifest.operations.get.concurrency = 'none'
      expect(() => validate(manifest)).toThrow()
      delete manifest.operations.get.concurrency

      manifest.operations.set.concurrency = 'none'
      expect(() => validate(manifest)).toThrow()
    })
  })

  describe('input, output', () => {
    it('should be schema', () => {
      manifest.operations.get.input = { properties: { foo: 'bar' } }
      expect(() => validate(manifest)).toThrow()

      delete manifest.operations.get.input
      manifest.operations.get.output = { properties: { foo: 'bar' } }
      expect(() => validate(manifest)).toThrow()
    })
  })
})

describe('receivers', () => {
  it('should throw if transition points to undefined transition', () => {
    manifest.receivers['foo.bar.happened'].transition = 'not-exists'

    expect(() => validate(manifest)).toThrow(/refers to undefined transition/)
  })

  it('should throw if transition points to non transition', () => {
    manifest.receivers['foo.bar.happened'].transition = 'get'

    expect(() => validate(manifest)).toThrow(/refers to non-transition/)
  })
})
