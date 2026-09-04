import { equal, throws } from 'node:assert/strict'
import { describe, it } from 'node:test'

import { emit, stated } from '../src/types/schema.js'

describe('scalars', () => {
  it('should emit primitives', () => {
    equal(emit({ type: 'string' }), 'string')
    equal(emit({ type: 'integer' }), 'number')
    equal(emit({ type: 'number' }), 'number')
    equal(emit({ type: 'boolean' }), 'boolean')
    equal(emit({ type: 'null' }), 'null')
  })

  it('should emit a secret', () => {
    equal(emit({ type: 'string', format: 'secret' }), 'Secret')
  })

  it('should ignore what only validates', () => {
    equal(emit({ type: 'string', minLength: 1, maxLength: 8, pattern: '^a' }), 'string')
  })

  it('should emit a union for a nullable', () => {
    equal(emit({ type: 'string', nullable: true }), 'string | null')
  })

  it('should emit a literal union for an enum', () => {
    equal(emit({ type: 'string', enum: ['a', 'b'] }), '"a" | "b"')
  })

  it('should emit a literal for a const', () => {
    equal(emit({ const: 3 }), '3')
  })

  it('should emit unknown where nothing is stated', () => {
    equal(emit({}), 'unknown')
    equal(emit(undefined), 'unknown')
    equal(emit(true), 'unknown')
  })

  it('should emit never for a schema nothing fits', () => {
    equal(emit(false), 'never')
  })
})

describe('objects', () => {
  it('should mark what is not required as optional', () => {
    const type = emit({
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'integer' } },
      required: ['a']
    })

    equal(type, '{\n  a: string\n  b?: number\n}')
  })

  it('should emit a record where no property is named', () => {
    equal(emit({ type: 'object' }), 'Record<string, unknown>')
  })

  it('should emit an index signature for additional properties', () => {
    equal(emit({ type: 'object', additionalProperties: { type: 'string' } }),
      'Record<string, string>')
  })

  it('should emit an index signature for pattern properties', () => {
    equal(emit({ type: 'object', patternProperties: { '.*': { type: 'integer' } } }),
      'Record<string, number>')
  })

  it('should quote a key that is not an identifier', () => {
    equal(emit({ type: 'object', properties: { 'a-b': { type: 'string' } } }),
      '{\n  "a-b"?: string\n}')
  })

  it('should carry a description as a comment', () => {
    equal(emit({ type: 'object', properties: { a: { type: 'string', description: 'what\n  it is' } } }),
      '{\n  /** what it is */\n  a?: string\n}')
  })

  it('should indent a nested object', () => {
    const type = emit({
      type: 'object',
      properties: { a: { type: 'object', properties: { b: { type: 'string' } } } }
    })

    equal(type, '{\n  a?: {\n    b?: string\n  }\n}')
  })
})

describe('arrays', () => {
  it('should emit a suffix for an identifier', () => {
    equal(emit({ type: 'array', items: { type: 'string' } }), 'string[]')
  })

  it('should wrap what a suffix would misread', () => {
    equal(emit({ type: 'array', items: { type: 'string', nullable: true } }),
      'Array<string | null>')
  })
})

describe('composition', () => {
  it('should emit a union for oneOf and anyOf', () => {
    equal(emit({ oneOf: [{ type: 'string' }, { type: 'integer' }] }), 'string | number')
    equal(emit({ anyOf: [{ type: 'string' }, { type: 'integer' }] }), 'string | number')
  })

  it('should collapse a repeated member', () => {
    equal(emit({ anyOf: [{ type: 'string' }, { type: 'string' }] }), 'string')
  })

  it('should emit an intersection for allOf', () => {
    const type = emit({
      allOf: [
        { type: 'object', properties: { a: { type: 'string' } } },
        { type: 'object', properties: { b: { type: 'string' } } }
      ]
    })

    equal(type, '{\n  a?: string\n} & {\n  b?: string\n}')
  })
})

describe('references', () => {
  it('should resolve a local pointer', () => {
    const schema = {
      type: 'object',
      properties: { a: { $ref: '#/definitions/thing' } },
      definitions: { thing: { type: 'string', enum: ['x'] } }
    }

    equal(emit(schema), '{\n  a?: "x"\n}')
  })

  it('should refuse what it cannot resolve', () => {
    throws(() => emit({ $ref: 'https://example.com/schema' }), /only local pointers/)
    throws(() => emit({ $ref: '#/definitions/absent' }, { definitions: {} }), /Cannot resolve/)
  })
})

describe('stated', () => {
  it('should tell a declaration from the default', () => {
    // every operation carries `output: {}` after normalization
    equal(stated({}), false)
    equal(stated(undefined), false)
    equal(stated(null), false)
    equal(stated({ type: 'object' }), true)
  })
})

describe('fidelity', () => {
  it('should keep every member of a discriminated union', () => {
    const type = emit({
      type: 'array',
      items: {
        anyOf: [
          { type: 'object', required: ['git'], properties: { git: { type: 'string' } } },
          { type: 'object', required: ['mcp'], properties: { mcp: { type: 'object' } } }
        ]
      }
    })

    equal(type, 'Array<{\n  git: string\n} | {\n  mcp: Record<string, unknown>\n}>')
  })
})

describe('composition beside a shape', () => {
  it('should intersect what a schema states with what it composes', () => {
    const type = emit({
      type: 'object',
      properties: { a: { type: 'string' } },
      allOf: [{ type: 'object', properties: { b: { type: 'string' } } }]
    })

    equal(type, '{\n  a?: string\n} & {\n  b?: string\n}')
  })

  it('should keep the shape where what it composes states nothing', () => {
    // `allOf: [anyOf: [required, required]]` is how a manifest says "one of these"
    const type = emit({
      type: 'object',
      properties: { model: { type: 'string' }, models: { type: 'string' } },
      allOf: [{ anyOf: [{ required: ['model'] }, { required: ['models'] }] }]
    })

    equal(type, '{\n  model?: string\n  models?: string\n}')
  })

  it('should parenthesise a union it intersects', () => {
    const type = emit({
      type: 'object',
      properties: { a: { type: 'string' } },
      anyOf: [{ type: 'object', properties: { b: { type: 'string' } } }, { type: 'string' }]
    })

    equal(type, '{\n  a?: string\n} & ({\n  b?: string\n} | string)')
  })
})
