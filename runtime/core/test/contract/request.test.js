'use strict'

const { describe, it, beforeEach, mock } = require('node:test')
const assert = require('node:assert/strict')
const { isDeepStrictEqual } = require('node:util')

const clone = require('clone-deep')
const { generate } = require('randomstring')

const { Request } = require('../../src/contract/request')
const { Contract } = require('../../src/contract/contract')
const fixtures = require('./contract.fixtures')

// the base is real; what it was constructed with and told to fit is observable
const fit = mock.method(Contract.prototype, 'fit', () => undefined)

let contract

beforeEach(() => {
  resetCalls()
  fit.mock.resetCalls()

  contract = new Request(fixtures.schema, {})
})

const dummy = { schema: { properties: {} } }

it('should extend Conditions', () => {
  assert.ok(contract instanceof Contract)
  assert.strictEqual(contract.schema, fixtures.schema)
})

it('should fit request', () => {
  const request = { [generate()]: generate() }

  contract.fit(request)

  assert.ok(fit.mock.calls.some((call) =>
    call.this === contract && isDeepStrictEqual(call.arguments[0], request)))
})

describe('schema', () => {
  let schema

  beforeEach(() => {
    schema = clone(fixtures.schemas.request)
  })

  it('should provide schema', () => {
    assert.notStrictEqual(Request.schema({}, dummy), undefined)
  })

  it('should add required input if defined', () => {
    const input = { type: 'number' }

    assert.deepStrictEqual(Request.schema({ input }, dummy).properties.input, input)
  })

  it('should set input as null if undefined', async () => {
    assert.deepStrictEqual(Request.schema({}, dummy).properties.input, { type: 'null' })
  })

  it('should contain query if declaration.query is not defined', () => {
    assert.notStrictEqual(Request.schema({}, dummy).properties.query, undefined)
  })

  it('should not contain query if declaration.query is false', () => {
    schema.properties.query = { type: 'null' }
    assert.partialDeepStrictEqual(Request.schema({ query: false }, dummy), schema)
  })

  it('should require query if declaration.query is true', () => {
    schema.required = ['query']
    assert.ok(['query'].every((item) => Request.schema({ query: true }, dummy).required.some((candidate) => isDeepStrictEqual(candidate, item))))
  })

  it('should forbid projection for non observations', () => {
    assert.strictEqual(Request.schema({ type: 'transition' }, dummy).properties.query.properties.projection, undefined)

    assert.strictEqual(Request.schema({ type: 'assignment' }, dummy).properties.query.properties.projection, undefined)

    assert.notStrictEqual(Request.schema({ type: 'observation' }, dummy).properties.query.properties.projection, undefined)
  })

  it('should forbid version for observations', () => {
    assert.notStrictEqual(Request.schema({ type: 'transition' }, dummy).properties.query.properties.version, undefined)

    assert.strictEqual(Request.schema({ type: 'observation' }, dummy).properties.query.properties.version, undefined)
  })

  it('should allow omit, limit only for set observations', () => {
    const schema = Request.schema({ type: 'transition' }, dummy)
    const transition = schema.properties.query.properties

    assert.strictEqual(transition.omit, undefined)
    assert.strictEqual(transition.limit, undefined)

    const object = Request.schema({
      type: 'observation',
      scope: 'object'
    }, dummy).properties.query.properties

    assert.strictEqual(object.omit, undefined)
    assert.strictEqual(object.limit, undefined)

    const objects = Request.schema({
      type: 'observation',
      scope: 'objects'
    }, dummy).properties.query.properties

    assert.notStrictEqual(objects.omit, undefined)
    assert.notStrictEqual(objects.limit, undefined)
  })
})

describe('source', () => {
  const schemas = require('@toa.io/schemas')

  const compile = (definition, entity) =>
    schemas.schema(Request.schema(definition, entity), { removeAdditional: true })

  it('should declare source', () => {
    const schema = Request.schema({}, dummy)

    assert.notStrictEqual(schema.properties.source, undefined)
    assert.deepStrictEqual(schema.properties.source.additionalProperties, false)
  })

  it('should pass known source variants', () => {
    const schema = compile({}, undefined)

    for (const source of [
      { namespace: 'a', component: 'b', operation: 'c' },
      { namespace: 'a', component: 'b', event: 'c' },
      { service: 'exposition' }
    ]) {
      const request = { input: null, query: null, source }

      assert.deepStrictEqual(schema.fit(request), null)
      assert.deepStrictEqual(request.source, source)
    }
  })

  // `source` crosses the wire and keys the introspection map, so whatever
  // a peer adds to it must not survive
  it('should strip unknown source properties', () => {
    const schema = compile({}, undefined)
    const request = { input: null, query: null, source: { service: 'exposition', evil: 'x' } }

    assert.deepStrictEqual(schema.fit(request), null)
    assert.deepStrictEqual(request.source, { service: 'exposition' })
  })
})

function resetCalls (target = [assert, clone, fixtures, dummy], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}
